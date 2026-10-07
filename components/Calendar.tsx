"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";
import { WEEKDAYS, monthGrid, monthLabel, toKey } from "@/lib/dates";
import { BADGE_STYLES, badgeKey, sortItems, type Item } from "@/lib/items";
import { CloudBanner } from "./CloudBanner";
import { DayDialog } from "./DayDialog";

const MAX_CHIPS = 3; // desktop: show up to 3, or 2 + "+N more"
const MAX_DOTS = 3; // phone: show up to 3 dots, then "+N"

export function Calendar({ programId }: { programId: string }) {
  const supabase = useMemo(() => getBrowserClient(), []);
  const today = new Date();
  const todayKey = toKey(today);

  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [items, setItems] = useState<Item[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openDay, setOpenDay] = useState<string | null>(null);

  const days = useMemo(() => monthGrid(view.year, view.month), [view]);
  const rangeStart = toKey(days[0]);
  const rangeEnd = toKey(days[days.length - 1]);

  const requestId = useRef(0);
  const load = useCallback(async () => {
    const id = ++requestId.current;
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .gte("item_date", rangeStart)
      .lte("item_date", rangeEnd)
      .order("created_at", { ascending: true });
    if (id !== requestId.current) return; // a newer request replaced this one
    if (error) {
      setLoadError("Couldn't load the calendar. Check your connection and try again.");
      return;
    }
    setLoadError(null);
    setItems((data ?? []) as Item[]);
  }, [supabase, rangeStart, rangeEnd]);

  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    load();
  }, [load]);

  // Live updates: when anyone on this program submits, edits, or deletes, reload.
  useEffect(() => {
    const channel = supabase
      .channel(`items-${programId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "items" }, () => loadRef.current())
      .subscribe();

    // Catch anything missed while the tab was in the background.
    const onVisible = () => {
      if (document.visibilityState === "visible") loadRef.current();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
  }, [supabase, programId]);

  const byDay = useMemo(() => {
    const map = new Map<string, Item[]>();
    for (const item of items) {
      const list = map.get(item.item_date) ?? [];
      list.push(item);
      map.set(item.item_date, list);
    }
    for (const [key, list] of map) map.set(key, sortItems(list));
    return map;
  }, [items]);

  const shiftMonth = (delta: number) =>
    setView(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  const isCurrentMonth = view.year === today.getFullYear() && view.month === today.getMonth();
  const navButton =
    "flex h-10 items-center justify-center rounded-full border-2 border-cloud bg-white px-3 font-display font-medium text-teal shadow-[0_3px_0_#A9D8E3] transition hover:bg-sky active:translate-y-0.5 active:shadow-none sm:px-4";

  return (
    <section className="overflow-hidden rounded-[2rem] border-4 border-white bg-white shadow-[0_10px_0_#A9D8E3]">
      <CloudBanner />

      <div className="px-2 pb-6 sm:px-6 sm:pb-8">
        <div className="mb-4 flex items-center justify-between gap-2">
          <button type="button" onClick={() => shiftMonth(-1)} className={navButton} aria-label="Previous month">
            <span aria-hidden="true">‹</span>
            <span className="ml-1 hidden sm:inline">Previous</span>
          </button>
          <div className="flex flex-col items-center">
            <h2 className="text-center font-display text-2xl font-semibold text-ink sm:text-3xl" aria-live="polite">
              {monthLabel(view.year, view.month)}
            </h2>
            {!isCurrentMonth && (
              <button
                type="button"
                onClick={() => setView({ year: today.getFullYear(), month: today.getMonth() })}
                className="text-xs font-semibold text-teal underline-offset-2 hover:underline"
              >
                Back to today
              </button>
            )}
          </div>
          <button type="button" onClick={() => shiftMonth(1)} className={navButton} aria-label="Next month">
            <span className="mr-1 hidden sm:inline">Next</span>
            <span aria-hidden="true">›</span>
          </button>
        </div>

        {loadError && (
          <p className="mb-3 rounded-2xl bg-[#FFE3EA] px-4 py-2 text-sm text-[#9E2F55]" role="alert">
            {loadError}
          </p>
        )}

        {/* Day names bar */}
        <div className="mr-1.5 grid grid-cols-7 border-2 border-cloud bg-white shadow-[6px_6px_0_#A9D8E3] sm:mr-2">
          {WEEKDAYS.map((day, i) => (
            <div
              key={day}
              className={`py-2 text-center font-display text-sm font-semibold text-teal sm:py-3 sm:text-lg ${i > 0 ? "border-l-2 border-cloud" : ""}`}
            >
              <span className="sm:hidden">{day.slice(0, 3)}</span>
              <span className="hidden sm:inline lg:hidden">{day.slice(0, 3)}</span>
              <span className="hidden lg:inline">{day}</span>
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="mr-1.5 mt-4 grid grid-cols-7 border-l-2 border-t-2 border-cloud bg-white shadow-[6px_6px_0_#A9D8E3] sm:mr-2 sm:mt-5 sm:shadow-[8px_8px_0_#A9D8E3]">
          {days.map((date) => {
            const key = toKey(date);
            const inMonth = date.getMonth() === view.month;
            const dayItems = byDay.get(key) ?? [];
            return (
              <DayCell
                key={key}
                date={date}
                inMonth={inMonth}
                isToday={key === todayKey}
                items={dayItems}
                onOpen={() => setOpenDay(key)}
              />
            );
          })}
        </div>

        <Legend />
      </div>

      {openDay && (
        <DayDialog
          dateKey={openDay}
          programId={programId}
          items={byDay.get(openDay) ?? []}
          onClose={() => setOpenDay(null)}
          onChanged={load}
        />
      )}
    </section>
  );
}

function DayCell({
  date,
  inMonth,
  isToday,
  items,
  onOpen,
}: {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  items: Item[];
  onOpen: () => void;
}) {
  const chips = items.length > MAX_CHIPS ? items.slice(0, MAX_CHIPS - 1) : items;
  const hiddenChips = items.length - chips.length;
  const dots = items.slice(0, MAX_DOTS);
  const hiddenDots = items.length - dots.length;
  const label = `${date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}, ${
    items.length === 0 ? "nothing planned" : `${items.length} item${items.length === 1 ? "" : "s"}`
  }. Open to add or edit.`;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label}
      className={`group relative flex min-h-[72px] flex-col items-stretch gap-1 border-b-2 border-r-2 border-cloud p-1 text-left transition sm:min-h-[118px] sm:p-2 ${
        inMonth ? "bg-white hover:bg-[#F5FAFE]" : "bg-[#F7FBFE] hover:bg-[#EEF6FC]"
      }`}
    >
      <span className="flex items-center justify-between">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full font-display text-xs font-semibold sm:h-7 sm:w-7 sm:text-sm ${
            isToday ? "bg-primary text-white" : inMonth ? "text-ink" : "text-slate-300"
          }`}
        >
          {date.getDate()}
        </span>
        {/* Plus icon: appears on hover on desktop */}
        <span
          aria-hidden="true"
          className="hidden h-6 w-6 items-center justify-center rounded-full bg-accent2 text-base font-bold leading-none text-teal opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100 sm:flex"
        >
          +
        </span>
      </span>

      {/* Desktop and tablet: titled chips */}
      <span className="hidden flex-col gap-1 sm:flex">
        {chips.map((item) => (
          <span
            key={item.id}
            className={`truncate rounded-lg border px-1.5 py-0.5 text-xs font-semibold ${BADGE_STYLES[badgeKey(item)].chip}`}
          >
            {item.title}
          </span>
        ))}
        {hiddenChips > 0 && <span className="px-1 text-xs font-semibold text-teal">+{hiddenChips} more</span>}
      </span>

      {/* Phone: colored dots */}
      <span className="flex flex-wrap items-center gap-1 px-0.5 sm:hidden">
        {dots.map((item) => (
          <span key={item.id} className={`h-2 w-2 rounded-full ${BADGE_STYLES[badgeKey(item)].dot}`} />
        ))}
        {hiddenDots > 0 && <span className="text-[10px] font-bold leading-none text-teal">+{hiddenDots}</span>}
      </span>
    </button>
  );
}

function Legend() {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs">
      {(["Event", "STEM", "Education", "Art", "Sports"] as const).map((key) => (
        <span key={key} className={`rounded-full border px-2.5 py-0.5 font-semibold ${BADGE_STYLES[key].chip}`}>
          {key}
        </span>
      ))}
    </div>
  );
}
