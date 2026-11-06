export const HEALTH_TIP_STATUS = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
} as const;

export const HEALTH_TIP_STATUS_VALUES = Object.values(HEALTH_TIP_STATUS);

export const HEALTH_TIP_SEARCHABLE_FIELDS = [
  "title",
  "summary",
  "authorName",
];

