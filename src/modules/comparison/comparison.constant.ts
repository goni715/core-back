export const COMPARISON_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVE: "archive",
} as const;

export const COMPARISON_STATUS_VALUES = Object.values(COMPARISON_STATUS);

export const COMPARISON_SEARCHABLE_FIELDS = [
  "treatmentName",
  "category",
  "firstCountry.country",
  "firstCountry.countryCode",
  "secondCountry.country",
  "secondCountry.countryCode",
];
