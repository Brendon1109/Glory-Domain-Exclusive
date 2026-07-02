import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/session";
import { getLatestDailyWord } from "@/lib/queries";
import { db } from "@/db";
import { scheduledPushes } from "@/db/schema";
import {
  sendToAll,
  dailyPayloadFromWord,
  isDaytimeCAT,
  next7amUtc,
} from "@/lib/push";

// Pastor taps "Send to everyone":
//  - during the day (7am–8pm CAT) → send right away
//  - after hours (8pm–7am CAT)   → queue it to go out at 7am
export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  const word = await getLatestDailyWord();
  const payload = dailyPayloadFromWord(word);

  if (isDaytimeCAT()) {
    const res = await sendToAll(payload);
    return NextResponse.json({ ...res, mode: "sent" });
  }

  const when = next7amUtc();
  await db.insert(scheduledPushes).values({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/",
    scheduledFor: when,
  });
  return NextResponse.json({
    ok: true,
    mode: "scheduled",
    scheduledFor: when.toISOString(),
  });
}
