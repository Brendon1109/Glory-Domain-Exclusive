import "server-only";
import webpush from "web-push";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:admin@glorydomain.org";

let configured = false;
function ensure() {
  if (configured) return true;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export type PushPayload = { title: string; body: string; url?: string };

export function dailyPayloadFromWord(
  word: { title: string | null; body: string } | null,
): PushPayload {
  const title = word?.title?.trim() || "Glory Domain";
  return { title, body: "Tap to read today’s message.", url: "/" };
}

// Zimbabwe time (CAT = UTC+2, no daylight saving).
export function catHour(): number {
  return new Date(Date.now() + 2 * 3600 * 1000).getUTCHours();
}

// Members are notified during the day only (07:00–20:00 CAT).
export function isDaytimeCAT(): boolean {
  const h = catHour();
  return h >= 7 && h < 20;
}

// The next 07:00 CAT as a real UTC instant (today if before 7am, else tomorrow).
export function next7amUtc(): Date {
  const cat = new Date(Date.now() + 2 * 3600 * 1000);
  const dayOffset = cat.getUTCHours() >= 20 ? 1 : 0;
  const catSevenAm = Date.UTC(
    cat.getUTCFullYear(),
    cat.getUTCMonth(),
    cat.getUTCDate() + dayOffset,
    7,
    0,
    0,
  );
  return new Date(catSevenAm - 2 * 3600 * 1000);
}

export async function sendToAll(payload: PushPayload) {
  if (!ensure()) {
    return { ok: false as const, error: "not_configured", sent: 0, total: 0, removed: 0 };
  }
  const subs = await db.select().from(pushSubscriptions);
  const json = JSON.stringify(payload);
  const dead: string[] = [];
  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          json,
        );
        sent++;
      } catch (e: unknown) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) dead.push(s.endpoint);
      }
    }),
  );
  if (dead.length) {
    await db
      .delete(pushSubscriptions)
      .where(inArray(pushSubscriptions.endpoint, dead));
  }
  return { ok: true as const, sent, total: subs.length, removed: dead.length };
}
