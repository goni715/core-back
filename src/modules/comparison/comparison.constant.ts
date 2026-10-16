export const COMPARISON_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
} as const;

export const COMPARISON_STATUS_VALUES = Object.values(COMPARISON_STATUS);

export const COMPARISON_VALID_FIELDS: string[] = [
  "searchTerm",
  "page",
  "limit",
  "sortBy",
  "sortOrder",
  "status",
  "treatmentName",
  "category",
  "country",
  "firstCountry",
  "secondCountry",
  "isPopular",
];

export const COMPARISON_SEARCHABLE_FIELDS = [
  "treatmentName",
  "category",
  "firstCountry.country",
  "firstCountry.countryCode",
  "secondCountry.country",
  "secondCountry.countryCode",
];
