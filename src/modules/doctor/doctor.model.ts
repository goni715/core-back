import { Schema, model } from "mongoose";
import { IDoctor } from "./doctor.interface";
import {
  DOCTOR_APPROVAL_STATUS,
  DOCTOR_APPROVAL_STATUS_VALUES,
  DOCTOR_REGISTRATION_SOURCE,
  DOCTOR_REGISTRATION_SOURCE_VALUES,
  DOCTOR_SPECIALIZATION_VALUES,
  DOCTOR_STATUS,
  DOCTOR_STATUS_VALUES,
  DOCTOR_TITLE,
  DOCTOR_TITLE_VALUES,
} from "./doctor.constant";

const doctorSchema = new Schema<IDoctor>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      unique: true,
    },
    title: {
      type: String,
      enum: {
        values: DOCTOR_TITLE_VALUES,
        message: "{VALUE} is not a valid doctor title",
      },
      required: [true, "Title is required"],
      default: DOCTOR_TITLE.DR,
      trim: true,
    },
    specialization: {
      type: String,
      enum: {
        values: DOCTOR_SPECIALIZATION_VALUES,
        message: "{VALUE} is not a valid specialization",
      },
      required: [true, "Specialization is required"],
      trim: true,
    },
    hospital: {
      type: String,
      trim: true,
      default: "",
    },
    designation: {
      type: String,
      trim: true,
      default: "",
    },
    education: {
      type: String,
      trim: true,
      default: "",
    },
    consultationFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    address: {
      type: String,
      trim: true,
    },
    bmdcNumber: {
      type: String,
      required: [true, "BMDC Number is required"],
      unique: true,
      trim: true,
    },
    experience: {
      type: Schema.Types.Mixed,
      default: 0,
    },
    about: {
      type: String,
      trim: true,
      default: "",
    },
    qualifications: {
      type: String,
      trim: true,
      default: "",
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    approvalStatus: {
      type: String,
      enum: {
        values: DOCTOR_APPROVAL_STATUS_VALUES,
        message: "{VALUE} is not a valid approval status",
      },
      default: DOCTOR_APPROVAL_STATUS.PENDING,
      index: true,
    },
    approvedAt: {
      type: Date,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    rejectedAt: {
      type: Date,
    },
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: DOCTOR_STATUS_VALUES,
        message: "{VALUE} is not a valid status",
      },
      default: DOCTOR_STATUS.DRAFT,
      index: true,
    },
    registrationSource: {
      type: String,
      enum: {
        values: DOCTOR_REGISTRATION_SOURCE_VALUES,
        message: "{VALUE} is not a valid registration source",
      },
      default: DOCTOR_REGISTRATION_SOURCE.SELF,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const DoctorModel = model<IDoctor>("Doctor", doctorSchema);
export default DoctorModel;
