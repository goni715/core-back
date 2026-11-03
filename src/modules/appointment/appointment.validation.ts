import z from "zod";
import isObjectId from "../../utils/isObjectId";
import { requiredStringSchema } from "../../schemas/required.schema";
import { enumSchema } from "../../schemas/enum.schema";
import {
  APPOINTMENT_STATUS_VALUES,
  BLOOD_GROUP_VALUES,
} from "./appointment.constant";
import objectIdSchema from "../../schemas/objectId.schema";
import { emailZodSchema, fullNameZodSchema, phoneNumberZodSchema } from "../auth/auth.validation";
import dateSchema from "../../schemas/date.schema";

const appointmentIdZodSchema = objectIdSchema("appointmentId");

const doctorUserIdZodSchema = objectIdSchema("doctorUserId");

const appointmentDateZodSchema =
  dateSchema("appointmentDate").superRefine((date, ctx) => {
    // 2. Parse the input date string and today's date (ignoring time for accurate day comparison)
    const inputDate = new Date(date);
    const today = new Date();

    // Reset hours, minutes, seconds, and milliseconds to 0 for accurate date-only comparison
    today.setHours(0, 0, 0, 0);
    inputDate.setHours(0, 0, 0, 0);

    // Calculate the maximum allowed date (7 days from today)
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 7);

    // Check if date is in the past (before today)
    if (inputDate < today) {
      ctx.addIssue({
        code: "custom",
        message: `Appointment date must be today or a future date within the next 7 days.`,
      });
      return;
    }

    // Check if date exceeds the 7-day limit
    if (inputDate > maxDate) {
      ctx.addIssue({
        code: "custom",
        message: `Appointment date cannot be more than 7 days in advance.`,
      });
      return;
    }
  });

export const bookAppointmentValidationSchema = z.object({
  body: z.object({
    scheduleId: objectIdSchema("scheduleId"),
    fullName: fullNameZodSchema,
    email: emailZodSchema,
    phone: phoneNumberZodSchema,
    appointmentDate: appointmentDateZodSchema,
    problem: requiredStringSchema("problem"),
    bloodGroup: enumSchema("bloodGroup", BLOOD_GROUP_VALUES).optional(),
    dateOfBirth: dateSchema("dateOfBirth").optional(),
  }),
});

export const updateAppointmentStatusValidationSchema = z.object({
  params: z.object({
    appointmentId: appointmentIdZodSchema,
  }),
  body: z.object({
    status: enumSchema("status", APPOINTMENT_STATUS_VALUES),
    cancelReason: requiredStringSchema("cancelReason").optional(),
    doctorNotes: requiredStringSchema("doctorNotes").optional(),
  }),
});

export const getSingleAppointmentValidationSchema = z.object({
  params: z.object({
    appointmentId: appointmentIdZodSchema,
  }),
});

export const getDoctorAppointmentsValidationSchema = z.object({
  params: z.object({
    doctorUserId: doctorUserIdZodSchema,
  }),
  query: z
    .object({
      searchTerm: z.string().optional(),
      page: z.string().optional(),
      limit: z.string().optional(),
      sortBy: z.string().optional(),
      sortOrder: z.enum(["asc", "desc"]).optional(),
      status: enumSchema("status", APPOINTMENT_STATUS_VALUES).optional(),
      appointmentDate: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
    .optional(),
});

export const getMyAppointmentsValidationSchema = z.object({
  query: z
    .object({
      searchTerm: z.string().optional(),
      page: z.string().optional(),
      limit: z.string().optional(),
      sortBy: z.string().optional(),
      sortOrder: z.enum(["asc", "desc"]).optional(),
      status: enumSchema("status", APPOINTMENT_STATUS_VALUES).optional(),
      appointmentDate: dateSchema('appointmentDate').optional(),
    })
    .optional(),
});

export const getAllAppointmentsValidationSchema = z.object({
  query: z
    .object({
      searchTerm: z.string().optional(),
      page: z.string().optional(),
      limit: z.string().optional(),
      sortBy: z.string().optional(),
      sortOrder: z.enum(["asc", "desc"]).optional(),
      doctorUserId: objectIdSchema('doctorUserId').optional(),
      status: enumSchema("status", APPOINTMENT_STATUS_VALUES).optional(),
      appointmentDate: dateSchema('appointmentDate').optional(),
    })
    .optional(),
});

export const getAppointmentsQueryValidationSchema = getAllAppointmentsValidationSchema;
