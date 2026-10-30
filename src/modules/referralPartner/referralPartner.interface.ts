import { Document, Types } from "mongoose";
import { REFERRAL_PARTNER_STATUS } from "./referralPartner.constant";

export type TReferralPartnerStatus =
  (typeof REFERRAL_PARTNER_STATUS)[keyof typeof REFERRAL_PARTNER_STATUS];

export interface IReferralPartner extends Document {
  refCode: string; // e.g. "CP-0112"
  agentUserId: Types.ObjectId; // The Channel Partner / Agent
  fullName: string;
  email: string;
  phone: string;
  agencyName: string;
  password: string;
  initials: string; // e.g. "NJ"
  joinedDate?: Date | null;
  cases: number; // total cases submitted by this referral partner
  ongoing: number; // ongoing active cases
  done: number; // completed cases
  earnings: number; // earnings in USD generated for the channel partner
  status: TReferralPartnerStatus;
  inviteToken?: string;
  inviteLink?: string;
  notes?: string;
  lastActiveAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TRegisterReferralPartnerPayload = {
  referralToken: string;
  fullName: string;
  email: string;
  phone: string;
  agencyName: string;
  password: string;
};

export type TInviteReferralPartnerPayload = {
  fullName: string;
  name?: string;
  email: string;
  phone?: string;
  agencyName?: string;
  password?: string;
  notes?: string;
};

export type TCreateReferralPartnerPayload = {
  fullName: string;
  email: string;
  phone: string;
  agencyName: string;
  password: string;
  status?: TReferralPartnerStatus;
  joinedDate?: Date | null;
  cases?: number;
  ongoing?: number;
  done?: number;
  earnings?: number;
  notes?: string;
};

export type TUpdateReferralPartnerPayload = Partial<{
  fullName: string;
  name: string;
  agencyName: string;
  email: string;
  phone: string;
  status: TReferralPartnerStatus;
  joinedDate: Date | null;
  cases: number;
  ongoing: number;
  done: number;
  earnings: number;
  notes: string;
}>;

export type TChangePartnerStatusPayload = {
  status: TReferralPartnerStatus;
};

export type TReferralPartnerQuery = {
  searchTerm?: string;
  status?: TReferralPartnerStatus | "all";
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type TMyNetworksQuery = {
  searchTerm?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc" | string;
  status?: TReferralPartnerStatus | "all";
};

export type TReferralPartnerStatusCounts = {
  all: number;
  active: number;
  invited: number;
  paused: number;
};

export type TNetworkOverviewStats = {
  referralPartners: number; // total count, e.g. 24
  activeThisMonth: number; // active this month, e.g. 17
  casesInNetwork: number; // sum of all cases, e.g. 386
  networkEarnings: number; // sum of all earnings, e.g. 8900
  formattedEarnings: string; // "$8,900"
};

export type TReferralPartnerResponseItem = {
  _id: string;
  refCode: string;
  partnerId: string;
  initials: string;
  name: string;
  fullName: string;
  email: string;
  phone?: string | undefined;
  agencyName: string;
  agentUserId?: string | undefined;
  joined: string; // formatted e.g. "Jan 2026" or "Invited"
  joinedDate?: Date | null | undefined;
  cases: number;
  ongoing: number;
  done: number;
  earnings: string; // formatted e.g. "$1,980"
  earningsAmount: number;
  status: TReferralPartnerStatus;
  statusBadge: string;
  inviteLink?: string | undefined;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
};
