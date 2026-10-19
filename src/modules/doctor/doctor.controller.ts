import asyncHandler from "../../utils/asyncHandler";
import DoctorService from "./doctor.service";
import pickValidFields from "../../utils/pickValidFields";
import { DOCTOR_VALID_FIELDS } from "./doctor.constant";

const approveOrRejectDoctor = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const adminUserId =
    (req as any).user?.userId || (req.headers.userId as string);
  const result = await DoctorService.approveOrRejectDoctor(
    doctorId as string,
    adminUserId,
    req.body,
  );
  const message =
    req.body.approvalStatus === "approved"
      ? "Doctor has been approved and activated successfully"
      : "Doctor registration has been rejected";

  res.status(200).json({
    success: true,
    message,
    data: result,
  });
});

const changeDoctorStatus = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const result = await DoctorService.changeDoctorStatus(
    doctorId as string,
    req.body,
  );
  res.status(200).json({
    success: true,
    message: `Doctor status updated to ${result?.status} successfully`,
    data: result,
  });
});

const createDoctor = asyncHandler(async (req, res) => {
  const result = await DoctorService.createDoctor(req);
  res.status(201).json({
    success: true,
    message: "Doctor is created successfully",
    data: result,
  });
});

const getDoctors = asyncHandler(async (req, res) => {
  const validatedQuery = pickValidFields(req.query, DOCTOR_VALID_FIELDS);
  const result = await DoctorService.getDoctors(validatedQuery);
  res.status(200).json({
    success: true,
    message: "Doctors are retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getPublishedDoctors = asyncHandler(async (req, res) => {
  const validatedQuery = pickValidFields(req.query, DOCTOR_VALID_FIELDS);
  const result = await DoctorService.getPublishedDoctors(validatedQuery);
  res.status(200).json({
    success: true,
    message: "Published doctors are retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getDoctorById = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const result = await DoctorService.getDoctorById(doctorId as string);
  res.status(200).json({
    success: true,
    message: "Doctor is retrieved successfully",
    data: result,
  });
});

const updateDoctor = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const result = await DoctorService.updateDoctor(doctorId as string, req);
  res.status(200).json({
    success: true,
    message: "Doctor is updated successfully",
    data: result,
  });
});

const deleteDoctor = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const result = await DoctorService.deleteDoctor(doctorId as string);
  res.status(200).json({
    success: true,
    message: "Doctor is deleted successfully",
    data: result,
  });
});

const DoctorController = {
  approveOrRejectDoctor,
  changeDoctorStatus,
  createDoctor,
  getDoctors,
  getPublishedDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
};

export default DoctorController;