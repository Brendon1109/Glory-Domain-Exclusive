"use client";
import { useState } from "react";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Hit = {
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
};
const TRANS = [
  { id: "kjv", name: "KJV" },
  { id: "web", name: "WEB" },
  { id: "shona", name: "Shona" },
];

export default function BibleSearchPage() {
  const [q, setQ] = useState("");
  const [t, setT] = useState("kjv");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim().length < 2) return;
    setLoading(true);
    const res = await fetch(
      `/api/bible/search?t=${t}&q=${encodeURIComponent(q.trim())}`,
    );
    const d = await res.json().catch(() => ({ results: [] }));
    setHits(d.results ?? []);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
        Search the Bible
      </h1>
      <form onSubmit={run} className="space-y-2">
        <div className="flex gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search a word or phrase…"
          />
          <Button type="submit" size="icon" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="flex w-fit rounded-lg bg-stone-100 p-0.5">
          {TRANS.map((x) => (
            <button
              type="button"
              key={x.id}
              onClick={() => setT(x.id)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
                t === x.id ? "bg-surface text-ink shadow-sm" : "text-faint",
              )}
            >
              {x.name}
            </button>
          ))}
        </div>
      </form>

      {hits ? (
        <p className="text-sm text-muted">
          {hits.length} result{hits.length !== 1 ? "s" : ""}
          {hits.length >= 100 ? "+" : ""}
        </p>
      ) : null}

      <div className="space-y-2">
        {hits?.map((h, i) => (
          <Link
            key={i}
            href={`/bible/${h.bookId}/${h.chapter}`}
            className="block rounded-xl border border-line bg-surface p-3 transition-colors hover:bg-stone-50"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              {h.bookName} {h.chapter}:{h.verse}
            </p>
            <p className="mt-0.5 font-display text-[0.95rem] text-ink">
              {h.text}
            </p>
          </Link>
        ))}
      </div>

      {hits && hits.length === 0 ? (
        <p className="text-sm text-muted">
          No matches found. (The Shona text covers the New Testament only.)
        </p>
      ) : null}
    </div>
  );
}
