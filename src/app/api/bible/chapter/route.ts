import { NextResponse, type NextRequest } from "next/server";
import { getChapter, isTranslation } from "@/lib/bible";
import { getBook } from "@/lib/bible-books";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const t = (sp.get("t") ?? "kjv").toLowerCase();
  const book = (sp.get("book") ?? "").toUpperCase();
  const ch = Number(sp.get("ch") ?? "1");

  if (!isTranslation(t)) {
    return NextResponse.json({ error: "Unknown translation" }, { status: 400 });
  }
  const meta = getBook(book);
  if (!meta || !Number.isInteger(ch) || ch < 1 || ch > meta.chapters) {
    return NextResponse.json({ error: "Unknown reference" }, { status: 400 });
  }

  const verses = await getChapter(t, book, ch);
  if (!verses) {
    return NextResponse.json(
      { error: "not_available", bookName: meta.name, chapter: ch },
      { status: 404 },
    );
  }

  return NextResponse.json(
    { translation: t, book, bookName: meta.name, chapter: ch, verses },
    { headers: { "Cache-Control": "public, max-age=31536000, immutable" } },
  );
}
