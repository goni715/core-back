import crypto from "crypto";
import { PipelineStage, Types } from "mongoose";
import BadRequestError from "../../errors/BadRequestError";
import ConflictError from "../../errors/ConflictError";
import NotFoundError from "../../errors/NotFoundError";
import { makeFilterQuery, makeSearchQuery } from "../../helpers/QueryBuilder";
import sendPartnerInviteEmail from "../../utils/email/sendPartnerInviteEmail";
import generatePartnerId from "../../utils/generatePartnerId";
import isObjectId from "../../utils/isObjectId";
import decrypt from "../../utils/decrypt";
import AgentPatientModel from "../agentPatient/agentPatient.model";
import UserModel from "../user/user.model";
import {
  REFERRAL_PARTNER_SEARCHABLE_FIELDS,
  REFERRAL_PARTNER_STATUS,
  REFERRAL_PARTNER_STATUS_BADGES,
} from "./referralPartner.constant";
import {
  IReferralPartner,
  TChangePartnerStatusPayload,
  TInviteReferralPartnerPayload,
  TMyNetworksQuery,
  TNetworkOverviewStats,
  TReferralPartnerQuery,
  TReferralPartnerResponseItem,
  TReferralPartnerStatus,
  TReferralPartnerStatusCounts,
  TRegisterReferralPartnerPayload,
  TUpdateReferralPartnerPayload,
} from "./referralPartner.interface";
import ReferralPartnerModel from "./referralPartner.model";
import generateReferralToken from "../../utils/generateReferralToken";
import config from "../../config";
import { hashedPassword } from "../../helpers/PasswordHelper";
import { TAgentQuery } from "../agent/agent.interface";
import { AGENT_SEARCHABLE_FIELDS } from "../agent/agent.constant";

/**
 * Format date to short Month Year string (e.g. "Jan 2026")
 */
const formatJoinedDate = (date?: Date | null, status?: string): string => {
  if (status === REFERRAL_PARTNER_STATUS.INVITED || !date) {
    return "Invited";
  }
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

/**
 * Format currency string (e.g. "$1,980")
 */
const formatCurrency = (amount: number): string => {
  return `$${Number(amount || 0).toLocaleString()}`;
};

/**
 * Transform a database document into the exact response format expected by the frontend
 */
const transformPartnerResponse = (
  doc: IReferralPartner | any,
): TReferralPartnerResponseItem => {
  const status = (doc.status ||
    REFERRAL_PARTNER_STATUS.ACTIVE) as TReferralPartnerStatus;
  const badgeInfo = REFERRAL_PARTNER_STATUS_BADGES[status] || {
    badgeClass: "bg-[#d1fae5] text-[#059669]",
  };

  const fullName = doc.fullName || "Partner";
  const initials =
    doc.initials ||
    (fullName
      .split(/\s+/)
      .map((n: string) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "RP");

  return {
    _id: String(doc._id),
    refCode: doc.refCode || "",
    partnerId: doc.refCode || "",
    initials,
    name: fullName,
    fullName,
    email: doc.email || "",
    phone: doc.phone || "",
    agencyName: doc.agencyName || "",
    agentUserId: doc.agentUserId ? String(doc.agentUserId) : undefined,
    joined: formatJoinedDate(doc.joinedDate, status),
    joinedDate: doc.joinedDate || null,
    cases: Number(doc.cases || 0),
    ongoing: Number(doc.ongoing || 0),
    done: Number(doc.done || 0),
    earnings: formatCurrency(doc.earnings || 0),
    earningsAmount: Number(doc.earnings || 0),
    status,
    statusBadge: badgeInfo.badgeClass,
    inviteLink: doc.inviteLink || undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

/* ==================== Get Network Overview Statistics ==================== */
const getNetworkStats = async (
  agentUserId: string,
): Promise<{
  overviewStats: TNetworkOverviewStats;
  statusCounts: TReferralPartnerStatusCounts;
}> => {
  const scopeFilter = { agentUserId: new Types.ObjectId(agentUserId) };

  // Status breakdown counts
  const statusAggregation = await ReferralPartnerModel.aggregate([
    { $match: scopeFilter },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const statusCounts: TReferralPartnerStatusCounts = {
    all: 0,
    active: 0,
    invited: 0,
    paused: 0,
  };

  statusAggregation.forEach((item) => {
    const key = item._id as keyof Omit<TReferralPartnerStatusCounts, "all">;
    if (key && statusCounts[key] !== undefined) {
      statusCounts[key] = item.count;
    }
    statusCounts.all += item.count;
  });

  // Calculate active this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const activeThisMonthCount = await ReferralPartnerModel.countDocuments({
    ...scopeFilter,
    status: REFERRAL_PARTNER_STATUS.ACTIVE,
    $or: [
      { lastActiveAt: { $gte: startOfMonth } },
      { updatedAt: { $gte: startOfMonth } },
      { cases: { $gt: 0 } },
    ],
  });

  // Calculate total cases & earnings across network
  const totalsAggregation = await ReferralPartnerModel.aggregate([
    { $match: scopeFilter },
    {
      $group: {
        _id: null,
        totalCases: { $sum: "$cases" },
        totalEarnings: { $sum: "$earnings" },
      },
    },
  ]);

  const totalCases = totalsAggregation[0]?.totalCases || 0;
  const totalEarnings = totalsAggregation[0]?.totalEarnings || 0;

  const overviewStats: TNetworkOverviewStats = {
    referralPartners: statusCounts.all,
    activeThisMonth: activeThisMonthCount,
    casesInNetwork: totalCases,
    networkEarnings: totalEarnings,
    formattedEarnings: formatCurrency(totalEarnings),
  };

  return {
    overviewStats,
    statusCounts,
  };
};

/* ==================== Get Referral Partners List ==================== */
const getReferralPartners = async (
  agentUserId: string,
  query: TReferralPartnerQuery,
) => {
  const {
    searchTerm,
    status,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const skip = (Number(page) - 1) * Number(limit);
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  const scopeFilter: Record<string, unknown> = {
    agentUserId: new Types.ObjectId(agentUserId),
  };

  // Search filter
  let searchQuery: Record<string, unknown> = {};
  if (searchTerm && searchTerm.trim()) {
    searchQuery = makeSearchQuery(
      searchTerm.trim(),
      REFERRAL_PARTNER_SEARCHABLE_FIELDS,
    );
  }

  // Status filter (all, active, invited, paused)
  const additionalFilters: Record<string, unknown> = {};
  if (status && status !== "all") {
    additionalFilters.status = status.toLowerCase();
  }

  const matchStage = {
    ...scopeFilter,
    ...searchQuery,
    ...additionalFilters,
  };

  // Find paginated partners
  const [partners, totalCount, statsData] = await Promise.all([
    ReferralPartnerModel.find(matchStage)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    ReferralPartnerModel.countDocuments(matchStage),
    getNetworkStats(agentUserId),
  ]);

  const totalPages = Math.ceil(totalCount / Number(limit)) || 1;
  const data = partners.map(transformPartnerResponse);

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      totalPages,
      total: totalCount,
    },
    statusCounts: statsData.statusCounts,
    overviewStats: statsData.overviewStats,
    data,
  };
};

/* ==================== Get Single Partner By ID or Code ==================== */
const getSinglePartner = async (agentUserId: string, partnerId: string) => {
  const isMongoId = isObjectId(partnerId);
  const query: Record<string, unknown> = {
    agentUserId: new Types.ObjectId(agentUserId),
    ...(isMongoId
      ? { _id: partnerId }
      : { refCode: partnerId.trim().toUpperCase() }),
  };

  const partner = await ReferralPartnerModel.findOne(query).lean();
  if (!partner) {
    throw new NotFoundError("Referral partner not found with the provided ID");
  }

  // Fetch recent cases referred by this partner if any
  const recentCases = await AgentPatientModel.find({
    agentUserId: new Types.ObjectId(agentUserId),
    $or: [
      { subAgentId: partner._id },
      { partnerId: partner.refCode },
      { partnerId: String(partner._id) },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return {
    ...transformPartnerResponse(partner),
    recentCases,
  };
};

/* ==================== Invite New Referral Partner ==================== */
const invitePartner = async (
  agentUserId: string,
  payload: TInviteReferralPartnerPayload,
) => {
  const { name, fullName, email, phone, agencyName, password, notes } = payload;
  const partnerFullName = (fullName || name || "").trim();
  const normalizedEmail = email.trim().toLowerCase();

  // Check if partner already exists for this agent
  const existingPartner = await ReferralPartnerModel.findOne({
    agentUserId: new Types.ObjectId(agentUserId),
    email: normalizedEmail,
  });

  if (existingPartner) {
    throw new ConflictError(
      "A referral partner with this email already exists in your network.",
    );
  }

  // Generate unique refCode (e.g. RP-0143)
  const totalCount = await ReferralPartnerModel.countDocuments({
    agentUserId: new Types.ObjectId(agentUserId),
  });
  let refCode = generatePartnerId(totalCount + 101);

  // Ensure global uniqueness of refCode
  let duplicate = await ReferralPartnerModel.findOne({ refCode });
  while (duplicate) {
    refCode = generatePartnerId();
    duplicate = await ReferralPartnerModel.findOne({ refCode });
  }

  // Generate invitation token & link
  const inviteToken = crypto.randomBytes(24).toString("hex");
  const inviteLink = `https://health-medicine-agent-website.vercel.app/register?ref=${refCode}&token=${inviteToken}`;

  // Fetch Channel Partner user info for the email
  const agentUser = await UserModel.findById(agentUserId).lean();
  const channelPartnerName = agentUser?.fullName || "3S Medi Care Int";

  // Create record with 'invited' status
  const partner = await ReferralPartnerModel.create({
    refCode,
    agentUserId: new Types.ObjectId(agentUserId),
    fullName: partnerFullName,
    email: normalizedEmail,
    phone: phone ? phone.trim() : "",
    agencyName: (agencyName || "General Agency").trim(),
    password: password || crypto.randomBytes(8).toString("hex") + "1a",
    status: REFERRAL_PARTNER_STATUS.INVITED,
    inviteToken,
    inviteLink,
    notes: notes ? notes.trim() : "",
    cases: 0,
    ongoing: 0,
    done: 0,
    earnings: 0,
    joinedDate: null,
  });

  // Send invitation email in the background (non-blocking)
  sendPartnerInviteEmail({
    to: normalizedEmail,
    partnerName: partnerFullName,
    partnerId: refCode,
    inviteLink,
    channelPartnerName,
  }).catch((err) => {
    console.error("Error dispatching partner invite email:", err);
  });

  return transformPartnerResponse(partner);
};

/* ==================== Register Partner by Referral Link (Self-Registration) ==================== */
const registerPartner = async (payload: TRegisterReferralPartnerPayload) => {
  const { referralToken, fullName, email, phone, agencyName, password } =
    payload;

  // 1. Decrypt referral token to extract refCode and agentUserId
  let decryptedToken = "";
  try {
    decryptedToken = decrypt(referralToken);
  } catch (err) {
    throw new BadRequestError("Invalid or corrupted referral token.");
  }

  const [refCode, agentUserId] = (decryptedToken || "").split(":");

  if (!refCode || !agentUserId || !isObjectId(agentUserId)) {
    throw new BadRequestError("Invalid referral token data.");
  }

  // 2. Validate agent user existence
  const agentUser = await UserModel.findById(agentUserId).lean();
  if (!agentUser) {
    throw new NotFoundError("Agent user not found for this referral link.");
  }


  // 3. Check for existing partner with this email
  const existingPartner = await ReferralPartnerModel.findOne({
    email
  });

  if (existingPartner) {
    throw new ConflictError(
      "A referral partner with this email is already registered.",
    );
  }

  // hash password
  const hashPass = await hashedPassword(password);

  // 4. Create new partner record
  await ReferralPartnerModel.create({
    refCode,
    agentUserId: new Types.ObjectId(agentUserId),
    fullName,
    email,
    phone,
    agencyName,
    password: hashPass,
    status: REFERRAL_PARTNER_STATUS.ACTIVE,
    joinedDate: new Date(),
    lastActiveAt: new Date(),
    cases: 0,
    ongoing: 0,
    done: 0,
    earnings: 0,
  });

  return null;
};

const generateInvitationLink = async (agentUserId: string) => {
  //generate referral token
  const referralToken = generateReferralToken(agentUserId);
  const invitationLink = `${config.frontEndUrl}/${referralToken}`;
  return {
    invitationLink,
  };
};

/* ==================== Get Channel Partner Invite Link ==================== */
const getInvitationLink = async (agentUserId: string) => {
  const user = await UserModel.findById(agentUserId).lean();
  if (!user) {
    throw new NotFoundError("Channel Partner account not found");
  }

  const cpCode = `CP-${String(agentUserId).slice(-4).toUpperCase()}`;
  const invitationLink = `https://health-medicine-agent-website.vercel.app/register?ref=${cpCode}`;

  return {
    channelPartnerId: cpCode,
    channelPartnerName: user.fullName || "3S Medi Care Int",
    invitationLink,
    description:
      "Send an invitation link. Anyone who signs up through it is linked to you as their Channel Partner and appears in your network.",
  };
};

/* ==================== Update Referral Partner ==================== */
const updatePartner = async (
  agentUserId: string,
  partnerId: string,
  payload: TUpdateReferralPartnerPayload,
) => {
  const isMongoId = isObjectId(partnerId);
  const query: Record<string, unknown> = {
    agentUserId: new Types.ObjectId(agentUserId),
    ...(isMongoId
      ? { _id: partnerId }
      : { refCode: partnerId.trim().toUpperCase() }),
  };

  const partner = await ReferralPartnerModel.findOne(query);
  if (!partner) {
    throw new NotFoundError("Referral partner not found with the provided ID");
  }

  // Update provided fields
  if (payload.fullName || payload.name) {
    partner.fullName = (payload.fullName || payload.name)!.trim();
  }
  if (payload.agencyName) partner.agencyName = payload.agencyName.trim();
  if (payload.email) partner.email = payload.email.trim().toLowerCase();
  if (payload.phone !== undefined) partner.phone = payload.phone.trim();
  if (payload.notes !== undefined) partner.notes = payload.notes.trim();
  if (payload.cases !== undefined) partner.cases = Number(payload.cases);
  if (payload.ongoing !== undefined) partner.ongoing = Number(payload.ongoing);
  if (payload.done !== undefined) partner.done = Number(payload.done);
  if (payload.earnings !== undefined)
    partner.earnings = Number(payload.earnings);

  if (payload.status) {
    partner.status = payload.status;
    if (
      payload.status === REFERRAL_PARTNER_STATUS.ACTIVE &&
      !partner.joinedDate
    ) {
      partner.joinedDate = new Date();
    }
  }

  partner.lastActiveAt = new Date();
  await partner.save();

  return transformPartnerResponse(partner);
};

/* ==================== Change Partner Status ==================== */
const changePartnerStatus = async (
  agentUserId: string,
  partnerId: string,
  payload: TChangePartnerStatusPayload,
) => {
  const { status } = payload;
  return await updatePartner(agentUserId, partnerId, { status });
};

/* ==================== Delete Referral Partner ==================== */
const deletePartner = async (agentUserId: string, partnerId: string) => {
  const isMongoId = isObjectId(partnerId);
  const query: Record<string, unknown> = {
    agentUserId: new Types.ObjectId(agentUserId),
    ...(isMongoId
      ? { _id: partnerId }
      : { refCode: partnerId.trim().toUpperCase() }),
  };

  const partner = await ReferralPartnerModel.findOneAndDelete(query);
  if (!partner) {
    throw new NotFoundError("Referral partner not found with the provided ID");
  }

  return {
    deletedPartnerId: partner.refCode,
    message: `Referral partner ${partner.fullName} (${partner.refCode}) deleted successfully`,
  };
};

/* ==================== Seed Initial Sample Network Partners ==================== */
const seedSamplePartners = async (agentUserId: string) => {
  const existingCount = await ReferralPartnerModel.countDocuments({
    agentUserId: new Types.ObjectId(agentUserId),
  });

  if (existingCount > 0) {
    return {
      message: `Agent network already has ${existingCount} referral partners. No seeding needed.`,
      count: existingCount,
    };
  }

  const samplePartners = [
    {
      refCode: "RP-0112",
      fullName: "Nusrat Jahan",
      email: "nusrat.jahan@example.com",
      phone: "+8801711223344",
      agencyName: "Jahan Health Agency",
      password: "SamplePassword123",
      initials: "NJ",
      joinedDate: new Date("2026-01-15"),
      cases: 64,
      ongoing: 7,
      done: 57,
      earnings: 1980,
      status: REFERRAL_PARTNER_STATUS.ACTIVE,
    },
    {
      refCode: "RP-0107",
      fullName: "Imran Hossain",
      email: "imran.hossain@example.com",
      phone: "+8801811223344",
      agencyName: "Hossain Medical Care",
      password: "SamplePassword123",
      initials: "IH",
      joinedDate: new Date("2025-12-10"),
      cases: 51,
      ongoing: 5,
      done: 46,
      earnings: 1620,
      status: REFERRAL_PARTNER_STATUS.ACTIVE,
    },
    {
      refCode: "RP-0121",
      fullName: "Farhana Akter",
      email: "farhana.akter@example.com",
      phone: "+8801911223344",
      agencyName: "Farhana Consultancy",
      password: "SamplePassword123",
      initials: "FA",
      joinedDate: new Date("2026-02-05"),
      cases: 43,
      ongoing: 6,
      done: 37,
      earnings: 1310,
      status: REFERRAL_PARTNER_STATUS.ACTIVE,
    },
    {
      refCode: "RP-0130",
      fullName: "Rakib Chowdhury",
      email: "rakib.chowdhury@example.com",
      phone: "+8801611223344",
      agencyName: "Chowdhury Health",
      password: "SamplePassword123",
      initials: "RC",
      joinedDate: new Date("2026-03-12"),
      cases: 29,
      ongoing: 3,
      done: 26,
      earnings: 890,
      status: REFERRAL_PARTNER_STATUS.ACTIVE,
    },
    {
      refCode: "RP-0136",
      fullName: "Mahmudul Hasan",
      email: "mahmudul.hasan@example.com",
      phone: "+8801511223344",
      agencyName: "Hasan Medicare",
      password: "SamplePassword123",
      initials: "MH",
      joinedDate: new Date("2026-04-18"),
      cases: 22,
      ongoing: 4,
      done: 18,
      earnings: 640,
      status: REFERRAL_PARTNER_STATUS.ACTIVE,
    },
    {
      refCode: "RP-0139",
      fullName: "Tasnim Sultana",
      email: "tasnim.sultana@example.com",
      phone: "+8801411223344",
      agencyName: "Tasnim Health Net",
      password: "SamplePassword123",
      initials: "TS",
      joinedDate: new Date("2026-05-22"),
      cases: 14,
      ongoing: 2,
      done: 12,
      earnings: 410,
      status: REFERRAL_PARTNER_STATUS.ACTIVE,
    },
    {
      refCode: "RP-0142",
      fullName: "Sadia Rahman",
      email: "sadia.rahman@example.com",
      phone: "+8801311223344",
      agencyName: "Sadia Health Associates",
      password: "SamplePassword123",
      initials: "SR",
      joinedDate: null,
      cases: 0,
      ongoing: 0,
      done: 0,
      earnings: 0,
      status: REFERRAL_PARTNER_STATUS.INVITED,
    },
  ];

  const docs = samplePartners.map((item) => ({
    ...item,
    agentUserId: new Types.ObjectId(agentUserId),
  }));

  await ReferralPartnerModel.insertMany(docs);

  return {
    message: "Sample referral partners seeded successfully matching the design",
    count: docs.length,
  };
};

/*============== get my networks (Agent's referral partners listing) ================== */
const getMyNetworks = async (
  agentUserId: string,
  query: TMyNetworksQuery,
) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortOrder = "desc",
    sortBy = "createdAt",
    ...filters
  } = query;

  // 1. set up pagination
  const skip = (Number(page) - 1) * Number(limit);

  // 2. setup sorting
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  // 3. setup searching
  let searchQuery: Record<string, unknown> = {};
  if (searchTerm) {
    searchQuery = makeSearchQuery(
      searchTerm,
      REFERRAL_PARTNER_SEARCHABLE_FIELDS,
    );
  }

  // 4. setup filters
  if (filters.status === "all") {
    delete filters.status;
  }
  let filterQuery: Record<string, unknown> = {};
  if (filters && Object.keys(filters).length > 0) {
    filterQuery = makeFilterQuery(filters);
  }

  // common pipeline
  const pipeline: PipelineStage[] = [
    {
      $match: {
        agentUserId: new Types.ObjectId(agentUserId),
        ...searchQuery,
        ...filterQuery,
      },
    },
  ];

  // Fetch networks list with projection
  const networks = await ReferralPartnerModel.aggregate([
    ...pipeline,
    {
      $project: {
        _id: 1,
        refCode: 1,
        partnerId: "$refCode",
        agentUserId: 1,
        fullName: 1,
        name: "$fullName",
        agencyName: 1,
        email: 1,
        phone: 1,
        initials: 1,
        joinedDate: 1,
        cases: 1,
        ongoing: 1,
        done: 1,
        earnings: 1,
        status: 1,
        inviteToken: 1,
        inviteLink: 1,
        notes: 1,
        lastActiveAt: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
    { $sort: { [sortBy]: sortDirection } },
    { $skip: skip },
    { $limit: Number(limit) },
  ]);

  // Total count
  const countPipeline: PipelineStage[] = [
    ...pipeline,
    { $count: "totalCount" },
  ];
  const totalCountResult = await ReferralPartnerModel.aggregate(countPipeline);

  const totalCount = totalCountResult[0]?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / Number(limit));

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      totalPages,
      total: totalCount,
    },
    data: networks,
  };
};

/*=========== get sub agents ===========*/
const getSubAgents = async (query: TAgentQuery) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortOrder = "desc",
    sortBy = "createdAt",
    ...filters
  } = query;

  const skip = (Number(page) - 1) * Number(limit);
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  let searchQuery = {};
  if (searchTerm) {
    searchQuery = makeSearchQuery(searchTerm, AGENT_SEARCHABLE_FIELDS);
  }

  let filterQuery = {};
  if (Object.keys(filters).length > 0) {
    filterQuery = makeFilterQuery(filters);
  }

  const pipeline: PipelineStage[] = [
    {
      $match: {
        ...searchQuery,
        ...filterQuery,
      },
    },
  ];

  const agents = await ReferralPartnerModel.aggregate([
    ...pipeline,
    {
      $project: {
        password: 0,
        inviteToken: 0,
        inviteLink: 0
      },
    },
    { $sort: { [sortBy]: sortDirection } },
    { $skip: skip },
    { $limit: Number(limit) },
  ]);

  const countPipeline: PipelineStage[] = [
    ...pipeline,
    { $count: "totalCount" },
  ];
  const totalCountResult = await ReferralPartnerModel.aggregate(countPipeline);

  const totalCount = totalCountResult[0]?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / Number(limit));

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      totalPages,
      total: totalCount,
    },
    data: agents,
  };
};

const ReferralPartnerService = {
  generateInvitationLink,
  registerPartner,
  getNetworkStats,
  getReferralPartners,
  getSinglePartner,
  invitePartner,
  getInvitationLink,
  updatePartner,
  changePartnerStatus,
  deletePartner,
  seedSamplePartners,
  getMyNetworks,
  getSubAgents
};

export default ReferralPartnerService;
