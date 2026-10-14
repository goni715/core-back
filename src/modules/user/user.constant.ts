export const USER_SEARCHABLE_FIELDS = ["fullName", "email", "phone"];

export const ACCOUNT_STATUS = {
    PENDING : 'pending',
    ACTIVE : 'active',
    BLOCKED : 'blocked',
} as const;

export const ACCOUNT_STATUS_VALUES = Object.values(ACCOUNT_STATUS);

export const USER_ROLES = {
  PATIENT: "patient",
  DOCTOR: "doctor",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin",
} as const;

export const USER_ROLE_VALUES = Object.values(USER_ROLES);

export const USER_VALID_FIELDS: string[] = [
  "searchTerm",
  "page",
  "limit",
  "sortBy",
  "sortOrder",
  "status",
];
