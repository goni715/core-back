import asyncHandler from "../../utils/asyncHandler";
import pickValidFields from "../../utils/pickValidFields";
import { COMPARISON_VALID_FIELDS } from "./comparison.constant";
import ComparisonService from "./comparison.service";

/*=========== Create Comparison ============*/
const createComparison = asyncHandler(async (req, res) => {
  const result = await ComparisonService.createComparison(req.body);
  res.status(201).json({
    success: true,
    message: "Comparison is created successfully",
    data: result,
  });
});

/*=========== Get All Comparisons ============*/
const getComparisons = asyncHandler(async (req, res) => {
  const validatedQuery = pickValidFields(req.query, COMPARISON_VALID_FIELDS);
  const result = await ComparisonService.getComparisons(validatedQuery);
  res.status(200).json({
    success: true,
    message: "Comparisons are retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

/*=========== Get Single Comparison by ID or Slug ============*/
const getComparisonById = asyncHandler(async (req, res) => {
  const { comparisonId } = req.params;
  const result = await ComparisonService.getComparisonById(comparisonId as string);
  res.status(200).json({
    success: true,
    message: "Comparison is retrieved successfully",
    data: result,
  });
});

/*=========== Compare Side-by-Side (Search Widget) ============*/
const compareSideBySide = asyncHandler(async (req, res) => {
  const result = await ComparisonService.compareSideBySide(req.query);
  res.status(200).json({
    success: true,
    message: "Comparison results retrieved successfully",
    data: result,
  });
});

/*=========== Get Popular Comparisons (Screenshot 2) ============*/
const getPopularComparisons = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 8;
  const result = await ComparisonService.getPopularComparisons(limit);
  res.status(200).json({
    success: true,
    message: "Popular comparisons retrieved successfully",
    data: result,
  });
});

/*=========== Get Dropdown Options (Screenshot 1) ============*/
const getComparisonOptions = asyncHandler(async (req, res) => {
  const result = await ComparisonService.getComparisonOptions();
  res.status(200).json({
    success: true,
    message: "Comparison dropdown options retrieved successfully",
    data: result,
  });
});

/*=========== Get Comparison Stats (Screenshot 1) ============*/
const getComparisonStats = asyncHandler(async (req, res) => {
  const result = await ComparisonService.getComparisonStats();
  res.status(200).json({
    success: true,
    message: "Comparison statistics retrieved successfully",
    data: result,
  });
});

/*=========== Update Comparison ============*/
const updateComparison = asyncHandler(async (req, res) => {
  const { comparisonId } = req.params;
  const result = await ComparisonService.updateComparison(
    comparisonId as string,
    req.body,
  );
  res.status(200).json({
    success: true,
    message: "Comparison is updated successfully",
    data: result,
  });
});

/*=========== Delete Comparison ============*/
const deleteComparison = asyncHandler(async (req, res) => {
  const { comparisonId } = req.params;
  const result = await ComparisonService.deleteComparison(comparisonId as string);
  res.status(200).json({
    success: true,
    message: "Comparison is deleted successfully",
    data: result,
  });
});

/*=========== Seed Screenshot Data ============*/
const seedScreenshotComparisons = asyncHandler(async (_req, res) => {
  const result = await ComparisonService.seedScreenshotComparisons();
  res.status(200).json({
    success: true,
    message: "Sample comparisons seeded successfully",
    data: result,
  });
});

const ComparisonController = {
  createComparison,
  getComparisons,
  getComparisonById,
  compareSideBySide,
  getPopularComparisons,
  getComparisonOptions,
  getComparisonStats,
  updateComparison,
  deleteComparison,
  seedScreenshotComparisons,
};

export default ComparisonController;
