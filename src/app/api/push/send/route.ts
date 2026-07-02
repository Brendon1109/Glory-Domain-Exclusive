import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/session";
import { getLatestDailyWord } from "@/lib/queries";
import { sendToAll, dailyPayloadFromWord } from "@/lib/push";

// Manual "Notify everyone" from the admin — sends the latest daily message.
export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  const word = await getLatestDailyWord();
  const res = await sendToAll(dailyPayloadFromWord(word));
  return NextResponse.json(res);
}
