import { Document, Types } from "mongoose";
import { PATIENT_GENDER, TEST_REPORT_STATUS } from "./testReport.constant";

export interface ITestResultItem {
  parameterName: string;
  value: string;
  unit?: string;
  normalRange?: string;
}

export type TTestReportStatus =
  (typeof TEST_REPORT_STATUS)[keyof typeof TEST_REPORT_STATUS];

export type TPatientGender =
  (typeof PATIENT_GENDER)[keyof typeof PATIENT_GENDER];

export interface ITestReport extends Document {
  testId: string;
  reportName: string;
  hospitalName: string;
  reportDate: Date;
  patientName: string;
  patientPhoneNumber: string;
  patientAge: string;
  patientGender: TPatientGender;
  doctorUserId: Types.ObjectId;
  testResults: ITestResultItem[];
  summary?: string;
  status: TTestReportStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TTestReportQuery = {
  searchTerm?: string;
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: TTestReportStatus;
  patientPhoneNumber?: string;
  reportDate?: string | Date;
  startDate?: string | Date;
  endDate?: string | Date;
  doctorId?: string;
};

