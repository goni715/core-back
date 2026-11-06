export const TIP_CATEGORY_STATUS = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
} as const;

export const TIP_CATEGORY_STATUS_VALUES = Object.values(TIP_CATEGORY_STATUS);

export const TIP_CATEGORY_SEARCHABLE_FIELDS = ["name", "slug"];

