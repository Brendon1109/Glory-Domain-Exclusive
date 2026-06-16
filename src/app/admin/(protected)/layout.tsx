import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/session";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdmin())) redirect("/admin/login");
  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-4 py-4">
      <AdminNav />
      <div className="mt-5">{children}</div>
    </div>
  );
}
