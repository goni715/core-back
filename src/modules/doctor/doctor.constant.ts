export const DOCTOR_TITLE = {
  DR: "Dr.",
  PROF_DR: "Prof. Dr.",
  ASSOC_PROF_DR: "Assoc. Prof. Dr.",
  ASST_PROF_DR: "Asst. Prof. Dr.",
} as const;

export const DOCTOR_TITLE_VALUES = Object.values(DOCTOR_TITLE);

export const DOCTOR_SPECIALIZATION = {
  CANCER: "Cancer",
  CARDIOVASCULAR_SURGERY: "Cardiovascular Surgery",
  CARDIOLOGY: "Cardiology",
  COLORECTAL_SURGERY_PILES: "Colorectal Surgery (Piles)",
  DENTISTRY: "Dentistry",
  DERMATOLOGY: "Dermatology",
  DIABETES_AND_HORMONE: "Diabetes & Hormone",
  ENT: "ENT (Ear, Nose & Throat)",
  OPHTHALMOLOGY: "Ophthalmology",
  GASTROENTEROLOGY: "Gastroenterology",
  GENERAL_PHYSICIAN: "General Physician",
  GENERAL_PRACTITIONER: "General Practitioner",
  SURGERY: "Surgery",
  GYNECOLOGY: "Gynecology",
  HEMATOLOGY: "Hematology",
  MEDICINE: "Medicine",
  NEPHROLOGY: "Nephrology",
  NEUROSURGERY: "Neurosurgery",
  NUTRITION: "Nutrition",
  ONCOLOGY_CANCER: "Oncology (Cancer)",
  ORTHOPEDICS: "Orthopedics",
  PAIN_MEDICINE: "Pain Medicine",
  PEDIATRICS: "Pediatrics",
  PHYSICAL_MEDICINE: "Physical Medicine",
  PHYSIOTHERAPY: "Physiotherapy",
  PLASTIC_SURGERY: "Plastic Surgery",
  PSYCHIATRY: "Psychiatry",
  ASTHMA_AND_CHEST_DISEASE: "Asthma & Chest Disease",
  SKIN_VD_AND_SEXUAL_HEALTH: "Skin, VD & Sexual Health",
  UROLOGY: "Urology",
  VASCULAR_DISEASE: "Vascular Disease",
} as const;

export const DOCTOR_SPECIALIZATION_VALUES = Object.values(
  DOCTOR_SPECIALIZATION,
);

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
  "hospital",
  "designation",
  "education",
  "consultationFee",
  "address",
  "bmdcNumber",
  "isOnline",
];

export const DOCTOR_SEARCHABLE_FIELDS = [
  "fullName",
  "email",
  "phone",
  "specialization",
  "hospital",
  "designation",
  "education",
  "address",
  "bmdcNumber",
  "title",
];