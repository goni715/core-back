/**
 * Normalizes time string ("10:00", "10:00 AM", "12:30 PM", "01:00 PM") to 24-hour "HH:mm" format.
 */
export const normalizeTimeTo24Hour = (time: string): string => {
  if (!time) return time;
  const trimmed = time.trim();
  const isPM = /pm/i.test(trimmed);
  const isAM = /am/i.test(trimmed);

  if (!isPM && !isAM) {
    const parts = trimmed.split(":");
    const hours = (parts[0] || "00").padStart(2, "0");
    const minutes = (parts[1] || "00").padStart(2, "0").slice(0, 2);
    return `${hours}:${minutes}`;
  }

  const cleanTime = trimmed.replace(/\s*(am|pm)/i, "").trim();
  const parts = cleanTime.split(":");
  let hours = parseInt(parts[0] || "0", 10);
  const minutes = (parts[1] || "00").padStart(2, "0").slice(0, 2);

  if (isPM && hours < 12) {
    hours += 12;
  } else if (isAM && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, "0")}:${minutes}`;
};

/**
 * Construct normalized Date from anchor date 2026-01-01 and HH:mm or hh:mm AM/PM time
 */
const createDateTimeFromTime = (time: string): Date => {
  const normalized = normalizeTimeTo24Hour(time);
  const parts = normalized.split(":");
  const hours = (parts[0] || "00").padStart(2, "0");
  const minutes = (parts[1] || "00").padStart(2, "0");
  const seconds = (parts[2] || "00").padStart(2, "0");
  return new Date(`2026-01-01T${hours}:${minutes}:${seconds}.000Z`);
};

export default createDateTimeFromTime;
