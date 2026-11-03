/**
 * Convert 24-hour ("HH:mm") or 12-hour ("hh:mm a") time string to standardized 12-hour AM/PM format ("hh:mm AM/PM").
 * E.g., "10:00" -> "10:00 AM", "12:30" -> "12:30 PM", "00:00" -> "12:00 AM", "13:15" -> "01:15 PM"
 */
const formatTime12Hour = (time: string): string => {
  if (!time || typeof time !== "string") return time;

  const trimmed = time.trim();
  const isPM = /pm/i.test(trimmed);
  const isAM = /am/i.test(trimmed);

  const cleanTime = trimmed.replace(/\s*(am|pm)/i, "").trim();
  const parts = cleanTime.split(":");
  if (parts.length < 2) return trimmed;

  let hours = parseInt(parts[0] || "0", 10);
  const minutes = (parts[1] || "00").padStart(2, "0").slice(0, 2);

  if (isNaN(hours)) return trimmed;

  let modifier: string;
  if (isPM) {
    modifier = "PM";
  } else if (isAM) {
    modifier = "AM";
  } else {
    modifier = hours >= 12 ? "PM" : "AM";
  }

  hours = hours % 12;
  hours = hours === 0 ? 12 : hours;
  const formattedHours = String(hours).padStart(2, "0");

  return `${formattedHours}:${minutes} ${modifier}`;
};

export default formatTime12Hour;
