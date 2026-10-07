// Dates are handled as plain YYYY-MM-DD strings in the user's local time,
// so a lesson on Oct 5 is always Oct 5 regardless of time zone.

const pad = (n: number) => String(n).padStart(2, "0");

export function toKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** All days shown for a month, in full Sunday-to-Saturday weeks (5 or 6 rows). */
export function monthGrid(year: number, month: number): Date[] {
  const firstWeekday = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  return Array.from({ length: cellCount }, (_, i) => new Date(year, month, 1 - firstWeekday + i));
}

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function longDateLabel(key: string): string {
  return fromKey(key).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}
