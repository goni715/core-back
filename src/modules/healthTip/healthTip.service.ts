import { Request } from "express";
import { PipelineStage, Types } from "mongoose";
import BadRequestError from "../../errors/BadRequestError";
import NotFoundError from "../../errors/NotFoundError";
import { makeFilterQuery, makeSearchQuery } from "../../helpers/QueryBuilder";
import convertToSlug from "../../utils/convertToSlug";
import deleteFromCloudinary from "../../utils/deleteFromCloudinary";
import makePublicID from "../../utils/makePublicID";
import uploadToCloudinary from "../../utils/uploadToCloudinary";
import TipCategoryModel from "../tipCategory/tipCategory.model";
import {
  HEALTH_TIP_SEARCHABLE_FIELDS,
  HEALTH_TIP_STATUS,
} from "./healthTip.constant";
import { THealthTipQuery } from "./healthTip.interface";
import HealthTipModel from "./healthTip.model";

/*========== Create Health Tip (Admin) ==========*/
const createHealthTip = async (req: Request) => {
  const payload = req.body;

  // Validate category existence
  if (!Types.ObjectId.isValid(payload.categoryId)) {
    throw new BadRequestError("Invalid category ID.");
  }

  const category = await TipCategoryModel.findById(payload.categoryId);
  if (!category) {
    throw new NotFoundError("Tip category not found with the provided ID.");
  }

  // Generate unique slug
  let slug = convertToSlug(payload.title);
  const existingSlug = await HealthTipModel.findOne({ slug });
  if (existingSlug) {
    slug = `${slug}-${Date.now().toString().slice(-4)}`;
  }
  payload.slug = slug;

  let imageUploadResult;

  try {
    // If image file uploaded via Multer
    if (req.file) {
      imageUploadResult = await uploadToCloudinary(
        req.file.path,
        "health_tip",
      );
      payload.image = imageUploadResult.img_url;
    }

    const result = await HealthTipModel.create(payload);
    return result;
  } catch (error) {
    // Rollback uploaded image on error
    if (imageUploadResult?.public_id) {
      await deleteFromCloudinary(imageUploadResult.public_id);
    }
    throw error;
  }
};

/*========== Get All Health Tips (Admin) ==========*/
const getHealthTips = async (query: THealthTipQuery) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortOrder = "desc",
    sortBy = "createdAt",
    categoryId,
    isFeatured,
    ...filters
  } = query;

  const skip = (Number(page) - 1) * Number(limit);
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  let searchQuery = {};
  if (searchTerm) {
    searchQuery = makeSearchQuery(searchTerm, HEALTH_TIP_SEARCHABLE_FIELDS);
  }

  let filterQuery: Record<string, unknown> = {};
  if (filters) {
    filterQuery = makeFilterQuery(filters);
  }

  if (categoryId && Types.ObjectId.isValid(categoryId)) {
    filterQuery.categoryId = new Types.ObjectId(categoryId);
  }

  if (isFeatured !== undefined) {
    filterQuery.isFeatured =
      typeof isFeatured === "boolean" ? isFeatured : isFeatured === "true";
  }

  const commonPipeline: PipelineStage[] = [
    {
      $match: {
        ...searchQuery,
        ...filterQuery,
      },
    },
    {
      $lookup: {
        from: "tipcategories",
        localField: "categoryId",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $unwind: {
        path: "$category",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        slug: 1,
        summary: 1,
        content: 1,
        categoryId: 1,
        category: {
          _id: "$category._id",
          name: "$category.name",
          slug: "$category.slug",
          status: "$category.status",
        },
        categoryName: "$category.name",
        authorName: 1,
        image: 1,
        status: 1,
        isFeatured: 1,
        viewsCount: 1,
        sharesCount: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ];

  const tips = await HealthTipModel.aggregate([
    ...commonPipeline,
    { $sort: { [sortBy]: sortDirection } },
    { $skip: skip },
    { $limit: Number(limit) },
  ]);

  const totalCountResult = await HealthTipModel.aggregate([
    {
      $match: {
        ...searchQuery,
        ...filterQuery,
      },
    },
    { $count: "totalCount" },
  ]);

  const totalCount = totalCountResult[0]?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / Number(limit));

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      totalPages,
      total: totalCount,
    },
    data: tips,
  };
};

/*========== Get Published Health Tips (Public / Patient) ==========*/
const getPublishedHealthTips = async (query: THealthTipQuery) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortOrder = "desc",
    sortBy = "createdAt",
    categoryId,
    categorySlug,
    isFeatured,
  } = query;

  const skip = (Number(page) - 1) * Number(limit);
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  let searchQuery = {};
  if (searchTerm) {
    searchQuery = makeSearchQuery(searchTerm, HEALTH_TIP_SEARCHABLE_FIELDS);
  }

  const matchQuery: Record<string, unknown> = {
    status: HEALTH_TIP_STATUS.PUBLISHED,
    ...searchQuery,
  };

  if (categoryId && Types.ObjectId.isValid(categoryId)) {
    matchQuery.categoryId = new Types.ObjectId(categoryId);
  }

  if (isFeatured !== undefined) {
    matchQuery.isFeatured =
      typeof isFeatured === "boolean" ? isFeatured : isFeatured === "true";
  }

  // If filtered by categorySlug, resolve categoryId first
  if (categorySlug && !categoryId) {
    const category = await TipCategoryModel.findOne({
      slug: categorySlug.trim().toLowerCase(),
    });
    if (category) {
      matchQuery.categoryId = category._id;
    } else {
      return {
        meta: {
          page: Number(page),
          limit: Number(limit),
          totalPages: 0,
          total: 0,
        },
        data: [],
      };
    }
  }

  const commonPipeline: PipelineStage[] = [
    {
      $match: matchQuery,
    },
    {
      $lookup: {
        from: "tipcategories",
        localField: "categoryId",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $unwind: {
        path: "$category",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        slug: 1,
        summary: 1,
        content: 1,
        categoryId: 1,
        category: {
          _id: "$category._id",
          name: "$category.name",
          slug: "$category.slug",
        },
        categoryName: "$category.name",
        authorName: 1,
        image: 1,
        status: 1,
        isFeatured: 1,
        viewsCount: 1,
        sharesCount: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ];

  const tips = await HealthTipModel.aggregate([
    ...commonPipeline,
    { $sort: { [sortBy]: sortDirection } },
    { $skip: skip },
    { $limit: Number(limit) },
  ]);

  const totalCountResult = await HealthTipModel.aggregate([
    { $match: matchQuery },
    { $count: "totalCount" },
  ]);

  const totalCount = totalCountResult[0]?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / Number(limit));

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      totalPages,
      total: totalCount,
    },
    data: tips,
  };
};

/*========== Get Single Health Tip by ID or Slug (Public & Admin) ==========*/
const getSingleHealthTip = async (identifier: string) => {
  const matchFilter: Record<string, unknown> = Types.ObjectId.isValid(identifier)
    ? { _id: new Types.ObjectId(identifier) }
    : { slug: identifier.trim().toLowerCase() };

  // Increment views count atomically
  await HealthTipModel.updateOne(matchFilter, {
    $inc: { viewsCount: 1 },
  });

  const tips = await HealthTipModel.aggregate([
    {
      $match: matchFilter,
    },
    {
      $lookup: {
        from: "tipcategories",
        localField: "categoryId",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $unwind: {
        path: "$category",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        slug: 1,
        summary: 1,
        content: 1,
        categoryId: 1,
        category: {
          _id: "$category._id",
          name: "$category.name",
          slug: "$category.slug",
          status: "$category.status",
        },
        categoryName: "$category.name",
        authorName: 1,
        image: 1,
        status: 1,
        isFeatured: 1,
        viewsCount: 1,
        sharesCount: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  if (!tips || tips.length === 0) {
    throw new NotFoundError("Health tip not found with the provided identifier.");
  }

  return tips[0];
};

/*========== Update Health Tip (Admin) ==========*/
const updateHealthTip = async (healthTipId: string, req: Request) => {
  if (!Types.ObjectId.isValid(healthTipId)) {
    throw new NotFoundError("Invalid health tip ID.");
  }

  const healthTip = await HealthTipModel.findById(healthTipId);
  if (!healthTip) {
    throw new NotFoundError("Health tip not found with the provided ID.");
  }

  const payload = req.body;

  // Validate category if updating categoryId
  if (payload.categoryId) {
    if (!Types.ObjectId.isValid(payload.categoryId)) {
      throw new BadRequestError("Invalid category ID.");
    }
    const category = await TipCategoryModel.findById(payload.categoryId);
    if (!category) {
      throw new NotFoundError("Tip category not found with the provided ID.");
    }
  }

  // Update slug if title changed
  if (payload.title && payload.title.trim() !== healthTip.title) {
    let slug = convertToSlug(payload.title);
    const existingConflict = await HealthTipModel.findOne({
      _id: { $ne: healthTipId },
      slug,
    });
    if (existingConflict) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }
    payload.slug = slug;
  }

  let newImageUploadResult;

  try {
    // If new image file uploaded
    if (req.file) {
      newImageUploadResult = await uploadToCloudinary(
        req.file.path,
        "health_tip",
      );
      payload.image = newImageUploadResult.img_url;
    }

    const updatedHealthTip = await HealthTipModel.findByIdAndUpdate(
      healthTipId,
      { $set: payload },
      { new: true, runValidators: true },
    );

    // If new image successfully uploaded and previous image existed on Cloudinary, delete old image
    if (req.file && healthTip.image) {
      const publicId = makePublicID(healthTip.image, "health_tip");
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }
    }

    return updatedHealthTip;
  } catch (error) {
    // Rollback uploaded image on error
    if (newImageUploadResult?.public_id) {
      await deleteFromCloudinary(newImageUploadResult.public_id);
    }
    throw error;
  }
};

/*========== Delete Health Tip (Admin) ==========*/
const deleteHealthTip = async (healthTipId: string) => {
  if (!Types.ObjectId.isValid(healthTipId)) {
    throw new NotFoundError("Invalid health tip ID.");
  }

  const healthTip = await HealthTipModel.findById(healthTipId);
  if (!healthTip) {
    throw new NotFoundError("Health tip not found with the provided ID.");
  }

  // Delete image from Cloudinary if exists
  if (healthTip.image) {
    const publicId = makePublicID(healthTip.image, "health_tip");
    if (publicId) {
      await deleteFromCloudinary(publicId);
    }
  }

  const result = await HealthTipModel.findByIdAndDelete(healthTipId);
  return result;
};

/*========== Increment Share Count (Public) ==========*/
const incrementShareCount = async (healthTipId: string) => {
  if (!Types.ObjectId.isValid(healthTipId)) {
    throw new NotFoundError("Invalid health tip ID.");
  }

  const result = await HealthTipModel.findByIdAndUpdate(
    healthTipId,
    { $inc: { sharesCount: 1 } },
    { new: true },
  );

  if (!result) {
    throw new NotFoundError("Health tip not found with the provided ID.");
  }

  return { sharesCount: result.sharesCount };
};

const HealthTipService = {
  createHealthTip,
  getHealthTips,
  getPublishedHealthTips,
  getSingleHealthTip,
  updateHealthTip,
  deleteHealthTip,
  incrementShareCount,
};

export default HealthTipService;

