import Link from "next/link";
import { BookOpen, Video, Heart, type LucideIcon } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { getDailyVerse } from "@/lib/daily-verse";
import { getNextTeaching, getWorshipItems } from "@/lib/queries";
import { pickForDay } from "@/lib/daily";
import { DailyVerseCard } from "@/components/daily-verse-card";
import { TeachingCard } from "@/components/teaching-card";
import { WhatsappButtons } from "@/components/whatsapp-buttons";
import { WorshipCard } from "@/components/worship-card";
import { Card, CardContent } from "@/components/ui/card";

export default async function HomePage() {
  const settings = await getSettings();
  const today = new Date();
  const verse = getDailyVerse(today, settings);
  const [next, worship] = await Promise.all([
    getNextTeaching(),
    getWorshipItems(),
  ]);
  const todaysWorship = pickForDay(worship, today, 1)[0] ?? null;

  return (
    <div className="space-y-6">
      <DailyVerseCard verse={verse} />

      <section>
        <SectionTitle>Next teaching</SectionTitle>
        {next ? (
          <TeachingCard teaching={next} context="upcoming" />
        ) : (
          <Card>
            <CardContent className="text-sm text-stone-500">
              No teaching is scheduled yet. Check back soon — or watch a past
              teaching in the library.
            </CardContent>
          </Card>
        )}
      </section>

      <section className="grid grid-cols-3 gap-3">
        <QuickLink href="/bible" icon={BookOpen} label="Bible" />
        <QuickLink href="/teachings" icon={Video} label="Teachings" />
        <QuickLink href="/prayer" icon={Heart} label="Prayer" />
      </section>

      {todaysWorship ? (
        <section>
          <SectionTitle>Today&apos;s worship</SectionTitle>
          <WorshipCard item={todaysWorship} />
          <Link
            href="/worship"
            className="mt-2 inline-block text-sm font-medium text-indigo-700"
          >
            More praise &amp; worship →
          </Link>
        </section>
      ) : null}

      <section>
        <SectionTitle>Stay connected</SectionTitle>
        <WhatsappButtons
          chatUrl={settings.whatsappChatUrl}
          groupUrl={settings.whatsappGroupUrl}
        />
      </section>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
      {children}
    </h2>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-2xl border border-stone-200 bg-white p-4 text-center shadow-sm transition-colors hover:bg-stone-50"
    >
      <Icon className="h-6 w-6 text-indigo-700" />
      <span className="text-sm font-medium text-stone-700">{label}</span>
    </Link>
  );
}
