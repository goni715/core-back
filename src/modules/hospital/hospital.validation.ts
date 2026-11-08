import z from "zod";
import isObjectId from "../../utils/isObjectId";
import { requiredStringSchema } from "../../schemas/required.schema";
import { HOSPITAL_STATUS, HOSPITAL_STATUS_VALUES } from "./hospital.constant";
import { emailZodSchema, phoneRegex } from "../auth/auth.validation";
import { enumSchema } from "../../schemas/enum.schema";

export const hospitalIdZodSchema = requiredStringSchema("hospitalId").refine(
  (id) => isObjectId(id),
  {
    message: "hospitalId must be a valid ObjectId",
  },
);

export const parseArrayField = (val: unknown) => {
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
      return [val];
    } catch {
      if (val.includes(",")) {
        return val.split(",").map((s) => s.trim()).filter(Boolean);
      }
      return val.trim() ? [val.trim()] : [];
    }
  }
  return val;
};

export const contactNumberZodSchema = requiredStringSchema('contactNumber')
  .regex(phoneRegex, {
    message:
      "Please enter a valid contact number (e.g., +1234567890 or 1234567890)",
  })
  .trim()
  .regex(phoneRegex, {
    message:
      "Please enter a valid contact number (e.g., +1234567890 or 1234567890)",
  });

export const createHospitalValidationSchema = z.object({
  body: z.object({
    name: requiredStringSchema("name"),
    country: z.string().trim().optional().default(""),
    address: requiredStringSchema("address"),
    contactNumber: contactNumberZodSchema,
    email: emailZodSchema,
    website: z.url("Invalid website format").optional(),
    status: enumSchema('status', HOSPITAL_STATUS_VALUES).default(HOSPITAL_STATUS.DRAFT),
  }),
});

export const updateHospitalValidationSchema = z.object({
  params: z.object({
    hospitalId: hospitalIdZodSchema,
  }),
  body: z.object({
    name: requiredStringSchema("name").optional(),
    country: z.string().trim().optional(),
    address: requiredStringSchema("address").optional(),
    contactNumber: contactNumberZodSchema.optional(),
    email: emailZodSchema.optional(),
    website: z.url("Invalid website format").optional(),
    status: z
      .enum([HOSPITAL_STATUS.DRAFT, HOSPITAL_STATUS.PUBLISHED, HOSPITAL_STATUS.ARCHIVE])
      .optional(),
    ratings: z.number().min(0).max(5).optional(),
    totalReviews: z.number().min(0).optional(),
  }),
});

export const deleteHospitalValidationSchema = z.object({
  params: z.object({
    hospitalId: hospitalIdZodSchema,
  }),
});

export const getSinglePublishedHospitalValidationSchema = z.object({
  params: z.object({
    hospitalId: hospitalIdZodSchema,
  }),
});


export const getHospitalsValidationSchema = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: enumSchema('sortOrder', ['asc', 'desc']).optional(),
    status: enumSchema('status', HOSPITAL_STATUS_VALUES).optional(),
    country: z.string().optional(),
  })
});

export const getPublishedHospitalsValidationSchema = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: enumSchema('sortOrder', ['asc', 'desc']).optional(),
    country: z.string().optional(),
  })
});
