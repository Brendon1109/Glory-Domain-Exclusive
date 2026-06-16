"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { isAdmin } from "@/lib/session";
import { settingsSchema, passcodeSchema } from "@/lib/validators";
import { hashPasscode } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

type Result = { ok?: true; error?: string };

export async function updateSettings(formData: FormData): Promise<Result> {
  if (!(await isAdmin())) return { error: "Not allowed." };
  const parsed = settingsSchema.safeParse({
    ministryName: String(formData.get("ministryName") ?? ""),
    whatsappChatUrl: String(formData.get("whatsappChatUrl") ?? ""),
    whatsappGroupUrl: String(formData.get("whatsappGroupUrl") ?? ""),
    dailyVerseOverrideRef: String(formData.get("dailyVerseOverrideRef") ?? ""),
    dailyVerseOverrideText: String(formData.get("dailyVerseOverrideText") ?? ""),
    dailyVerseOverrideDate: String(formData.get("dailyVerseOverrideDate") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  await getSettings(); // ensure the row exists
  const d = parsed.data;
  await db
    .update(settings)
    .set({
      ministryName: d.ministryName,
      whatsappChatUrl: d.whatsappChatUrl || "",
      whatsappGroupUrl: d.whatsappGroupUrl || null,
      dailyVerseOverrideRef: d.dailyVerseOverrideRef?.trim() || null,
      dailyVerseOverrideText: d.dailyVerseOverrideText?.trim() || null,
      dailyVerseOverrideDate: d.dailyVerseOverrideDate?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(settings.id, 1));
  revalidatePath("/");
  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function changePasscode(formData: FormData): Promise<Result> {
  if (!(await isAdmin())) return { error: "Not allowed." };
  const parsed = passcodeSchema.safeParse({
    newPasscode: String(formData.get("newPasscode") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid passcode." };
  }
  await getSettings();
  await db
    .update(settings)
    .set({
      memberPasscodeHash: hashPasscode(parsed.data.newPasscode),
      updatedAt: new Date(),
    })
    .where(eq(settings.id, 1));
  revalidatePath("/admin/settings");
  return { ok: true };
}
