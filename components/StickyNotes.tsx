"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";
import {
  EMPTY_NOTE,
  NOTE_MAX,
  NOTE_SLOTS,
  monthKey,
  normalizeRanges,
  segments,
  shiftRanges,
  type NoteData,
} from "@/lib/stickyNotes";

const SAVE_DELAY_MS = 500; // save this long after the last keystroke
const DOUBLE_CLICK_WAIT_MS = 250; // a click on a highlight waits this long in case it's a double-click

// Phones only view the notes. Narrow screens and landscape phones count as phones.
const VIEW_ONLY_QUERY = "(max-width: 639px), (pointer: coarse) and (max-height: 500px)";

// Wide screens (1640px+): notes sit in the empty space beside the calendar, without moving it.
// Narrower screens: the same six notes sit in a grid under the calendar: 3 across (left-side notes on
// the first row, right-side on the second), or on phones 2 columns mirroring the left and right sides.
const WRAPPER =
  "mt-10 grid grid-flow-col grid-cols-2 grid-rows-3 gap-x-5 gap-y-8 px-1 sm:grid-flow-row sm:grid-cols-3 sm:grid-rows-none sm:gap-x-8 min-[1640px]:contents";
const GROUP =
  "contents min-[1640px]:absolute min-[1640px]:top-8 min-[1640px]:flex min-[1640px]:w-[210px] min-[1640px]:flex-col min-[1640px]:gap-10";

// Shared by the display text, the editing box, and the highlight layer behind it,
// so the text sits in exactly the same place in all three.
const TEXT_BOX =
  "h-full w-full overflow-y-auto whitespace-pre-wrap break-words px-4 pb-3 pt-6 font-sans text-[15px] leading-6 [scrollbar-gutter:stable]";

type Pending = { month: string; slot: number; data: NoteData };

export function StickyNotes({ programId, year, month }: { programId: string; year: number; month: number }) {
  const supabase = useMemo(() => getBrowserClient(), []);
  const mKey = monthKey(year, month);

  const [notes, setNotes] = useState<Record<number, NoteData>>({});
  const [loadedMonth, setLoadedMonth] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const viewOnly = useMediaQuery(VIEW_ONLY_QUERY);

  // Notes with unsaved or in-flight changes, or being typed in, keep their local text
  // when a live update arrives, so a reload never wipes out what someone is typing.
  const editing = useRef(new Set<string>());
  const pending = useRef(new Map<string, Pending>());
  const inFlight = useRef(new Map<string, number>());
  const timers = useRef(new Map<string, number>());
  const isBusy = (key: string) =>
    editing.current.has(key) || pending.current.has(key) || (inFlight.current.get(key) ?? 0) > 0;

  const requestId = useRef(0);
  const load = useCallback(async () => {
    const id = ++requestId.current;
    const m = mKey;
    const { data, error } = await supabase
      .from("sticky_notes")
      .select("slot, content, highlights")
      .eq("program_id", programId)
      .eq("month", m);
    if (id !== requestId.current) return; // a newer request replaced this one
    if (error) {
      setError("Couldn't load the sticky notes. Check your connection and try again.");
      return;
    }
    setError(null);
    setNotes((prev) => {
      const next: Record<number, NoteData> = {};
      for (const row of data ?? []) {
        const content = (row.content as string | null) ?? "";
        next[row.slot as number] = { content, highlights: normalizeRanges(row.highlights, content.length) };
      }
      for (const { slot } of NOTE_SLOTS) {
        if (isBusy(`${m}:${slot}`) && prev[slot]) next[slot] = prev[slot];
      }
      return next;
    });
    setLoadedMonth(m);
  }, [supabase, programId, mKey]);

  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    load();
  }, [load]);

  // Live updates: when anyone on this program changes a note, reload.
  useEffect(() => {
    const channel = supabase
      .channel(`sticky-notes-${programId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sticky_notes", filter: `program_id=eq.${programId}` },
        () => loadRef.current(),
      )
      .subscribe();
    const onVisible = () => {
      if (document.visibilityState === "visible") loadRef.current();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
  }, [supabase, programId]);

  const flush = useCallback(
    async (key: string) => {
      window.clearTimeout(timers.current.get(key));
      timers.current.delete(key);
      const job = pending.current.get(key);
      if (!job) return;
      pending.current.delete(key);
      inFlight.current.set(key, (inFlight.current.get(key) ?? 0) + 1);
      const { error } = await supabase.from("sticky_notes").upsert(
        {
          program_id: programId,
          month: job.month,
          slot: job.slot,
          content: job.data.content,
          highlights: job.data.highlights,
        },
        { onConflict: "program_id,slot,month" },
      );
      inFlight.current.set(key, (inFlight.current.get(key) ?? 1) - 1);
      setError(error ? "Couldn't save the sticky note. Check your connection and try again." : null);
    },
    [supabase, programId],
  );

  // Save any unsaved notes when leaving the page.
  const flushRef = useRef(flush);
  flushRef.current = flush;
  useEffect(() => {
    const flushAll = () => {
      for (const key of [...pending.current.keys()]) flushRef.current(key);
    };
    window.addEventListener("pagehide", flushAll);
    return () => {
      window.removeEventListener("pagehide", flushAll);
      flushAll();
    };
  }, []);

  const update = (slot: number, data: NoteData, saveNow: boolean) => {
    const key = `${mKey}:${slot}`;
    setNotes((prev) => ({ ...prev, [slot]: data }));
    pending.current.set(key, { month: mKey, slot, data });
    window.clearTimeout(timers.current.get(key));
    if (saveNow) flush(key);
    else timers.current.set(key, window.setTimeout(() => flush(key), SAVE_DELAY_MS));
  };

  const ready = loadedMonth === mKey;
  const noteFor = (slot: number) => (ready ? (notes[slot] ?? EMPTY_NOTE) : EMPTY_NOTE);

  const renderNote = (cfg: (typeof NOTE_SLOTS)[number]) => {
    const key = `${mKey}:${cfg.slot}`;
    return (
      <StickyNote
        key={key}
        name={cfg.name}
        tape={cfg.tape}
        highlight={cfg.highlight}
        data={noteFor(cfg.slot)}
        viewOnly={viewOnly}
        disabled={!ready}
        onEditStart={() => editing.current.add(key)}
        onEditEnd={async () => {
          editing.current.delete(key);
          await flush(key);
          loadRef.current(); // pick up anything others changed while this note was open
        }}
        onChange={(data, saveNow) => update(cfg.slot, data, saveNow)}
      />
    );
  };

  return (
    <>
      <div className={WRAPPER}>
        <div className={`${GROUP} min-[1640px]:right-full min-[1640px]:mr-4`}>
          {NOTE_SLOTS.filter((n) => n.side === "left").map(renderNote)}
        </div>
        <div className={`${GROUP} min-[1640px]:left-full min-[1640px]:ml-4`}>
          {NOTE_SLOTS.filter((n) => n.side === "right").map(renderNote)}
        </div>
      </div>
      {error && (
        <p className="mt-6 rounded-2xl bg-[#FFE3EA] px-4 py-2 text-sm text-[#9E2F55]" role="alert">
          {error}
        </p>
      )}
    </>
  );
}

function StickyNote({
  name,
  tape,
  highlight,
  data,
  viewOnly,
  disabled,
  onEditStart,
  onEditEnd,
  onChange,
}: {
  name: string;
  tape: string;
  highlight: string;
  data: NoteData;
  viewOnly: boolean;
  disabled: boolean;
  onEditStart: () => void;
  onEditEnd: () => void;
  onChange: (data: NoteData, saveNow: boolean) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const skipClick = useRef(false);
  const clickTimer = useRef<number | undefined>(undefined);
  const dataRef = useRef(data);
  dataRef.current = data;

  const canEdit = !viewOnly && !disabled;
  const parts = segments(data.content, data.highlights);

  useEffect(() => () => window.clearTimeout(clickTimer.current), []);

  // If the note becomes view-only (window shrunk to phone size) while open, close it.
  useEffect(() => {
    if (isEditing && !canEdit) areaRef.current?.blur();
  }, [isEditing, canEdit]);

  useEffect(() => {
    if (!isEditing) return;
    const area = areaRef.current;
    if (!area) return;
    area.focus();
    area.setSelectionRange(area.value.length, area.value.length);
  }, [isEditing]);

  const startEditing = () => {
    if (!canEdit || isEditing) return;
    setIsEditing(true);
    onEditStart();
  };

  // Dragging across words (outside of editing) highlights them when the mouse is let go.
  const highlightSelection = () => {
    const container = textRef.current;
    const sel = window.getSelection();
    if (!container || !sel || sel.isCollapsed || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!range.intersectsNode(container)) return;
    const text = dataRef.current.content;
    const offsetOf = (node: Node, offset: number) => {
      const r = document.createRange();
      r.selectNodeContents(container);
      r.setEnd(node, offset);
      return r.toString().length;
    };
    const start = container.contains(range.startContainer) ? offsetOf(range.startContainer, range.startOffset) : 0;
    const end = container.contains(range.endContainer) ? offsetOf(range.endContainer, range.endOffset) : text.length;
    sel.removeAllRanges();
    if (end <= start) return;
    skipClick.current = true; // the click that follows this mouse-up shouldn't open the note
    onChange(
      { content: text, highlights: normalizeRanges([...dataRef.current.highlights, [start, end]], text.length) },
      true,
    );
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (!canEdit || isEditing || e.button !== 0) return;
    if (e.detail > 1) {
      e.preventDefault(); // stop double-click from selecting a word
      return;
    }
    skipClick.current = false;
    // Listen on the whole page so a drag that ends just outside the note still counts.
    document.addEventListener("mouseup", (up) => up.detail <= 1 && highlightSelection(), { once: true });
  };

  const onClick = (e: React.MouseEvent) => {
    if (!canEdit || isEditing) return;
    if (skipClick.current) {
      skipClick.current = false;
      return;
    }
    if (e.detail > 1) return;
    if ((e.target as HTMLElement).closest("mark")) {
      // Might be the first half of a double-click that removes this highlight.
      window.clearTimeout(clickTimer.current);
      clickTimer.current = window.setTimeout(startEditing, DOUBLE_CLICK_WAIT_MS);
    } else {
      startEditing();
    }
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    if (!canEdit || isEditing) return;
    window.clearTimeout(clickTimer.current);
    const mark = (e.target as HTMLElement).closest<HTMLElement>("mark[data-i]");
    if (!mark) return;
    const index = Number(mark.dataset.i);
    window.getSelection()?.removeAllRanges();
    onChange({ content: data.content, highlights: data.highlights.filter((_, i) => i !== index) }, true);
  };

  const onType = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value.slice(0, NOTE_MAX);
    const prev = dataRef.current;
    onChange({ content: next, highlights: shiftRanges(prev.highlights, prev.content, next) }, false);
  };

  const finishEditing = () => {
    setIsEditing(false);
    onEditEnd();
  };

  const marks = (textClass: string) =>
    parts.map((part, i) =>
      part.hi === -1 ? (
        <span key={i}>{part.text}</span>
      ) : (
        <mark
          key={i}
          data-i={part.hi}
          className={`rounded-[3px] [box-decoration-break:clone] ${textClass}`}
          style={{ backgroundColor: highlight }}
          title={canEdit && !isEditing ? "Double-click to remove highlight" : undefined}
        >
          {part.text}
        </mark>
      ),
    );

  return (
    <div className="relative pt-4">
      <div
        role={canEdit && !isEditing ? "button" : undefined}
        tabIndex={canEdit && !isEditing ? 0 : undefined}
        aria-label={canEdit && !isEditing ? `${name} sticky note. Click to edit.` : undefined}
        onMouseDown={onMouseDown}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onKeyDown={(e) => {
          if (!isEditing && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            startEditing();
          }
        }}
        className={`group relative h-[190px] border-2 border-[#2B2426] bg-[#FFFBF3] text-ink shadow-[8px_8px_0_#A6607A] ${
          canEdit && !isEditing ? "cursor-text" : ""
        }`}
      >
        <Tape color={tape} />

        {isEditing ? (
          <>
            {/* Highlight layer behind the transparent typing box, so highlights stay visible while editing. */}
            <div ref={backdropRef} aria-hidden="true" className={`absolute inset-0 overflow-hidden text-transparent ${TEXT_BOX}`}>
              {marks("text-transparent")}
              {"\n"}
            </div>
            <textarea
              ref={areaRef}
              value={data.content}
              maxLength={NOTE_MAX}
              onChange={onType}
              onBlur={finishEditing}
              onKeyDown={(e) => e.key === "Escape" && e.currentTarget.blur()}
              onScroll={(e) => {
                if (backdropRef.current) backdropRef.current.scrollTop = e.currentTarget.scrollTop;
              }}
              aria-label={`${name} sticky note`}
              spellCheck
              className={`absolute inset-0 resize-none bg-transparent text-ink caret-ink outline-none ${TEXT_BOX}`}
            />
            <span className="pointer-events-none absolute bottom-1 right-3 text-[11px] font-semibold text-[#A6607A]/80">
              {data.content.length}/{NOTE_MAX}
            </span>
          </>
        ) : (
          <>
            <div ref={textRef} className={TEXT_BOX}>
              {marks("text-ink")}
            </div>
            {canEdit && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 flex items-center justify-center font-display text-7xl font-semibold text-[#A6607A] opacity-0 transition-opacity duration-150 group-hover:opacity-35 group-focus-visible:opacity-35"
              >
                +
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** Washi tape across the top of a note, with zigzag torn ends. */
function Tape({ color }: { color: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 34"
      preserveAspectRatio="none"
      className="pointer-events-none absolute -top-4 left-1/2 z-10 h-8 w-[46%] -translate-x-1/2"
    >
      <path
        d="M5 2 H115 L109 7.5 L116 13 L109 18.5 L116 24 L109 29.5 L115 32 H5 L11 29.5 L4 24 L11 18.5 L4 13 L11 7.5 Z"
        fill={color}
        stroke="#4A2232"
        strokeWidth="1.6"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}
