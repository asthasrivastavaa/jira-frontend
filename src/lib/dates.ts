// A due date is a CALENDAR DAY ("2026-10-10"), not a moment in time.
// The API stores it as UTC midnight. If we turned that into a local Date, anyone west of UTC
// would see the previous day. So we never do: we only ever handle the "YYYY-MM-DD" string.

/** "2026-10-10T00:00:00.000Z" -> "2026-10-10" */
export const toDay = (iso: string) => iso.slice(0, 10);

/** Today's calendar day in the user's own timezone. */
export function today() {
  return fromLocalDate(new Date());
}

/** A Date picked in the calendar (local midnight) -> "YYYY-MM-DD" using LOCAL parts. */
export function fromLocalDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "YYYY-MM-DD" -> a local Date at midnight (what the calendar component expects). */
export function toLocalDate(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "2026-10-10" -> "Oct 10" (or "Oct 10, 2027" when not this year). */
export function formatDay(day: string) {
  const date = toLocalDate(day);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", ...(sameYear ? {} : { year: "numeric" }) });
}

/** "just now", "5 minutes ago", "3 days ago"; falls back to a date after a month. For MOMENTS (createdAt), not days. */
export function timeAgo(iso: string) {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 45) return "just now";
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const steps: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [30, "day"],
  ];
  let value = seconds;
  for (const [size, unit] of steps) {
    if (Math.abs(value) < size) return rtf.format(-Math.round(value), unit);
    value /= size;
  }
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/** YYYY-MM-DD strings sort the same way as the dates they represent, so plain < works. */
export const isOverdue = (day: string) => day < today();
