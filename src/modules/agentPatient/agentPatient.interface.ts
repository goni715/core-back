import { Document, Types } from "mongoose";
import {
  PATIENT_CASE_STATUS,
  PATIENT_GENDER,
} from "./agentPatient.constant";

export type TPatientCaseStatus =
  (typeof PATIENT_CASE_STATUS)[keyof typeof PATIENT_CASE_STATUS];

export type TPatientGender =
  (typeof PATIENT_GENDER)[keyof typeof PATIENT_GENDER];

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
  partnerId?: string; // Optional Referral Partner ID (e.g. RP-0112)
  fullName: string;
  name?: string;
  phone: string;
  age: number;
  gender: TPatientGender;
  treatmentType: string;
  symptoms: string;
  preferredCountry: string;
  budgetRange: string;
  reports: string[];
  status: TPatientCaseStatus;
  timeline: IPatientTimeline;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TCreateAgentPatientPayload = {
  partnerId?: string;
  fullName: string;
  phone: string;
  age: number;
  gender: TPatientGender;
  treatmentType: string;
  symptoms: string;
  preferredCountry: string;
  budgetRange: string;
  reports?: string[];
};

export type TUpdateAgentPatientPayload = Partial<TCreateAgentPatientPayload>;

export type TUpdateStatusPayload = {
  status: TPatientCaseStatus;
};

export type TAgentPatientQuery = {
  searchTerm?: string;
  status?: TPatientCaseStatus | "all";
  preferredCountry?: string;
  country?: string;
  treatmentType?: string;
  gender?: TPatientGender;
  agentUserId?: string;
  partnerId?: string;
  partner?: string;
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
