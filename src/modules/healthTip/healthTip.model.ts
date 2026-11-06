import { Schema, model } from "mongoose";
import {
  HEALTH_TIP_STATUS,
  HEALTH_TIP_STATUS_VALUES,
} from "./healthTip.constant";
import { IHealthTip } from "./healthTip.interface";

const healthTipSchema = new Schema<IHealthTip>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    summary: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "TipCategory",
      required: [true, "Category ID is required"],
      index: true,
    },
    authorName: {
      type: String,
      trim: true,
      default: "Admin",
    },
    image: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: HEALTH_TIP_STATUS_VALUES,
      default: HEALTH_TIP_STATUS.PUBLISHED,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    viewsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    sharesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const HealthTipModel = model<IHealthTip>("HealthTip", healthTipSchema);
export default HealthTipModel;

