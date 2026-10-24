export const SCHEDULE_DAYS = {
  SAT: "Sat",
  SUN: "Sun",
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
} as const;

export const SCHEDULE_DAYS_VALUES = Object.values(SCHEDULE_DAYS);

export const SCHEDULE_SEARCHABLE_FIELDS = ["day", "startTime", "endTime"];
