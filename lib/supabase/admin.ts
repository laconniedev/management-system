import { createClient } from "@supabase/supabase-js";

/**
 * Server-only client using the secret key. Bypasses row level security, so only use it
 * inside Server Actions for creating programs and changing passwords. Never import it
 * into a client component.
 */
export function createAdminClient() {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) {
    throw new Error("SUPABASE_SECRET_KEY is missing from .env.local");
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** A throwaway client that doesn't touch cookies. Used to check a password without changing the current session. */
export function createVerifierClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
