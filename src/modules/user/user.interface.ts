import { Document } from "mongoose";
import { ACCOUNT_STATUS, USER_ROLES } from "./user.constant";

export type TUserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
export type TAccountStatus = (typeof ACCOUNT_STATUS)[keyof typeof ACCOUNT_STATUS];

export interface IUser extends Document {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: TUserRole;
  profileImg?: string;
  isEmailVerified: boolean;
  emailVerifiedAt?: Date;
  status: TAccountStatus;
  googleId: string;
  appleId: string;
  blockedAt?: Date;
  passwordChangedAt?: Date;
  lastLoginAt?: Date;
  tokenVersion: number;
  createdAt?: Date;
  updatedAt?: Date;
}



export type TUserQuery = {
  searchTerm?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: TAccountStatus;
};


