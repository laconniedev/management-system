"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { SheepIcon } from "@/components/Sheep";
import { DIRECTOR_CODE_MIN, PASSWORD_MIN, PROGRAM_NAME_MAX } from "@/lib/limits";
import { createProgram, login, type AuthFormState } from "./actions";

type Mode = "login" | "create";

const inputClass =
  "w-full rounded-2xl border-2 border-accent2 bg-white px-4 py-3 text-base text-ink placeholder:text-slate-400 focus:border-primary focus:outline-none";
const labelClass = "mb-1.5 block font-display text-sm font-medium text-teal";

export function LoginForm({ programNames, expired }: { programNames: string[]; expired: boolean }) {
  const [mode, setMode] = useState<Mode>("login");
  const [programName, setProgramName] = useState("");
  const [loginState, loginAction, loginPending] = useActionState<AuthFormState, FormData>(login, undefined);
  const [createState, createAction, createPending] = useActionState<AuthFormState, FormData>(createProgram, undefined);

  const isLogin = mode === "login";
  const state = isLogin ? loginState : createState;
  const pending = isLogin ? loginPending : createPending;

  return (
    <div className="w-full max-w-md rounded-[2rem] border-4 border-white bg-white/95 p-6 shadow-[0_10px_0_#A9D8E3] sm:p-8">
      <div className="mb-6 flex flex-col items-center text-center">
        <SheepIcon className="mb-2 h-16 w-20" />
        <h1 className="font-display text-3xl font-semibold text-ink">Management System</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isLogin ? "Log in to your program's calendar" : "Set up a new program profile"}
        </p>
      </div>

      {expired && isLogin && !state?.error && (
        <p className="mb-4 rounded-2xl bg-accent1 px-4 py-3 text-sm text-[#7A5A00]" role="status">
          Your session ended after 2 days. Please log in again.
        </p>
      )}

      <form action={isLogin ? loginAction : createAction} className="space-y-4" key={mode}>
        <div>
          <label htmlFor="programName" className={labelClass}>
            Program name
          </label>
          <div className="flex gap-2">
            <input
              id="programName"
              name="programName"
              type="text"
              autoComplete="username"
              required
              maxLength={PROGRAM_NAME_MAX}
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              placeholder={isLogin ? "Your program's name" : "Choose a program name"}
              className={inputClass}
            />
            {isLogin && <ProgramPicker names={programNames} onPick={setProgramName} />}
          </div>
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
            minLength={isLogin ? undefined : PASSWORD_MIN}
            placeholder={isLogin ? "Program password" : `At least ${PASSWORD_MIN} characters`}
            className={inputClass}
          />
        </div>

        {!isLogin && (
          <div>
            <label htmlFor="confirmPassword" className={labelClass}>
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={PASSWORD_MIN}
              placeholder="Type it again"
              className={inputClass}
            />
          </div>
        )}

        {!isLogin && (
          <div className="space-y-3 rounded-2xl bg-accent1 p-4">
            <div>
              <label htmlFor="directorCode" className={labelClass}>
                Director code
              </label>
              <p className="mb-2 text-xs text-[#7A5A00]">
                Only the director should know this. It&apos;s needed to change the program password.
              </p>
              <input
                id="directorCode"
                name="directorCode"
                type="password"
                autoComplete="off"
                required
                minLength={DIRECTOR_CODE_MIN}
                placeholder={`At least ${DIRECTOR_CODE_MIN} characters`}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="confirmDirectorCode" className={labelClass}>
                Confirm director code
              </label>
              <input
                id="confirmDirectorCode"
                name="confirmDirectorCode"
                type="password"
                autoComplete="off"
                required
                minLength={DIRECTOR_CODE_MIN}
                placeholder="Type it again"
                className={inputClass}
              />
            </div>
          </div>
        )}

        {state?.error && (
          <p className="rounded-2xl bg-[#FFE3EA] px-4 py-3 text-sm text-[#9E2F55]" role="alert">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-2xl bg-primary px-4 py-3 font-display text-lg font-medium text-white shadow-[0_4px_0_#6FA3CC] transition hover:brightness-105 active:translate-y-0.5 active:shadow-[0_2px_0_#6FA3CC] disabled:opacity-60"
        >
          {isLogin ? (pending ? "Logging in…" : "Log in") : pending ? "Creating…" : "Create program"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        {isLogin ? "New program?" : "Already have a program?"}{" "}
        <button
          type="button"
          onClick={() => setMode(isLogin ? "create" : "login")}
          className="font-semibold text-teal underline-offset-2 hover:underline"
        >
          {isLogin ? "Create one" : "Log in instead"}
        </button>
      </p>
    </div>
  );
}

function ProgramPicker({ names, onPick }: { names: string[]; onPick: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Choose an existing program"
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-full w-14 items-center justify-center rounded-2xl border-2 border-accent2 bg-sky transition hover:border-primary hover:bg-accent2"
      >
        <SheepIcon className="h-8 w-10" />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Existing programs"
          className="absolute right-0 z-20 mt-2 max-h-64 w-64 overflow-y-auto rounded-2xl border-2 border-accent2 bg-white p-1.5 shadow-[0_6px_0_#A9D8E3]"
        >
          {names.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-500">No programs yet. Create one below.</li>
          ) : (
            names.map((name) => (
              <li key={name} role="option" aria-selected={false}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(name);
                    setOpen(false);
                    document.getElementById("password")?.focus();
                  }}
                  className="w-full truncate rounded-xl px-3 py-2 text-left text-sm text-ink hover:bg-sky"
                >
                  {name}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
