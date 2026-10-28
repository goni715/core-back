export const AGENT_APPROVAL_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export const AGENT_APPROVAL_STATUS_VALUES = Object.values(
  AGENT_APPROVAL_STATUS,
);


export const AGENT_SEARCHABLE_FIELDS = [
  "agencyName",
  "fullName",
  "email",
  "phone",
];
