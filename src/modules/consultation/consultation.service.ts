import { PipelineStage, Types } from "mongoose";
import ConflictError from "../../errors/ConflictError";
import NotFoundError from "../../errors/NotFoundError";
import UnauthorizedError from "../../errors/UnauthorizedError";
import { makeFilterQuery, makeSearchQuery } from "../../helpers/QueryBuilder";
import { APPOINTMENT_STATUS } from "../appointment/appointment.constant";
import AppointmentModel from "../appointment/appointment.model";
import { USER_ROLES } from "../user/user.constant";
import { CONSULTATION_SEARCHABLE_FIELDS } from "./consultation.constant";
import {
  IConsultation,
  IMedicineItem,
  TConsultationQuery,
} from "./consultation.interface";
import ConsultationModel from "./consultation.model";
import MedicineModel from "./medicine.model";

/*========== Create Consultation & Prescription (Doctor) ==========*/
const createConsultation = async (
  doctorUserId: string,
  payload: IConsultation& { medicines?: IMedicineItem[] },
) => {

  // Find appointment
  const appointment = await AppointmentModel.findOne({
    _id: payload.appointmentId,
    doctorUserId
  });
  if (!appointment) {
    throw new NotFoundError("Appointment not found with the provided ID.");
  }

  // Authorization: check if appointment belongs to the logged-in doctor
  if (appointment.doctorUserId.toString() !== doctorUserId) {
    throw new UnauthorizedError(
      "You are not authorized to create a consultation for this appointment.",
    );
  }

  // Check if a consultation already exists for this appointment
  const existingConsultation = await ConsultationModel.findOne({
    appointmentId: payload.appointmentId,
  });
  if (existingConsultation) {
    throw new ConflictError(
      "A consultation/prescription has already been created for this appointment.",
    );
  }

  // Assign doctor ID
  payload.doctorUserId = new Types.ObjectId(doctorUserId);

  payload.patientName=appointment.fullName;
  payload.patientEmail=appointment.email;
  payload.patientPhone=appointment.phone;


  // Separate medicines from consultation payload
  const { medicines, ...consultationPayload } = payload;

  // Create consultation
  const consultation = await ConsultationModel.create({
    ...consultationPayload,
    medicines: [],
  });

  // Insert medicines into separate Medicine collection
  if (Array.isArray(medicines) && medicines.length > 0) {
    const medicinesToInsert = medicines.map((med) => ({
      ...med,
      consultationId: consultation._id,
      appointmentId: consultation.appointmentId,
    }));

    const insertedMedicines = await MedicineModel.insertMany(medicinesToInsert);
    consultation.medicines = insertedMedicines.map((m) => m._id);
    await consultation.save();
  }

  // Mark appointment as COMPLETED with diagnosis notes
  await AppointmentModel.findByIdAndUpdate(payload.appointmentId, {
    status: APPOINTMENT_STATUS.COMPLETED,
    doctorNotes: payload.diagnosisNotes,
  });

  // Return full consultation with populated medicines
  return getSingleConsultation(consultation._id.toString());
};

/*========== Get Doctor Own Consultations (Doctor) ==========*/
const getDoctorConsultations = async (
  doctorUserId: string,
  query: TConsultationQuery,
) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    appointmentId,
    patientId,
    startDate,
    endDate,
    ...filters
  } = query;

  const skip = (Number(page) - 1) * Number(limit);
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  let searchQuery = {};
  if (searchTerm) {
    searchQuery = makeSearchQuery(searchTerm, CONSULTATION_SEARCHABLE_FIELDS);
  }

  let filterQuery: Record<string, unknown> = {};
  if (filters) {
    filterQuery = makeFilterQuery(filters);
  }

  if (appointmentId && Types.ObjectId.isValid(appointmentId)) {
    filterQuery.appointmentId = new Types.ObjectId(appointmentId);
  }


  const commonPipeline: PipelineStage[] = [
    {
      $match: {
        doctorUserId: new Types.ObjectId(doctorUserId),
        ...searchQuery,
        ...filterQuery,
      },
    },
    {
      $lookup: {
        from: "appointments",
        localField: "appointmentId",
        foreignField: "_id",
        as: "appointment",
      },
    },
    {
      $unwind: {
        path: "$appointment",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "medicines",
        localField: "_id",
        foreignField: "consultationId",
        as: "medicines",
      },
    },
    {
      $lookup: {
        from: "doctors",
        localField: "doctorId",
        foreignField: "userId",
        as: "doctorProfile",
      },
    },
    {
      $unwind: {
        path: "$doctorProfile",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        appointmentId: 1,
        appointmentCode: "$appointment.appointmentCode",
        appointmentDate: "$appointment.appointmentDate",
        appointmentSchedule: "$appointment.schedule",
        appointmentProblem: "$appointment.problem",
        appointmentStatus: "$appointment.status",
        patientId: 1,
        patientName: 1,
        patientEmail: 1,
        patientPhone: 1,
        doctorId: 1,
        doctorName: "$doctorUser.fullName",
        doctorEmail: "$doctorUser.email",
        doctorPhone: "$doctorUser.phone",
        doctorTitle: "$doctorProfile.title",
        doctorSpecialization: "$doctorProfile.specialization",
        doctorHospital: "$doctorProfile.hospital",
        doctorDesignation: "$doctorProfile.designation",
        diagnosisNotes: 1,
        treatmentAdvice: 1,
        followUpRecommendation: 1,
        nextFollowUpDate: 1,
        internalDoctorNote: 1,
        medicines: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ];

  const consultations = await ConsultationModel.aggregate([
    ...commonPipeline,
    { $sort: { [sortBy]: sortDirection } },
    { $skip: skip },
    { $limit: Number(limit) },
  ]);

  const totalCountResult = await ConsultationModel.aggregate([
    {
      $match: {
        doctorId: new Types.ObjectId(doctorUserId),
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
    data: consultations,
  };
};

/*========== Get Patient Own Consultations / Prescriptions (Patient) ==========*/
const getPatientConsultations = async (
  patientIdentifier: { userId?: string; email?: string; phone?: string },
  query: TConsultationQuery,
) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    startDate,
    endDate,
    ...filters
  } = query;

  const skip = (Number(page) - 1) * Number(limit);
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  let searchQuery = {};
  if (searchTerm) {
    searchQuery = makeSearchQuery(searchTerm, CONSULTATION_SEARCHABLE_FIELDS);
  }

  let filterQuery: Record<string, unknown> = {};
  if (filters) {
    filterQuery = makeFilterQuery(filters);
  }

  if (startDate || endDate) {
    const dateRange: Record<string, Date> = {};
    if (startDate) {
      const s = new Date(startDate);
      s.setUTCHours(0, 0, 0, 0);
      dateRange.$gte = s;
    }
    if (endDate) {
      const e = new Date(endDate);
      e.setUTCHours(23, 59, 59, 999);
      dateRange.$lte = e;
    }
    filterQuery.createdAt = dateRange;
  }

  const patientMatchConditions: any[] = [];
  if (
    patientIdentifier.userId &&
    Types.ObjectId.isValid(patientIdentifier.userId)
  ) {
    patientMatchConditions.push({
      patientId: new Types.ObjectId(patientIdentifier.userId),
    });
  }
  if (patientIdentifier.email) {
    patientMatchConditions.push({
      patientEmail: {
        $regex: `^${patientIdentifier.email.trim()}$`,
        $options: "i",
      },
    });
  }
  if (patientIdentifier.phone) {
    patientMatchConditions.push({
      patientPhone: patientIdentifier.phone.trim(),
    });
  }

  const patientMatch =
    patientMatchConditions.length > 0 ? { $or: patientMatchConditions } : {};

  const commonPipeline: PipelineStage[] = [
    {
      $match: {
        ...patientMatch,
        ...searchQuery,
        ...filterQuery,
      },
    },
    {
      $lookup: {
        from: "appointments",
        localField: "appointmentId",
        foreignField: "_id",
        as: "appointment",
      },
    },
    {
      $unwind: {
        path: "$appointment",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "medicines",
        localField: "_id",
        foreignField: "consultationId",
        as: "medicines",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "doctorId",
        foreignField: "_id",
        as: "doctorUser",
      },
    },
    {
      $unwind: {
        path: "$doctorUser",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "doctors",
        localField: "doctorId",
        foreignField: "userId",
        as: "doctorProfile",
      },
    },
    {
      $unwind: {
        path: "$doctorProfile",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        appointmentId: 1,
        appointmentCode: "$appointment.appointmentCode",
        appointmentDate: "$appointment.appointmentDate",
        appointmentSchedule: "$appointment.schedule",
        appointmentProblem: "$appointment.problem",
        patientId: 1,
        patientName: 1,
        patientEmail: 1,
        patientPhone: 1,
        doctorId: 1,
        doctorName: "$doctorUser.fullName",
        doctorEmail: "$doctorUser.email",
        doctorPhone: "$doctorUser.phone",
        doctorTitle: "$doctorProfile.title",
        doctorSpecialization: "$doctorProfile.specialization",
        doctorHospital: "$doctorProfile.hospital",
        doctorDesignation: "$doctorProfile.designation",
        doctor: {
          _id: "$doctorUser._id",
          fullName: "$doctorUser.fullName",
          email: "$doctorUser.email",
          phone: "$doctorUser.phone",
          profileImg: "$doctorUser.profileImg",
          title: "$doctorProfile.title",
          specialization: "$doctorProfile.specialization",
          hospital: "$doctorProfile.hospital",
          designation: "$doctorProfile.designation",
        },
        diagnosisNotes: 1,
        treatmentAdvice: 1,
        followUpRecommendation: 1,
        nextFollowUpDate: 1,
        medicines: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ];

  const consultations = await ConsultationModel.aggregate([
    ...commonPipeline,
    { $sort: { [sortBy]: sortDirection } },
    { $skip: skip },
    { $limit: Number(limit) },
  ]);

  const totalCountResult = await ConsultationModel.aggregate([
    {
      $match: {
        ...patientMatch,
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
    data: consultations,
  };
};

/*========== Get Single Consultation (by consultationId) ==========*/
const getSingleConsultation = async (
  consultationId: string,
  requestRole?: string,
) => {
  if (!Types.ObjectId.isValid(consultationId)) {
    throw new NotFoundError("Invalid consultation ID.");
  }

  const isPatient = requestRole === USER_ROLES.PATIENT;

  const consultations = await ConsultationModel.aggregate([
    { $match: { _id: new Types.ObjectId(consultationId) } },
    {
      $lookup: {
        from: "appointments",
        localField: "appointmentId",
        foreignField: "_id",
        as: "appointment",
      },
    },
    {
      $unwind: {
        path: "$appointment",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "medicines",
        localField: "_id",
        foreignField: "consultationId",
        as: "medicines",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "doctorId",
        foreignField: "_id",
        as: "doctorUser",
      },
    },
    {
      $unwind: {
        path: "$doctorUser",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "doctors",
        localField: "doctorId",
        foreignField: "userId",
        as: "doctorProfile",
      },
    },
    {
      $unwind: {
        path: "$doctorProfile",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        appointmentId: 1,
        appointmentCode: "$appointment.appointmentCode",
        appointmentDate: "$appointment.appointmentDate",
        appointmentSchedule: "$appointment.schedule",
        appointmentProblem: "$appointment.problem",
        appointmentStatus: "$appointment.status",
        patientId: 1,
        patientName: 1,
        patientEmail: 1,
        patientPhone: 1,
        doctorId: 1,
        doctorName: "$doctorUser.fullName",
        doctorEmail: "$doctorUser.email",
        doctorPhone: "$doctorUser.phone",
        doctorProfileImg: "$doctorUser.profileImg",
        doctorTitle: "$doctorProfile.title",
        doctorSpecialization: "$doctorProfile.specialization",
        doctorHospital: "$doctorProfile.hospital",
        doctorDesignation: "$doctorProfile.designation",
        doctor: {
          _id: "$doctorUser._id",
          fullName: "$doctorUser.fullName",
          email: "$doctorUser.email",
          phone: "$doctorUser.phone",
          profileImg: "$doctorUser.profileImg",
          title: "$doctorProfile.title",
          specialization: "$doctorProfile.specialization",
          hospital: "$doctorProfile.hospital",
          designation: "$doctorProfile.designation",
        },
        diagnosisNotes: 1,
        treatmentAdvice: 1,
        followUpRecommendation: 1,
        nextFollowUpDate: 1,
        internalDoctorNote: isPatient ? 0 : 1,
        medicines: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  if (!consultations || consultations.length === 0) {
    throw new NotFoundError("Consultation not found with the provided ID.");
  }

  return consultations[0];
};

/*========== Get Consultation by Appointment ID ==========*/
const getConsultationByAppointment = async (
  appointmentId: string,
  requestRole?: string,
) => {
  if (!Types.ObjectId.isValid(appointmentId)) {
    throw new NotFoundError("Invalid appointment ID.");
  }

  const isPatient = requestRole === USER_ROLES.PATIENT;

  const consultations = await ConsultationModel.aggregate([
    { $match: { appointmentId: new Types.ObjectId(appointmentId) } },
    {
      $lookup: {
        from: "appointments",
        localField: "appointmentId",
        foreignField: "_id",
        as: "appointment",
      },
    },
    {
      $unwind: {
        path: "$appointment",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "medicines",
        localField: "_id",
        foreignField: "consultationId",
        as: "medicines",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "doctorId",
        foreignField: "_id",
        as: "doctorUser",
      },
    },
    {
      $unwind: {
        path: "$doctorUser",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "doctors",
        localField: "doctorId",
        foreignField: "userId",
        as: "doctorProfile",
      },
    },
    {
      $unwind: {
        path: "$doctorProfile",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        appointmentId: 1,
        appointmentCode: "$appointment.appointmentCode",
        appointmentDate: "$appointment.appointmentDate",
        appointmentSchedule: "$appointment.schedule",
        appointmentProblem: "$appointment.problem",
        appointmentStatus: "$appointment.status",
        patientId: 1,
        patientName: 1,
        patientEmail: 1,
        patientPhone: 1,
        doctorId: 1,
        doctorName: "$doctorUser.fullName",
        doctorEmail: "$doctorUser.email",
        doctorPhone: "$doctorUser.phone",
        doctorProfileImg: "$doctorUser.profileImg",
        doctorTitle: "$doctorProfile.title",
        doctorSpecialization: "$doctorProfile.specialization",
        doctorHospital: "$doctorProfile.hospital",
        doctorDesignation: "$doctorProfile.designation",
        doctor: {
          _id: "$doctorUser._id",
          fullName: "$doctorUser.fullName",
          email: "$doctorUser.email",
          phone: "$doctorUser.phone",
          profileImg: "$doctorUser.profileImg",
          title: "$doctorProfile.title",
          specialization: "$doctorProfile.specialization",
          hospital: "$doctorProfile.hospital",
          designation: "$doctorProfile.designation",
        },
        diagnosisNotes: 1,
        treatmentAdvice: 1,
        followUpRecommendation: 1,
        nextFollowUpDate: 1,
        internalDoctorNote: isPatient ? 0 : 1,
        medicines: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  if (!consultations || consultations.length === 0) {
    throw new NotFoundError("No consultation found for this appointment.");
  }

  return consultations[0];
};

/*========== Update Consultation (Doctor / Admin) ==========*/
const updateConsultation = async (
  doctorUserId: string,
  consultationId: string,
  payload: Partial<IConsultation> & { medicines?: IMedicineItem[] },
  userRole?: string,
) => {
  if (!Types.ObjectId.isValid(consultationId)) {
    throw new NotFoundError("Invalid consultation ID.");
  }

  const existingConsultation = await ConsultationModel.findById(consultationId);
  if (!existingConsultation) {
    throw new NotFoundError("Consultation not found with the provided ID.");
  }


  const { medicines, ...updatePayload } = payload;

  // If medicines array is provided, sync with separate Medicine collection
  if (Array.isArray(medicines)) {
    // Delete old medicines for this consultation
    await MedicineModel.deleteMany({
      consultationId: new Types.ObjectId(consultationId),
    });

    if (medicines.length > 0) {
      const medicinesToInsert = medicines.map((med) => ({
        medicineName: med.medicineName,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        instructions: med.instructions || "",
        consultationId: new Types.ObjectId(consultationId),
        appointmentId: existingConsultation.appointmentId,
      }));

      const insertedMedicines = await MedicineModel.insertMany(medicinesToInsert);
      (updatePayload as any).medicines = insertedMedicines.map((m) => m._id);
    } else {
      (updatePayload as any).medicines = [];
    }
  }


  await ConsultationModel.findByIdAndUpdate(
    consultationId,
    { $set: updatePayload },
    { new: true, runValidators: true },
  );

  return getSingleConsultation(consultationId);
};

/*========== Delete Consultation (Doctor / Admin) ==========*/
const deleteConsultation = async (
  doctorUserId: string,
  consultationId: string,
  userRole?: string,
) => {
  if (!Types.ObjectId.isValid(consultationId)) {
    throw new NotFoundError("Invalid consultation ID.");
  }

  const existingConsultation = await ConsultationModel.findById(consultationId);
  if (!existingConsultation) {
    throw new NotFoundError("Consultation not found with the provided ID.");
  }


  // Cascade delete associated medicines from separate collection
  await MedicineModel.deleteMany({
    consultationId: new Types.ObjectId(consultationId),
  });

  const result = await ConsultationModel.findByIdAndDelete(consultationId);
  return result;
};

/*========== Add Single Medicine to Consultation (Doctor / Admin) ==========*/
const addMedicineToConsultation = async (
  doctorUserId: string,
  consultationId: string,
  medicinePayload: IMedicineItem,
  userRole?: string,
) => {
  if (!Types.ObjectId.isValid(consultationId)) {
    throw new NotFoundError("Invalid consultation ID.");
  }

  const consultation = await ConsultationModel.findById(consultationId);
  if (!consultation) {
    throw new NotFoundError("Consultation not found with the provided ID.");
  }

  const newMedicine = await MedicineModel.create({
    ...medicinePayload,
    consultationId: consultation._id,
    appointmentId: consultation.appointmentId,
  });

  await ConsultationModel.findByIdAndUpdate(consultationId, {
    $addToSet: { medicines: newMedicine._id },
  });

  return newMedicine;
};

/*========== Update Single Medicine (Doctor / Admin) ==========*/
const updateMedicine = async (
  doctorUserId: string,
  medicineId: string,
  medicinePayload: Partial<IMedicineItem>,
  userRole?: string,
) => {
  if (!Types.ObjectId.isValid(medicineId)) {
    throw new NotFoundError("Invalid medicine ID.");
  }

  const medicine = await MedicineModel.findById(medicineId);
  if (!medicine) {
    throw new NotFoundError("Medicine not found with the provided ID.");
  }

  const updatedMedicine = await MedicineModel.findByIdAndUpdate(
    medicineId,
    { $set: medicinePayload },
    { new: true, runValidators: true },
  );

  return updatedMedicine;
};

/*========== Delete Single Medicine (Doctor / Admin) ==========*/
const deleteMedicine = async (
  doctorUserId: string,
  medicineId: string,
  userRole?: string,
) => {
  if (!Types.ObjectId.isValid(medicineId)) {
    throw new NotFoundError("Invalid medicine ID.");
  }

  const medicine = await MedicineModel.findById(medicineId);
  if (!medicine) {
    throw new NotFoundError("Medicine not found with the provided ID.");
  }

  // if (consultation) {
  //   await ConsultationModel.findByIdAndUpdate(consultation._id, {
  //     $pull: { medicines: new Types.ObjectId(medicineId) },
  //   });
  // }

  const result = await MedicineModel.findByIdAndDelete(medicineId);
  return result;
};

/*========== Get All Consultations (Admin / Super Admin) ==========*/
const getAllConsultations = async (query: TConsultationQuery) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    doctorId,
    patientId,
    appointmentId,
    startDate,
    endDate,
    ...filters
  } = query;

  const skip = (Number(page) - 1) * Number(limit);
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  let searchQuery = {};
  if (searchTerm) {
    searchQuery = makeSearchQuery(searchTerm, CONSULTATION_SEARCHABLE_FIELDS);
  }

  let filterQuery: Record<string, unknown> = {};
  if (filters) {
    filterQuery = makeFilterQuery(filters);
  }

  if (doctorId && Types.ObjectId.isValid(doctorId)) {
    filterQuery.doctorId = new Types.ObjectId(doctorId);
  }

  if (patientId && Types.ObjectId.isValid(patientId)) {
    filterQuery.patientId = new Types.ObjectId(patientId);
  }

  if (appointmentId && Types.ObjectId.isValid(appointmentId)) {
    filterQuery.appointmentId = new Types.ObjectId(appointmentId);
  }

  if (startDate || endDate) {
    const dateRange: Record<string, Date> = {};
    if (startDate) {
      const s = new Date(startDate);
      s.setUTCHours(0, 0, 0, 0);
      dateRange.$gte = s;
    }
    if (endDate) {
      const e = new Date(endDate);
      e.setUTCHours(23, 59, 59, 999);
      dateRange.$lte = e;
    }
    filterQuery.createdAt = dateRange;
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
        from: "appointments",
        localField: "appointmentId",
        foreignField: "_id",
        as: "appointment",
      },
    },
    {
      $unwind: {
        path: "$appointment",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "medicines",
        localField: "_id",
        foreignField: "consultationId",
        as: "medicines",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "doctorId",
        foreignField: "_id",
        as: "doctorUser",
      },
    },
    {
      $unwind: {
        path: "$doctorUser",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "doctors",
        localField: "doctorId",
        foreignField: "userId",
        as: "doctorProfile",
      },
    },
    {
      $unwind: {
        path: "$doctorProfile",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        appointmentId: 1,
        appointmentCode: "$appointment.appointmentCode",
        appointmentDate: "$appointment.appointmentDate",
        appointmentSchedule: "$appointment.schedule",
        appointmentProblem: "$appointment.problem",
        appointmentStatus: "$appointment.status",
        patientId: 1,
        patientName: 1,
        patientEmail: 1,
        patientPhone: 1,
        doctorId: 1,
        doctorName: "$doctorUser.fullName",
        doctorEmail: "$doctorUser.email",
        doctorPhone: "$doctorUser.phone",
        doctorTitle: "$doctorProfile.title",
        doctorSpecialization: "$doctorProfile.specialization",
        doctorHospital: "$doctorProfile.hospital",
        doctorDesignation: "$doctorProfile.designation",
        doctor: {
          _id: "$doctorUser._id",
          fullName: "$doctorUser.fullName",
          email: "$doctorUser.email",
          phone: "$doctorUser.phone",
          profileImg: "$doctorUser.profileImg",
          title: "$doctorProfile.title",
          specialization: "$doctorProfile.specialization",
          hospital: "$doctorProfile.hospital",
          designation: "$doctorProfile.designation",
        },
        diagnosisNotes: 1,
        treatmentAdvice: 1,
        followUpRecommendation: 1,
        nextFollowUpDate: 1,
        internalDoctorNote: 1,
        medicines: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ];

  const consultations = await ConsultationModel.aggregate([
    ...commonPipeline,
    { $sort: { [sortBy]: sortDirection } },
    { $skip: skip },
    { $limit: Number(limit) },
  ]);

  const totalCountResult = await ConsultationModel.aggregate([
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
    data: consultations,
  };
};

const ConsultationService = {
  createConsultation,
  getDoctorConsultations,
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

export default ConsultationService;
