import { PipelineStage, Types } from "mongoose";
import NotFoundError from "../../errors/NotFoundError";
import { makeSearchQuery } from "../../helpers/QueryBuilder";
import generateCaseId from "../../utils/generateCaseId";
import isObjectId from "../../utils/isObjectId";
import uploadToCloudinary from "../../utils/uploadToCloudinary";
import deleteFromCloudinary from "../../utils/deleteFromCloudinary";
import {
  AGENT_PATIENT_SEARCHABLE_FIELDS,
  PATIENT_CASE_STATUS,
} from "./agentPatient.constant";
import {
  TAgentPatientQuery,
  TCreateAgentPatientPayload,
  TPatientCaseStatus,
  TPatientStatusCounts,
  TUpdateAgentPatientPayload,
} from "./agentPatient.interface";
import AgentPatientModel from "./agentPatient.model";

/* ==================== Create Patient Case ==================== */
const createPatient = async (
  agentUserId: string,
  payload: TCreateAgentPatientPayload,
  files?: Express.Multer.File[],
) => {
  const uploadedCloudinaryIds: string[] = [];
  const reports: string[] = Array.isArray(payload.reports)
    ? [...payload.reports]
    : typeof payload.reports === "string"
      ? [payload.reports]
      : [];

  try {
    // Process optional uploaded report files
    if (files && files.length > 0) {
      for (const file of files) {
        const uploaded = await uploadToCloudinary(file.path, "patient_report");
        uploadedCloudinaryIds.push(uploaded.public_id);
        reports.push(uploaded.img_url);
      }
    }

    await AgentPatientModel.create({
      ...payload,
      caseId: generateCaseId(),
      agentUserId,
      reports,
    });

    return null;
  } catch (error) {
    for (const publicId of uploadedCloudinaryIds) {
      await deleteFromCloudinary(publicId).catch(() => {});
    }
    throw error;
  }
};

/* ==================== Get Patients List ==================== */
const getPatients = async (
  agentUserId: string,
  query: TAgentPatientQuery,
) => {
  const {
    searchTerm,
    status,
    preferredCountry,
    country,
    treatmentType,
    gender,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const skip = (Number(page) - 1) * Number(limit);
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  // Filter strictly for this specific agent
  const scopeFilter: Record<string, unknown> = {
    agentUserId: new Types.ObjectId(agentUserId),
  };

  // Search query
  let searchQuery: Record<string, unknown> = {};
  if (searchTerm) {
    searchQuery = makeSearchQuery(searchTerm, AGENT_PATIENT_SEARCHABLE_FIELDS);
  }

  // Attribute filters
  const additionalFilters: Record<string, unknown> = {};
  if (status && status !== "all") {
    additionalFilters.status = status;
  }
  const countryFilter = preferredCountry || country;
  if (countryFilter && countryFilter !== "all") {
    additionalFilters.preferredCountry = {
      $regex: countryFilter,
      $options: "i",
    };
  }
  if (treatmentType && treatmentType !== "all") {
    additionalFilters.treatmentType = {
      $regex: treatmentType,
      $options: "i",
    };
  }
  if (gender && (gender as string) !== "all") {
    additionalFilters.gender = String(gender).toLowerCase();
  }

  const matchStage = {
    ...scopeFilter,
    ...searchQuery,
    ...additionalFilters,
  };

  // Aggregation pipeline for data retrieval
  const pipeline: PipelineStage[] = [
    { $match: matchStage },
    {
      $project: {
        _id: 1,
        caseId: 1,
        agentUserId: 1,
        fullName: 1,
        name: "$fullName",
        phone: 1,
        phoneNumber: "$phone",
        age: 1,
        gender: 1,
        treatmentType: 1,
        symptoms: 1,
        preferredCountry: 1,
        budgetRange: 1,
        reports: 1,
        status: 1,
        timeline: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
    { $sort: { [sortBy]: sortDirection } },
    { $skip: skip },
    { $limit: Number(limit) },
  ];

  const data = await AgentPatientModel.aggregate(pipeline).collation({
    locale: "en",
    strength: 2,
  });

  // Total matching count
  const totalCountResult = await AgentPatientModel.countDocuments(matchStage);

  // Status breakdown counts (for tabs in UI)
  const statusCountFilter: Record<string, unknown> = { ...scopeFilter };
  if (searchTerm) {
    Object.assign(statusCountFilter, searchQuery);
  }
  if (countryFilter && countryFilter !== "all") {
    statusCountFilter.preferredCountry = {
      $regex: countryFilter,
      $options: "i",
    };
  }

  const countsAggregation = await AgentPatientModel.aggregate([
    { $match: statusCountFilter },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const statusCounts: TPatientStatusCounts = {
    all: 0,
    submitted: 0,
    under_review: 0,
    confirmed: 0,
    ongoing: 0,
    completed: 0,
    cancelled: 0,
  };

  countsAggregation.forEach((item) => {
    const key = item._id as keyof Omit<TPatientStatusCounts, "all">;
    if (key && statusCounts[key] !== undefined) {
      statusCounts[key] = item.count;
    }
    statusCounts.all += item.count;
  });

  const totalPages = Math.ceil(totalCountResult / Number(limit));

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      totalPages,
      total: totalCountResult,
    },
    statusCounts,
    data,
  };
};

/* ==================== Get Status Stats ==================== */
const getStatusStats = async (agentUserId: string) => {
  const scopeFilter: Record<string, unknown> = {
    agentUserId: new Types.ObjectId(agentUserId),
  };

  const countsAggregation = await AgentPatientModel.aggregate([
    { $match: scopeFilter },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const statusCounts: TPatientStatusCounts = {
    all: 0,
    submitted: 0,
    under_review: 0,
    confirmed: 0,
    ongoing: 0,
    completed: 0,
    cancelled: 0,
  };

  countsAggregation.forEach((item) => {
    const key = item._id as keyof Omit<TPatientStatusCounts, "all">;
    if (key && statusCounts[key] !== undefined) {
      statusCounts[key] = item.count;
    }
    statusCounts.all += item.count;
  });

  return statusCounts;
};

/* ==================== Get Single Patient Case ==================== */
const getPatientById = async (
  patientId: string,
  agentUserId: string,
) => {
  const query: Record<string, unknown> = {
    agentUserId: new Types.ObjectId(agentUserId),
    ...(isObjectId(patientId) ? { _id: new Types.ObjectId(patientId) } : { caseId: patientId }),
  };

  const patient = await AgentPatientModel.findOne(query);

  if (!patient) {
    throw new NotFoundError("Patient case not found");
  }

  return patient;
};

/* ==================== Update Patient Case ==================== */
const updatePatient = async (
  patientId: string,
  agentUserId: string,
  payload: TUpdateAgentPatientPayload,
  files?: Express.Multer.File[],
) => {
  const query: Record<string, unknown> = {
    agentUserId: new Types.ObjectId(agentUserId),
    ...(isObjectId(patientId) ? { _id: new Types.ObjectId(patientId) } : { caseId: patientId }),
  };

  const patient = await AgentPatientModel.findOne(query);
  if (!patient) {
    throw new NotFoundError("Patient case not found");
  }

  // Handle new uploaded report files if any
  if (files && files.length > 0) {
    for (const file of files) {
      const uploaded = await uploadToCloudinary(file.path, "patient_report");
      patient.reports.push(uploaded.img_url);
    }
  }

  // Assign updated fields directly from payload
  Object.assign(patient, payload);

  await patient.save();

  return null;
};

/* ==================== Update Patient Status ==================== */
const updatePatientStatus = async (
  patientId: string,
  agentUserId: string,
  status: TPatientCaseStatus,
) => {
  const query: Record<string, unknown> = {
    agentUserId: new Types.ObjectId(agentUserId),
    ...(isObjectId(patientId) ? { _id: new Types.ObjectId(patientId) } : { caseId: patientId }),
  };

  const patient = await AgentPatientModel.findOne(query);
  if (!patient) {
    throw new NotFoundError("Patient case not found");
  }

  patient.status = status;

  // Update timeline milestone
  const now = new Date();
  if (status === PATIENT_CASE_STATUS.SUBMITTED && !patient.timeline.submittedAt) {
    patient.timeline.submittedAt = now;
  } else if (status === PATIENT_CASE_STATUS.UNDER_REVIEW) {
    patient.timeline.underReviewAt = now;
  } else if (status === PATIENT_CASE_STATUS.CONFIRMED) {
    patient.timeline.confirmedAt = now;
  } else if (status === PATIENT_CASE_STATUS.ONGOING) {
    patient.timeline.ongoingAt = now;
  } else if (status === PATIENT_CASE_STATUS.COMPLETED) {
    patient.timeline.completedAt = now;
  } else if (status === PATIENT_CASE_STATUS.CANCELLED) {
    patient.timeline.cancelledAt = now;
  }

  await patient.save();

  return null;
};

/* ==================== Delete Patient Case ==================== */
const deletePatient = async (
  patientId: string,
  agentUserId: string,
) => {
  const query: Record<string, unknown> = {
    agentUserId: new Types.ObjectId(agentUserId),
    ...(isObjectId(patientId) ? { _id: new Types.ObjectId(patientId) } : { caseId: patientId }),
  };

  const result = await AgentPatientModel.findOneAndDelete(query);
  if (!result) {
    throw new NotFoundError("Patient case not found");
  }

  return null;
};

const AgentPatientService = {
  createPatient,
  getPatients,
  getStatusStats,
  getPatientById,
  updatePatient,
  updatePatientStatus,
  deletePatient,
};

export default AgentPatientService;
