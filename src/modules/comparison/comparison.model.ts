import { Schema, model } from "mongoose";
import { IComparison, ICountryComparison } from "./comparison.interface";
import {
  COMPARISON_STATUS,
  COMPARISON_STATUS_VALUES,
} from "./comparison.constant";

const countryComparisonSchema = new Schema<ICountryComparison>(
  {
    country: {
      type: String,
      required: [true, "Country name is required"],
      trim: true,
    },
    countryCode: {
      type: String,
      required: [true, "Country code is required"],
      trim: true,
      uppercase: true,
    },
    costUSD: {
      type: Number,
      required: [true, "Cost in USD is required"],
      min: [0, "Cost in USD cannot be negative"],
    },
    costBDT: {
      type: Number,
      min: [0, "Cost in BDT cannot be negative"],
      default: 0,
    },
    successRate: {
      type: String,
      trim: true,
      default: "",
    },
    hospitalStay: {
      type: String,
      trim: true,
      default: "",
    },
    recoveryTime: {
      type: String,
      trim: true,
      default: "",
    },
    popularHospitals: {
      type: [String],
      default: [],
    },
  },
  { _id: false },
);

const comparisonSchema = new Schema<IComparison>(
  {
    treatmentName: {
      type: String,
      required: [true, "Treatment name is required"],
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      trim: true,
      default: "General",
    },
    firstCountry: {
      type: countryComparisonSchema,
      required: [true, "First country details are required"],
    },
    secondCountry: {
      type: countryComparisonSchema,
      required: [true, "Second country details are required"],
    },
    savingsPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    isPopular: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: COMPARISON_STATUS_VALUES,
        message: "{VALUE} is not a valid status",
      },
      default: COMPARISON_STATUS.PUBLISHED,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Compound indexes for fast searching and filtering
comparisonSchema.index({
  treatmentName: 1,
  "firstCountry.country": 1,
  "secondCountry.country": 1,
});
comparisonSchema.index({ isPopular: 1, status: 1 });

// Auto compute savings percentage and costBDT if needed before save
comparisonSchema.pre("save", async function (this: any) {
  if (this.firstCountry && this.secondCountry) {
    const cost1 = this.firstCountry.costUSD || 0;
    const cost2 = this.secondCountry.costUSD || 0;

    // Approximate BDT calculation if not provided (1 USD ~ 122 BDT)
    if (!this.firstCountry.costBDT && cost1 > 0) {
      this.firstCountry.costBDT = Math.round(cost1 * 122);
    }
    if (!this.secondCountry.costBDT && cost2 > 0) {
      this.secondCountry.costBDT = Math.round(cost2 * 122);
    }

    if (this.savingsPercentage === undefined || this.savingsPercentage === 0) {
      const maxCost = Math.max(cost1, cost2);
      if (maxCost > 0) {
        this.savingsPercentage = Math.round(
          (Math.abs(cost1 - cost2) / maxCost) * 100,
        );
      }
    }
  }
});

const ComparisonModel = model<IComparison>("Comparison", comparisonSchema);
export default ComparisonModel;
