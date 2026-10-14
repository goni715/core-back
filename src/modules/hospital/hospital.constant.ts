export const HOSPITAL_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
} as const;

export const HOSPITAL_STATUS_VALUES = Object.values(HOSPITAL_STATUS);

export const HOSPITAL_VALID_FIELDS: string[] = [
  "searchTerm",
  "page",
  "limit",
  "sortBy",
  "sortOrder",
  "status",
  "address",
  "specialities",
  "languages",
  "contactNumber",
  "email",
  "website",
];

export const HOSPITAL_SEARCHABLE_FIELDS = [
  "name",
  "address",
  "specialities",
  "languages",
  "contactNumber",
  "email",
];
