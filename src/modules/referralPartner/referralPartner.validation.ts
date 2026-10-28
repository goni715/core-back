import z from "zod";
import { enumSchema } from "../../schemas/enum.schema";
import { requiredStringSchema } from "../../schemas/required.schema";
import { REFERRAL_PARTNER_STATUS_VALUES } from "./referralPartner.constant";
import { emailZodSchema, phoneRegex } from "../auth/auth.validation";

// Accepts MongoDB ObjectId OR Partner ID (e.g. RP-0112)
export const partnerIdentifierSchema = z.string({
  error: (issue) =>
    issue.input === undefined
      ? "Partner ID is required"
      : "Partner ID must be a string",
}).trim().min(1, "Partner ID is required");

const optionalPhoneSchema = z
  .string()
  .trim()
  .regex(phoneRegex, {
    message: "Please enter a valid phone number (e.g., +1234567890)",
  })
  .optional();

/* ==================== Invite Referral Partner ==================== */
export const inviteReferralPartnerValidationSchema = z.object({
  body: z.object({
    name: requiredStringSchema("name"),
    email: emailZodSchema,
    phone: optionalPhoneSchema,
    notes: z.string().trim().optional(),
  }),
});

/* ==================== Update Referral Partner ==================== */
export const updateReferralPartnerValidationSchema = z.object({
  params: z.object({
    partnerId: partnerIdentifierSchema,
  }),
  body: z
    .object({
      name: requiredStringSchema("name").optional(),
      email: emailZodSchema.optional(),
      phone: optionalPhoneSchema,
      status: enumSchema("status", REFERRAL_PARTNER_STATUS_VALUES).optional(),
      cases: z.number().int().min(0).optional(),
      ongoing: z.number().int().min(0).optional(),
      done: z.number().int().min(0).optional(),
      earnings: z.number().min(0).optional(),
      notes: z.string().trim().optional(),
    })
    .refine((data) => Object.values(data).some((val) => val !== undefined), {
      message: "At least one field must be provided to update",
      path: ["body"],
    }),
});

/* ==================== Change Status ==================== */
export const changePartnerStatusValidationSchema = z.object({
  params: z.object({
    partnerId: partnerIdentifierSchema,
  }),
  body: z.object({
    status: enumSchema("status", REFERRAL_PARTNER_STATUS_VALUES),
  }),
});

/* ==================== Get Single Partner ==================== */
export const getSingleReferralPartnerValidationSchema = z.object({
  params: z.object({
    partnerId: partnerIdentifierSchema,
  }),
});

/* ==================== Delete Partner ==================== */
export const deleteReferralPartnerValidationSchema = z.object({
  params: z.object({
    partnerId: partnerIdentifierSchema,
  }),
});

/* ==================== Query / List Partners ==================== */
export const getReferralPartnersValidationSchema = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    status: z.string().optional(),
  }),
});
