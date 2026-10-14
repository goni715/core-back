import { Document, Types } from "mongoose";
import { TAccountStatus } from "../user/user.interface";

export interface IDoctor extends Document {
  userId: Types.ObjectId;
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
  createdAt?: Date;
  updatedAt?: Date;
}

export type TDoctorQuery = {
  searchTerm?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: TAccountStatus;
  specialization?: string;
  city?: string;
  country?: string;
  hospital?: string;
  availabilityLabel?: string;
};
