import { Document, Types } from "mongoose";
import { TAccountStatus } from "../user/user.interface";
import {
  DOCTOR_APPROVAL_STATUS,
  DOCTOR_REGISTRATION_SOURCE,
  DOCTOR_STATUS,
  DOCTOR_TITLE,
} from "./doctor.constant";

export type TDoctorTitle =
  (typeof DOCTOR_TITLE)[keyof typeof DOCTOR_TITLE];

export type TDoctorApprovalStatus =
  (typeof DOCTOR_APPROVAL_STATUS)[keyof typeof DOCTOR_APPROVAL_STATUS];

export type TDoctorStatus =
  (typeof DOCTOR_STATUS)[keyof typeof DOCTOR_STATUS];

export type TDoctorRegistrationSource =
  (typeof DOCTOR_REGISTRATION_SOURCE)[keyof typeof DOCTOR_REGISTRATION_SOURCE];

export interface IDoctor extends Document {
  userId: Types.ObjectId;
  title: TDoctorTitle;
  specialization: string;
  hospital?: string;
  country?: string;
  city: string;
  bmdcNumber: string;
  experience?: string | number;
  fee?: number;
  languages?: string[];
  about?: string;
  qualifications?: string[];
  consultationTypes?: string[];
  availabilityLabel?: string;
  availableDays?: string[];
  rating?: number;
  totalReviews?: number;
  // Approval system
  approvalStatus: TDoctorApprovalStatus;
  approvedAt?: Date | null;
  approvedBy?: Types.ObjectId | null;
  rejectedAt?: Date | null;
  rejectedBy?: Types.ObjectId | null;
  rejectionReason?: string;
  // Publication / active status
  status: TDoctorStatus;
  registrationSource: TDoctorRegistrationSource;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TDoctorQuery = {
  searchTerm?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: TDoctorStatus;
  approvalStatus?: TDoctorApprovalStatus;
  registrationSource?: TDoctorRegistrationSource;
  userStatus?: TAccountStatus;
  specialization?: string;
  city?: string;
  country?: string;
  hospital?: string;
  availabilityLabel?: string;
};
