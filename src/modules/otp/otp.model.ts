import { model, Schema } from "mongoose";
import { OTP_TYPE, OTP_TYPE_VALUES } from "./otp.constant";
import { IOtp } from "./otp.interface";

const otpSchema = new Schema<IOtp>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
      unique: true,
    },
    email: {
      type: String,
      required: [true, "email is required"],
      trim: true,
      lowercase: true,
      unique: true,
    },
    otp: {
      type: String,
      required: true,
      trim: true,
      minlength: 6,
      maxlength: 6,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      expires: 0 //(Time-To-Live)
    },
    type: {
      type: String,
      enum: OTP_TYPE_VALUES,
      required: true,
      default: OTP_TYPE.REGISTER
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const OtpModel = model<IOtp>("Otp", otpSchema);
export default OtpModel;
