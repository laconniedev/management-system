export const LESSON_TYPES = ["STEM", "Art", "Education", "Sports"] as const;
export type LessonType = (typeof LESSON_TYPES)[number];
export type ItemKind = "lesson" | "event";

/** One row of the `items` table (a lesson plan or an event on one day). */
export type Item = {
  id: string;
  program_id: string;
  item_date: string; // YYYY-MM-DD
  kind: ItemKind;
  lesson_type: LessonType | null;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
};

/** Badge colors. Background + text pairs keep text readable. */
export const BADGE_STYLES: Record<LessonType | "Event", { chip: string; dot: string }> = {
  STEM: { chip: "bg-[#DCEBFF] text-[#245296] border-[#B5D1F7]", dot: "bg-[#5B95E0]" },
  Education: { chip: "bg-[#ECE2FF] text-[#5B3AA6] border-[#D3C2F7]", dot: "bg-[#9673DB]" },
  Art: { chip: "bg-[#FFF1BF] text-[#7A5A00] border-[#F2DD8A]", dot: "bg-[#E8B923]" },
  Sports: { chip: "bg-[#DBF4E2] text-[#22693B] border-[#B4E3C1]", dot: "bg-[#4DB36F]" },
  Event: { chip: "bg-[#FFE3EA] text-[#9E2F55] border-[#F7C2D1]", dot: "bg-[#E6719A]" },
};

export function badgeKey(item: Pick<Item, "kind" | "lesson_type">): LessonType | "Event" {
  return item.kind === "event" || !item.lesson_type ? "Event" : item.lesson_type;
}

/** Events first, then lessons; within each group, oldest first. */
export function sortItems(items: Item[]): Item[] {
  return [...items].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "event" ? -1 : 1;
    return a.created_at.localeCompare(b.created_at);
  });
}

export const TITLE_MAX = 120;
export const DESCRIPTION_MAX = 5000;
