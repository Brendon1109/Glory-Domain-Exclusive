import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { getCloudflareContext } from "@opennextjs/cloudflare/cloudflare-context";
import { getBook } from "./bible-books";

export const TRANSLATIONS = [
  { id: "kjv", name: "KJV", full: "King James Version" },
  { id: "web", name: "WEB", full: "World English Bible" },
  { id: "shona", name: "Shona", full: "Shona Bible (New Testament)" },
] as const;

export type TranslationId = (typeof TRANSLATIONS)[number]["id"];

export function isTranslation(t: string): t is TranslationId {
  return TRANSLATIONS.some((x) => x.id === t);
}

/**
 * The Bible is served from small generated files under public/bible-data
 * (scripts/split-bible.mjs, run before every dev and build), never from the
 * whole translation JSON, so a request only reads what it needs:
 *   chapters/<t>/<BOOK>/<n>.json  a JSON array of verse strings
 *   search/<t>/<nn>.txt           BOOK\tchapter\tverse\ttext lines
 *   manifest.json                 the books and search shards per translation
 *
 * On Cloudflare Workers there is no filesystem, so they are static assets
 * read through the ASSETS binding. On Vercel, next dev and next start they
 * are read from disk (traced into the functions in next.config.ts).
 */
type Manifest = {
  version: number;
  translations: Record<string, { books: string[]; shards: string[] }>;
};

type AssetsBinding = { fetch(input: URL | string): Promise<Response> };

function workersAssets(): AssetsBinding | null {
  try {
    const { env } = getCloudflareContext() as unknown as {
      env: { ASSETS?: AssetsBinding };
    };
    return env.ASSETS ?? null;
  } catch {
    // Not running on Workers.
    return null;
  }
}

/** Reads public/bible-data/<rel>. Null when the file does not exist. */
async function readBibleFile(rel: string): Promise<string | null> {
  const assets = workersAssets();
  if (assets) {
    // The host is not used by the binding, only the path.
    const res = await assets.fetch(new URL(`/bible-data/${rel}`, "https://assets.local"));
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Bible asset ${rel} answered ${res.status}`);
    return res.text();
  }
  try {
    // turbopackIgnore stops the bundler tracing all of public/bible-data into
    // every route that imports this file. next.config.ts traces exactly the
    // files each Bible route reads instead.
    return await fs.readFile(
      path.join(/* turbopackIgnore: true */ process.cwd(), "public", "bible-data", rel),
      "utf8",
    );
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
}

let manifest: Promise<Manifest | null> | undefined;

function loadManifest(): Promise<Manifest | null> {
  manifest ??= readBibleFile("manifest.json")
    .then((raw) => (raw ? (JSON.parse(raw) as Manifest) : null))
    .catch((e) => {
      manifest = undefined; // retry on the next request rather than caching a failure
      throw e;
    });
  return manifest;
}

async function translationEntry(t: string) {
  const m = await loadManifest();
  return m?.translations[t.toLowerCase()] ?? null;
}

export type Verse = { n: number; t: string };

export async function getChapter(
  t: string,
  bookId: string,
  chapter: number,
): Promise<Verse[] | null> {
  const entry = await translationEntry(t);
  const book = bookId.toUpperCase();
  if (!entry || !entry.books.includes(book)) return null;
  const raw = await readBibleFile(
    `chapters/${t.toLowerCase()}/${book}/${chapter}.json`,
  );
  if (!raw) return null;
  const verses = JSON.parse(raw) as string[];
  return verses.map((text, i) => ({ n: i + 1, t: text }));
}

export type SearchHit = {
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
};

type Shard = { raw: string; lower: string };

// Shards stay in memory so repeat searches in the same isolate skip the read
// and the lowercasing. A shard is about 0.5 MB and is held twice (original
// and lowercased), so eight of them, one whole translation, is about 8 MB,
// well inside a Worker's 128 MB.
const SHARD_CACHE_MAX = 8;
const shardCache = new Map<string, Shard>();

async function loadShard(t: string, name: string): Promise<Shard> {
  const key = `${t}/${name}`;
  const hit = shardCache.get(key);
  if (hit) {
    shardCache.delete(key);
    shardCache.set(key, hit);
    return hit;
  }
  const raw = await readBibleFile(`search/${key}`);
  if (raw === null) throw new Error(`Bible search shard ${key} is missing`);
  // split-bible.mjs refuses any verse whose lowercase changes length, so an
  // offset in `lower` is the same offset in `raw`.
  const shard = { raw, lower: raw.toLowerCase() };
  shardCache.set(key, shard);
  if (shardCache.size > SHARD_CACHE_MAX) {
    shardCache.delete(shardCache.keys().next().value!);
  }
  return shard;
}

// Longer than any verse, so pasting a whole verse still finds it.
const MAX_QUERY_LENGTH = 1000;

/**
 * Case insensitive substring search over the verse text, one hit per verse,
 * in canonical order, the same results the whole file search gave.
 *
 * CPU budget: each translation is split into shards of about 0.5 MB (8 for
 * KJV and WEB, 2 for Shona) read one at a time, stopping at `limit` hits, so
 * a common word is answered from the first shard. Matching is indexOf over
 * the lowercased shard text, and only a hit becomes an object. Measured on
 * KJV: a word with 100 hits about 2 ms, a miss that walks every shard about
 * 15 ms cold and about 1 ms once the shards are cached. The whole file parse
 * this replaces cost about 40 ms before any matching.
 */
export async function searchBible(
  t: string,
  query: string,
  limit = 100,
): Promise<SearchHit[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2 || q.length > MAX_QUERY_LENGTH) return [];
  const entry = await translationEntry(t);
  if (!entry) return [];
  const results: SearchHit[] = [];
  for (const name of entry.shards) {
    const { raw, lower } = await loadShard(t.toLowerCase(), name);
    let from = 0;
    while (results.length < limit) {
      const pos = lower.indexOf(q, from);
      if (pos === -1) break;
      // Each line is BOOK\tchapter\tverse\ttext.
      const start = lower.lastIndexOf("\n", pos) + 1;
      const nl = lower.indexOf("\n", pos);
      const end = nl === -1 ? lower.length : nl;
      const a = raw.indexOf("\t", start);
      const b = raw.indexOf("\t", a + 1);
      const c = raw.indexOf("\t", b + 1);
      if (pos > c && pos + q.length <= end) {
        const bookId = raw.slice(start, a);
        results.push({
          bookId,
          bookName: getBook(bookId)?.name ?? bookId,
          chapter: Number(raw.slice(a + 1, b)),
          verse: Number(raw.slice(b + 1, c)),
          text: raw.slice(c + 1, end),
        });
        from = end + 1; // one hit per verse
      } else {
        from = pos + 1; // matched the reference prefix or across a line
      }
    }
    if (results.length >= limit) break;
  }
  return results;
}

/** Which book ids actually have data in the given translation (for the picker). */
export async function loadedBookIds(t: string): Promise<Set<string>> {
  const entry = await translationEntry(t);
  return new Set(entry?.books ?? []);
}
