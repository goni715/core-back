import z from "zod";
import {
  emailZodSchema,
  fullNameZodSchema,
  passwordZodSchema,
  phoneNumberZodSchema,
} from "../auth/auth.validation";
import isObjectId from "../../utils/isObjectId";
import { requiredStringSchema } from "../../schemas/required.schema";
import { enumSchema } from "../../schemas/enum.schema";
import { booleanSchema } from "../../schemas/boolean.schema";
import {
  DOCTOR_APPROVAL_STATUS,
  DOCTOR_APPROVAL_STATUS_VALUES,
  DOCTOR_REGISTRATION_SOURCE_VALUES,
  DOCTOR_SPECIALIZATION_VALUES,
  DOCTOR_STATUS,
  DOCTOR_STATUS_VALUES,
  DOCTOR_TITLE,
  DOCTOR_TITLE_VALUES,
} from "./doctor.constant";
import { parseArrayField } from "../hospital/hospital.validation";
import { booleanQuerySchema } from "../../schemas/global.schema";
import { ACCOUNT_STATUS_VALUES } from "../user/user.constant";

export const isOnlineZodSchema = z
  .preprocess((val) => {
    if (typeof val === "string") {
      if (val.toLowerCase() === "true") return true;
      if (val.toLowerCase() === "false") return false;
    }
    return val;
  }, booleanSchema("isOnline").optional())
  .optional();

export const doctorTitleZodSchema = z.enum([
  DOCTOR_TITLE.DR,
  DOCTOR_TITLE.PROF_DR,
  DOCTOR_TITLE.ASSOC_PROF_DR,
  DOCTOR_TITLE.ASST_PROF_DR,
]);

export const doctorSpecializationZodSchema = enumSchema(
  "specialization",
  DOCTOR_SPECIALIZATION_VALUES,
);

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
    specialization: doctorSpecializationZodSchema,
    bmdcNumber: requiredStringSchema("bmdcNumber"),
    title: enumSchema('title', DOCTOR_TITLE_VALUES),
    password: passwordZodSchema.optional(),
    designation: requiredStringSchema("designation"),
    education: requiredStringSchema("education"),
    consultationFee: z
      .preprocess(
        (val) => (val !== undefined && val !== "" ? Number(val) : undefined),
        z.number({
          error: (issue) =>
            issue.input === undefined
              ? "consultationFee is required"
              : "consultationFee must be a number",
        }).min(0),
      ),
    address: requiredStringSchema("address"),
    experience: requiredStringSchema("experience"),
    about: requiredStringSchema("about"),
    qualifications: requiredStringSchema("qualifications"),
    status: enumSchema('status', [DOCTOR_STATUS.DRAFT, DOCTOR_STATUS.PUBLISHED]).default(DOCTOR_STATUS.DRAFT),
    approvalStatus: enumSchema('approvalStatus', DOCTOR_APPROVAL_STATUS_VALUES).default(DOCTOR_APPROVAL_STATUS.PENDING),
  }),
});

export const approvalDoctorValidationSchema = z.object({
  params: z.object({
    doctorId: doctorIdZodSchema,
  }),
  body: z
    .object({
      approvalStatus: enumSchema('approvalStatus', [
        DOCTOR_APPROVAL_STATUS.APPROVED,
        DOCTOR_APPROVAL_STATUS.REJECTED,
      ]),
      rejectionReason: z.string().trim().optional(),
    })
    .refine(
      (data) => {
        if (data.approvalStatus === DOCTOR_APPROVAL_STATUS.REJECTED) {
          return !!data.rejectionReason && data.rejectionReason.trim().length > 0;
        }
        return true;
      },
      {
        message: "rejectionReason is required when approvalStatus is rejected",
        path: ["rejectionReason"],
      },
    ),
});

export const changeDoctorStatusValidationSchema = z.object({
  params: z.object({
    doctorId: doctorIdZodSchema,
  }),
  body: z.object({
    status: enumSchema('status', DOCTOR_STATUS_VALUES),
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
      specialization: doctorSpecializationZodSchema.optional(),
      bmdcNumber: z.string().optional(),
      hospital: z.string().optional(),
      designation: z.string().optional(),
      education: z
        .preprocess(
          (val) => (Array.isArray(val) ? val.join(", ") : val),
          z.string().optional(),
        ),
      consultationFee: z
        .preprocess(
          (val) => (val !== undefined && val !== "" ? Number(val) : undefined),
          z.number().min(0).optional(),
        ),
      address: z.string().optional(),
      experience: z.union([z.number(), z.string()]).optional(),
      about: z.string().optional(),
      qualifications: z.string().optional(),
      rating: z.number().optional(),
      totalReviews: z.number().optional(),
      isOnline: isOnlineZodSchema,
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

export const getSingleDoctorValidationSchema = z.object({
  params: z.object({
    doctorId: doctorIdZodSchema,
  }),
});

export const getPublishedDoctorsValidationSchema = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sortOrder: z.string().optional(),
    sortBy: z.string().optional(),
    isOnline: booleanQuerySchema("isOnline")
      .optional()
  })
});

export const getDoctorsValidationSchema = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sortOrder: z.string().optional(),
    sortBy: z.string().optional(),
    isOnline: booleanQuerySchema("isOnline")
      .optional(),
    status: enumSchema('status', DOCTOR_STATUS_VALUES).optional(),
    approvalStatus: enumSchema('approvalStatus', DOCTOR_APPROVAL_STATUS_VALUES).optional(),
    registrationSource: enumSchema('registrationSource', DOCTOR_REGISTRATION_SOURCE_VALUES).optional(),
    userStatus: enumSchema('userStatus', ACCOUNT_STATUS_VALUES).optional(),
  })
});