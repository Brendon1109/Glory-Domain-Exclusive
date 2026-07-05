"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { teachings } from "@/db/schema";
import { isAdmin } from "@/lib/session";
import { teachingSchema } from "@/lib/validators";

type Result = { ok?: true; error?: string };

function parseScheduled(s?: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createTeaching(formData: FormData): Promise<Result> {
  if (!(await isAdmin())) return { error: "Not allowed." };
  const parsed = teachingSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    kind: String(formData.get("kind") ?? "live"),
    scheduledAt: String(formData.get("scheduledAt") ?? ""),
    recordingUrl: String(formData.get("recordingUrl") ?? ""),
    audioOnly:
      formData.get("audioOnly") === "on" ||
      formData.get("audioOnly") === "true",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const d = parsed.data;
  const isLive = d.kind === "live";
  await db.insert(teachings).values({
    title: d.title,
    description: d.description || null,
    kind: d.kind,
    // The admin form promises a blank date starts the session right away:
    // stamp "now" so the upcoming queries (gte on scheduledAt) and the
    // "Live now" badge treat it as a live session instead of dropping it.
    scheduledAt: isLive ? (parseScheduled(d.scheduledAt) ?? new Date()) : null,
    roomName: isLive ? `glory-${nanoid(12)}` : null,
    recordingUrl: d.recordingUrl ? d.recordingUrl : null,
    audioOnly: d.audioOnly ?? false,
  });
  revalidatePath("/");
  revalidatePath("/teachings");
  revalidatePath("/admin/teachings");
  return { ok: true };
}

export async function updateTeachingRecording(
  id: string,
  recordingUrl: string,
): Promise<Result> {
  if (!(await isAdmin())) return { error: "Not allowed." };
  await db
    .update(teachings)
    .set({ recordingUrl: recordingUrl.trim() || null })
    .where(eq(teachings.id, id));
  revalidatePath("/teachings");
  revalidatePath("/admin/teachings");
  return { ok: true };
}

export async function setTeachingMedia(
  id: string,
  mediaUrl: string,
  mediaKind: "audio" | "video",
): Promise<Result> {
  if (!(await isAdmin())) return { error: "Not allowed." };
  await db
    .update(teachings)
    .set({ mediaUrl, mediaKind })
    .where(eq(teachings.id, id));
  revalidatePath("/");
  revalidatePath("/teachings");
  revalidatePath("/admin/teachings");
  revalidatePath(`/teachings/${id}`);
  return { ok: true };
}

export async function clearTeachingMedia(id: string): Promise<Result> {
  if (!(await isAdmin())) return { error: "Not allowed." };
  await db
    .update(teachings)
    .set({ mediaUrl: null, mediaKind: null })
    .where(eq(teachings.id, id));
  revalidatePath("/teachings");
  revalidatePath("/admin/teachings");
  return { ok: true };
}

export async function deleteTeaching(id: string): Promise<Result> {
  if (!(await isAdmin())) return { error: "Not allowed." };
  await db.delete(teachings).where(eq(teachings.id, id));
  revalidatePath("/");
  revalidatePath("/teachings");
  revalidatePath("/admin/teachings");
  return { ok: true };
}
