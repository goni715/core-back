import { Schema, model } from "mongoose";
import { IDoctor } from "./doctor.interface";
import {
  DOCTOR_APPROVAL_STATUS,
  DOCTOR_APPROVAL_STATUS_VALUES,
  DOCTOR_REGISTRATION_SOURCE,
  DOCTOR_REGISTRATION_SOURCE_VALUES,
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
      required: [true, "Specialization is required"],
      trim: true,
    },
    hospital: {
      type: String,
      trim: true,
      default: "",
    },
    country: {
      type: String,
      trim: true,
      default: "Bangladesh",
    },
    city: {
      type: String,
      required: [true, "City is required"],
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
    fee: {
      type: Number,
      default: 0,
      min: 0,
    },
    languages: {
      type: [String],
      default: [],
    },
    about: {
      type: String,
      trim: true,
      default: "",
    },
    qualifications: {
      type: [String],
      default: [],
    },
    consultationTypes: {
      type: [String],
      default: [],
    },
    availabilityLabel: {
      type: String,
      trim: true,
      default: "",
    },
    availableDays: {
      type: [String],
      default: [],
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
      default: "",
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
