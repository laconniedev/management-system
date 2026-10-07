import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>;
}) {
  const { expired } = await searchParams;

  const supabase = await createClient();
  const { data } = await supabase.rpc("list_program_names");
  const programNames: string[] = ((data ?? []) as { program_name: string }[]).map((row) => row.program_name);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <LoginForm programNames={programNames} expired={expired === "1"} />
    </main>
  );
}
