import z from "zod";
import isObjectId from "../../utils/isObjectId";
import {
  requiredNumberSchema,
  requiredStringSchema,
} from "../../schemas/required.schema";
import { enumSchema } from "../../schemas/enum.schema";
import { booleanSchema } from "../../schemas/boolean.schema";
import {
  COMPARISON_STATUS,
  COMPARISON_STATUS_VALUES,
} from "./comparison.constant";

export const comparisonIdZodSchema = requiredStringSchema(
  "comparisonId",
).refine((id) => isObjectId(id), {
  message: "comparisonId must be a valid ObjectId",
});

export const countryComparisonValidationSchema = z.object({
  country: requiredStringSchema("country"),
  countryCode: requiredStringSchema("countryCode")
    .min(2, "Country code must be at least 2 characters")
    .max(5, "Country code cannot exceed 5 characters"),
  costUSD: requiredNumberSchema("costUSD").min(
    0,
    "Cost in USD cannot be negative",
  ),
  costBDT: z.number().min(0, "Cost in BDT cannot be negative").optional(),
  successRate: z.string().optional(),
  hospitalStay: z.string().optional(),
  recoveryTime: z.string().optional(),
  popularHospitals: z.array(z.string()).optional(),
});

export const updateCountryComparisonValidationSchema = z.object({
  country: z.string().trim().min(1, "Country name cannot be empty").optional(),
  countryCode: z
    .string()
    .trim()
    .min(2, "Country code must be at least 2 characters")
    .max(5, "Country code cannot exceed 5 characters")
    .optional(),
  costUSD: z.number().min(0, "Cost in USD cannot be negative").optional(),
  costBDT: z.number().min(0, "Cost in BDT cannot be negative").optional(),
  successRate: z.string().optional(),
  hospitalStay: z.string().optional(),
  recoveryTime: z.string().optional(),
  popularHospitals: z.array(z.string()).optional(),
});

export const createComparisonValidationSchema = z.object({
  body: z
    .object({
      treatmentName: requiredStringSchema("treatmentName"),
      category: z.string().trim().optional().default("General"),
      firstCountry: countryComparisonValidationSchema,
      secondCountry: countryComparisonValidationSchema,
      savingsPercentage: z.number().min(0).max(100).optional(),
      isPopular: booleanSchema("isPopular").optional().default(false),
      status: enumSchema("status", COMPARISON_STATUS_VALUES)
        .optional()
        .default(COMPARISON_STATUS.PUBLISHED),
      description: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (
        data.firstCountry?.country?.toLowerCase().trim() ===
        data.secondCountry?.country?.toLowerCase().trim()
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["secondCountry", "country"],
          message: "Second country must be different from the first country",
        });
      }
    }),
});

export const updateComparisonValidationSchema = z.object({
  params: z.object({
    comparisonId: comparisonIdZodSchema,
  }),
  body: z
    .object({
      treatmentName: z.string().trim().min(1).optional(),
      category: z.string().trim().optional(),
      firstCountry: updateCountryComparisonValidationSchema.optional(),
      secondCountry: updateCountryComparisonValidationSchema.optional(),
      savingsPercentage: z.number().min(0).max(100).optional(),
      isPopular: booleanSchema("isPopular").optional(),
      status: z
        .enum([COMPARISON_STATUS.DRAFT, COMPARISON_STATUS.PUBLISHED])
        .optional(),
      description: z.string().optional(),
    })
    .refine((data) => Object.values(data).some((val) => val !== undefined), {
      message: "At least one field must be provided to update",
      path: ["body"],
    })
    .superRefine((data, ctx) => {
      if (
        data.firstCountry?.country &&
        data.secondCountry?.country &&
        data.firstCountry.country.toLowerCase().trim() ===
          data.secondCountry.country.toLowerCase().trim()
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["secondCountry", "country"],
          message: "Second country must be different from the first country",
        });
      }
    }),
});

export const deleteComparisonValidationSchema = z.object({
  params: z.object({
    comparisonId: comparisonIdZodSchema,
  }),
});

export const compareSearchValidationSchema = z.object({
  query: z.object({
    treatmentName: z.string().optional(),
    treatment: z.string().optional(),
    firstCountry: z.string().optional(),
    secondCountry: z.string().optional(),
  }),
});


export const getComparisonsValidationSchema = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sortOrder: z.string().optional(),
    sortBy: z.string().optional(),
    status: enumSchema('status', COMPARISON_STATUS_VALUES).optional(),
  })
});