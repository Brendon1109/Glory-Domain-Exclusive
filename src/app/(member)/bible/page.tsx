import Link from "next/link";
import { Search } from "lucide-react";
import { BOOKS, type BibleBook } from "@/lib/bible-books";
import { VerseJump } from "@/components/bible/verse-jump";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function BiblePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
          Holy Bible
        </h1>
        <Link
          href="/bible/search"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <Search className="h-4 w-4" /> Search
        </Link>
      </div>
      <p className="text-sm text-muted">
        King James, World English &amp; Shona (New Testament). Switch
        translation freely as you read.
      </p>
      <VerseJump />
      <BookGroup
        title="Old Testament"
        books={BOOKS.filter((b) => b.testament === "OT")}
      />
      <BookGroup
        title="New Testament"
        books={BOOKS.filter((b) => b.testament === "NT")}
      />
    </div>
  );
}

function BookGroup({ title, books }: { title: string; books: BibleBook[] }) {
  return (
    <section>
      <h2 className="eyebrow mb-2.5">{title}</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {books.map((b) => (
          <Link
            key={b.id}
            href={`/bible/${b.id}/1`}
            className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-stone-50"
          >
            {b.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
