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
