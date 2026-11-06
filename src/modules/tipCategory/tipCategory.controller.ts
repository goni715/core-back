import asyncHandler from "../../utils/asyncHandler";
import TipCategoryService from "./tipCategory.service";

const createTipCategory = asyncHandler(async (req, res) => {
  const result = await TipCategoryService.createTipCategory(req.body);
  res.status(201).json({
    success: true,
    message: "Tip category created successfully",
    data: result,
  });
});

const getTipCategories = asyncHandler(async (req, res) => {
  const validatedQuery = (req as any).validatedQuery || req.query;
  const result = await TipCategoryService.getTipCategories(validatedQuery);
  res.status(200).json({
    success: true,
    message: "Tip categories retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getCategoryDropdown = asyncHandler(async (_req, res) => {
  const result = await TipCategoryService.getCategoryDropdown();
  res.status(200).json({
    success: true,
    message: "Category dropdown retrieved successfully",
    data: result,
  });
});

const getTipCategoryById = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const result = await TipCategoryService.getTipCategoryById(categoryId as string);
  res.status(200).json({
    success: true,
    message: "Tip category retrieved successfully",
    data: result,
  });
});

const updateTipCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const result = await TipCategoryService.updateTipCategory(
    categoryId as string,
    req.body,
  );
  res.status(200).json({
    success: true,
    message: "Tip category updated successfully",
    data: result,
  });
});

const deleteTipCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const result = await TipCategoryService.deleteTipCategory(categoryId as string);
  res.status(200).json({
    success: true,
    message: "Tip category deleted successfully",
    data: result,
  });
});

const TipCategoryController = {
  createTipCategory,
  getTipCategories,
  getCategoryDropdown,
  getTipCategoryById,
  updateTipCategory,
  deleteTipCategory,
};

export default TipCategoryController;

