import Link from "next/link";
import { Search } from "lucide-react";
import { BOOKS, type BibleBook } from "@/lib/bible-books";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function BiblePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-stone-900">Holy Bible</h1>
        <Link
          href="/bible/search"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <Search className="h-4 w-4" /> Search
        </Link>
      </div>
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
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {books.map((b) => (
          <Link
            key={b.id}
            href={`/bible/${b.id}/1`}
            className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
          >
            {b.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
