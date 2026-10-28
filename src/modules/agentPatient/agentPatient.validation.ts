import z from "zod";
import { enumSchema } from "../../schemas/enum.schema";
import { requiredStringSchema } from "../../schemas/required.schema";
import {
  PATIENT_CASE_STATUS_VALUES,
  PATIENT_GENDER_VALUES,
} from "./agentPatient.constant";
import { phoneNumberZodSchema } from "../auth/auth.validation";
import objectIdSchema from "../../schemas/objectId.schema";

export const patientIdZodSchema = objectIdSchema('patientId');

const ageZodSchema = z.preprocess(
  (val) => (val !== undefined && val !== null && val !== "" ? Number(val) : val),
  z
    .number({
      error: (issue) =>
        issue.input === undefined
          ? "Age is required"
          : "Age must be a number",
    })
    .int("Age must be an integer")
    .min(0, "Age must be at least 0")
    .max(150, "Age cannot exceed 150"),
)

export const createAgentPatientValidationSchema = z.object({
  body: z
    .object({
      partnerId: z.string().trim().optional(),
      fullName: requiredStringSchema("fullName"),
      phone: phoneNumberZodSchema,
      age: ageZodSchema,
      gender: enumSchema("gender", PATIENT_GENDER_VALUES),
      treatmentType: requiredStringSchema("treatmentType"),
      symptoms: requiredStringSchema("symptoms"),
      preferredCountry: requiredStringSchema("preferredCountry"),
      budgetRange: requiredStringSchema('budgetRange'),
    }),
});

export const updateAgentPatientValidationSchema = z.object({
  params: z.object({
    patientId: patientIdZodSchema,
  }),
  body: z
    .object({
      fullName: requiredStringSchema("fullName").optional(),
      phone: phoneNumberZodSchema.optional(),
      age: ageZodSchema.optional(),
      gender: enumSchema("gender", PATIENT_GENDER_VALUES).optional(),
      treatmentType: requiredStringSchema("treatmentType").optional(),
      symptoms: requiredStringSchema("symptoms").optional(),
      preferredCountry: requiredStringSchema("preferredCountry").optional(),
      budgetRange: requiredStringSchema("budgetRange").optional(),
    })
    .refine((data) => Object.values(data).some((val) => val !== undefined), {
      message: "At least one field must be provided to update",
      path: ["body"],
    }),
});

export const updateStatusValidationSchema = z.object({
  params: z.object({
    patientId: patientIdZodSchema,
  }),
  body: z.object({
    status: enumSchema("status", PATIENT_CASE_STATUS_VALUES),
  }),
});

export const getSingleAgentPatientValidationSchema = z.object({
  params: z.object({
    patientId: patientIdZodSchema,
  }),
});

export const deleteAgentPatientValidationSchema = z.object({
  params: z.object({
    patientId: patientIdZodSchema,
  }),
});

export const getAgentPatientsValidationSchema = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    gender: z.string().optional(),
    preferredCountry: z.string().optional(),
    partnerId: z.string().optional(),
    partner: z.string().optional(),
    status: enumSchema("status", PATIENT_CASE_STATUS_VALUES).optional(),
  }),
});
