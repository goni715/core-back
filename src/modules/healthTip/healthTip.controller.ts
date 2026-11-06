import asyncHandler from "../../utils/asyncHandler";
import HealthTipService from "./healthTip.service";

const createHealthTip = asyncHandler(async (req, res) => {
  const result = await HealthTipService.createHealthTip(req);
  res.status(201).json({
    success: true,
    message: "Health tip created successfully",
    data: result,
  });
});

const getHealthTips = asyncHandler(async (req, res) => {
  const validatedQuery = (req as any).validatedQuery || req.query;
  const result = await HealthTipService.getHealthTips(validatedQuery);
  res.status(200).json({
    success: true,
    message: "Health tips retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getPublishedHealthTips = asyncHandler(async (req, res) => {
  const validatedQuery = (req as any).validatedQuery || req.query;
  const result = await HealthTipService.getPublishedHealthTips(validatedQuery);
  res.status(200).json({
    success: true,
    message: "Published health tips retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getSingleHealthTip = asyncHandler(async (req, res) => {
  const { identifier } = req.params;
  const result = await HealthTipService.getSingleHealthTip(
    identifier as string,
  );
  res.status(200).json({
    success: true,
    message: "Health tip retrieved successfully",
    data: result,
  });
});

const updateHealthTip = asyncHandler(async (req, res) => {
  const { healthTipId } = req.params;
  const result = await HealthTipService.updateHealthTip(
    healthTipId as string,
    req,
  );
  res.status(200).json({
    success: true,
    message: "Health tip updated successfully",
    data: result,
  });
});

const deleteHealthTip = asyncHandler(async (req, res) => {
  const { healthTipId } = req.params;
  const result = await HealthTipService.deleteHealthTip(
    healthTipId as string,
  );
  res.status(200).json({
    success: true,
    message: "Health tip deleted successfully",
    data: result,
  });
});

const incrementShareCount = asyncHandler(async (req, res) => {
  const { healthTipId } = req.params;
  const result = await HealthTipService.incrementShareCount(
    healthTipId as string,
  );
  res.status(200).json({
    success: true,
    message: "Share count updated successfully",
    data: result,
  });
});

const HealthTipController = {
  createHealthTip,
  getHealthTips,
  getPublishedHealthTips,
  getSingleHealthTip,
  updateHealthTip,
  deleteHealthTip,
  incrementShareCount,
};

export default HealthTipController;

