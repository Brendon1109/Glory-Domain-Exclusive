"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { dailyWords } from "@/db/schema";
import { isAdmin } from "@/lib/session";
import { dailyWordSchema } from "@/lib/validators";

type Result = { ok?: true; error?: string };

export async function createDailyWord(formData: FormData): Promise<Result> {
  if (!(await isAdmin())) return { error: "Not allowed." };
  const parsed = dailyWordSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  await db.insert(dailyWords).values({
    title: parsed.data.title?.trim() || null,
    body: parsed.data.body,
  });
  revalidatePath("/");
  revalidatePath("/admin/word");
  return { ok: true };
}

export async function deleteDailyWord(id: string): Promise<Result> {
  if (!(await isAdmin())) return { error: "Not allowed." };
  await db.delete(dailyWords).where(eq(dailyWords.id, id));
  revalidatePath("/");
  revalidatePath("/admin/word");
  return { ok: true };
}
