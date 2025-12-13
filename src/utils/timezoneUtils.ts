/**
 * Timezone utility functions for handling Europe/Prague timezone
 * with automatic Daylight Saving Time (DST) handling.
 *
 * Czech Republic uses:
 * - CET (Central European Time) - UTC+1 in winter
 * - CEST (Central European Summer Time) - UTC+2 in summer
 */

/**
 * Gets the timezone offset in hours between UTC and Europe/Prague for a given date.
 * This automatically handles DST transitions.
 *
 * @param date - The date to calculate the offset for
 * @returns The offset in hours (positive means Prague is ahead of UTC)
 */
export function getPragueTimezoneOffset(date: Date): number {
  // Create formatters to get the hour in both timezones for the same timestamp
  const utcFormatter = new Intl.DateTimeFormat("en", {
    timeZone: "UTC",
    hour: "2-digit",
    hour12: false,
  });

  const pragueFormatter = new Intl.DateTimeFormat("en", {
    timeZone: "Europe/Prague",
    hour: "2-digit",
    hour12: false,
  });

  // Format the same timestamp in both timezones
  const utcParts = utcFormatter.formatToParts(date);
  const pragueParts = pragueFormatter.formatToParts(date);

  const utcHour = parseInt(utcParts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const pragueHour = parseInt(pragueParts.find((p) => p.type === "hour")?.value ?? "0", 10);

  // Calculate the difference
  let offset = pragueHour - utcHour;

  // Normalize to -12 to +12 range (Prague is always UTC+1 or UTC+2)
  if (offset > 12) {
    offset -= 24;
  } else if (offset < -12) {
    offset += 24;
  }

  return offset;
}

/**
 * Converts a date from local/Prague time to UTC for database storage.
 * Subtracts the Prague timezone offset.
 *
 * @param date - The date in Prague timezone
 * @returns The date adjusted to UTC for storage
 */
export function adjustToUTCForStorage(date: Date): Date {
  const offset = getPragueTimezoneOffset(date);
  const adjustedDate = new Date(date);
  adjustedDate.setHours(adjustedDate.getHours() - offset);
  return adjustedDate;
}

/**
 * Converts a date from UTC (database) to Prague timezone for display/email.
 * Adds the Prague timezone offset.
 *
 * @param date - The date in UTC from database
 * @returns The date adjusted to Prague timezone for display
 */
export function adjustFromUTCForDisplay(date: Date): Date {
  const offset = getPragueTimezoneOffset(date);
  const adjustedDate = new Date(date);
  adjustedDate.setHours(adjustedDate.getHours() + offset);
  return adjustedDate;
}

/**
 * Converts a datetime-local string (interpreted as Prague time) to UTC Date.
 * This is used when receiving input from datetime-local inputs where the user
 * intends to enter a time in Prague timezone.
 *
 * @param dateTimeString - A string in format "YYYY-MM-DDTHH:mm" (from datetime-local input)
 * @returns A Date object in UTC that represents the same moment in Prague time
 */
export function convertPragueTimeStringToUTC(dateTimeString: string): Date {
  // Parse the datetime-local string (format: "YYYY-MM-DDTHH:mm")
  // This string represents a time in Prague timezone (what the user intends)
  const [datePart, timePart] = dateTimeString.split("T");
  if (!datePart || !timePart) {
    throw new Error(`Invalid datetime-local format: ${dateTimeString}`);
  }

  const dateParts = datePart.split("-").map(Number);
  const timeParts = timePart.split(":").map(Number);

  if (dateParts.length < 3 || timeParts.length < 2) {
    throw new Error(`Invalid datetime-local format: ${dateTimeString}`);
  }

  const year = dateParts[0];
  const month = dateParts[1];
  const day = dateParts[2];
  const hour = timeParts[0] ?? 0;
  const minute = timeParts[1] ?? 0;

  if (!year || !month || !day) {
    throw new Error(`Invalid datetime-local format: ${dateTimeString}`);
  }

  // Create a date object in UTC representing the input time
  // We'll then check what Prague time this corresponds to, and adjust
  const tempDate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));

  // Get what Prague time this UTC time corresponds to
  const pragueTimeString = tempDate.toLocaleString("en-US", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // Parse the Prague time to see if it matches what user entered
  const pragueParts = pragueTimeString.split(", ");
  const pragueDateParts = pragueParts[0]?.split("/") ?? [];
  const pragueTimeParts = pragueParts[1]?.split(":") ?? [];

  const pragueMonth = parseInt(pragueDateParts[0] ?? "1", 10);
  const pragueDay = parseInt(pragueDateParts[1] ?? "1", 10);
  const pragueYear = parseInt(pragueDateParts[2] ?? "2000", 10);
  const pragueHour = parseInt(pragueTimeParts[0] ?? "0", 10);
  const pragueMinute = parseInt(pragueTimeParts[1] ?? "0", 10);

  // Calculate the difference between what user entered and what this UTC time represents in Prague
  // If they match, we're done. Otherwise, adjust.
  if (
    pragueYear === year &&
    pragueMonth === month &&
    pragueDay === day &&
    pragueHour === hour &&
    pragueMinute === minute
  ) {
    return tempDate;
  }

  // They don't match, so we need to adjust
  // Calculate the offset needed to make Prague time match user input
  const hourDiff = hour - pragueHour;
  const minuteDiff = minute - pragueMinute;

  // Adjust the UTC time by the difference
  const adjustedDate = new Date(tempDate);
  adjustedDate.setUTCHours(adjustedDate.getUTCHours() + hourDiff);
  adjustedDate.setUTCMinutes(adjustedDate.getUTCMinutes() + minuteDiff);

  return adjustedDate;
}

