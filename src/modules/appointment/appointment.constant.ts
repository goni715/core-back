export const APPOINTMENT_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export const APPOINTMENT_STATUS_VALUES = Object.values(APPOINTMENT_STATUS);

export const BLOOD_GROUP = {
  A_POSITIVE: "A+",
  A_NEGATIVE: "A-",
  B_POSITIVE: "B+",
  B_NEGATIVE: "B-",
  AB_POSITIVE: "AB+",
  AB_NEGATIVE: "AB-",
  O_POSITIVE: "O+",
  O_NEGATIVE: "O-",
} as const;

export const BLOOD_GROUP_VALUES = Object.values(BLOOD_GROUP);

export const APPOINTMENT_SEARCHABLE_FIELDS = [
  "fullName",
  "email",
  "phone",
  "appointmentCode"
];

