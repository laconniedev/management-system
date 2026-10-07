import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/session";
import { Dashboard } from "./Dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: program } = await supabase
    .from("programs")
    .select("program_name")
    .eq("id", user.id)
    .maybeSingle();

  const cookieStore = await cookies();
  const startedAt = Number(cookieStore.get(SESSION_COOKIE)?.value) || Date.now();

  return (
    <Dashboard
      programId={user.id}
      programName={(program?.program_name as string | undefined) ?? "My program"}
      sessionEndsAt={startedAt + SESSION_MAX_AGE_SECONDS * 1000}
    />
  );
}
