import z from "zod";
import { enumSchema } from "../../schemas/enum.schema";
import { requiredStringSchema } from "../../schemas/required.schema";
import isObjectId from "../../utils/isObjectId";

export const consultationIdZodSchema = requiredStringSchema(
  "consultationId",
).refine((id) => isObjectId(id), {
  message: "consultationId must be a valid ObjectId",
});

export const appointmentIdZodSchema = requiredStringSchema(
  "appointmentId",
).refine((id) => isObjectId(id), {
  message: "appointmentId must be a valid ObjectId",
});

export const medicineIdZodSchema = requiredStringSchema(
  "medicineId",
).refine((id) => isObjectId(id), {
  message: "medicineId must be a valid ObjectId",
});

export const medicineItemZodSchema = z.object({
  _id: z.string().refine(isObjectId).optional(),
  medicineName: requiredStringSchema("medicineName"),
  dosage: requiredStringSchema("dosage"),
  frequency: requiredStringSchema("frequency"),
  duration: requiredStringSchema("duration"),
  instructions: z.string().trim().optional().default(""),
});

export const nextFollowUpDateZodSchema = z.preprocess((val) => {
  if (typeof val === "string" || val instanceof Date) {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
  }
  return val;
}, z.date().optional());

export const createConsultationValidationSchema = z.object({
  body: z.object({
    appointmentId: appointmentIdZodSchema,
    diagnosisNotes: requiredStringSchema("diagnosisNotes"),
    treatmentAdvice: z.string().trim().optional().default(""),
    followUpRecommendation: z.string().trim().optional().default(""),
    nextFollowUpDate: nextFollowUpDateZodSchema,
    internalDoctorNote: z.string().trim().optional().default(""),
    medicines: z.array(medicineItemZodSchema).optional().default([]),
  }),
});

export const updateConsultationValidationSchema = z.object({
  params: z.object({
    consultationId: consultationIdZodSchema,
  }),
  body: z
    .object({
      diagnosisNotes: requiredStringSchema("diagnosisNotes").optional(),
      treatmentAdvice: z.string().trim().optional(),
      followUpRecommendation: z.string().trim().optional(),
      nextFollowUpDate: nextFollowUpDateZodSchema,
      internalDoctorNote: z.string().trim().optional(),
      medicines: z.array(medicineItemZodSchema).optional(),
      patientId: z
        .string()
        .refine((id) => isObjectId(id), {
          message: "patientId must be a valid ObjectId",
        })
        .optional(),
    })
    .refine((data) => Object.values(data).some((val) => val !== undefined), {
      message: "At least one field must be provided to update",
      path: ["body"],
    }),
});

export const addMedicineValidationSchema = z.object({
  params: z.object({
    consultationId: consultationIdZodSchema,
  }),
  body: medicineItemZodSchema,
});

export const updateMedicineValidationSchema = z.object({
  params: z.object({
    medicineId: medicineIdZodSchema,
  }),
  body: z
    .object({
      medicineName: requiredStringSchema("medicineName").optional(),
      dosage: requiredStringSchema("dosage").optional(),
      frequency: requiredStringSchema("frequency").optional(),
      duration: requiredStringSchema("duration").optional(),
      instructions: z.string().trim().optional(),
    })
    .refine((data) => Object.values(data).some((val) => val !== undefined), {
      message: "At least one field must be provided to update",
      path: ["body"],
    }),
});

export const deleteMedicineValidationSchema = z.object({
  params: z.object({
    medicineId: medicineIdZodSchema,
  }),
});

export const getSingleConsultationValidationSchema = z.object({
  params: z.object({
    consultationId: consultationIdZodSchema,
  }),
});

export const getByAppointmentValidationSchema = z.object({
  params: z.object({
    appointmentId: appointmentIdZodSchema,
  }),
});

export const deleteConsultationValidationSchema = z.object({
  params: z.object({
    consultationId: consultationIdZodSchema,
  }),
});

export const getConsultationsQueryValidationSchema = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: enumSchema("sortOrder", ["asc", "desc"]).optional(),
    appointmentId: z
      .string()
      .refine((id) => isObjectId(id), {
        message: "appointmentId must be a valid ObjectId",
      })
      .optional(),
    patientId: z
      .string()
      .refine((id) => isObjectId(id), {
        message: "patientId must be a valid ObjectId",
      })
      .optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});
