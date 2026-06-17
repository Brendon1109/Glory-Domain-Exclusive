import type { DailyWord } from "@/db/schema";
import { LocalDateTime } from "./local-datetime";

export function DailyWordCard({ word }: { word: DailyWord }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(20,18,15,0.03)]">
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-accent">
        Word for today
      </p>
      {word.title ? (
        <h3 className="mt-2 font-display text-xl font-semibold tracking-tight text-ink">
          {word.title}
        </h3>
      ) : null}
      <p className="mt-2 whitespace-pre-wrap leading-relaxed text-ink/90">
        {word.body}
      </p>
      <p className="mt-3 text-xs text-faint">
        <LocalDateTime iso={new Date(word.createdAt).toISOString()} mode="date" />
      </p>
    </div>
  );
}
