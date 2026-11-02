import { Document, Types } from "mongoose";
import {
  COMMISSION_PAYMENT_STATUS,
  PATIENT_CASE_STATUS,
  PATIENT_GENDER,
} from "./agentPatient.constant";

export type TPatientCaseStatus =
  (typeof PATIENT_CASE_STATUS)[keyof typeof PATIENT_CASE_STATUS];

export type TPatientGender =
  (typeof PATIENT_GENDER)[keyof typeof PATIENT_GENDER];

export type TCommissionPaymentStatus =
  (typeof COMMISSION_PAYMENT_STATUS)[keyof typeof COMMISSION_PAYMENT_STATUS];

export interface IPatientTimeline {
  submittedAt: Date;
  underReviewAt?: Date | null;
  confirmedAt?: Date | null;
  ongoingAt?: Date | null;
  completedAt?: Date | null;
  cancelledAt?: Date | null;
}

export interface IAgentPatient extends Document {
  caseId: string;
  agentUserId: Types.ObjectId;
  subAgentId?: Types.ObjectId | null; // Optional Sub-Agent ObjectId
  agentCommissionFee: number;
  agentPaymentStatus: TCommissionPaymentStatus;
  subAgentCommission: number;
  subAgentPaymentStatus: TCommissionPaymentStatus;
  fullName: string;
  phone: string;
  age: number;
  gender: TPatientGender;
  treatmentType: string;
  symptoms: string;
  preferredCountry: string;
  budgetRange: string;
  driveLink?: string | null;
  status: TPatientCaseStatus;
  timeline: IPatientTimeline;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TCreateAgentPatientPayload = {
  subAgentId?: Types.ObjectId | string | null;
  fullName: string;
  phone: string;
  age: number;
  gender: TPatientGender;
  treatmentType: string;
  symptoms: string;
  preferredCountry: string;
  budgetRange: string;
  driveLink?: string | null;
};

export type TUpdateAgentPatientPayload = Partial<TCreateAgentPatientPayload>;

export type TUpdateStatusPayload = {
  status: TPatientCaseStatus;
};

export type TUpdateAgentCommissionPayload = {
  agentUserId?: string | undefined;
  agentCommissionFee?: number | undefined;
  paymentStatus?: TCommissionPaymentStatus | undefined;
  agentPaymentStatus?: TCommissionPaymentStatus | undefined;
};

export type TUpdateSubAgentCommissionPayload = {
  subAgentId?: string | undefined;
  subAgentCommission?: number | undefined;
  subAgentCommissionFee?: number | undefined;
  paymentStatus?: TCommissionPaymentStatus | undefined;
  subAgentPaymentStatus?: TCommissionPaymentStatus | undefined;
};

export type TUpdatePaymentStatusPayload = {
  agentUserId?: string | undefined;
  subAgentId?: string | undefined;
  paymentStatus: TCommissionPaymentStatus;
};

export type TUpdateAgentPaymentStatusPayload = {
  agentPaymentStatus?: TCommissionPaymentStatus | undefined;
  paymentStatus?: TCommissionPaymentStatus | undefined;
};

export type TUpdateSubAgentPaymentStatusPayload = {
  subAgentPaymentStatus?: TCommissionPaymentStatus | undefined;
  paymentStatus?: TCommissionPaymentStatus | undefined;
};

export type TAgentPatientQuery = {
  searchTerm?: string;
  status?: TPatientCaseStatus | "all";
  preferredCountry?: string;
  country?: string;
  treatmentType?: string;
  gender?: TPatientGender;
  agentUserId?: string;
  subAgentId?: string;
  subAgent?: string;
  partnerId?: string;
  partner?: string;
  paymentStatus?: TCommissionPaymentStatus | "all";
  agentPaymentStatus?: TCommissionPaymentStatus | "all";
  subAgentPaymentStatus?: TCommissionPaymentStatus | "all";
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type TPatientStatusCounts = {
  all: number;
  submitted: number;
  under_review: number;
  confirmed: number;
  ongoing: number;
  completed: number;
  cancelled: number;
};

export type TCommissionStatusCounts = {
  all: number;
  pending: number;
  paid: number;
  unpaid?: number;
};

export type TCommissionPatientQuery = {
  searchTerm?: string;
  paymentStatus?: TCommissionPaymentStatus | "all";
  status?: TCommissionPaymentStatus | "all";
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};
