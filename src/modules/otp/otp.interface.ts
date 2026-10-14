import { OTP_TYPE } from "./otp.constant";
import { Document, Types } from "mongoose";

export type TOtpType = (typeof OTP_TYPE)[keyof typeof OTP_TYPE];

export interface IOtp extends Document {
  userId: Types.ObjectId;
  email: string;
  otp: string;
  type: TOtpType;
  expiresAt: Date;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}
