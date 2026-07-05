import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/session";
import { LoginForm } from "./login-form";

export default async function AdminLoginPage() {
  // Already signed in (e.g. the user refreshed after a login that did set the
  // cookie) — go straight to the dashboard instead of showing the form again.
  if (await isAdmin()) redirect("/admin");
  return <LoginForm />;
}
