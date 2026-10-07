"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PASSWORD_MIN,
  PROGRAM_NAME_MAX,
  PROGRAM_NAME_MIN,
  normalizeProgramName,
  programEmail,
  programKey,
} from "@/lib/program";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/session";

export type AuthFormState = { error?: string } | undefined;

async function startSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, String(Date.now()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function login(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const name = normalizeProgramName(String(formData.get("programName") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (!name) return { error: "Enter your program name." };
  if (!password) return { error: "Enter your password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: programEmail(name), password });
  if (error) return { error: "That program name and password don't match. Please try again." };

  await startSession();
  redirect("/dashboard");
}

export async function createProgram(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const name = normalizeProgramName(String(formData.get("programName") ?? ""));
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (name.length < PROGRAM_NAME_MIN || name.length > PROGRAM_NAME_MAX) {
    return { error: `Program name must be ${PROGRAM_NAME_MIN} to ${PROGRAM_NAME_MAX} characters.` };
  }
  if (password.length < PASSWORD_MIN) {
    return { error: `Password must be at least ${PASSWORD_MIN} characters.` };
  }
  if (password !== confirm) return { error: "The two passwords don't match." };

  const takenError = { error: `"${name}" is already taken. Please choose a different program name.` };

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return { error: "The app isn't fully set up yet." };
  }

  const { data: existing, error: lookupError } = await admin
    .from("programs")
    .select("id")
    .eq("program_key", programKey(name))
    .maybeSingle();
  if (lookupError) {
    console.error("Program lookup failed", lookupError);
    return { error: "Couldn't create the program right now. Please try again." };
  }
  if (existing) return takenError;

  const email = programEmail(name);
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { program_name: name },
  });

  if (createError || !created.user) {
    if (createError?.code === "email_exists" || /already/i.test(createError?.message ?? "")) return takenError;
    if (createError?.code === "weak_password") return { error: createError.message };
    console.error("Create program user failed", createError);
    return { error: "Couldn't create the program right now. Please try again." };
  }

  const { error: insertError } = await admin.from("programs").insert({ id: created.user.id, program_name: name });
  if (insertError) {
    await admin.auth.admin.deleteUser(created.user.id);
    if (insertError.code === "23505") return takenError;
    console.error("Insert program failed", insertError);
    return { error: "Couldn't create the program right now. Please try again." };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) return { error: "Your program was created, but logging in failed. Please log in." };

  await startSession();
  redirect("/dashboard");
}
