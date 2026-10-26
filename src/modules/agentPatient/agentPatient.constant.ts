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

export const AGENT_PATIENT_SEARCHABLE_FIELDS = [
  "caseId",
  "fullName",
  "name",
  "phone",
  "treatmentType",
  "preferredCountry",
];
