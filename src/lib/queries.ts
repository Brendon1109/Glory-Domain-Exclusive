import "server-only";
import { and, asc, desc, eq, gte, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { teachings, prayerRequests, worshipItems } from "@/db/schema";

const LIVE_GRACE_MS = 2 * 60 * 60 * 1000; // keep a just-started teaching visible

export async function getUpcomingTeachings() {
  const cutoff = new Date(Date.now() - LIVE_GRACE_MS);
  return db
    .select()
    .from(teachings)
    .where(and(eq(teachings.kind, "live"), gte(teachings.scheduledAt, cutoff)))
    .orderBy(asc(teachings.scheduledAt));
}

export async function getNextTeaching() {
  const rows = await getUpcomingTeachings();
  return rows[0] ?? null;
}

export async function getRecordedTeachings() {
  return db
    .select()
    .from(teachings)
    .where(isNotNull(teachings.recordingUrl))
    .orderBy(desc(teachings.createdAt));
}

export async function getTeaching(id: string) {
  const rows = await db
    .select()
    .from(teachings)
    .where(eq(teachings.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getAllTeachings() {
  return db.select().from(teachings).orderBy(desc(teachings.createdAt));
}

export async function getWorshipItems() {
  return db
    .select()
    .from(worshipItems)
    .orderBy(asc(worshipItems.sortOrder), asc(worshipItems.createdAt));
}

export async function getPrayerRequests() {
  return db
    .select()
    .from(prayerRequests)
    .orderBy(desc(prayerRequests.createdAt));
}
