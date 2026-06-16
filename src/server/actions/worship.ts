"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { worshipItems } from "@/db/schema";
import { isAdmin } from "@/lib/session";
import { worshipSchema } from "@/lib/validators";

type Result = { ok?: true; error?: string };

export async function createWorshipItem(formData: FormData): Promise<Result> {
  if (!(await isAdmin())) return { error: "Not allowed." };
  const parsed = worshipSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    kind: String(formData.get("kind") ?? "playlist"),
    youtubeUrl: String(formData.get("youtubeUrl") ?? ""),
    sortOrder: formData.get("sortOrder") ?? 0,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  await db.insert(worshipItems).values({
    title: parsed.data.title,
    kind: parsed.data.kind,
    youtubeUrl: parsed.data.youtubeUrl,
    sortOrder: parsed.data.sortOrder ?? 0,
  });
  revalidatePath("/worship");
  revalidatePath("/admin/worship");
  return { ok: true };
}

export async function deleteWorshipItem(id: string): Promise<Result> {
  if (!(await isAdmin())) return { error: "Not allowed." };
  await db.delete(worshipItems).where(eq(worshipItems.id, id));
  revalidatePath("/worship");
  revalidatePath("/admin/worship");
  return { ok: true };
}
