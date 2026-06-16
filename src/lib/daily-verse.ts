import "server-only";
import versesData from "../../data/verses/daily-verses.json";
import { pickForDay } from "./daily";
import type { Settings } from "@/db/schema";

export type DailyVerse = { ref: string; text: string };

const verses = versesData as DailyVerse[];

type Override = Partial<
  Pick<
    Settings,
    "dailyVerseOverrideRef" | "dailyVerseOverrideText" | "dailyVerseOverrideDate"
  >
>;

/**
 * The verse for a given day. If the pastor set an override (and it has no date,
 * or its date matches today) that wins; otherwise a deterministic daily pick.
 */
export function getDailyVerse(date: Date, override?: Override): DailyVerse {
  const ref = override?.dailyVerseOverrideRef;
  const text = override?.dailyVerseOverrideText;
  if (ref && text) {
    const overrideDate = override?.dailyVerseOverrideDate;
    const today = date.toISOString().slice(0, 10);
    if (!overrideDate || overrideDate === today) {
      return { ref, text };
    }
  }
  return pickForDay(verses, date, 1)[0] ?? verses[0];
}
