import { NextResponse, type NextRequest } from "next/server";
import { and, eq, lte } from "drizzle-orm";
import { db } from "@/db";
import { scheduledPushes } from "@/db/schema";
import { sendToAll } from "@/lib/push";

// Runs each morning (Vercel Cron from vercel.json, or the Worker's Cron
// Trigger in cloudflare-worker.ts, which calls this route with the same
// secret) and delivers any pushes the pastor queued after hours. Does NOT
// auto-send anything on its own.
//
// Fails closed. It used to check the secret only when CRON_SECRET was set,
// and it never was, so anyone could trigger a broadcast. Vercel Cron sends
// "Authorization: Bearer <CRON_SECRET>" on its own once the variable exists.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[push/daily] CRON_SECRET is not set, refusing to run.");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const due = await db
    .select()
    .from(scheduledPushes)
    .where(
      and(eq(scheduledPushes.sent, false), lte(scheduledPushes.scheduledFor, new Date())),
    );
  let sent = 0;
  for (const row of due) {
    const res = await sendToAll({ title: row.title, body: row.body, url: row.url });
    await db
      .update(scheduledPushes)
      .set({ sent: true })
      .where(eq(scheduledPushes.id, row.id));
    sent += res.sent ?? 0;
  }
  return NextResponse.json({ ok: true, delivered: due.length, sent });
}
