import Link from "next/link";
import { Settings as Cog } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { InstallPrompt } from "@/components/install-prompt";
import { getSettings } from "@/lib/settings";

// The member app is open (no passcode); keep it server-rendered per request so
// the daily verse, daily word and schedule stay fresh.
export const dynamic = "force-dynamic";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings().catch(() => null);
  const name = settings?.ministryName ?? "Glory Domain";

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-paper/85 px-4 py-3.5 backdrop-blur">
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-tight text-ink"
        >
          {name}
        </Link>
        <Link
          href="/admin"
          className="text-faint transition-colors hover:text-ink"
          aria-label="Admin"
        >
          <Cog className="h-5 w-5" />
        </Link>
      </header>
      <main className="flex-1 px-4 pb-28 pt-4">{children}</main>
      <InstallPrompt />
      <BottomNav />
    </div>
  );
}
