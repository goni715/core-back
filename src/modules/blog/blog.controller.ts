import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler";
import BlogService from "./blog.service";

/* ==================== Create Blog ==================== */
const createBlog = asyncHandler(async (req: Request, res: Response) => {
  const result = await BlogService.createBlog(req);

  res.status(201).json({
    success: true,
    message: "Blog created successfully",
    data: result,
  });
});

/* ==================== Get All Blogs ==================== */
const getBlogs = asyncHandler(async (req: Request, res: Response) => {
  const validatedQuery = (req as any).validatedQuery || req.query;
  const result = await BlogService.getBlogs(validatedQuery);

  res.status(200).json({
    success: true,
    message: "Blogs retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

/* ==================== Get Published Blogs (Public) ==================== */
const getPublishedBlogs = asyncHandler(async (req: Request, res: Response) => {
  const validatedQuery = (req as any).validatedQuery || req.query;
  const result = await BlogService.getPublishedBlogs(validatedQuery);

  res.status(200).json({
    success: true,
    message: "Published blogs retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

/* ==================== Get Single Blog (Increments Views) ==================== */
const getSingleBlog = asyncHandler(async (req: Request, res: Response) => {
  const { identifier } = req.params;
  const result = await BlogService.getSingleBlog(identifier as string);

  res.status(200).json({
    success: true,
    message: "Blog retrieved successfully",
    data: result,
  });
});

/* ==================== Update Blog ==================== */
const updateBlog = asyncHandler(async (req: Request, res: Response) => {
  const { blogId } = req.params;
  const result = await BlogService.updateBlog(blogId as string, req);

  res.status(200).json({
    success: true,
    message: "Blog updated successfully",
    data: result,
  });
});

/* ==================== Delete Blog ==================== */
const deleteBlog = asyncHandler(async (req: Request, res: Response) => {
  const { blogId } = req.params;
  const result = await BlogService.deleteBlog(blogId as string);

  res.status(200).json({
    success: true,
    message: "Blog deleted successfully",
    data: result,
  });
});

/* ==================== Toggle Featured Status ==================== */
const toggleFeatured = asyncHandler(async (req: Request, res: Response) => {
  const { blogId } = req.params;
  const result = await BlogService.toggleFeatured(blogId as string);

  res.status(200).json({
    success: true,
    message: `Blog marked as ${result.isFeatured ? "featured" : "standard"} successfully`,
    data: result,
  });
});

const BlogController = {
  createBlog,
  getBlogs,
  getPublishedBlogs,
  getSingleBlog,
  updateBlog,
  deleteBlog,
  toggleFeatured,
};

export default BlogController;
