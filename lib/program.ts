import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";

export { PROGRAM_NAME_MIN, PROGRAM_NAME_MAX, PASSWORD_MIN, DIRECTOR_CODE_MIN } from "./limits";

export function normalizeProgramName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

/** Case-insensitive key used for uniqueness. Matches programs.program_key in the database. */
export function programKey(name: string): string {
  return normalizeProgramName(name).toLowerCase();
}

export function programEmail(name: string): string {
  const hash = createHash("sha256").update(programKey(name)).digest("hex").slice(0, 32);
  return `program-${hash}@programs.management-system.local`;
}

export function hashDirectorCode(code: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(code, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyDirectorCode(code: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(code, salt, expected.length);
  return timingSafeEqual(expected, actual);
}
