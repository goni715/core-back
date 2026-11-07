export const TEST_REPORT_STATUS = {
  VERIFIED: "verified",
  REVIEW_NEEDED: "review_needed",
  PENDING: "pending",
} as const;

export const TEST_REPORT_STATUS_VALUES = Object.values(TEST_REPORT_STATUS);

export const PATIENT_GENDER = {
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
} as const;

export const PATIENT_GENDER_VALUES = Object.values(PATIENT_GENDER);

export const TEST_REPORT_SEARCHABLE_FIELDS = [
  "testId",
  "reportCode",
  "reportName",
  "hospitalName",
  "patientName",
  "patientPhoneNumber",
  "summary",
];

