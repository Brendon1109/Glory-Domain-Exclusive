import { z } from "zod";

const httpUrl = (msg: string) =>
  z
    .string()
    .trim()
    .refine((s) => /^https?:\/\/.+/i.test(s), msg);

// Allows empty string OR a valid http(s) URL.
const optionalUrl = z
  .string()
  .trim()
  .refine((s) => s === "" || /^https?:\/\/.+/i.test(s), "Enter a valid link (https://…)");

export const prayerSchema = z.object({
  name: z.string().trim().max(80).optional(),
  body: z.string().trim().min(3, "Please write your prayer request").max(2000),
});

export const teachingSchema = z.object({
  title: z.string().trim().min(2, "Add a title").max(160),
  description: z.string().trim().max(2000).optional(),
  kind: z.enum(["live", "recorded"]),
  scheduledAt: z.string().trim().optional(),
  recordingUrl: optionalUrl.optional(),
  audioOnly: z.boolean().optional(),
});

export const worshipSchema = z.object({
  title: z.string().trim().min(2, "Add a title").max(160),
  kind: z.enum(["song", "album", "playlist"]),
  youtubeUrl: httpUrl("Enter a valid YouTube link"),
  sortOrder: z.coerce.number().int().optional(),
});

export const settingsSchema = z.object({
  ministryName: z.string().trim().min(1).max(80),
  whatsappChatUrl: optionalUrl,
  whatsappGroupUrl: optionalUrl,
  dailyVerseOverrideRef: z.string().trim().max(80).optional(),
  dailyVerseOverrideText: z.string().trim().max(1000).optional(),
  dailyVerseOverrideDate: z.string().trim().optional(),
});

export const passcodeSchema = z.object({
  newPasscode: z.string().trim().min(4, "Use at least 4 characters").max(60),
});
