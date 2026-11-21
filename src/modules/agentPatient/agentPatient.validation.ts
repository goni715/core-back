import z from "zod";
import { enumSchema } from "../../schemas/enum.schema";
import { requiredNumberSchema, requiredStringSchema } from "../../schemas/required.schema";
import {
  COMMISSION_PAYMENT_STATUS_VALUES,
  DOCUMENT_SOURCE_VALUES,
  PATIENT_CASE_STATUS_VALUES,
  PATIENT_GENDER_VALUES,
} from "./agentPatient.constant";
import { phoneNumberZodSchema } from "../auth/auth.validation";
import objectIdSchema from "../../schemas/objectId.schema";

export const patientIdZodSchema = objectIdSchema('patientId');

const optionalObjectIdSchema = (name: string) =>
  z
    .preprocess(
      (val) => (val === "" || val === null ? undefined : val),
      objectIdSchema(name).optional(),
    )
    .optional();

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

const driveLinkUrlSchema = z
  .string({
    error: (issue) =>
      issue.input === undefined
        ? "Link is required"
        : "Link must be a string",
  })
  .trim()
  .min(1, "Link is required")
  .url("Link must be a valid URL");

const optionalUrlSchema = z
  .string()
  .trim()
  .url("Must be a valid URL")
  .optional()
  .nullable()
  .or(z.literal(""));


export const createAgentPatientValidationSchema = z.object({
  body: z
    .object({
      fullName: requiredStringSchema("fullName"),
      phone: phoneNumberZodSchema,
      age: ageZodSchema,
      gender: enumSchema("gender", PATIENT_GENDER_VALUES),
      treatmentType: requiredStringSchema("treatmentType"),
      symptoms: requiredStringSchema("symptoms"),
      preferredCountry: requiredStringSchema("preferredCountry"),
      budgetRange: requiredStringSchema("budgetRange"),
      documentSource: enumSchema("documentSource", DOCUMENT_SOURCE_VALUES),
      link: requiredStringSchema("Link or whatsapp number is required"),
    })
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
      documentSource: enumSchema("documentSource", DOCUMENT_SOURCE_VALUES).optional(),
      link: driveLinkUrlSchema.optional().nullable(),
      driveLink: driveLinkUrlSchema.optional().nullable(),
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
    patientId: z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? "patientId is required"
            : "patientId must be a string",
      })
      .trim()
      .min(1, "patientId is required"),
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
    subAgentId: z.string().optional(),
    subAgent: z.string().optional(),
    status: enumSchema("status", PATIENT_CASE_STATUS_VALUES).optional(),
  }),
});

export const getAgentAllCommissionsValidationSchema = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    paymentStatus: z.string().optional(),
    status: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  }),
});

export const getAllPatientsByAdminValidationSchema = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    gender: z.string().optional(),
    preferredCountry: z.string().optional(),
    country: z.string().optional(),
    treatmentType: z.string().optional(),
    agentUserId: z.string().optional(),
    subAgentId: z.string().optional(),
    subAgent: z.string().optional(),
    partnerId: z.string().optional(),
    partner: z.string().optional(),
    paymentStatus: z.string().optional(),
    agentPaymentStatus: z.string().optional(),
    subAgentPaymentStatus: z.string().optional(),
    status: z.string().optional(),
  }),
});

export const updateAgentCommissionValidationSchema = z.object({
  params: z.object({
    patientId: patientIdZodSchema,
  }),
  body: z.object({
    agentCommissionPercentage: requiredNumberSchema('AgentCommissionPercentage'),
  }),
});

export const updateSubAgentCommissionValidationSchema = z.object({
  params: z.object({
    patientId: patientIdZodSchema,
  }),
  body: z.object({
    subAgentCommissionPercentage: requiredNumberSchema('subAgentCommissionPercentage'),
  }),
});



export const updateAgentPaymentStatusValidationSchema = z.object({
  params: z.object({
    patientId: z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? "patientId is required"
            : "patientId must be a string",
      })
      .trim()
      .min(1, "patientId is required"),
  }),
  body: z
    .object({
      agentPaymentStatus: enumSchema(
        "agentPaymentStatus",
        COMMISSION_PAYMENT_STATUS_VALUES,
      ).optional(),
      paymentStatus: enumSchema(
        "paymentStatus",
        COMMISSION_PAYMENT_STATUS_VALUES,
      ).optional(),
    })
    .refine(
      (data) =>
        data.agentPaymentStatus !== undefined ||
        data.paymentStatus !== undefined,
      {
        message: "agentPaymentStatus is required",
        path: ["agentPaymentStatus"],
      },
    ),
});

export const updateSubAgentPaymentStatusValidationSchema = z.object({
  params: z.object({
    patientId: z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? "patientId is required"
            : "patientId must be a string",
      })
      .trim()
      .min(1, "patientId is required"),
  }),
  body: z
    .object({
      subAgentPaymentStatus: enumSchema(
        "subAgentPaymentStatus",
        COMMISSION_PAYMENT_STATUS_VALUES,
      ).optional(),
      paymentStatus: enumSchema(
        "paymentStatus",
        COMMISSION_PAYMENT_STATUS_VALUES,
      ).optional(),
    })
    .refine(
      (data) =>
        data.subAgentPaymentStatus !== undefined ||
        data.paymentStatus !== undefined,
      {
        message: "subAgentPaymentStatus is required",
        path: ["subAgentPaymentStatus"],
      },
    ),
});


export const updateRevenueValidationSchema = z.object({
  params: z.object({
    patientId: patientIdZodSchema
  }),
  body: z
    .object({
      revenue: requiredNumberSchema('revenue')
    })
});