import z from "zod";
import isObjectId from "../../utils/isObjectId";
import { requiredStringSchema } from "../../schemas/required.schema";
import { enumSchema } from "../../schemas/enum.schema";
import { booleanSchema } from "../../schemas/boolean.schema";
import { booleanQuerySchema } from "../../schemas/global.schema";
import { SCHEDULE_DAYS_VALUES } from "./schedule.constant";

// 24-hour format: HH:mm (00:00 - 23:59)
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const timeSchema = (fieldName: string) =>
  requiredStringSchema(fieldName).regex(timeRegex, {
    message: `${fieldName} must be in 24-hour HH:mm format (e.g. '09:00', '17:30')`,
  });

const optionalTimeSchema = (fieldName: string) =>
  z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? `${fieldName} is required`
          : `${fieldName} must be a string`,
    })
    .regex(timeRegex, {
      message: `${fieldName} must be in 24-hour HH:mm format (e.g. '09:00', '17:30')`,
    })
    .optional();

const scheduleIdZodSchema = requiredStringSchema("scheduleId").refine(
  (id) => isObjectId(id),
  {
    message: "scheduleId must be a valid ObjectId",
  },
);

const doctorUserIdZodSchema = z
  .string()
  .refine((id) => !id || isObjectId(id), {
    message: "doctorUserId must be a valid ObjectId",
  })
  .optional();

export const createScheduleValidationSchema = z.object({
  body: z
    .object({
      day: enumSchema("day", SCHEDULE_DAYS_VALUES),
      startTime: timeSchema("startTime"),
      endTime: timeSchema("endTime"),
      isActive: booleanSchema("isActive").optional(),
    })
    .refine((data) => data.startTime < data.endTime, {
      message: "startTime must be before endTime",
      path: ["endTime"],
    }),
});

export const updateScheduleValidationSchema = z.object({
  params: z.object({
    scheduleId: scheduleIdZodSchema,
  }),
  body: z
    .object({
      day: enumSchema("day", SCHEDULE_DAYS_VALUES).optional(),
      startTime: optionalTimeSchema("startTime"),
      endTime: optionalTimeSchema("endTime"),
      isActive: booleanSchema("isActive").optional(),
    })
    .refine(
      (data) => Object.values(data).some((val) => val !== undefined),
      {
        message: "At least one field must be provided to update",
        path: ["body"],
      },
    )
    .refine(
      (data) => {
        if (data.startTime && data.endTime) {
          return data.startTime < data.endTime;
        }
        return true;
      },
      {
        message: "startTime must be before endTime",
        path: ["endTime"],
      },
    ),
});

export const getSingleScheduleValidationSchema = z.object({
  params: z.object({
    scheduleId: scheduleIdZodSchema,
  }),
});

export const getDoctorSchedulesValidationSchema = z.object({
  params: z.object({
    doctorUserId: requiredStringSchema("doctorUserId").refine(
      (id) => isObjectId(id),
      {
        message: "doctorUserId must be a valid ObjectId",
      },
    ),
  }),
  query: z.object({
    day: enumSchema("day", SCHEDULE_DAYS_VALUES).optional(),
    isActive: booleanQuerySchema("isActive").optional(),
  }),
});

export const getSchedulesValidationSchema = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: enumSchema("sortOrder", ["asc", "desc"]).optional(),
    doctorUserId: doctorUserIdZodSchema,
    day: enumSchema("day", SCHEDULE_DAYS_VALUES).optional(),
    isActive: booleanQuerySchema("isActive").optional(),
  }),
});

export const deleteScheduleValidationSchema = z.object({
  params: z.object({
    scheduleId: scheduleIdZodSchema,
  }),
});
