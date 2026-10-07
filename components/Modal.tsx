"use client";

import { useEffect, useRef } from "react";
import { SheepIcon } from "./Sheep";

/** Pop-up window that dims the page behind it. Closes on Escape, the X button, or a click outside. */
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#34506B]/45 p-0 sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-[2rem] border-4 border-white bg-white shadow-[0_10px_0_#A9D8E3] focus:outline-none sm:rounded-[2rem]"
      >
        <div className="flex items-center gap-2 border-b-2 border-sky px-5 py-4">
          <SheepIcon className="h-8 w-10 shrink-0" />
          <h2 className="min-w-0 flex-1 font-display text-lg font-semibold text-ink sm:text-xl">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-slate-400 hover:bg-sky hover:text-ink"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
