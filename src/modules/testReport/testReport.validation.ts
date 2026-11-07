import z from "zod";
import { enumSchema } from "../../schemas/enum.schema";
import { requiredStringSchema } from "../../schemas/required.schema";
import isObjectId from "../../utils/isObjectId";
import {
  PATIENT_GENDER_VALUES,
  TEST_REPORT_STATUS,
  TEST_REPORT_STATUS_VALUES,
} from "./testReport.constant";
import dateSchema from "../../schemas/date.schema";

export const testReportIdZodSchema = requiredStringSchema(
  "testReportId",
).refine((id) => isObjectId(id), {
  message: "testReportId must be a valid ObjectId",
});

export const patientGenderZodSchema = enumSchema('patientGender', PATIENT_GENDER_VALUES)

export const testReportStatusZodSchema = enumSchema('status', TEST_REPORT_STATUS_VALUES)

export const testResultItemZodSchema = z.object({
  parameterName: requiredStringSchema("parameterName"),
  value: requiredStringSchema("value"),
  unit: z.string().trim().optional().default(""),
  normalRange: z.string().trim().optional().default(""),
});

export const reportDateZodSchema = dateSchema('reportDate')

export const createTestReportValidationSchema = z.object({
  body: z.object({
    reportName: requiredStringSchema("reportName"),
    hospitalName: requiredStringSchema("hospitalName"),
    reportDate: reportDateZodSchema,
    patientName: requiredStringSchema("patientName"),
    patientPhoneNumber: requiredStringSchema("patientPhoneNumber"),
    patientAge: requiredStringSchema("patientAge"),
    patientGender: patientGenderZodSchema,
    testResults: z
      .array(testResultItemZodSchema)
      .min(1, "At least one test result parameter is required"),
    summary: requiredStringSchema("summary").optional(),
    status: testReportStatusZodSchema.optional().default(TEST_REPORT_STATUS.VERIFIED),
  }),
});

export const updateTestReportValidationSchema = z.object({
  params: z.object({
    testReportId: testReportIdZodSchema,
  }),
  body: z
    .object({
      reportName: requiredStringSchema("reportName").optional(),
      hospitalName: requiredStringSchema("hospitalName").optional(),
      reportDate: reportDateZodSchema.optional(),
      patientName: requiredStringSchema("patientName").optional(),
      patientPhoneNumber: requiredStringSchema("patientPhoneNumber").optional(),
      patientAge: requiredStringSchema("patientAge").optional(),
      patientGender: patientGenderZodSchema.optional(),
      testResults: z
        .array(testResultItemZodSchema)
        .min(1, "At least one test result parameter is required"),
      summary: requiredStringSchema("summary").optional(),
      status: testReportStatusZodSchema.optional(),
    })
    .refine((data) => Object.values(data).some((val) => val !== undefined), {
      message: "At least one field must be provided to update",
      path: ["body"],
    }),
});

export const getSingleTestReportValidationSchema = z.object({
  params: z.object({
    identifier: requiredStringSchema("identifier"),
  }),
});

export const deleteTestReportValidationSchema = z.object({
  params: z.object({
    testReportId: testReportIdZodSchema,
  }),
});

export const getTestReportsValidationSchema = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: enumSchema("sortOrder", ["asc", "desc"]).optional(),
    status: testReportStatusZodSchema.optional(),
    patientPhoneNumber: z.string().optional(),
    reportDate: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    doctorId: z
      .string()
      .refine((id) => isObjectId(id), {
        message: "doctorId must be a valid ObjectId",
      })
      .optional(),
  }),
});

