"use client";

import { useCallback, useEffect, useState } from "react";
import { SheepIcon } from "@/components/Sheep";
import { Calendar } from "@/components/Calendar";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { StickyNotes } from "@/components/StickyNotes";
import { logout } from "./actions";

export function Dashboard({
  programId,
  programName,
  sessionEndsAt,
}: {
  programId: string;
  programName: string;
  sessionEndsAt: number;
}) {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [shownMonth, setShownMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const onViewChange = useCallback(
    (year: number, month: number) =>
      setShownMonth((prev) => (prev.year === year && prev.month === month ? prev : { year, month })),
    [],
  );

  useEffect(() => {
    const msLeft = sessionEndsAt - Date.now();
    if (msLeft <= 0) {
      window.location.href = "/login?expired=1";
      return;
    }
    const timer = window.setTimeout(
      () => (window.location.href = "/login?expired=1"),
      Math.min(msLeft + 1000, 2_147_483_000),
    );
    return () => window.clearTimeout(timer);
  }, [sessionEndsAt]);

  const headerButton =
    "rounded-full border-2 border-white bg-white/80 px-3 py-1.5 text-sm font-semibold text-teal shadow-[0_3px_0_#A9D8E3] transition hover:bg-white sm:px-4";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b-2 border-white/70 bg-sky/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <SheepIcon className="h-9 w-11 shrink-0" />
            <h1 className="truncate font-display text-xl font-semibold text-ink sm:text-2xl">{programName}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={() => setShowChangePassword(true)} className={headerButton}>
              <span className="sm:hidden">Password</span>
              <span className="hidden sm:inline">Change password</span>
            </button>
            <form action={logout}>
              <button type="submit" className={headerButton}>
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* "relative" lets the sticky notes sit beside the calendar on wide screens without moving it. */}
      <main className="relative mx-auto max-w-6xl px-2 py-4 sm:px-6 sm:py-8">
        <Calendar programId={programId} onViewChange={onViewChange} />
        <StickyNotes programId={programId} year={shownMonth.year} month={shownMonth.month} />
      </main>

      {showChangePassword && <ChangePasswordDialog onClose={() => setShowChangePassword(false)} />}
    </div>
  );
}
