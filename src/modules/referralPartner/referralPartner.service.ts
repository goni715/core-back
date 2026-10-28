import crypto from "crypto";
import { Types } from "mongoose";
import ConflictError from "../../errors/ConflictError";
import NotFoundError from "../../errors/NotFoundError";
import { makeSearchQuery } from "../../helpers/QueryBuilder";
import sendPartnerInviteEmail from "../../utils/email/sendPartnerInviteEmail";
import generatePartnerId from "../../utils/generatePartnerId";
import isObjectId from "../../utils/isObjectId";
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
  TNetworkOverviewStats,
  TReferralPartnerQuery,
  TReferralPartnerResponseItem,
  TReferralPartnerStatus,
  TReferralPartnerStatusCounts,
  TUpdateReferralPartnerPayload,
} from "./referralPartner.interface";
import ReferralPartnerModel from "./referralPartner.model";

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

  const name = doc.name || doc.fullName || "Partner";
  const initials =
    doc.initials ||
    (name
      .split(/\s+/)
      .map((n: string) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "RP");

  return {
    _id: String(doc._id),
    partnerId: doc.partnerId,
    initials,
    name,
    fullName: name,
    email: doc.email || "",
    phone: doc.phone || "",
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
      : { partnerId: partnerId.trim().toUpperCase() }),
  };

  const partner = await ReferralPartnerModel.findOne(query).lean();
  if (!partner) {
    throw new NotFoundError("Referral partner not found with the provided ID");
  }

  // Fetch recent cases referred by this partner if any
  const recentCases = await AgentPatientModel.find({
    agentUserId: new Types.ObjectId(agentUserId),
    $or: [{ partnerId: partner.partnerId }, { partnerId: String(partner._id) }],
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
  const { name, email, phone, notes } = payload;
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

  // Generate unique Partner ID (e.g. RP-0143)
  const totalCount = await ReferralPartnerModel.countDocuments({
    agentUserId: new Types.ObjectId(agentUserId),
  });
  let partnerId = generatePartnerId(totalCount + 101);

  // Ensure global uniqueness of partnerId
  let duplicate = await ReferralPartnerModel.findOne({ partnerId });
  while (duplicate) {
    partnerId = generatePartnerId();
    duplicate = await ReferralPartnerModel.findOne({ partnerId });
  }

  // Generate invitation token & link
  const inviteToken = crypto.randomBytes(24).toString("hex");
  const inviteLink = `https://health-medicine-agent-website.vercel.app/register?ref=${partnerId}&token=${inviteToken}`;

  // Fetch Channel Partner user info for the email
  const agentUser = await UserModel.findById(agentUserId).lean();
  const channelPartnerName = agentUser?.fullName || "3S Medi Care Int";

  // Create record with 'invited' status
  const partner = await ReferralPartnerModel.create({
    partnerId,
    agentUserId: new Types.ObjectId(agentUserId),
    name: name.trim(),
    fullName: name.trim(),
    email: normalizedEmail,
    phone: phone ? phone.trim() : "",
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
    partnerName: name.trim(),
    partnerId,
    inviteLink,
    channelPartnerName,
  }).catch((err) => {
    console.error("Error dispatching partner invite email:", err);
  });

  return transformPartnerResponse(partner);
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
      : { partnerId: partnerId.trim().toUpperCase() }),
  };

  const partner = await ReferralPartnerModel.findOne(query);
  if (!partner) {
    throw new NotFoundError("Referral partner not found with the provided ID");
  }

  // Update provided fields
  if (payload.name) {
    partner.name = payload.name.trim();
    partner.fullName = payload.name.trim();
  }
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
      : { partnerId: partnerId.trim().toUpperCase() }),
  };

  const partner = await ReferralPartnerModel.findOneAndDelete(query);
  if (!partner) {
    throw new NotFoundError("Referral partner not found with the provided ID");
  }

  return {
    deletedPartnerId: partner.partnerId,
    message: `Referral partner ${partner.name} (${partner.partnerId}) deleted successfully`,
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
      partnerId: "RP-0112",
      name: "Nusrat Jahan",
      fullName: "Nusrat Jahan",
      email: "nusrat.jahan@example.com",
      phone: "+8801711223344",
      initials: "NJ",
      joinedDate: new Date("2026-01-15"),
      cases: 64,
      ongoing: 7,
      done: 57,
      earnings: 1980,
      status: REFERRAL_PARTNER_STATUS.ACTIVE,
    },
    {
      partnerId: "RP-0107",
      name: "Imran Hossain",
      fullName: "Imran Hossain",
      email: "imran.hossain@example.com",
      phone: "+8801811223344",
      initials: "IH",
      joinedDate: new Date("2025-12-10"),
      cases: 51,
      ongoing: 5,
      done: 46,
      earnings: 1620,
      status: REFERRAL_PARTNER_STATUS.ACTIVE,
    },
    {
      partnerId: "RP-0121",
      name: "Farhana Akter",
      fullName: "Farhana Akter",
      email: "farhana.akter@example.com",
      phone: "+8801911223344",
      initials: "FA",
      joinedDate: new Date("2026-02-05"),
      cases: 43,
      ongoing: 6,
      done: 37,
      earnings: 1310,
      status: REFERRAL_PARTNER_STATUS.ACTIVE,
    },
    {
      partnerId: "RP-0130",
      name: "Rakib Chowdhury",
      fullName: "Rakib Chowdhury",
      email: "rakib.chowdhury@example.com",
      phone: "+8801611223344",
      initials: "RC",
      joinedDate: new Date("2026-03-12"),
      cases: 29,
      ongoing: 3,
      done: 26,
      earnings: 890,
      status: REFERRAL_PARTNER_STATUS.ACTIVE,
    },
    {
      partnerId: "RP-0136",
      name: "Mahmudul Hasan",
      fullName: "Mahmudul Hasan",
      email: "mahmudul.hasan@example.com",
      phone: "+8801511223344",
      initials: "MH",
      joinedDate: new Date("2026-04-18"),
      cases: 22,
      ongoing: 4,
      done: 18,
      earnings: 640,
      status: REFERRAL_PARTNER_STATUS.ACTIVE,
    },
    {
      partnerId: "RP-0139",
      name: "Tasnim Sultana",
      fullName: "Tasnim Sultana",
      email: "tasnim.sultana@example.com",
      phone: "+8801411223344",
      initials: "TS",
      joinedDate: new Date("2026-05-22"),
      cases: 14,
      ongoing: 2,
      done: 12,
      earnings: 410,
      status: REFERRAL_PARTNER_STATUS.ACTIVE,
    },
    {
      partnerId: "RP-0142",
      name: "Sadia Rahman",
      fullName: "Sadia Rahman",
      email: "sadia.rahman@example.com",
      phone: "+8801311223344",
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

const ReferralPartnerService = {
  getNetworkStats,
  getReferralPartners,
  getSinglePartner,
  invitePartner,
  getInvitationLink,
  updatePartner,
  changePartnerStatus,
  deletePartner,
  seedSamplePartners,
};

export default ReferralPartnerService;
