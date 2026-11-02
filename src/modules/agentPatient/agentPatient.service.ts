import { PipelineStage, Types } from "mongoose";
import NotFoundError from "../../errors/NotFoundError";
import BadRequestError from "../../errors/BadRequestError";
import { makeSearchQuery } from "../../helpers/QueryBuilder";
import generateCaseId from "../../utils/generateCaseId";
import isObjectId from "../../utils/isObjectId";
import {
  AGENT_PATIENT_SEARCHABLE_FIELDS,
  COMMISSION_PAYMENT_STATUS,
  PATIENT_CASE_STATUS,
} from "./agentPatient.constant";
import {
  TAgentPatientQuery,
  TCommissionPatientQuery,
  TCommissionPaymentStatus,
  TCommissionStatusCounts,
  TCreateAgentPatientPayload,
  TPatientCaseStatus,
  TPatientStatusCounts,
  TUpdateAgentCommissionPayload,
  TUpdateAgentPatientPayload,
  TUpdateSubAgentCommissionPayload,
} from "./agentPatient.interface";
import AgentPatientModel from "./agentPatient.model";
import ReferralPartnerModel from "../referralPartner/referralPartner.model";
import UserModel from "../user/user.model";

/* ==================== Create Patient Case By Agent ==================== */
const submitPatientByAgent = async (
  agentUserId: string,
  payload: TCreateAgentPatientPayload,
) => {
  await AgentPatientModel.create({
    ...payload,
    caseId: generateCaseId(),
    agentUserId: new Types.ObjectId(agentUserId),
  });

  return null;
};

/* ==================== Create Patient Case By Sub Agent ==================== */
const submitPatientBySubAgent = async (
  subAgentUserId: string,
  payload: TCreateAgentPatientPayload,
) => {
  const subAgent = await ReferralPartnerModel.findById(subAgentUserId);
  if (!subAgent) {
    throw new NotFoundError("Sub-agent account not found");
  }

  await AgentPatientModel.create({
    ...payload,
    caseId: generateCaseId(),
    agentUserId: subAgent.agentUserId,
    subAgentId: subAgent._id,
  });

  await ReferralPartnerModel.findByIdAndUpdate(subAgent._id, {
    $inc: { cases: 1, ongoing: 1 },
    lastActiveAt: new Date(),
  });

  return null;
};

/* ==================== Get Patients List ==================== */
const getPatientsByAgent = async (
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
  const subAgentFilter =
    query.subAgentId || query.subAgent || query.partnerId || query.partner;
  if (subAgentFilter && subAgentFilter !== "all") {
    if (isObjectId(subAgentFilter)) {
      additionalFilters.subAgentId = new Types.ObjectId(subAgentFilter);
    }
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
      $lookup: {
        from: "referralpartners",
        localField: "subAgentId",
        foreignField: "_id",
        as: "subAgent",
      },
    },
    {
      $unwind: {
        path: "$subAgent",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        caseId: 1,
        agentUserId: 1,
        subAgentId: 1,
        commissionFee: { $ifNull: ["$agentCommissionFee", 0] },
        paymentStatus: {
          $ifNull: ["$agentPaymentStatus", COMMISSION_PAYMENT_STATUS.UNPAID],
        },
        agentCommissionFee: { $ifNull: ["$agentCommissionFee", 0] },
        agentPaymentStatus: {
          $ifNull: ["$agentPaymentStatus", COMMISSION_PAYMENT_STATUS.UNPAID],
        },
        subAgentCommission: { $ifNull: ["$subAgentCommission", 0] },
        subAgentCommissionFee: { $ifNull: ["$subAgentCommission", 0] },
        subAgentPaymentStatus: {
          $ifNull: ["$subAgentPaymentStatus", COMMISSION_PAYMENT_STATUS.UNPAID],
        },
        totalCommissionFee: {
          $add: [
            { $ifNull: ["$agentCommissionFee", 0] },
            { $ifNull: ["$subAgentCommission", 0] },
          ],
        },
        totalCommission: {
          $add: [
            { $ifNull: ["$agentCommissionFee", 0] },
            { $ifNull: ["$subAgentCommission", 0] },
          ],
        },
        subAgent: {
          $cond: {
            if: "$subAgent",
            then: {
              _id: "$subAgent._id",
              refCode: "$subAgent.refCode",
              fullName: "$subAgent.fullName",
              email: "$subAgent.email",
              phone: "$subAgent.phone",
              agencyName: "$subAgent.agencyName",
            },
            else: null,
          },
        },
        fullName: 1,
        phone: 1,
        age: 1,
        gender: 1,
        treatmentType: 1,
        symptoms: 1,
        preferredCountry: 1,
        budgetRange: 1,
        driveLink: 1,
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

/* ==================== Get Patients List By Sub Agent ==================== */
const getPatientsBySubAgent = async (
  subAgentId: string,
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

  // Filter strictly for this specific sub agent
  const scopeFilter: Record<string, unknown> = {
    subAgentId: new Types.ObjectId(subAgentId),
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
      $lookup: {
        from: "users",
        localField: "agentUserId",
        foreignField: "_id",
        as: "agent",
      },
    },
    {
      $unwind: {
        path: "$agent",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        caseId: 1,
        agentUserId: 1,
        subAgentId: 1,
        commissionFee: { $ifNull: ["$subAgentCommission", 0] },
        paymentStatus: {
          $ifNull: ["$subAgentPaymentStatus", COMMISSION_PAYMENT_STATUS.UNPAID],
        },
        subAgentCommission: { $ifNull: ["$subAgentCommission", 0] },
        subAgentCommissionFee: { $ifNull: ["$subAgentCommission", 0] },
        subAgentPaymentStatus: {
          $ifNull: ["$subAgentPaymentStatus", COMMISSION_PAYMENT_STATUS.UNPAID],
        },
        agentCommissionFee: { $ifNull: ["$agentCommissionFee", 0] },
        agentPaymentStatus: {
          $ifNull: ["$agentPaymentStatus", COMMISSION_PAYMENT_STATUS.UNPAID],
        },
        totalCommissionFee: {
          $add: [
            { $ifNull: ["$agentCommissionFee", 0] },
            { $ifNull: ["$subAgentCommission", 0] },
          ],
        },
        totalCommission: {
          $add: [
            { $ifNull: ["$agentCommissionFee", 0] },
            { $ifNull: ["$subAgentCommission", 0] },
          ],
        },
        agent: {
          $cond: {
            if: "$agent",
            then: {
              _id: "$agent._id",
              fullName: "$agent.fullName",
              email: "$agent.email",
              phone: "$agent.phone",
            },
            else: null,
          },
        },
        fullName: 1,
        phone: 1,
        age: 1,
        gender: 1,
        treatmentType: 1,
        symptoms: 1,
        preferredCountry: 1,
        budgetRange: 1,
        driveLink: 1,
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

/* ==================== Get All Patients By Admin ==================== */
const getAllPatientsByAdmin = async (query: TAgentPatientQuery) => {
  const {
    searchTerm,
    status,
    preferredCountry,
    country,
    treatmentType,
    gender,
    agentUserId,
    subAgentId,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const skip = (Number(page) - 1) * Number(limit);
  const sortDirection = sortOrder === "asc" ? 1 : -1;

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
  if (agentUserId && agentUserId !== "all" && isObjectId(agentUserId)) {
    additionalFilters.agentUserId = new Types.ObjectId(agentUserId);
  }
  const subAgentFilter =
    subAgentId || query.subAgent || query.partnerId || query.partner;
  if (subAgentFilter && subAgentFilter !== "all" && isObjectId(subAgentFilter)) {
    additionalFilters.subAgentId = new Types.ObjectId(subAgentFilter);
  }
  const agentPaymentStatusFilter =
    query.paymentStatus || query.agentPaymentStatus;
  if (agentPaymentStatusFilter && agentPaymentStatusFilter !== "all") {
    additionalFilters.agentPaymentStatus = agentPaymentStatusFilter;
  }
  if (query.subAgentPaymentStatus && query.subAgentPaymentStatus !== "all") {
    additionalFilters.subAgentPaymentStatus = query.subAgentPaymentStatus;
  }

  const matchStage = {
    ...searchQuery,
    ...additionalFilters,
  };

  // Aggregation pipeline for data retrieval with both agent and subAgent lookups
  const pipeline: PipelineStage[] = [
    { $match: matchStage },
    {
      $lookup: {
        from: "users",
        localField: "agentUserId",
        foreignField: "_id",
        as: "agent",
      },
    },
    {
      $unwind: {
        path: "$agent",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "referralpartners",
        localField: "subAgentId",
        foreignField: "_id",
        as: "subAgent",
      },
    },
    {
      $unwind: {
        path: "$subAgent",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        caseId: 1,
        agentUserId: 1,
        subAgentId: 1,
        commissionFee: { $ifNull: ["$agentCommissionFee", 0] },
        paymentStatus: {
          $ifNull: ["$agentPaymentStatus", COMMISSION_PAYMENT_STATUS.UNPAID],
        },
        agentCommissionFee: { $ifNull: ["$agentCommissionFee", 0] },
        agentPaymentStatus: {
          $ifNull: ["$agentPaymentStatus", COMMISSION_PAYMENT_STATUS.UNPAID],
        },
        subAgentCommission: { $ifNull: ["$subAgentCommission", 0] },
        subAgentCommissionFee: { $ifNull: ["$subAgentCommission", 0] },
        subAgentPaymentStatus: {
          $ifNull: ["$subAgentPaymentStatus", COMMISSION_PAYMENT_STATUS.UNPAID],
        },
        totalCommissionFee: {
          $add: [
            { $ifNull: ["$agentCommissionFee", 0] },
            { $ifNull: ["$subAgentCommission", 0] },
          ],
        },
        totalCommission: {
          $add: [
            { $ifNull: ["$agentCommissionFee", 0] },
            { $ifNull: ["$subAgentCommission", 0] },
          ],
        },
        agent: {
          $cond: {
            if: "$agent",
            then: {
              _id: "$agent._id",
              fullName: "$agent.fullName",
              email: "$agent.email",
              phone: "$agent.phone",
              profileImg: "$agent.profileImg",
              agencyName: "$agent.agencyName",
            },
            else: null,
          },
        },
        subAgent: {
          $cond: {
            if: "$subAgent",
            then: {
              _id: "$subAgent._id",
              refCode: "$subAgent.refCode",
              fullName: "$subAgent.fullName",
              email: "$subAgent.email",
              phone: "$subAgent.phone",
              agencyName: "$subAgent.agencyName",
            },
            else: null,
          },
        },
        fullName: 1,
        phone: 1,
        age: 1,
        gender: 1,
        treatmentType: 1,
        symptoms: 1,
        preferredCountry: 1,
        budgetRange: 1,
        driveLink: 1,
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

  // Status breakdown counts (for UI tabs)
  const statusCountFilter: Record<string, unknown> = {};
  if (searchTerm) {
    Object.assign(statusCountFilter, searchQuery);
  }
  if (countryFilter && countryFilter !== "all") {
    statusCountFilter.preferredCountry = {
      $regex: countryFilter,
      $options: "i",
    };
  }
  if (agentUserId && agentUserId !== "all" && isObjectId(agentUserId)) {
    statusCountFilter.agentUserId = new Types.ObjectId(agentUserId);
  }
  if (subAgentFilter && subAgentFilter !== "all" && isObjectId(subAgentFilter)) {
    statusCountFilter.subAgentId = new Types.ObjectId(subAgentFilter);
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

  const totalPages = Math.ceil(totalCountResult / Number(limit)) || 1;

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

/* ==================== Get Agent Commission Stats & 12 Months Chart ==================== */
const getAgentCommissionStats = async (
  agentUserId?: string,
  query?: { year?: string | number },
) => {
  const currentYear = query?.year
    ? Number(query.year)
    : new Date().getFullYear();

  // Match only agentPatients that actually generate agent commission
  const matchQuery: Record<string, unknown> = {
    agentCommissionFee: { $gt: 0 },
  };

  if (agentUserId) {
    if (isObjectId(agentUserId)) {
      matchQuery.agentUserId = new Types.ObjectId(agentUserId);
    } else {
      matchQuery.agentUserId = agentUserId;
    }
  }

  // 1. Overview cards: Total Commission, Pending, Paid & Total Patients count
  const statsAggregation = await AgentPatientModel.aggregate([
    {
      $match: matchQuery,
    },
    {
      $group: {
        _id: null,
        totalCommission: { $sum: "$agentCommissionFee" },
        pendingCommission: {
          $sum: {
            $cond: [
              {
                $eq: [
                  "$agentPaymentStatus",
                  COMMISSION_PAYMENT_STATUS.PENDING,
                ],
              },
              "$agentCommissionFee",
              0,
            ],
          },
        },
        paidCommission: {
          $sum: {
            $cond: [
              { $eq: ["$agentPaymentStatus", COMMISSION_PAYMENT_STATUS.PAID] },
              "$agentCommissionFee",
              0,
            ],
          },
        },
        totalPatients: { $sum: 1 },
      },
    },
  ]);

  const overview = statsAggregation[0] || {
    totalCommission: 0,
    pendingCommission: 0,
    paidCommission: 0,
    totalPatients: 0,
  };

  // 2. 12 Months Chart Data (Monthly Earnings based on the contributing agentPatients)
  const startOfYear = new Date(`${currentYear}-01-01T00:00:00.000Z`);
  const endOfYear = new Date(`${currentYear}-12-31T23:59:59.999Z`);

  const monthlyAggregation = await AgentPatientModel.aggregate([
    {
      $addFields: {
        effectiveDate: {
          $ifNull: [
            "$timeline.completedAt",
            { $ifNull: ["$updatedAt", "$createdAt"] },
          ],
        },
      },
    },
    {
      $match: {
        ...matchQuery,
        effectiveDate: { $gte: startOfYear, $lte: endOfYear },
      },
    },
    {
      $group: {
        _id: { $month: "$effectiveDate" },
        earnings: { $sum: "$agentCommissionFee" },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const monthlyMap: Record<number, number> = {};
  monthlyAggregation.forEach((item) => {
    monthlyMap[item._id] = item.earnings;
  });

  const monthlyEarnings = monthNames.map((name, index) => {
    const monthNumber = index + 1;
    const earnings = monthlyMap[monthNumber] || 0;
    return {
      month: name,
      earnings,
      commission: earnings,
    };
  });

  return {
    totalCommission: overview.totalCommission,
    pendingCommission: overview.pendingCommission,
    paidCommission: overview.paidCommission,
    pending: overview.pendingCommission,
    paid: overview.paidCommission,
    monthlyEarnings,
  };
};

/* ==================== Get Sub-Agent Commission Stats & 12 Months Chart ==================== */
const getSubAgentCommissionStats = async (
  subAgentId?: string,
  query?: { year?: string | number },
) => {
  const currentYear = query?.year
    ? Number(query.year)
    : new Date().getFullYear();

  // Match only agentPatients that actually generate sub-agent commission
  const matchQuery: Record<string, unknown> = {
    subAgentCommission: { $gt: 0 },
  };

  if (subAgentId) {
    if (isObjectId(subAgentId)) {
      matchQuery.subAgentId = new Types.ObjectId(subAgentId);
    } else {
      // Handle refCode (e.g. RP-0112) or email
      const partner = await ReferralPartnerModel.findOne({
        $or: [
          { refCode: String(subAgentId).trim().toUpperCase() },
          { email: String(subAgentId).trim().toLowerCase() },
        ],
      });
      if (partner) {
        matchQuery.subAgentId = partner._id;
      } else {
        matchQuery.subAgentId = subAgentId;
      }
    }
  }

  // 1. Overview cards: Total Commission, Pending, Paid & Total Patients count
  const statsAggregation = await AgentPatientModel.aggregate([
    {
      $match: matchQuery,
    },
    {
      $group: {
        _id: null,
        totalCommission: { $sum: "$subAgentCommission" },
        pendingCommission: {
          $sum: {
            $cond: [
              {
                $eq: [
                  "$subAgentPaymentStatus",
                  COMMISSION_PAYMENT_STATUS.PENDING,
                ],
              },
              "$subAgentCommission",
              0,
            ],
          },
        },
        paidCommission: {
          $sum: {
            $cond: [
              {
                $eq: [
                  "$subAgentPaymentStatus",
                  COMMISSION_PAYMENT_STATUS.PAID,
                ],
              },
              "$subAgentCommission",
              0,
            ],
          },
        },
        totalPatients: { $sum: 1 },
      },
    },
  ]);

  const overview = statsAggregation[0] || {
    totalCommission: 0,
    pendingCommission: 0,
    paidCommission: 0,
    totalPatients: 0,
  };

  // 2. 12 Months Chart Data (Monthly Earnings based on the contributing agentPatients)
  const startOfYear = new Date(`${currentYear}-01-01T00:00:00.000Z`);
  const endOfYear = new Date(`${currentYear}-12-31T23:59:59.999Z`);

  const monthlyAggregation = await AgentPatientModel.aggregate([
    {
      $addFields: {
        effectiveDate: {
          $ifNull: [
            "$timeline.completedAt",
            { $ifNull: ["$updatedAt", "$createdAt"] },
          ],
        },
      },
    },
    {
      $match: {
        ...matchQuery,
        effectiveDate: { $gte: startOfYear, $lte: endOfYear },
      },
    },
    {
      $group: {
        _id: { $month: "$effectiveDate" },
        earnings: { $sum: "$subAgentCommission" },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const monthlyMap: Record<number, number> = {};
  monthlyAggregation.forEach((item) => {
    monthlyMap[item._id] = item.earnings;
  });

  const monthlyEarnings = monthNames.map((name, index) => {
    const monthNumber = index + 1;
    const earnings = monthlyMap[monthNumber] || 0;
    return {
      month: name,
      earnings,
      commission: earnings,
    };
  });

  return {
    totalCommission: overview.totalCommission,
    pendingCommission: overview.pendingCommission,
    paidCommission: overview.paidCommission,
    pending: overview.pendingCommission,
    paid: overview.paidCommission,
    monthlyEarnings,
  };
};

/* ==================== Get Agent All Commissions ==================== */
const getAgentAllCommissions = async (
  agentUserId: string,
  query: TCommissionPatientQuery,
) => {
  const {
    searchTerm,
    paymentStatus,
    status,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const skip = (Number(page) - 1) * Number(limit);
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  // Filter strictly for this specific agent and agentCommissionFee > 0
  const scopeFilter: Record<string, unknown> = {
    agentUserId: new Types.ObjectId(agentUserId),
    agentCommissionFee: { $gt: 0 },
  };

  // Search query
  let searchQuery: Record<string, unknown> = {};
  if (searchTerm) {
    searchQuery = makeSearchQuery(searchTerm, AGENT_PATIENT_SEARCHABLE_FIELDS);
  }

  // Payment status filter (supports ?paymentStatus=pending or ?status=pending)
  const additionalFilters: Record<string, unknown> = {};
  const targetPaymentStatus = paymentStatus || status;
  if (targetPaymentStatus && targetPaymentStatus !== "all") {
    additionalFilters.agentPaymentStatus = targetPaymentStatus;
  }

  const matchStage = {
    ...scopeFilter,
    ...searchQuery,
    ...additionalFilters,
  };

  const pipeline: PipelineStage[] = [
    { $match: matchStage },
    {
      $project: {
        _id: 1,
        caseId: 1,
        fullName: 1,
        patientName: "$fullName",
        commission: { $ifNull: ["$agentCommissionFee", 0] },
        commissionFee: { $ifNull: ["$agentCommissionFee", 0] },
        agentCommissionFee: 1,
        paymentStatus: {
          $ifNull: ["$agentPaymentStatus", COMMISSION_PAYMENT_STATUS.UNPAID],
        },
        status: {
          $ifNull: ["$agentPaymentStatus", COMMISSION_PAYMENT_STATUS.UNPAID],
        },
        patientStatus: "$status",
        date: {
          $ifNull: [
            "$timeline.completedAt",
            { $ifNull: ["$updatedAt", "$createdAt"] },
          ],
        },
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

  const total = await AgentPatientModel.countDocuments(matchStage);

  // Status breakdown counts for UI tabs (All, Pending, Paid)
  const statusCountFilter: Record<string, unknown> = { ...scopeFilter };
  if (searchTerm) {
    Object.assign(statusCountFilter, searchQuery);
  }

  const countsAggregation = await AgentPatientModel.aggregate([
    { $match: statusCountFilter },
    {
      $group: {
        _id: "$agentPaymentStatus",
        count: { $sum: 1 },
      },
    },
  ]);

  const statusCounts: TCommissionStatusCounts = {
    all: 0,
    pending: 0,
    paid: 0,
    unpaid: 0,
  };

  countsAggregation.forEach((item) => {
    const key = item._id as keyof Omit<TCommissionStatusCounts, "all">;
    if (key && statusCounts[key] !== undefined) {
      statusCounts[key] = item.count;
    }
    statusCounts.all += item.count;
  });

  const totalPages = Math.ceil(total / Number(limit)) || 1;

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      totalPages,
      total,
    },
    statusCounts,
    paymentStatusCounts: statusCounts,
    data,
  };
};

/* ==================== Get Sub-Agent All Commissions ==================== */
const getSubAgentAllCommissionsByAgent = async (
  subAgentId: string,
  query: TCommissionPatientQuery,
) => {
  const {
    searchTerm,
    paymentStatus,
    status,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const skip = (Number(page) - 1) * Number(limit);
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  // Filter strictly for this specific sub-agent and subAgentCommission > 0
  const scopeFilter: Record<string, unknown> = {
    subAgentId: new Types.ObjectId(subAgentId),
    subAgentCommission: { $gt: 0 },
  };

  // Search query
  let searchQuery: Record<string, unknown> = {};
  if (searchTerm) {
    searchQuery = makeSearchQuery(searchTerm, AGENT_PATIENT_SEARCHABLE_FIELDS);
  }

  // Payment status filter (supports ?paymentStatus=pending or ?status=pending)
  const additionalFilters: Record<string, unknown> = {};
  const targetPaymentStatus = paymentStatus || status;
  if (targetPaymentStatus && targetPaymentStatus !== "all") {
    additionalFilters.subAgentPaymentStatus = targetPaymentStatus;
  }

  const matchStage = {
    ...scopeFilter,
    ...searchQuery,
    ...additionalFilters,
  };

  const pipeline: PipelineStage[] = [
    { $match: matchStage },
    {
      $project: {
        _id: 1,
        caseId: 1,
        fullName: 1,
        patientName: "$fullName",
        commission: { $ifNull: ["$subAgentCommission", 0] },
        commissionFee: { $ifNull: ["$subAgentCommission", 0] },
        subAgentCommission: 1,
        subAgentCommissionFee: "$subAgentCommission",
        paymentStatus: {
          $ifNull: ["$subAgentPaymentStatus", COMMISSION_PAYMENT_STATUS.UNPAID],
        },
        status: {
          $ifNull: ["$subAgentPaymentStatus", COMMISSION_PAYMENT_STATUS.UNPAID],
        },
        patientStatus: "$status",
        date: {
          $ifNull: [
            "$timeline.completedAt",
            { $ifNull: ["$updatedAt", "$createdAt"] },
          ],
        },
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

  const total = await AgentPatientModel.countDocuments(matchStage);

  // Status breakdown counts for UI tabs (All, Pending, Paid)
  const statusCountFilter: Record<string, unknown> = { ...scopeFilter };
  if (searchTerm) {
    Object.assign(statusCountFilter, searchQuery);
  }

  const countsAggregation = await AgentPatientModel.aggregate([
    { $match: statusCountFilter },
    {
      $group: {
        _id: "$subAgentPaymentStatus",
        count: { $sum: 1 },
      },
    },
  ]);

  const statusCounts: TCommissionStatusCounts = {
    all: 0,
    pending: 0,
    paid: 0,
    unpaid: 0,
  };

  countsAggregation.forEach((item) => {
    const key = item._id as keyof Omit<TCommissionStatusCounts, "all">;
    if (key && statusCounts[key] !== undefined) {
      statusCounts[key] = item.count;
    }
    statusCounts.all += item.count;
  });

  const totalPages = Math.ceil(total / Number(limit)) || 1;

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      totalPages,
      total,
    },
    statusCounts,
    paymentStatusCounts: statusCounts,
    data,
  };
};

/* ==================== Get Single Patient Case By Agent ==================== */
const getPatientByAgent = async (
  patientId: string,
  agentUserId: string,
) => {
  const query: Record<string, unknown> = {
    agentUserId: new Types.ObjectId(agentUserId),
    ...(isObjectId(patientId)
      ? { _id: new Types.ObjectId(patientId) }
      : { caseId: patientId }),
  };

  const patient = await AgentPatientModel.findOne(query)
    .populate("subAgentId", "_id refCode fullName email phone agencyName")
    .populate("agentUserId", "_id fullName agencyName email phone profileImg");

  if (!patient) {
    throw new NotFoundError("Patient case not found");
  }

  return patient;
};

/* ==================== Get Single Patient Case By Sub Agent ==================== */
const getPatientBySubAgent = async (
  patientId: string,
  subAgentId: string,
) => {
  const query: Record<string, unknown> = {
    subAgentId: new Types.ObjectId(subAgentId),
    ...(isObjectId(patientId)
      ? { _id: new Types.ObjectId(patientId) }
      : { caseId: patientId }),
  };

  const patient = await AgentPatientModel.findOne(query)
    .populate("agentUserId", "_id fullName agencyName email phone profileImg")
    .populate("subAgentId", "_id refCode fullName email phone agencyName");

  if (!patient) {
    throw new NotFoundError("Patient case not found");
  }

  return patient;
};

const getPatientById = getPatientByAgent;

/* ==================== Update Patient Case ==================== */
const updatePatientByAgent = async (
  patientId: string,
  agentUserId: string,
  payload: TUpdateAgentPatientPayload,
) => {

  const patient = await AgentPatientModel.findOne({
    agentUserId: new Types.ObjectId(agentUserId),
    _id: patientId,
  });
  if (!patient) {
    throw new NotFoundError("Patient case not found");
  }

  //update patient
  const result = await AgentPatientModel.updateOne({
    agentUserId: new Types.ObjectId(agentUserId),
    _id: patientId,
  },
    payload
  )

  return result;
};


/* ==================== Update Patient Case ==================== */
const updatePatientBySubAgent = async (
  patientId: string,
  subAgentId: string,
  payload: TUpdateAgentPatientPayload,
) => {

  const patient = await AgentPatientModel.findOne({
    subAgentId: new Types.ObjectId(subAgentId),
    _id: patientId,
  });
  if (!patient) {
    throw new NotFoundError("Patient case not found");
  }

  //update patient
  const result = await AgentPatientModel.updateOne({
    subAgentId: new Types.ObjectId(subAgentId),
    _id: patientId,
  },
    payload
  )

  return result;
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

  const previousStatus = patient.status;

  // Prevent modifying already completed or cancelled cases
  if (
    previousStatus === PATIENT_CASE_STATUS.COMPLETED ||
    previousStatus === PATIENT_CASE_STATUS.CANCELLED
  ) {
    throw new BadRequestError(
      `Cannot change status of a ${previousStatus} patient case. The case has already been finalized.`
    );
  }

  if (previousStatus === status) {
    return null;
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

  // Update referral partner stats if subAgentId is attached
  if (patient.subAgentId) {
    if (status === PATIENT_CASE_STATUS.COMPLETED) {
      await ReferralPartnerModel.findByIdAndUpdate(patient.subAgentId, {
        $inc: { ongoing: -1, done: 1 },
      });
    } else if (status === PATIENT_CASE_STATUS.CANCELLED) {
      await ReferralPartnerModel.findByIdAndUpdate(patient.subAgentId, {
        $inc: { ongoing: -1 },
      });
    }
  }

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

/* ==================== Update Agent Commission ==================== */
const updateAgentCommission = async (
  patientId: string,
  payload: TUpdateAgentCommissionPayload,
) => {
  const query = isObjectId(patientId)
    ? { _id: new Types.ObjectId(patientId) }
    : { caseId: patientId };

  const patient = await AgentPatientModel.findOne(query);
  if (!patient) {
    throw new NotFoundError("Patient case not found");
  }

  // Commission can only be updated when patient case status is completed
  // if (patient.status !== PATIENT_CASE_STATUS.COMPLETED) {
  //   throw new BadRequestError(
  //     `Commission can only be updated when patient case status is '${PATIENT_CASE_STATUS.COMPLETED}'. Current status is '${patient.status}'.`,
  //   );
  // }

  // If agentUserId is provided, verify it matches patient's assigned agentUserId
  if (payload.agentUserId) {
    if (!isObjectId(payload.agentUserId)) {
      throw new BadRequestError("Invalid agentUserId");
    }
    if (patient.agentUserId.toString() !== payload.agentUserId.toString()) {
      throw new BadRequestError(
        "Provided agentUserId does not match the patient's assigned agent",
      );
    }
  }

  // Ensure the agent user exists in user database
  const agentUser = await UserModel.findById(patient.agentUserId);
  if (!agentUser) {
    throw new NotFoundError("Assigned agent user account not found");
  }

  const requestedPaymentStatus =
    payload.paymentStatus || payload.agentPaymentStatus;

  // 1. If agentCommissionFee is being updated
  if (payload.agentCommissionFee !== undefined) {
    const newFee = Number(payload.agentCommissionFee);
    const previousFee = patient.agentCommissionFee || 0;
    patient.agentCommissionFee = newFee;

    // Rule: commission 0 thek update korle, paymentStatus hobe pending
    if (previousFee === 0 && newFee > 0 && !requestedPaymentStatus) {
      patient.agentPaymentStatus = COMMISSION_PAYMENT_STATUS.PENDING;
    } else if (
      patient.agentPaymentStatus === COMMISSION_PAYMENT_STATUS.UNPAID &&
      newFee > 0 &&
      !requestedPaymentStatus
    ) {
      patient.agentPaymentStatus = COMMISSION_PAYMENT_STATUS.PENDING;
    } else if (newFee === 0 && !requestedPaymentStatus) {
      patient.agentPaymentStatus = COMMISSION_PAYMENT_STATUS.UNPAID;
    }
  }

  // 2. If paymentStatus is explicitly provided
  if (requestedPaymentStatus) {
    // Cannot mark as paid when commission is 0
    if (
      requestedPaymentStatus === COMMISSION_PAYMENT_STATUS.PAID &&
      patient.agentCommissionFee <= 0
    ) {
      throw new BadRequestError(
        "Cannot change payment status to 'paid' when agent commission fee is 0. Please set a commission fee first.",
      );
    }
    patient.agentPaymentStatus = requestedPaymentStatus;
  }

  await patient.save();

  const updatedPatient = await AgentPatientModel.findById(patient._id)
    .populate("agentUserId", "_id fullName email phone")
    .populate("subAgentId", "_id refCode fullName email phone agencyName");

  return updatedPatient;
};

/* ==================== Update Sub-Agent Commission ==================== */
const updateSubAgentCommission = async (
  patientId: string,
  payload: TUpdateSubAgentCommissionPayload,
) => {
  const query = isObjectId(patientId)
    ? { _id: new Types.ObjectId(patientId) }
    : { caseId: patientId };

  const patient = await AgentPatientModel.findOne(query);
  if (!patient) {
    throw new NotFoundError("Patient case not found");
  }

  // // Commission can only be updated when patient case status is completed
  // if (patient.status !== PATIENT_CASE_STATUS.COMPLETED) {
  //   throw new BadRequestError(
  //     `Commission can only be updated when patient case status is '${PATIENT_CASE_STATUS.COMPLETED}'. Current status is '${patient.status}'.`,
  //   );
  // }

  // Check if patient case actually has a subAgentId assigned
  if (!patient.subAgentId) {
    throw new BadRequestError(
      "This patient case does not have an assigned sub-agent / referral partner",
    );
  }

  // If subAgentId is provided, verify it matches patient's assigned subAgentId
  if (payload.subAgentId) {
    if (!isObjectId(payload.subAgentId)) {
      throw new BadRequestError("Invalid subAgentId");
    }
    if (patient.subAgentId.toString() !== payload.subAgentId.toString()) {
      throw new BadRequestError(
        "Provided subAgentId does not match the patient's assigned sub-agent",
      );
    }
  }

  // Ensure the sub-agent (referral partner) exists in database
  const subAgent = await ReferralPartnerModel.findById(patient.subAgentId);
  if (!subAgent) {
    throw new NotFoundError("Assigned sub-agent / referral partner not found");
  }

  const requestedPaymentStatus =
    payload.paymentStatus || payload.subAgentPaymentStatus;

  // 1. If subAgentCommission is being updated
  if (payload.subAgentCommission !== undefined) {
    const newCommission = Number(payload.subAgentCommission);
    const previousCommission = patient.subAgentCommission || 0;
    patient.subAgentCommission = newCommission;

    // Rule: commission 0 thek update korle, paymentStatus hobe pending
    if (previousCommission === 0 && newCommission > 0 && !requestedPaymentStatus) {
      patient.subAgentPaymentStatus = COMMISSION_PAYMENT_STATUS.PENDING;
    } else if (
      patient.subAgentPaymentStatus === COMMISSION_PAYMENT_STATUS.UNPAID &&
      newCommission > 0 &&
      !requestedPaymentStatus
    ) {
      patient.subAgentPaymentStatus = COMMISSION_PAYMENT_STATUS.PENDING;
    } else if (newCommission === 0 && !requestedPaymentStatus) {
      patient.subAgentPaymentStatus = COMMISSION_PAYMENT_STATUS.UNPAID;
    }
  }

  // 2. If paymentStatus is explicitly provided
  if (requestedPaymentStatus) {
    // Cannot mark as paid when commission is 0
    if (
      requestedPaymentStatus === COMMISSION_PAYMENT_STATUS.PAID &&
      patient.subAgentCommission <= 0
    ) {
      throw new BadRequestError(
        "Cannot change payment status to 'paid' when sub-agent commission is 0. Please set a commission fee first.",
      );
    }
    patient.subAgentPaymentStatus = requestedPaymentStatus;
  }

  await patient.save();

  const updatedPatient = await AgentPatientModel.findById(patient._id)
    .populate("agentUserId", "_id fullName email phone")
    .populate("subAgentId", "_id refCode fullName email phone agencyName");

  return updatedPatient;
};

/* ==================== Update Agent Payment Status ==================== */
const updateAgentPaymentStatus = async (
  patientId: string,
  payload: TUpdateAgentCommissionPayload,
) => {
  return await updateAgentCommission(patientId, payload);
};

/* ==================== Update Sub-Agent Payment Status ==================== */
const updateSubAgentPaymentStatus = async (
  patientId: string,
  payload: TUpdateSubAgentCommissionPayload,
) => {
  return await updateSubAgentCommission(patientId, payload);
};

const AgentPatientService = {
  submitPatientByAgent,
  submitPatientBySubAgent,
  getPatientsByAgent,
  getPatientsBySubAgent,
  getAllPatientsByAdmin,
  getStatusStats,
  getAgentCommissionStats,
  getSubAgentCommissionStats,
  getAgentAllCommissions,
  getSubAgentAllCommissionsByAgent,
  getPatientById,
  getPatientByAgent,
  getPatientBySubAgent,
  updatePatientByAgent,
  updatePatientBySubAgent,
  updatePatientStatus,
  deletePatient,
  updateAgentCommission,
  updateSubAgentCommission,
  updateAgentPaymentStatus,
  updateSubAgentPaymentStatus,
};

export default AgentPatientService;
