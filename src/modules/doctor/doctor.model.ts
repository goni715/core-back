import { Schema, model } from "mongoose";
import { IDoctor } from "./doctor.interface";

const doctorSchema = new Schema<IDoctor>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      unique: true,
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
      default: "",
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
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const DoctorModel = model<IDoctor>("Doctor", doctorSchema);
export default DoctorModel;
