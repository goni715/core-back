import asyncHandler from "../../utils/asyncHandler";
import ConsultationService from "./consultation.service";

/*========== Create Consultation & Prescription (Doctor) ==========*/
const createConsultation = asyncHandler(async (req, res) => {
  const { userId } = req.headers;

  const result = await ConsultationService.createConsultation(
    userId as string,
    req.body,
  );

  res.status(201).json({
    success: true,
    message: "Consultation and prescription created successfully",
    data: result,
  });
});

/*========== Get Doctor Own Consultations (Doctor) ==========*/
const getMyConsultations = asyncHandler(async (req, res) => {
  const { userId } = req.headers;
  const validatedQuery = (req as any).validatedQuery;

  const result = await ConsultationService.getDoctorConsultations(
    userId as string,
    validatedQuery,
  );

  res.status(200).json({
    success: true,
    message: "Doctor consultations retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

/*========== Get Patient Own Consultations / Prescriptions (Patient) ==========*/
const getPatientConsultations = asyncHandler(async (req, res) => {
  const validatedQuery = (req as any).validatedQuery || req.query;
  const patientIdentifier = {
    userId: (req as any).user?.userId || (req.headers.userId as string),
    email: (req as any).user?.email || (req.headers.email as string),
    phone: (req as any).user?.phone || (req.headers.phone as string),
  };

  const result = await ConsultationService.getPatientConsultations(
    patientIdentifier,
    validatedQuery,
  );

  res.status(200).json({
    success: true,
    message: "Patient consultations retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

/*========== Get Single Consultation ==========*/
const getSingleConsultation = asyncHandler(async (req, res) => {
  const { consultationId } = req.params;
  const userRole = (req as any).user?.role || (req.headers.role as string);

  const result = await ConsultationService.getSingleConsultation(
    consultationId as string,
    userRole,
  );

  res.status(200).json({
    success: true,
    message: "Consultation retrieved successfully",
    data: result,
  });
});

/*========== Get Consultation by Appointment ID ==========*/
const getConsultationByAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const userRole = (req as any).user?.role || (req.headers.role as string);

  const result = await ConsultationService.getConsultationByAppointment(
    appointmentId as string,
    userRole,
  );

  res.status(200).json({
    success: true,
    message: "Consultation retrieved successfully",
    data: result,
  });
});

/*========== Update Consultation (Doctor / Admin) ==========*/
const updateConsultation = asyncHandler(async (req, res) => {
  const doctorUserId =
    (req as any).user?.userId || (req.headers.userId as string);
  const userRole = (req as any).user?.role || (req.headers.role as string);
  const { consultationId } = req.params;

  const result = await ConsultationService.updateConsultation(
    doctorUserId,
    consultationId as string,
    req.body,
    userRole,
  );

  res.status(200).json({
    success: true,
    message: "Consultation updated successfully",
    data: result,
  });
});

/*========== Delete Consultation (Doctor / Admin) ==========*/
const deleteConsultation = asyncHandler(async (req, res) => {
  const doctorUserId =
    (req as any).user?.userId || (req.headers.userId as string);
  const userRole = (req as any).user?.role || (req.headers.role as string);
  const { consultationId } = req.params;

  const result = await ConsultationService.deleteConsultation(
    doctorUserId,
    consultationId as string,
    userRole,
  );

  res.status(200).json({
    success: true,
    message: "Consultation deleted successfully",
    data: result,
  });
});

/*========== Add Single Medicine to Consultation (Doctor / Admin) ==========*/
const addMedicineToConsultation = asyncHandler(async (req, res) => {
  const doctorUserId =
    (req as any).user?.userId || (req.headers.userId as string);
  const userRole = (req as any).user?.role || (req.headers.role as string);
  const { consultationId } = req.params;

  const result = await ConsultationService.addMedicineToConsultation(
    doctorUserId,
    consultationId as string,
    req.body,
    userRole,
  );

  res.status(201).json({
    success: true,
    message: "Medicine added to consultation successfully",
    data: result,
  });
});

/*========== Update Single Medicine (Doctor / Admin) ==========*/
const updateMedicine = asyncHandler(async (req, res) => {
  const doctorUserId =
    (req as any).user?.userId || (req.headers.userId as string);
  const userRole = (req as any).user?.role || (req.headers.role as string);
  const { medicineId } = req.params;

  const result = await ConsultationService.updateMedicine(
    doctorUserId,
    medicineId as string,
    req.body,
    userRole,
  );

  res.status(200).json({
    success: true,
    message: "Medicine updated successfully",
    data: result,
  });
});

/*========== Delete Single Medicine (Doctor / Admin) ==========*/
const deleteMedicine = asyncHandler(async (req, res) => {
  const doctorUserId =
    (req as any).user?.userId || (req.headers.userId as string);
  const userRole = (req as any).user?.role || (req.headers.role as string);
  const { medicineId } = req.params;

  const result = await ConsultationService.deleteMedicine(
    doctorUserId,
    medicineId as string,
    userRole,
  );

  res.status(200).json({
    success: true,
    message: "Medicine deleted successfully",
    data: result,
  });
});

/*========== Get All Consultations (Admin / Super Admin) ==========*/
const getAllConsultations = asyncHandler(async (req, res) => {
  const validatedQuery = (req as any).validatedQuery || req.query;

  const result = await ConsultationService.getAllConsultations(validatedQuery);

  res.status(200).json({
    success: true,
    message: "All consultations retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const ConsultationController = {
  createConsultation,
  getMyConsultations,
  getPatientConsultations,
  getSingleConsultation,
  getConsultationByAppointment,
  updateConsultation,
  deleteConsultation,
  addMedicineToConsultation,
  updateMedicine,
  deleteMedicine,
  getAllConsultations,
};

export default ConsultationController;
