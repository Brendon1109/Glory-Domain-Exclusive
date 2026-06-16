"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Home" },
  { href: "/admin/teachings", label: "Teachings" },
  { href: "/admin/prayer", label: "Prayer" },
  { href: "/admin/worship", label: "Worship" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await fetch("/api/admin-auth", { method: "DELETE" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-bold text-stone-900">Pastor Admin</span>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-medium text-indigo-700">
            View app
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>
      <nav className="-mx-1 flex gap-1 overflow-x-auto pb-1">
        {links.map((l) => {
          const active =
            l.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-700 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200",
              )}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
