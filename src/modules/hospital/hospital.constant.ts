export const HOSPITAL_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVE: "archive",
} as const;

export const HOSPITAL_STATUS_VALUES = Object.values(HOSPITAL_STATUS);

export const HOSPITAL_SEARCHABLE_FIELDS = [
  "name",
  "country",
  "address",
  "specialities",
  "languages",
  "contactNumber",
  "email",
];

export const TARGET_COUNTRIES = [
  { country: "Bangladesh", code: "BD" },
  { country: "India", code: "IN" },
  { country: "Thailand", code: "TH" },
  { country: "Singapore", code: "SG" },
  { country: "Malaysia", code: "MY" },
  { country: "Turkey", code: "TR" },
];
