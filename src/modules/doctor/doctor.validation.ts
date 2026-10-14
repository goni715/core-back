import z from "zod";
import {
  emailZodSchema,
  fullNameZodSchema,
  passwordZodSchema,
  phoneNumberZodSchema,
} from "../auth/auth.validation";
import isObjectId from "../../utils/isObjectId";
import { requiredStringSchema } from "../../schemas/required.schema";

export const createDoctorValidationSchema = z.object({
  body: z.object({
    fullName: fullNameZodSchema,
    email: emailZodSchema,
    phone: phoneNumberZodSchema,
    password: passwordZodSchema.optional(),
    specialization: requiredStringSchema("specialization"),
    city: requiredStringSchema("city"),
    bmdcNumber: requiredStringSchema("bmdcNumber"),
    hospital: z.string().optional(),
    country: z.string().optional(),
    experience: z.union([z.number(), z.string()]).optional(),
    fee: z.number().optional(),
    languages: z.array(z.string()).optional(),
    about: z.string().optional(),
    qualifications: z.array(z.string()).optional(),
    consultationTypes: z.array(z.string()).optional(),
    availabilityLabel: z.string().optional(),
    availableDays: z.array(z.string()).optional(),
  }),
});

export const doctorIdZodSchema = requiredStringSchema("doctorId").refine(
  (id) => isObjectId(id),
  {
    message: "doctorId must be a valid ObjectId",
  },
);

export const updateDoctorValidationSchema = z.object({
  params: z.object({
    doctorId: doctorIdZodSchema,
  }),
  body: z
    .object({
      fullName: fullNameZodSchema.optional(),
      phone: phoneNumberZodSchema.optional(),
      profileImg: z.string().optional(),
      specialization: z.string().optional(),
      city: z.string().optional(),
      bmdcNumber: z.string().optional(),
      hospital: z.string().optional(),
      country: z.string().optional(),
      experience: z.union([z.number(), z.string()]).optional(),
      fee: z.number().optional(),
      languages: z.array(z.string()).optional(),
      about: z.string().optional(),
      qualifications: z.array(z.string()).optional(),
      consultationTypes: z.array(z.string()).optional(),
      availabilityLabel: z.string().optional(),
      availableDays: z.array(z.string()).optional(),
      rating: z.number().optional(),
      totalReviews: z.number().optional(),
    })
    .refine((data) => Object.values(data).some((val) => val !== undefined), {
      message: "At least one field must be provided to update",
      path: ["body"],
    }),
});

export const deleteDoctorValidationSchema = z.object({
  params: z.object({
    doctorId: doctorIdZodSchema,
  }),
});
