import { redirect } from "next/navigation";

// Middleware sends logged-in programs to /dashboard before this runs.
export default function Home() {
  redirect("/login");
}
