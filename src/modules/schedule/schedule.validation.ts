import z from "zod";
import isObjectId from "../../utils/isObjectId";
import { requiredStringSchema } from "../../schemas/required.schema";
import { enumSchema } from "../../schemas/enum.schema";
import { booleanSchema } from "../../schemas/boolean.schema";
import { booleanQuerySchema } from "../../schemas/global.schema";
import { SCHEDULE_DAYS_VALUES } from "./schedule.constant";
import { normalizeTimeTo24Hour } from "../../utils/createDateTimeFromTime";
import objectIdSchema from "../../schemas/objectId.schema";

// 24-hour format: HH:mm (00:00 - 23:55) or 12-hour format: hh:mm AM/PM, minutes strictly in 5-minute intervals (00, 05, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55)
const timeRegex = /^([01]?\d|2[0-3]):[0-5][05](\s?[AaPp][Mm])?$/;

const timeSchema = (fieldName: string) =>
  requiredStringSchema(fieldName)
    .regex(timeRegex, {
      message: `${fieldName} must be in valid format (e.g. '10:00' or '10:00 AM') and minutes must be in 5-minute intervals (00, 05, 10, 15, ..., 55)`,
    })
    .refine(
      (val) => {
        const cleanTime = val.replace(/\s*(am|pm)/i, "").trim();
        const parts = cleanTime.split(":");
        const minutes = parseInt(parts[1] || "", 10);
        return !isNaN(minutes) && minutes % 5 === 0;
      },
      {
        message: `${fieldName} minutes must be in full 5-minute intervals (00, 05, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55)`,
      },
    );

const optionalTimeSchema = (fieldName: string) =>
  z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? `${fieldName} is required`
          : `${fieldName} must be a string`,
    })
    .regex(timeRegex, {
      message: `${fieldName} must be in valid format (e.g. '10:00' or '10:00 AM') and minutes must be in 5-minute intervals (00, 05, 10, 15, ..., 55)`,
    })
    .refine(
      (val) => {
        if (!val) return true;
        const cleanTime = val.replace(/\s*(am|pm)/i, "").trim();
        const parts = cleanTime.split(":");
        const minutes = parseInt(parts[1] || "", 10);
        return !isNaN(minutes) && minutes % 5 === 0;
      },
      {
        message: `${fieldName} minutes must be in full 5-minute intervals (00, 05, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55)`,
      },
    )
    .optional();

const scheduleIdZodSchema = objectIdSchema("scheduleId");

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
    .refine((data) => normalizeTimeTo24Hour(data.startTime) < normalizeTimeTo24Hour(data.endTime), {
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
          return (
            normalizeTimeTo24Hour(data.startTime) <
            normalizeTimeTo24Hour(data.endTime)
          );
        }
        return true;
      },
      {
        message: "startTime must be before endTime",
        path: ["endTime"],
      },
    ),
});

export const updateScheduleStatusValidationSchema = z.object({
  params: z.object({
    scheduleId: scheduleIdZodSchema,
  }),
  body: z
    .object({
      isActive: booleanSchema("isActive"),
    })
});

export const getSingleScheduleValidationSchema = z.object({
  params: z.object({
    scheduleId: scheduleIdZodSchema,
  }),
});

export const getDoctorSchedulesByDayValidationSchema = z.object({
  params: z.object({
    day: enumSchema("day", SCHEDULE_DAYS_VALUES),
    doctorUserId: objectIdSchema("doctorUserId"),
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
    day: enumSchema("day", SCHEDULE_DAYS_VALUES).optional(),
    isActive: booleanQuerySchema("isActive").optional(),
  }),
});

export const deleteScheduleValidationSchema = z.object({
  params: z.object({
    scheduleId: scheduleIdZodSchema,
  }),
});
