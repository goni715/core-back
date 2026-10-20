import { Document } from "mongoose";
import { HOSPITAL_STATUS } from "./hospital.constant";

export type THospitalStatus =
  (typeof HOSPITAL_STATUS)[keyof typeof HOSPITAL_STATUS];

export interface IHospital extends Document {
  name: string;
  slug: string;
  image: string;
  address: string;
  contactNumber?: string;
  email?: string;
  website?: string;
  specialities: string[];
  languages: string[];
  status: THospitalStatus;
  ratings?: number;
  totalReviews?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type THospitalQuery = {
  searchTerm?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: THospitalStatus;
};
