import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  date,
} from "drizzle-orm/pg-core";

/**
 * One table powers both the upcoming schedule and the recorded library.
 *  - kind="live"     => a scheduled teaching with a Jitsi room (Join)
 *  - recordingUrl set => appears in the Library (Replay)
 * A finished live teaching simply gets recordingUrl filled in.
 */
export const teachings = pgTable("teachings", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  kind: text("kind").notNull().default("live"), // 'live' | 'recorded'
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  roomName: text("room_name"),
  recordingUrl: text("recording_url"),
  audioOnly: boolean("audio_only").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const prayerRequests = pgTable("prayer_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().default("Anonymous"),
  body: text("body").notNull(),
  status: text("status").notNull().default("new"), // 'new' | 'praying' | 'answered'
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** A short text teaching / devotional the pastor posts; the latest shows to all members. */
export const dailyWords = pgTable("daily_words", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title"),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const worshipItems = pgTable("worship_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  kind: text("kind").notNull().default("playlist"), // 'song' | 'album' | 'playlist'
  youtubeUrl: text("youtube_url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Singleton settings row (id = 1). */
export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  ministryName: text("ministry_name").notNull().default("Glory Domain"),
  // Hash of the shared member passcode (rotatable from the admin settings page).
  memberPasscodeHash: text("member_passcode_hash"),
  whatsappChatUrl: text("whatsapp_chat_url")
    .notNull()
    .default("https://wa.me/263716976332"),
  whatsappGroupUrl: text("whatsapp_group_url"),
  // Optional pastor override for the daily verse (applies on the given date).
  dailyVerseOverrideRef: text("daily_verse_override_ref"),
  dailyVerseOverrideText: text("daily_verse_override_text"),
  dailyVerseOverrideDate: date("daily_verse_override_date"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Teaching = typeof teachings.$inferSelect;
export type NewTeaching = typeof teachings.$inferInsert;
export type DailyWord = typeof dailyWords.$inferSelect;
export type PrayerRequest = typeof prayerRequests.$inferSelect;
export type WorshipItem = typeof worshipItems.$inferSelect;
export type Settings = typeof settings.$inferSelect;
