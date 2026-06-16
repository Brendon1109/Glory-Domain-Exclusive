import { notFound } from "next/navigation";
import { getBook } from "@/lib/bible-books";
import { ChapterReader } from "@/components/bible/chapter-reader";

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ book: string; chapter: string }>;
}) {
  const { book, chapter } = await params;
  const meta = getBook(book);
  const ch = Number(chapter);
  if (!meta || !Number.isInteger(ch) || ch < 1 || ch > meta.chapters) {
    notFound();
  }
  return <ChapterReader bookId={meta.id} chapter={ch} />;
}
