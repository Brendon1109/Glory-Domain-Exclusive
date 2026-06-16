import { NextResponse, type NextRequest } from "next/server";
import { searchBible, isTranslation } from "@/lib/bible";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const t = (sp.get("t") ?? "kjv").toLowerCase();
  const q = sp.get("q") ?? "";

  if (!isTranslation(t)) {
    return NextResponse.json({ error: "Unknown translation" }, { status: 400 });
  }

  const results = await searchBible(t, q, 100);
  return NextResponse.json(
    { query: q, translation: t, results },
    { headers: { "Cache-Control": "public, max-age=600" } },
  );
}
