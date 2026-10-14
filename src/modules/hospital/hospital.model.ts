import { Schema, model } from "mongoose";
import { IHospital } from "./hospital.interface";
import { HOSPITAL_STATUS, HOSPITAL_STATUS_VALUES } from "./hospital.constant";

const hospitalSchema = new Schema<IHospital>(
  {
    name: {
      type: String,
      required: [true, "Hospital name is required"],
      trim: true,
    },
    image: {
      type: String,
      required: [true, "Hospital image is required"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    contactNumber: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    website: {
      type: String,
      trim: true,
      default: "",
    },
    specialities: {
      type: [String],
      default: [],
    },
    languages: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: HOSPITAL_STATUS_VALUES,
        message: "{VALUE} is not a valid status",
      },
      default: HOSPITAL_STATUS.DRAFT,
      trim: true,
    },
    ratings: {
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

const HospitalModel = model<IHospital>("Hospital", hospitalSchema);
export default HospitalModel;
