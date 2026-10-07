"use client";

import { useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";
import { longDateLabel } from "@/lib/dates";
import {
  BADGE_STYLES,
  DESCRIPTION_MAX,
  LESSON_TYPES,
  TITLE_MAX,
  badgeKey,
  type Item,
  type ItemKind,
  type LessonType,
} from "@/lib/items";
import { Description } from "./Description";
import { Modal } from "./Modal";

type View = { screen: "list" } | { screen: "form"; kind: ItemKind; editing?: Item };

const primaryButton =
  "rounded-2xl bg-primary px-4 py-2.5 font-display font-medium text-white shadow-[0_4px_0_#6FA3CC] transition hover:brightness-105 active:translate-y-0.5 active:shadow-[0_2px_0_#6FA3CC] disabled:opacity-60";
const secondaryButton =
  "rounded-2xl border-2 border-accent2 px-4 py-2 font-display font-medium text-teal transition hover:bg-sky";

export function DayDialog({
  dateKey,
  programId,
  items,
  onClose,
  onChanged,
}: {
  dateKey: string;
  programId: string;
  items: Item[];
  onClose: () => void;
  onChanged: () => void | Promise<void>;
}) {
  const [view, setView] = useState<View>({ screen: "list" });
  const title = `Edit ${longDateLabel(dateKey)}'s Events`;

  return (
    <Modal title={title} onClose={onClose}>
      {view.screen === "list" ? (
        <ItemList
          items={items}
          onAdd={(kind) => setView({ screen: "form", kind })}
          onEdit={(item) => setView({ screen: "form", kind: item.kind, editing: item })}
          onChanged={onChanged}
        />
      ) : (
        <ItemForm
          key={view.editing?.id ?? view.kind}
          kind={view.kind}
          editing={view.editing}
          dateKey={dateKey}
          programId={programId}
          onCancel={() => setView({ screen: "list" })}
          onSaved={async () => {
            await onChanged();
            setView({ screen: "list" });
          }}
        />
      )}
    </Modal>
  );
}

function ItemList({
  items,
  onAdd,
  onEdit,
  onChanged,
}: {
  items: Item[];
  onAdd: (kind: ItemKind) => void;
  onEdit: (item: Item) => void;
  onChanged: () => void | Promise<void>;
}) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const remove = async (id: string) => {
    setDeletingId(id);
    setError(null);
    const { error } = await getBrowserClient().from("items").delete().eq("id", id);
    setDeletingId(null);
    setConfirmingId(null);
    if (error) {
      setError("Couldn't delete that. Please try again.");
      return;
    }
    await onChanged();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => onAdd("lesson")} className={primaryButton}>
          + Add Lesson Plan
        </button>
        <button
          type="button"
          onClick={() => onAdd("event")}
          className="rounded-2xl bg-[#F49BB7] px-4 py-2.5 font-display font-medium text-white shadow-[0_4px_0_#D9789A] transition hover:brightness-105 active:translate-y-0.5 active:shadow-[0_2px_0_#D9789A]"
        >
          + Add Event
        </button>
      </div>

      {error && (
        <p className="rounded-2xl bg-[#FFE3EA] px-4 py-2 text-sm text-[#9E2F55]" role="alert">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <p className="rounded-2xl bg-sky px-4 py-6 text-center text-sm text-slate-500">
          Nothing planned for this day yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const key = badgeKey(item);
            const confirming = confirmingId === item.id;
            return (
              <li key={item.id} className="rounded-2xl border-2 border-sky p-3">
                <div className="mb-1 flex items-start gap-2">
                  <span className={`mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-xs font-bold ${BADGE_STYLES[key].chip}`}>
                    {key}
                  </span>
                  <h3 className="min-w-0 flex-1 break-words font-display text-base font-semibold text-ink">{item.title}</h3>
                </div>
                <Description text={item.description} />

                <div className="mt-3 flex items-center justify-end gap-2">
                  {confirming ? (
                    <>
                      <span className="mr-auto text-sm font-semibold text-[#9E2F55]">Are you sure?</span>
                      <button type="button" onClick={() => setConfirmingId(null)} className="rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-500 hover:bg-sky">
                        No
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === item.id}
                        onClick={() => remove(item.id)}
                        className="rounded-xl bg-[#E6719A] px-3 py-1.5 text-sm font-semibold text-white hover:brightness-105 disabled:opacity-60"
                      >
                        {deletingId === item.id ? "Deleting…" : "Yes, delete"}
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => onEdit(item)} className="rounded-xl px-3 py-1.5 text-sm font-semibold text-teal hover:bg-sky">
                        Edit
                      </button>
                      <button type="button" onClick={() => setConfirmingId(item.id)} className="rounded-xl px-3 py-1.5 text-sm font-semibold text-[#9E2F55] hover:bg-[#FFE3EA]">
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ItemForm({
  kind,
  editing,
  dateKey,
  programId,
  onCancel,
  onSaved,
}: {
  kind: ItemKind;
  editing?: Item;
  dateKey: string;
  programId: string;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const isLesson = kind === "lesson";
  const [lessonType, setLessonType] = useState<LessonType | null>(editing?.lesson_type ?? null);
  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLesson && !lessonType) return setError("Pick a lesson type.");
    if (!title.trim()) return setError("Add a title.");
    setError(null);
    setSaving(true);

    const fields = {
      kind,
      lesson_type: isLesson ? lessonType : null,
      title: title.trim(),
      description: description.trim(),
    };
    const supabase = getBrowserClient();

    if (editing) {
      const { data, error } = await supabase.from("items").update(fields).eq("id", editing.id).select("id");
      if (!error && (data ?? []).length === 0) {
        setSaving(false);
        return setError("Someone else deleted this item, so it can't be saved.");
      }
      if (error) {
        setSaving(false);
        return setError("Couldn't save. Please try again.");
      }
    } else {
      const { error } = await supabase.from("items").insert({ ...fields, program_id: programId, item_date: dateKey });
      if (error) {
        setSaving(false);
        return setError("Couldn't save. Please try again.");
      }
    }

    await onSaved();
  };

  const labelClass = "mb-1.5 block font-display text-sm font-medium text-teal";

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="font-display text-base font-semibold text-ink">
        {editing ? "Edit" : "Add"} {isLesson ? "lesson plan" : "event"}
      </p>

      {isLesson && (
        <fieldset>
          <legend className={labelClass}>Lesson type</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {LESSON_TYPES.map((type) => {
              const selected = lessonType === type;
              return (
                <label
                  key={type}
                  className={`cursor-pointer rounded-xl border-2 px-2 py-2 text-center text-sm font-bold transition ${
                    BADGE_STYLES[type].chip
                  } ${selected ? "ring-2 ring-offset-1 ring-[#5B95E0]" : "opacity-70 hover:opacity-100"}`}
                >
                  <input
                    type="radio"
                    name="lessonType"
                    value={type}
                    checked={selected}
                    onChange={() => setLessonType(type)}
                    className="sr-only"
                  />
                  {type}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <div>
        <label htmlFor="item-title" className={labelClass}>
          Title
        </label>
        <input
          id="item-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={TITLE_MAX}
          required
          autoFocus
          placeholder={isLesson ? "Type your lesson plan's title here" : "Type your event's title here"}
          className="w-full rounded-2xl border-2 border-accent2 px-4 py-2.5 text-base text-ink focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="item-description" className={labelClass}>
          Description
        </label>
        <textarea
          id="item-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={DESCRIPTION_MAX}
          rows={6}
          placeholder={isLesson ? "Description and materials needed\n- material\n- material" : "Details about the event"}
          className="w-full resize-y rounded-2xl border-2 border-accent2 px-4 py-2.5 text-base text-ink focus:border-primary focus:outline-none"
        />
        <p className="mt-1 text-xs text-slate-500">Start a line with &quot;-&quot; to make a bullet point.</p>
      </div>

      {error && (
        <p className="rounded-2xl bg-[#FFE3EA] px-4 py-2 text-sm text-[#9E2F55]" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className={`flex-1 ${secondaryButton}`}>
          Back
        </button>
        <button type="submit" disabled={saving} className={`flex-1 ${primaryButton}`}>
          {saving ? "Saving…" : "Submit"}
        </button>
      </div>
    </form>
  );
}
