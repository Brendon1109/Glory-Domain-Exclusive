import { Sparkles } from "lucide-react";

export function DailyVerseCard({
  verse,
  label = "Verse of the day",
}: {
  verse: { ref: string; text: string };
  label?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-700 to-violet-800 p-5 text-white shadow-md">
      <div className="mb-2 flex items-center gap-2 text-amber-300">
        <Sparkles className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-lg leading-relaxed">&ldquo;{verse.text}&rdquo;</p>
      <p className="mt-3 text-sm font-medium text-indigo-100">{verse.ref}</p>
    </div>
  );
}
