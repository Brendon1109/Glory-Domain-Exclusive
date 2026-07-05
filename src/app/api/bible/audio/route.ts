import { NextResponse, type NextRequest } from "next/server";
import { getBook } from "@/lib/bible-books";

/**
 * Human-narrated chapter audio from Faith Comes By Hearing's Bible Brain API
 * (free for ministry use — https://4.dbt.io/api_key/request).
 *
 * GET /api/bible/audio?t=kjv&book=JHN&ch=3          -> 302 to a signed MP3 URL
 * GET /api/bible/audio?t=kjv&book=JHN&ch=3&meta=1   -> { available: boolean }
 *
 * Without a BIBLE_BRAIN_KEY the route reports "not available" and the reader
 * falls back to on-device text-to-speech.
 */

const API = "https://4.dbt.io/api";
const TRANSLATIONS = new Set(["kjv", "web", "shona"]);

// Bible Brain bible IDs for the fixed English translations. Shona recordings
// vary by publisher, so that one is resolved by language search instead.
const BIBLE_IDS: Record<string, string> = { kjv: "ENGKJV", web: "ENGWEB" };

type Fileset = { id?: string; type?: string; size?: string };

async function dbt(
  path: string,
  params: Record<string, string> = {},
): Promise<unknown> {
  const url = new URL(API + path);
  url.searchParams.set("v", "4");
  url.searchParams.set("key", process.env.BIBLE_BRAIN_KEY ?? "");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { cache: "no-store" }).catch(() => null);
  if (!res || !res.ok) return null;
  return res.json().catch(() => null);
}

/** Filesets come grouped by storage bucket; flatten to one list. */
function extractFilesets(bible: unknown): Fileset[] {
  const groups =
    (bible as { filesets?: Record<string, Fileset[]> } | null)?.filesets ?? {};
  return Object.values(groups).flat();
}

/**
 * Choose the best audio fileset covering the given testament: plain narration
 * over dramatized, base MP3 filesets (no "-opus16" style suffix) first.
 */
function pickFileset(filesets: Fileset[], testament: "OT" | "NT"): string | null {
  const sizeOk = (size: string) =>
    size.startsWith("C") || size.startsWith(testament);
  const candidates = filesets.filter(
    (f) =>
      typeof f.id === "string" &&
      (f.type === "audio" || f.type === "audio_drama") &&
      sizeOk(String(f.size ?? "")),
  );
  const rank = (f: Fileset) =>
    (f.type === "audio" ? 0 : 1) + (String(f.id).includes("-") ? 2 : 0);
  candidates.sort((a, b) => rank(a) - rank(b));
  return (candidates[0]?.id as string) ?? null;
}

// Fileset lookups are stable; cache them for the life of the server instance.
const filesetCache = new Map<string, string | null>();

async function resolveFileset(
  translation: string,
  testament: "OT" | "NT",
): Promise<string | null> {
  const cacheKey = `${translation}:${testament}`;
  const cached = filesetCache.get(cacheKey);
  if (cached !== undefined) return cached;

  let fileset: string | null = null;
  if (BIBLE_IDS[translation]) {
    const d = (await dbt(`/bibles/${BIBLE_IDS[translation]}`)) as {
      data?: unknown;
    } | null;
    fileset = pickFileset(extractFilesets(d?.data), testament);
  } else if (translation === "shona") {
    const d = (await dbt("/bibles", {
      language_code: "SNA",
      media: "audio",
    })) as { data?: unknown[] } | null;
    for (const bible of d?.data ?? []) {
      fileset = pickFileset(extractFilesets(bible), testament);
      if (fileset) break;
    }
  }
  filesetCache.set(cacheKey, fileset);
  return fileset;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const t = (sp.get("t") ?? "").toLowerCase();
  const bookId = (sp.get("book") ?? "").toUpperCase();
  const ch = Number(sp.get("ch"));
  const wantsMeta = sp.get("meta") === "1";

  const book = getBook(bookId);
  if (
    !TRANSLATIONS.has(t) ||
    !book ||
    !Number.isInteger(ch) ||
    ch < 1 ||
    ch > book.chapters
  ) {
    return NextResponse.json({ available: false }, { status: 400 });
  }

  const unavailable = () =>
    wantsMeta
      ? NextResponse.json({ available: false })
      : NextResponse.json({ error: "No narration" }, { status: 404 });

  if (!process.env.BIBLE_BRAIN_KEY) return unavailable();

  const fileset = await resolveFileset(t, book.testament);
  if (!fileset) return unavailable();

  const d = (await dbt(`/bibles/filesets/${fileset}/${book.id}/${ch}`)) as {
    data?: { path?: string }[];
  } | null;
  const path = d?.data?.[0]?.path;
  if (typeof path !== "string" || !/^https?:\/\//.test(path)) {
    return unavailable();
  }

  if (wantsMeta) return NextResponse.json({ available: true });
  // Signed CDN URLs expire, so redirect fresh on every playback rather than
  // handing the client a URL to keep.
  return NextResponse.redirect(path, 302);
}
