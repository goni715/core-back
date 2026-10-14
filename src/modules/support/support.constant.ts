export const SUPPORT_STATUS = {
    NEW: "new",
    REPLIED: "replied",
    CLOSED: "closed",
} as const;

export const SUPPORT_STATUS_VALUES = Object.values(SUPPORT_STATUS);

export const SUPPORT_SEARCHABLE_FIELDS = ["fullName", "email", "phone", "title"];

export const SUPPORT_VALID_FIELDS: string[] = [
    "searchTerm",
    "page",
    "limit",
    "sortBy",
    "sortOrder",
    "status",
    "date"
];