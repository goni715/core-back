import z from "zod";
import {
  emailZodSchema,
  fullNameZodSchema,
  passwordZodSchema,
  phoneNumberZodSchema,
} from "../auth/auth.validation";
import isObjectId from "../../utils/isObjectId";
import { requiredStringSchema } from "../../schemas/required.schema";
import {
  DOCTOR_APPROVAL_STATUS,
  DOCTOR_STATUS,
  DOCTOR_TITLE,
} from "./doctor.constant";
import { parseArrayField } from "../hospital/hospital.validation";

export const doctorTitleZodSchema = z.enum([
  DOCTOR_TITLE.DR,
  DOCTOR_TITLE.PROF_DR,
  DOCTOR_TITLE.ASSOC_PROF_DR,
  DOCTOR_TITLE.ASST_PROF_DR,
]);

export const doctorIdZodSchema = requiredStringSchema("doctorId").refine(
  (id) => isObjectId(id),
  {
    message: "doctorId must be a valid ObjectId",
  },
);

export const createDoctorValidationSchema = z.object({
  body: z.object({
    fullName: fullNameZodSchema,
    email: emailZodSchema,
    phone: phoneNumberZodSchema,
    specialization: requiredStringSchema("specialization"),
    city: requiredStringSchema("city"),
    bmdcNumber: requiredStringSchema("bmdcNumber"),
    title: doctorTitleZodSchema.optional().default(DOCTOR_TITLE.DR),
    password: passwordZodSchema.optional(),
    profileImg: z.string().optional(),
    hospital: z.string().optional(),
    country: z.string().optional(),
    experience: z.union([z.number(), z.string()]).optional(),
    fee: z
      .preprocess(
        (val) => (val !== undefined && val !== "" ? Number(val) : undefined),
        z.number().min(0).optional(),
      ),
    languages: z.preprocess(parseArrayField, z.array(z.string())).optional(),
    about: z.string().optional(),
    qualifications: z
      .preprocess(parseArrayField, z.array(z.string()))
      .optional(),
    consultationTypes: z
      .preprocess(parseArrayField, z.array(z.string()))
      .optional(),
    availabilityLabel: z.string().optional(),
    availableDays: z
      .preprocess(parseArrayField, z.array(z.string()))
      .optional(),
    status: z
      .enum([DOCTOR_STATUS.DRAFT, DOCTOR_STATUS.PUBLISHED, DOCTOR_STATUS.ARCHIVE])
      .optional(),
    approvalStatus: z
      .enum([
        DOCTOR_APPROVAL_STATUS.APPROVED,
        DOCTOR_APPROVAL_STATUS.PENDING,
      ])
      .optional(),
  }),
});

export const approvalDoctorValidationSchema = z.object({
  params: z.object({
    doctorId: doctorIdZodSchema,
  }),
  body: z.object({
    approvalStatus: z.enum([
      DOCTOR_APPROVAL_STATUS.APPROVED,
      DOCTOR_APPROVAL_STATUS.REJECTED,
    ]),
    rejectionReason: z.string().optional(),
    status: z
      .enum([DOCTOR_STATUS.DRAFT, DOCTOR_STATUS.PUBLISHED, DOCTOR_STATUS.ARCHIVE])
      .optional(),
  }),
});

export const changeDoctorStatusValidationSchema = z.object({
  params: z.object({
    doctorId: doctorIdZodSchema,
  }),
  body: z.object({
    status: z.enum([
      DOCTOR_STATUS.DRAFT,
      DOCTOR_STATUS.PUBLISHED,
      DOCTOR_STATUS.ARCHIVE,
    ]),
  }),
});

export const updateDoctorValidationSchema = z.object({
  params: z.object({
    doctorId: doctorIdZodSchema,
  }),
  body: z
    .object({
      fullName: fullNameZodSchema.optional(),
      phone: phoneNumberZodSchema.optional(),
      profileImg: z.string().optional(),
      title: doctorTitleZodSchema.optional(),
      specialization: z.string().optional(),
      city: z.string().optional(),
      bmdcNumber: z.string().optional(),
      hospital: z.string().optional(),
      country: z.string().optional(),
      experience: z.union([z.number(), z.string()]).optional(),
      fee: z
        .preprocess(
          (val) => (val !== undefined && val !== "" ? Number(val) : undefined),
          z.number().min(0).optional(),
        ),
      languages: z.preprocess(parseArrayField, z.array(z.string())).optional(),
      about: z.string().optional(),
      qualifications: z
        .preprocess(parseArrayField, z.array(z.string()))
        .optional(),
      consultationTypes: z
        .preprocess(parseArrayField, z.array(z.string()))
        .optional(),
      availabilityLabel: z.string().optional(),
      availableDays: z
        .preprocess(parseArrayField, z.array(z.string()))
        .optional(),
      rating: z.number().optional(),
      totalReviews: z.number().optional(),
      status: z
        .enum([DOCTOR_STATUS.DRAFT, DOCTOR_STATUS.PUBLISHED, DOCTOR_STATUS.ARCHIVE])
        .optional(),
      approvalStatus: z
        .enum([
          DOCTOR_APPROVAL_STATUS.PENDING,
          DOCTOR_APPROVAL_STATUS.APPROVED,
          DOCTOR_APPROVAL_STATUS.REJECTED,
        ])
        .optional(),
      rejectionReason: z.string().optional(),
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
