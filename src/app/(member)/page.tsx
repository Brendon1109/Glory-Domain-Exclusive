import Link from "next/link";
import { BookOpen, Video, Heart, type LucideIcon } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { getDailyVerse } from "@/lib/daily-verse";
import {
  getNextTeaching,
  getWorshipItems,
  getLatestDailyWord,
} from "@/lib/queries";
import { pickForDay } from "@/lib/daily";
import { DailyVerseCard } from "@/components/daily-verse-card";
import { DailyWordCard } from "@/components/daily-word-card";
import { TeachingCard } from "@/components/teaching-card";
import { WhatsappButtons } from "@/components/whatsapp-buttons";
import { NotifyButton } from "@/components/notify-button";
import { WorshipCard } from "@/components/worship-card";
import { Card, CardContent } from "@/components/ui/card";

export default async function HomePage() {
  const settings = await getSettings();
  const today = new Date();
  const verse = getDailyVerse(today, settings);
  const [next, worship, word] = await Promise.all([
    getNextTeaching(),
    getWorshipItems(),
    getLatestDailyWord(),
  ]);
  const todaysWorship = pickForDay(worship, today, 1)[0] ?? null;

  return (
    <div className="space-y-7">
      <DailyVerseCard verse={verse} />

      {word ? <DailyWordCard word={word} /> : null}

      <section>
        <h2 className="eyebrow mb-2.5">Next teaching</h2>
        {next ? (
          <TeachingCard teaching={next} context="upcoming" />
        ) : (
          <Card>
            <CardContent className="text-sm text-muted">
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
          <h2 className="eyebrow mb-2.5">Today&apos;s worship</h2>
          <WorshipCard item={todaysWorship} />
          <Link
            href="/worship"
            className="mt-3 inline-block text-sm font-medium text-ink underline decoration-line underline-offset-4"
          >
            More praise &amp; worship
          </Link>
        </section>
      ) : null}

      <section>
        <h2 className="eyebrow mb-2.5">Stay connected</h2>
        <WhatsappButtons
          chatUrl={settings.whatsappChatUrl}
          groupUrl={settings.whatsappGroupUrl}
        />
        <div className="mt-2">
          <NotifyButton />
        </div>
      </section>
    </div>
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
      className="flex flex-col items-center gap-2 rounded-xl border border-line bg-surface p-4 text-center transition-colors hover:bg-stone-50"
    >
      <Icon className="h-6 w-6 text-accent" strokeWidth={1.7} />
      <span className="text-sm font-medium text-ink">{label}</span>
    </Link>
  );
}
