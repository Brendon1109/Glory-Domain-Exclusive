"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Video, Music, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/bible", label: "Bible", icon: BookOpen },
  { href: "/teachings", label: "Teach", icon: Video },
  { href: "/worship", label: "Worship", icon: Music },
  { href: "/prayer", label: "Prayer", icon: Heart },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium",
                active ? "text-indigo-700" : "text-stone-500",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.9} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
