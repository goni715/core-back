export const DOCTOR_TITLE = {
  DR: "Dr.",
  PROF_DR: "Prof. Dr.",
  ASSOC_PROF_DR: "Assoc. Prof. Dr.",
  ASST_PROF_DR: "Asst. Prof. Dr.",
} as const;

export const DOCTOR_TITLE_VALUES = Object.values(DOCTOR_TITLE);

export const DOCTOR_APPROVAL_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export const DOCTOR_APPROVAL_STATUS_VALUES = Object.values(
  DOCTOR_APPROVAL_STATUS,
);

export const DOCTOR_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVE: "archive",
} as const;

export const DOCTOR_STATUS_VALUES = Object.values(DOCTOR_STATUS);

export const DOCTOR_REGISTRATION_SOURCE = {
  SELF: "self",
  ADMIN: "admin",
} as const;

export const DOCTOR_REGISTRATION_SOURCE_VALUES = Object.values(
  DOCTOR_REGISTRATION_SOURCE,
);

export const DOCTOR_VALID_FIELDS: string[] = [
  "searchTerm",
  "page",
  "limit",
  "sortBy",
  "sortOrder",
  "status",
  "approvalStatus",
  "registrationSource",
  "userStatus",
  "specialization",
  "city",
  "country",
  "hospital",
  "availabilityLabel",
];

export const DOCTOR_SEARCHABLE_FIELDS = [
  "fullName",
  "email",
  "phone",
  "specialization",
  "hospital",
  "city",
  "country",
  "bmdcNumber",
  "title",
];