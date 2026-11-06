import { Schema, model } from "mongoose";
import { TIP_CATEGORY_STATUS, TIP_CATEGORY_STATUS_VALUES } from "./tipCategory.constant";
import { ITipCategory } from "./tipCategory.interface";

const tipCategorySchema = new Schema<ITipCategory>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: TIP_CATEGORY_STATUS_VALUES,
      default: TIP_CATEGORY_STATUS.PUBLISHED,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const TipCategoryModel = model<ITipCategory>("TipCategory", tipCategorySchema);
export default TipCategoryModel;

