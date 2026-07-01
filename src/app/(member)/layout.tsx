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
  const year = new Date().getFullYear();

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
      <main className="flex-1 px-4 pb-28 pt-4">
        {children}
        <footer className="mt-10 border-t border-line pt-5 text-center">
          <p className="text-xs text-faint">
            © {year} {name}
          </p>
          <p className="mt-1 text-xs font-medium tracking-wide text-muted">
            Developed by{" "}
            <a
              href="https://brendon-mapinda-portfolio.vercel.app/"
              target="_blank"
              rel="noopener"
              className="text-ink underline decoration-line underline-offset-4 transition-colors hover:text-accent"
            >
              Brendon
            </a>
            &trade;
          </p>
          <p className="mt-1 text-[0.7rem] text-faint">
            <a
              href="https://brendon-mapinda-portfolio.vercel.app/"
              target="_blank"
              rel="noopener"
              className="transition-colors hover:text-ink"
            >
              Portfolio
            </a>
            {" · "}
            <a
              href="https://www.linkedin.com/in/brendon-mapinda-20b6911a0/"
              target="_blank"
              rel="noopener"
              className="transition-colors hover:text-ink"
            >
              LinkedIn
            </a>
          </p>
        </footer>
      </main>
      <InstallPrompt />
      <BottomNav />
    </div>
  );
}
