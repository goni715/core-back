import z from "zod";
import { fullNameZodSchema, phoneNumberZodSchema } from "../auth/auth.validation";
import { ACCOUNT_STATUS_VALUES } from "./user.constant";
import { enumSchema } from "../../schemas/enum.schema";
import { requiredStringSchema } from "../../schemas/required.schema";

export const updateProfileValidationSchema = z.object({
    body: z.object({
        fullName: fullNameZodSchema.optional(),
        phone: phoneNumberZodSchema.optional(),
    }),
});

export const updateAgentProfileValidationSchema = z.object({
    body: z.object({
        fullName: fullNameZodSchema.optional(),
        agencyName: requiredStringSchema("agencyName").optional(),
    }),
});


export const getPatientsValidationSchema = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sortOrder: z.string().optional(),
    sortBy: z.string().optional(),
    status: enumSchema('status', ACCOUNT_STATUS_VALUES).optional(),
  })
});