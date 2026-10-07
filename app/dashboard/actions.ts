"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PASSWORD_MIN, verifyDirectorCode } from "@/lib/program";
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

/** Changing the program password requires the director code, so regular staff can't do it. */
export async function changePassword(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const directorCode = String(formData.get("directorCode") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!directorCode) return { error: "Enter the director code." };
  if (next.length < PASSWORD_MIN) return { error: `New password must be at least ${PASSWORD_MIN} characters.` };
  if (next !== confirm) return { error: "The new passwords don't match." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session has ended. Please log in again." };

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return { error: "The app isn't fully set up yet." };
  }

  // Director codes live in a table only the server can read.
  const { data: secret, error: secretError } = await admin
    .from("program_secrets")
    .select("director_code_hash")
    .eq("program_id", user.id)
    .maybeSingle();
  if (secretError) {
    console.error("Director code lookup failed", secretError);
    return { error: "Couldn't change the password right now. Please try again." };
  }
  if (!secret) return { error: "This program doesn't have a director code set up. Contact the app admin." };
  if (!verifyDirectorCode(directorCode, secret.director_code_hash as string)) {
    return { error: "That director code is incorrect." };
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
