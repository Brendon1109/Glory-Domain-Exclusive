"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { prayerRequests } from "@/db/schema";
import { isMember, isAdmin } from "@/lib/session";
import { prayerSchema } from "@/lib/validators";

type Result = { ok?: true; error?: string };

export async function createPrayerRequest(formData: FormData): Promise<Result> {
  if (!(await isMember())) return { error: "Please sign in first." };
  const parsed = prayerSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    body: String(formData.get("body") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const name = parsed.data.name?.trim() || "Anonymous";
  await db.insert(prayerRequests).values({ name, body: parsed.data.body });
  revalidatePath("/prayer");
  revalidatePath("/admin/prayer");
  return { ok: true };
}

export async function setPrayerStatus(
  id: string,
  status: "new" | "praying" | "answered",
): Promise<Result> {
  if (!(await isAdmin())) return { error: "Not allowed." };
  await db
    .update(prayerRequests)
    .set({ status, updatedAt: new Date() })
    .where(eq(prayerRequests.id, id));
  revalidatePath("/prayer");
  revalidatePath("/admin/prayer");
  return { ok: true };
}

export async function deletePrayerRequest(id: string): Promise<Result> {
  if (!(await isAdmin())) return { error: "Not allowed." };
  await db.delete(prayerRequests).where(eq(prayerRequests.id, id));
  revalidatePath("/prayer");
  revalidatePath("/admin/prayer");
  return { ok: true };
}
