export const SUPPORT_STATUS = {
    OPEN: "open",
    IN_PROGRESS: "in_progress",
    CLOSED: "closed",
} as const;

export const SUPPORT_STATUS_VALUES = Object.values(SUPPORT_STATUS);

export const SUPPORT_SEARCHABLE_FIELDS = ["fullName", "email", "phone", "subject"];
