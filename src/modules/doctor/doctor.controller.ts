import asyncHandler from "../../utils/asyncHandler";
import DoctorService from "./doctor.service";
import pickValidFields from "../../utils/pickValidFields";
import { DOCTOR_VALID_FIELDS } from "./doctor.constant";

const createDoctor = asyncHandler(async (req, res) => {
  const result = await DoctorService.createDoctor(req.body);
  res.status(200).json({
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
  const result = await DoctorService.updateDoctor(doctorId as string, req.body);
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
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
};

export default DoctorController;