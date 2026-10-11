// Sticky notes beside the calendar. Safe to import from browser code.

export const NOTE_MAX = 300;

/** A highlighted stretch of a note's text: [start, end) character positions. */
export type Range = [number, number];

export type NoteData = { content: string; highlights: Range[] };

export const EMPTY_NOTE: NoteData = { content: "", highlights: [] };

/**
 * The six notes, three on each side of the calendar (listed top to bottom).
 * Every note is cream paper; the tape color changes, and highlights on a note
 * use its tape color. `slot` is what's stored in the database, so never renumber.
 */
export const NOTE_SLOTS = [
  { slot: 0, side: "left", name: "Green", tape: "#CFE6B9", highlight: "#CFE6B9" },
  { slot: 1, side: "left", name: "Pink", tape: "#FDD2E5", highlight: "#FDD2E5" },
  { slot: 4, side: "left", name: "Lavender", tape: "#E8DAF0", highlight: "#E8DAF0" },
  // #FFF9E6 is almost the same as the cream paper, so its highlight is a deeper butter
  // yellow from the same family; otherwise highlighted words would be invisible.
  { slot: 2, side: "right", name: "Cream", tape: "#FFF9E6", highlight: "#FBE7A1" },
  { slot: 3, side: "right", name: "Blue", tape: "#A8D0EF", highlight: "#A8D0EF" },
  { slot: 5, side: "right", name: "Periwinkle", tape: "#C8CEEE", highlight: "#C8CEEE" },
] as const;

export type NoteSlot = (typeof NOTE_SLOTS)[number]["slot"];

/** "2026-10" for October 2026 (month is 0-based, like Date#getMonth). */
export function monthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

/** Clamp to the text, drop empty ranges, sort, and merge overlapping ranges. */
export function normalizeRanges(ranges: unknown, textLength: number): Range[] {
  if (!Array.isArray(ranges)) return [];
  const clean = ranges
    .filter((r): r is Range => Array.isArray(r) && r.length === 2 && r.every((n) => Number.isInteger(n)))
    .map(([a, b]) => [Math.max(0, Math.min(a, textLength)), Math.max(0, Math.min(b, textLength))] as Range)
    .filter(([a, b]) => b > a)
    .sort((x, y) => x[0] - y[0]);
  const out: Range[] = [];
  for (const [a, b] of clean) {
    const last = out[out.length - 1];
    if (last && a < last[1]) last[1] = Math.max(last[1], b);
    else out.push([a, b]);
  }
  return out;
}

/**
 * Keep highlights attached to the same words while the text is edited.
 * Typing inside a highlight extends it; typing right before or after it doesn't.
 */
export function shiftRanges(ranges: Range[], oldText: string, newText: string): Range[] {
  let p = 0;
  const maxPrefix = Math.min(oldText.length, newText.length);
  while (p < maxPrefix && oldText[p] === newText[p]) p++;
  let s = 0;
  while (
    s < oldText.length - p &&
    s < newText.length - p &&
    oldText[oldText.length - 1 - s] === newText[newText.length - 1 - s]
  ) {
    s++;
  }
  const oldEnd = oldText.length - s; // the changed part of the old text is [p, oldEnd)
  const delta = newText.length - oldText.length;

  const mapStart = (x: number) => (x >= oldEnd ? x + delta : x <= p ? x : p);
  const mapEnd = (x: number) => (x <= p ? x : x >= oldEnd ? x + delta : p);

  return normalizeRanges(
    ranges.map(([a, b]) => [mapStart(a), mapEnd(b)]),
    newText.length,
  );
}

/** Split text into plain and highlighted pieces for display. `hi` is the range index, or -1. */
export function segments(text: string, ranges: Range[]): { text: string; hi: number }[] {
  const out: { text: string; hi: number }[] = [];
  let pos = 0;
  ranges.forEach(([a, b], i) => {
    if (a > pos) out.push({ text: text.slice(pos, a), hi: -1 });
    out.push({ text: text.slice(a, b), hi: i });
    pos = b;
  });
  if (pos < text.length) out.push({ text: text.slice(pos), hi: -1 });
  return out;
}
