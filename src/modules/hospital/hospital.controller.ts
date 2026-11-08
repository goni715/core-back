import asyncHandler from "../../utils/asyncHandler";
import HospitalService from "./hospital.service";

const createHospital = asyncHandler(async (req, res) => {
  const result = await HospitalService.createHospital(req);
  res.status(200).json({
    success: true,
    message: "Hospital is created successfully",
    data: result,
  });
});

const getHospitals = asyncHandler(async (req, res) => {
  const validatedQuery = (req as any).validatedQuery;
  const result = await HospitalService.getHospitals(validatedQuery);
  res.status(200).json({
    success: true,
    message: "Hospitals are retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getPublishedHospitals = asyncHandler(async (req, res) => {
  const validatedQuery = (req as any).validatedQuery;
  const result = await HospitalService.getPublishedHospitals(validatedQuery);
  res.status(200).json({
    success: true,
    message: "Hospitals are retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getSinglePublishedHospital = asyncHandler(async (req, res) => {
  const { hospitalId } = req.params;
  const result = await HospitalService.getSinglePublishedHospital(hospitalId as string);
  res.status(200).json({
    success: true,
    message: "Hospital is retrieved successfully",
    data: result,
  });
});

const getHospitalById = asyncHandler(async (req, res) => {
  const { hospitalId } = req.params;
  const result = await HospitalService.getHospitalById(hospitalId as string);
  res.status(200).json({
    success: true,
    message: "Hospital is retrieved successfully",
    data: result,
  });
});

const updateHospital = asyncHandler(async (req, res) => {
  const { hospitalId } = req.params;
  const result = await HospitalService.updateHospital(
    hospitalId as string,
    req,
  );
  res.status(200).json({
    success: true,
    message: "Hospital is updated successfully",
    data: result,
  });
});

const deleteHospital = asyncHandler(async (req, res) => {
  const { hospitalId } = req.params;
  const result = await HospitalService.deleteHospital(hospitalId as string);
  res.status(200).json({
    success: true,
    message: "Hospital is deleted successfully",
    data: result,
  });
});

const getHospitalCountryStats = asyncHandler(async (req, res) => {
  const result = await HospitalService.getHospitalCountryStats(req.query as { status?: string });
  res.status(200).json({
    success: true,
    message: "Hospital country statistics retrieved successfully",
    data: result,
  });
});

const HospitalController = {
  createHospital,
  getHospitals,
  getPublishedHospitals,
  getSinglePublishedHospital,
  getHospitalById,
  updateHospital,
  deleteHospital,
  getHospitalCountryStats,
};

export default HospitalController;
