import "server-only";
import { db } from "@/db";
import { settings, type Settings } from "@/db/schema";
import { eq } from "drizzle-orm";

/** Read the singleton settings row, creating defaults if it doesn't exist. */
export async function getSettings(): Promise<Settings> {
  const rows = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
  if (rows[0]) return rows[0];
  await db.insert(settings).values({ id: 1 }).onConflictDoNothing();
  const again = await db
    .select()
    .from(settings)
    .where(eq(settings.id, 1))
    .limit(1);
  return again[0];
}
