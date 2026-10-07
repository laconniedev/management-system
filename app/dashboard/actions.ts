"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, createVerifierClient } from "@/lib/supabase/admin";
import { PASSWORD_MIN } from "@/lib/program";
import { SESSION_COOKIE } from "@/lib/session";

/** Logs out this browser only. Other staff on the same program stay logged in. */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}

export type ChangePasswordState = { error?: string; success?: boolean } | undefined;

export async function changePassword(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!current) return { error: "Enter your current password." };
  if (next.length < PASSWORD_MIN) return { error: `New password must be at least ${PASSWORD_MIN} characters.` };
  if (next !== confirm) return { error: "The new passwords don't match." };
  if (next === current) return { error: "The new password is the same as the current one." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Your session has ended. Please log in again." };

  // Check the current password without touching this browser's session.
  const verifier = createVerifierClient();
  const { error: verifyError } = await verifier.auth.signInWithPassword({ email: user.email, password: current });
  if (verifyError) return { error: "Your current password is incorrect." };

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return { error: "The app isn't fully set up yet: the Supabase secret key is missing from .env.local." };
  }

  // Admin update keeps everyone who is already logged in signed in.
  const { error } = await admin.auth.admin.updateUserById(user.id, { password: next });
  if (error) {
    if (error.code === "weak_password") return { error: error.message };
    console.error("Change password failed", error);
    return { error: "Couldn't change the password right now. Please try again." };
  }

  return { success: true };
}
