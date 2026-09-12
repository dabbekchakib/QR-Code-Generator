/**
 * URL builders for templates whose content is derived (not typed verbatim):
 * Location → a Google Maps/OpenStreetMap-compatible URL, Event → a Google
 * Calendar link. Both are plain URLs — no external API, no keys.
 */

export interface MapsUrlInput {
  latitude?: string;
  longitude?: string;
  label?: string;
}

export function buildMapsUrl({ latitude, longitude, label }: MapsUrlInput): string {
  const lat = Number(latitude);
  const lng = Number(longitude);
  const coords = `${lat},${lng}`;
  if (label && label.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label.trim())}`;
  }
  return `https://www.google.com/maps?q=${coords}&z=15`;
}

/** Validate that a coordinates pair is usable by buildMapsUrl. */
export function areValidCoordinates(
  latitude: string,
  longitude: string
): boolean {
  const lat = Number(latitude);
  const lng = Number(longitude);
  return (
    latitude.trim() !== "" &&
    longitude.trim() !== "" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export interface CalendarUrlInput {
  name: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM or ""
  endTime: string; // HH:MM or ""
  location?: string;
  description?: string;
}

/** Normalize "YYYY-MM-DD" + "HH:MM" into GCal "YYYYMMDDTHHmm00". */
function calendarTimestamp(date: string, time: string): string {
  const compactDate = date.replace(/-/g, "");
  const cleanTime = (time || "12:00").replace(":", "");
  return `${compactDate}T${cleanTime.padStart(4, "0")}00`;
}

export function buildCalendarUrl(input: CalendarUrlInput): string {
  const start = calendarTimestamp(input.date, input.startTime);
  const end = input.endTime
    ? calendarTimestamp(input.date, input.endTime)
    : calendarTimestamp(input.date, input.startTime || "13:00");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.name.trim(),
  });
  if (input.location?.trim()) params.set("location", input.location.trim());
  if (input.description?.trim()) params.set("details", input.description.trim());
  params.set("dates", `${start}/${end}`);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Loose validation for an event date/time combo (used by the event schema). */
export function isValidEventDateTime(date: string, startTime: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return false;
  const dt = new Date(y, m - 1, d);
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== m - 1 ||
    dt.getDate() !== d
  ) {
    return false;
  }
  if (startTime && !/^\d{2}:\d{2}$/.test(startTime)) return false;
  return true;
}