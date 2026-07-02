import { NextResponse, type NextRequest } from "next/server";
import { getLatestDailyWord } from "@/lib/queries";
import { sendToAll, dailyPayloadFromWord } from "@/lib/push";

// Runs from Vercel Cron each morning. Sends the latest daily message only if it
// was posted recently (so an old message isn't re-broadcast on a quiet day).
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const word = await getLatestDailyWord();
  if (!word || Date.now() - new Date(word.createdAt).getTime() > 26 * 3600 * 1000) {
    return NextResponse.json({ ok: true, skipped: true });
  }
  const res = await sendToAll(dailyPayloadFromWord(word));
  return NextResponse.json(res);
}
