import { Document, Types } from "mongoose";
import { TAccountStatus } from "../user/user.interface";
import {
  DOCTOR_APPROVAL_STATUS,
  DOCTOR_REGISTRATION_SOURCE,
  DOCTOR_SPECIALIZATION,
  DOCTOR_STATUS,
  DOCTOR_TITLE,
} from "./doctor.constant";

export type TDoctorTitle =
  (typeof DOCTOR_TITLE)[keyof typeof DOCTOR_TITLE];

export type TDoctorSpecialization =
  (typeof DOCTOR_SPECIALIZATION)[keyof typeof DOCTOR_SPECIALIZATION];

export type TDoctorApprovalStatus =
  (typeof DOCTOR_APPROVAL_STATUS)[keyof typeof DOCTOR_APPROVAL_STATUS];

export type TDoctorStatus =
  (typeof DOCTOR_STATUS)[keyof typeof DOCTOR_STATUS];

export type TDoctorRegistrationSource =
  (typeof DOCTOR_REGISTRATION_SOURCE)[keyof typeof DOCTOR_REGISTRATION_SOURCE];

export interface IDoctor extends Document {
  userId: Types.ObjectId;
  title: TDoctorTitle;
  specialization: TDoctorSpecialization;
  hospital?: string;
  designation?: string;
  education?: string;
  consultationFee?: number;
  address?: string;
  bmdcNumber: string;
  experience?: string | number;
  about?: string;
  qualifications?: string;
  rating?: number;
  totalReviews?: number;
  isOnline: boolean;
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

export type TCreateDoctorPayload = {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  profileImg?: string;
  title?: TDoctorTitle;
  specialization: TDoctorSpecialization;
  hospital?: string;
  designation?: string;
  education?: string;
  consultationFee?: number;
  address?: string;
  bmdcNumber: string;
  experience?: string | number;
  about?: string;
  qualifications: string;
  status?: TDoctorStatus;
  approvalStatus?: TDoctorApprovalStatus;
};

export type TUpdateDoctorPayload = Partial<TCreateDoctorPayload> & {
  rating?: number;
  totalReviews?: number;
  rejectionReason?: string;
  isOnline?: boolean;
};

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
  isOnline?: boolean;
};

export type TPublishedDoctorQuery = {
  searchTerm?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  isOnline?: boolean;
};
