"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { BOOKS, getBook, bookIndex } from "@/lib/bible-books";
import { cn } from "@/lib/utils";

type Verse = { n: number; t: string };
const TRANS = [
  { id: "kjv", name: "KJV" },
  { id: "web", name: "WEB" },
];

export function ChapterReader({
  bookId,
  chapter,
}: {
  bookId: string;
  chapter: number;
}) {
  const meta = getBook(bookId)!;
  const [translation, setTranslation] = useState("kjv");
  const [verses, setVerses] = useState<Verse[] | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "unavailable" | "error">(
    "loading",
  );

  useEffect(() => {
    const saved = localStorage.getItem("gd_translation");
    if (saved === "kjv" || saved === "web") setTranslation(saved);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    setVerses(null);
    fetch(`/api/bible/chapter?t=${translation}&book=${bookId}&ch=${chapter}`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.ok) {
          const d = await res.json();
          setVerses(d.verses);
          setState("ok");
        } else if (res.status === 404) {
          setState("unavailable");
        } else {
          setState("error");
        }
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [translation, bookId, chapter]);

  function changeTranslation(t: string) {
    localStorage.setItem("gd_translation", t);
    setTranslation(t);
  }

  const idx = bookIndex(bookId);
  const prev =
    chapter > 1
      ? `/bible/${bookId}/${chapter - 1}`
      : idx > 0
        ? `/bible/${BOOKS[idx - 1].id}/${BOOKS[idx - 1].chapters}`
        : null;
  const next =
    chapter < meta.chapters
      ? `/bible/${bookId}/${chapter + 1}`
      : idx < BOOKS.length - 1
        ? `/bible/${BOOKS[idx + 1].id}/1`
        : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/bible"
          className="text-sm text-stone-500 hover:text-stone-800"
        >
          All books
        </Link>
        <div className="flex rounded-lg bg-stone-100 p-0.5">
          {TRANS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => changeTranslation(t.id)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
                translation === t.id
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-stone-500",
              )}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <h1 className="text-2xl font-bold text-stone-900">
        {meta.name} {chapter}
      </h1>

      {state === "loading" ? (
        <div className="flex justify-center py-12 text-stone-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : null}

      {state === "ok" && verses ? (
        <div className="space-y-2 text-[1.05rem] leading-relaxed text-stone-800">
          {verses.map((v) => (
            <p key={v.n}>
              <sup className="mr-1 align-super text-xs font-bold text-indigo-600">
                {v.n}
              </sup>
              {v.t}
            </p>
          ))}
        </div>
      ) : null}

      {state === "unavailable" ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          This chapter isn&apos;t loaded yet. The full Bible is added with the
          one-time import (<code className="font-mono">npm run bible:fetch</code>
          ). Psalm 23 and Psalm 117 are available in this preview.
        </div>
      ) : null}

      {state === "error" ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Couldn&apos;t load this chapter. Please check your connection and try
          again.
        </div>
      ) : null}

      <div className="flex items-center justify-between border-t border-stone-200 pt-3">
        {prev ? (
          <Link
            href={prev}
            className="inline-flex items-center text-sm font-medium text-indigo-700"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={next}
            className="inline-flex items-center text-sm font-medium text-indigo-700"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
