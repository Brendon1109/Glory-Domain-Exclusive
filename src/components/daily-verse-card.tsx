export function DailyVerseCard({
  verse,
  label = "Verse of the day",
}: {
  verse: { ref: string; text: string };
  label?: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-ink p-6 text-paper">
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-accent">
        {label}
      </p>
      <p className="mt-3 font-display text-xl leading-relaxed">
        &ldquo;{verse.text}&rdquo;
      </p>
      <div className="mt-4 flex items-center gap-3">
        <span className="h-px w-6 bg-accent/70" />
        <p className="text-sm font-medium tracking-wide text-paper/70">
          {verse.ref}
        </p>
      </div>
    </div>
  );
}
