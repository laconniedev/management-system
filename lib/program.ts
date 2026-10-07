// Server-only helpers (uses Node's crypto). Browser code should import from lib/limits.ts instead.
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";

export { PROGRAM_NAME_MIN, PROGRAM_NAME_MAX, PASSWORD_MIN, DIRECTOR_CODE_MIN } from "./limits";

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

/** Scramble a director code for storage. The original code can't be recovered from the result. */
export function hashDirectorCode(code: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(code, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/** Check a typed director code against the stored scrambled version. */
export function verifyDirectorCode(code: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(code, salt, expected.length);
  return timingSafeEqual(expected, actual);
}
