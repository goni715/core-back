export const HOSPITAL_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVE: "archive",
} as const;

export const HOSPITAL_STATUS_VALUES = Object.values(HOSPITAL_STATUS);

export const HOSPITAL_SEARCHABLE_FIELDS = [
  "name",
  "address",
  "specialities",
  "languages",
  "contactNumber",
  "email",
];
