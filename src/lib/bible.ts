import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { getBook } from "./bible-books";

export const TRANSLATIONS = [
  { id: "kjv", name: "KJV", full: "King James Version" },
  { id: "web", name: "WEB", full: "World English Bible" },
] as const;

export type TranslationId = (typeof TRANSLATIONS)[number]["id"];

export function isTranslation(t: string): t is TranslationId {
  return TRANSLATIONS.some((x) => x.id === t);
}

/**
 * data/bible/<id>.json shape (chapter-keyed so partial/sample data works):
 *   { translation: "KJV", books: { GEN: { "1": ["v1", "v2", ...], "2": [...] } } }
 */
type RawTranslation = {
  translation: string;
  books: Record<string, Record<string, string[]>>;
};

const cache = new Map<string, RawTranslation | null>();

async function loadTranslation(t: string): Promise<RawTranslation | null> {
  const key = t.toLowerCase();
  if (cache.has(key)) return cache.get(key)!;
  const file = path.join(process.cwd(), "data", "bible", `${key}.json`);
  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw) as RawTranslation;
    cache.set(key, parsed);
    return parsed;
  } catch {
    cache.set(key, null);
    return null;
  }
}

export type Verse = { n: number; t: string };

export async function getChapter(
  t: string,
  bookId: string,
  chapter: number,
): Promise<Verse[] | null> {
  const data = await loadTranslation(t);
  if (!data) return null;
  const book = data.books[bookId.toUpperCase()];
  if (!book) return null;
  const verses = book[String(chapter)];
  if (!verses) return null;
  return verses.map((text, i) => ({ n: i + 1, t: text }));
}

export type SearchHit = {
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
};

export async function searchBible(
  t: string,
  query: string,
  limit = 100,
): Promise<SearchHit[]> {
  const data = await loadTranslation(t);
  if (!data) return [];
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const results: SearchHit[] = [];
  for (const [bookId, chapters] of Object.entries(data.books)) {
    const meta = getBook(bookId);
    for (const [chStr, verses] of Object.entries(chapters)) {
      const chapter = Number(chStr);
      for (let v = 0; v < verses.length; v++) {
        if (verses[v].toLowerCase().includes(q)) {
          results.push({
            bookId,
            bookName: meta?.name ?? bookId,
            chapter,
            verse: v + 1,
            text: verses[v],
          });
          if (results.length >= limit) return results;
        }
      }
    }
  }
  return results;
}

/** Which book ids actually have data in the given translation (for the picker). */
export async function loadedBookIds(t: string): Promise<Set<string>> {
  const data = await loadTranslation(t);
  if (!data) return new Set();
  return new Set(Object.keys(data.books));
}
