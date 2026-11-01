export const PATIENT_CASE_STATUS = {
  SUBMITTED: "submitted",
  UNDER_REVIEW: "under_review",
  CONFIRMED: "confirmed",
  ONGOING: "ongoing",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export const PATIENT_CASE_STATUS_VALUES = Object.values(PATIENT_CASE_STATUS);

export const PATIENT_GENDER = {
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
} as const;

export const PATIENT_GENDER_VALUES = Object.values(PATIENT_GENDER);

export const COMMISSION_PAYMENT_STATUS = {
  UNPAID: "unpaid",
  PENDING: "pending",
  PAID: "paid",
} as const;

export const COMMISSION_PAYMENT_STATUS_VALUES = Object.values(
  COMMISSION_PAYMENT_STATUS,
);

export const AGENT_PATIENT_SEARCHABLE_FIELDS = [
  "caseId",
  "fullName",
  "phone",
  "treatmentType",
  "preferredCountry",
];
