import { Schema, model } from "mongoose";
import {
  PATIENT_GENDER_VALUES,
  TEST_REPORT_STATUS,
  TEST_REPORT_STATUS_VALUES,
} from "./testReport.constant";
import { ITestReport, ITestResultItem } from "./testReport.interface";

export const generateSixDigitTestId = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const testResultItemSchema = new Schema<ITestResultItem>(
  {
    parameterName: {
      type: String,
      required: [true, "Parameter name is required"],
      trim: true,
    },
    value: {
      type: String,
      required: [true, "Value is required"],
      trim: true,
    },
    unit: {
      type: String,
      default: "",
      trim: true,
    },
    normalRange: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const testReportSchema = new Schema<ITestReport>(
  {
    doctorUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Doctor ID is required"],
      index: true,
    },
    testId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    reportName: {
      type: String,
      required: [true, "Report name is required"],
      trim: true,
    },
    hospitalName: {
      type: String,
      required: [true, "Hospital name is required"],
      trim: true,
    },
    reportDate: {
      type: Date,
      required: [true, "Report date is required"],
      index: true,
    },
    patientName: {
      type: String,
      required: [true, "Patient name is required"],
      trim: true,
    },
    patientPhoneNumber: {
      type: String,
      required: [true, "Patient phone number is required"],
      trim: true,
      index: true,
    },
    patientAge: {
      type: String,
      required: [true, "Patient age is required"],
      trim: true,
    },
    patientGender: {
      type: String,
      enum: {
        values: PATIENT_GENDER_VALUES,
        message: "{VALUE} is not a valid gender (Male, Female, Other)",
      },
      required: [true, "Patient gender is required"],
    },
    testResults: {
      type: [testResultItemSchema],
      required: [true, "Test results are required"],
      default: [],
    },
    summary: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: TEST_REPORT_STATUS_VALUES,
        message: "{VALUE} is not a valid status (Verified, Review Needed, Pending)",
      },
      default: TEST_REPORT_STATUS.VERIFIED,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const TestReportModel = model<ITestReport>("TestReport", testReportSchema);
export default TestReportModel;

