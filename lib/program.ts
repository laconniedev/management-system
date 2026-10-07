import { createHash } from "crypto";

/** Trim and collapse repeated spaces: "  Sunny   Kids " -> "Sunny Kids". */
export function normalizeProgramName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

/** Case-insensitive key used for uniqueness. Matches programs.program_key in the database. */
export function programKey(name: string): string {
  return normalizeProgramName(name).toLowerCase();
}

/**
 * Each program is one Supabase Auth account behind the scenes. Supabase Auth needs an
 * email, so we derive a stable, never-emailed address from the program name.
 */
export function programEmail(name: string): string {
  const hash = createHash("sha256").update(programKey(name)).digest("hex").slice(0, 32);
  return `program-${hash}@programs.management-system.local`;
}

export const PROGRAM_NAME_MIN = 2;
export const PROGRAM_NAME_MAX = 60;
export const PASSWORD_MIN = 8;
