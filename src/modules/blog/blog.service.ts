import { Request } from "express";
import { Types } from "mongoose";
import BadRequestError from "../../errors/BadRequestError";
import NotFoundError from "../../errors/NotFoundError";
import { makeSearchQuery } from "../../helpers/QueryBuilder";
import convertToSlug from "../../utils/convertToSlug";
import deleteFromCloudinary from "../../utils/deleteFromCloudinary";
import isObjectId from "../../utils/isObjectId";
import makePublicID from "../../utils/makePublicID";
import uploadToCloudinary from "../../utils/uploadToCloudinary";
import { BLOG_SEARCHABLE_FIELDS, BLOG_STATUS } from "./blog.constant";
import { TBlogQuery } from "./blog.interface";
import BlogModel from "./blog.model";

/* ==================== Create Blog ==================== */
const createBlog = async (req: Request) => {
  const payload = req.body;

  // Generate unique slug
  let slug = convertToSlug(payload.title);
  const existingSlug = await BlogModel.findOne({ slug });
  if (existingSlug) {
    slug = `${slug}-${Date.now().toString().slice(-4)}`;
  }
  payload.slug = slug;

  let imageUploadResult;

  try {
    // If image file uploaded via Multer
    if (req.file) {
      imageUploadResult = await uploadToCloudinary(req.file.path, "blog");
      payload.image = imageUploadResult.img_url;
    }

    const result = await BlogModel.create(payload);
    return result;
  } catch (error) {
    // Rollback uploaded image on error
    if (imageUploadResult?.public_id) {
      await deleteFromCloudinary(imageUploadResult.public_id);
    }
    throw error;
  }
};

/* ==================== Get All Blogs (Admin / Filterable) ==================== */
const getBlogs = async (query: TBlogQuery) => {
  const {
    searchTerm,
    status,
    isFeatured,
    author,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const skip = (Number(page) - 1) * Number(limit);
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  const filterQuery: Record<string, unknown> = {};

  // Search filter
  if (searchTerm) {
    Object.assign(filterQuery, makeSearchQuery(searchTerm, BLOG_SEARCHABLE_FIELDS));
  }

  // Status filter
  if (status && status !== "all") {
    filterQuery.status = status.toLowerCase();
  }

  // isFeatured filter
  if (isFeatured !== undefined && isFeatured !== "") {
    if (typeof isFeatured === "boolean") {
      filterQuery.isFeatured = isFeatured;
    } else if (String(isFeatured).toLowerCase() === "true") {
      filterQuery.isFeatured = true;
    } else if (String(isFeatured).toLowerCase() === "false") {
      filterQuery.isFeatured = false;
    }
  }

  // Author filter
  if (author && author !== "all") {
    filterQuery.author = { $regex: author, $options: "i" };
  }

  const [data, total] = await Promise.all([
    BlogModel.find(filterQuery)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    BlogModel.countDocuments(filterQuery),
  ]);

  const totalPages = Math.ceil(total / Number(limit)) || 1;

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      totalPages,
      total,
    },
    data,
  };
};

/* ==================== Get Published Blogs (Public Listing) ==================== */
const getPublishedBlogs = async (query: TBlogQuery) => {
  return getBlogs({
    ...query,
    status: BLOG_STATUS.PUBLISHED,
  });
};

/* ==================== Get Single Blog (Increments Views) ==================== */
const getSingleBlog = async (identifier: string) => {
  const query = isObjectId(identifier)
    ? { _id: new Types.ObjectId(identifier) }
    : { slug: identifier.toLowerCase().trim() };

  // Single get korle (public api) views 1 kore barbe
  const blog = await BlogModel.findOneAndUpdate(
    query,
    { $inc: { views: 1 } },
    { new: true, returnDocument: "after" },
  );

  if (!blog) {
    throw new NotFoundError("Blog not found with the provided ID or slug");
  }

  return blog;
};

/* ==================== Update Blog ==================== */
const updateBlog = async (blogId: string, req: Request) => {
  if (!isObjectId(blogId)) {
    throw new BadRequestError("Invalid blog ID");
  }

  const blog = await BlogModel.findById(blogId);
  if (!blog) {
    throw new NotFoundError("Blog not found with the provided ID");
  }

  const payload = req.body;

  // If title is being changed, update slug
  if (payload.title && payload.title.trim() !== blog.title) {
    let newSlug = convertToSlug(payload.title);
    const existing = await BlogModel.findOne({
      slug: newSlug,
      _id: { $ne: blog._id },
    });
    if (existing) {
      newSlug = `${newSlug}-${Date.now().toString().slice(-4)}`;
    }
    payload.slug = newSlug;
  }

  let newImageUploadResult;

  try {
    // If new image uploaded
    if (req.file) {
      newImageUploadResult = await uploadToCloudinary(req.file.path, "blog");
      payload.image = newImageUploadResult.img_url;

      // Delete previous image from Cloudinary
      if (blog.image) {
        const publicId = makePublicID(blog.image, "blog");
        if (publicId) {
          await deleteFromCloudinary(publicId);
        }
      }
    }

    const updatedBlog = await BlogModel.findByIdAndUpdate(
      blogId,
      { $set: payload },
      { new: true, returnDocument: "after", runValidators: true },
    );

    return updatedBlog;
  } catch (error) {
    // Rollback uploaded image on error
    if (newImageUploadResult?.public_id) {
      await deleteFromCloudinary(newImageUploadResult.public_id);
    }
    throw error;
  }
};

/* ==================== Delete Blog ==================== */
const deleteBlog = async (blogId: string) => {
  if (!isObjectId(blogId)) {
    throw new BadRequestError("Invalid blog ID");
  }

  const blog = await BlogModel.findById(blogId);
  if (!blog) {
    throw new NotFoundError("Blog not found with the provided ID");
  }

  // Delete image from Cloudinary if exists
  if (blog.image) {
    const publicId = makePublicID(blog.image, "blog");
    if (publicId) {
      await deleteFromCloudinary(publicId);
    }
  }

  await BlogModel.findByIdAndDelete(blogId);
  return null;
};

/* ==================== Toggle Featured Status ==================== */
const toggleFeatured = async (blogId: string) => {
  if (!isObjectId(blogId)) {
    throw new BadRequestError("Invalid blog ID");
  }

  const blog = await BlogModel.findById(blogId);
  if (!blog) {
    throw new NotFoundError("Blog not found with the provided ID");
  }

  blog.isFeatured = !blog.isFeatured;
  await blog.save();

  return blog;
};

const BlogService = {
  createBlog,
  getBlogs,
  getPublishedBlogs,
  getSingleBlog,
  updateBlog,
  deleteBlog,
  toggleFeatured,
};

export default BlogService;
