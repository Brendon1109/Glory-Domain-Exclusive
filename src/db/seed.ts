import "../lib/load-env";

import { eq } from "drizzle-orm";
import { db } from "./index";
import { settings, worshipItems } from "./schema";
import { hashPasscode } from "../lib/auth";

const DEFAULT_PASSCODE = process.env.SEED_PASSCODE ?? "glory";

/**
 * Seeded worship items use YouTube *search* links so they always open to
 * relevant worship content even before the pastor curates real playlists.
 * The pastor can replace these (and paste real playlist/video links that embed
 * inline) from the admin Worship page.
 */
const WORSHIP_SEED = [
  { title: "Praise & Worship Songs", kind: "playlist", youtubeUrl: "https://www.youtube.com/results?search_query=praise+and+worship+songs", sortOrder: 1 },
  { title: "Gospel Worship Mix", kind: "playlist", youtubeUrl: "https://www.youtube.com/results?search_query=gospel+worship+music", sortOrder: 2 },
  { title: "Hillsong Worship", kind: "playlist", youtubeUrl: "https://www.youtube.com/results?search_query=hillsong+worship", sortOrder: 3 },
  { title: "Bethel Music Worship", kind: "playlist", youtubeUrl: "https://www.youtube.com/results?search_query=bethel+music+worship", sortOrder: 4 },
  { title: "Shona Gospel Worship", kind: "playlist", youtubeUrl: "https://www.youtube.com/results?search_query=shona+gospel+worship", sortOrder: 5 },
  { title: "African Gospel Praise", kind: "playlist", youtubeUrl: "https://www.youtube.com/results?search_query=african+gospel+praise", sortOrder: 6 },
  { title: "Soaking & Spontaneous Worship", kind: "playlist", youtubeUrl: "https://www.youtube.com/results?search_query=soaking+worship+instrumental", sortOrder: 7 },
  { title: "Classic Hymns of Faith", kind: "playlist", youtubeUrl: "https://www.youtube.com/results?search_query=classic+hymns", sortOrder: 8 },
];

async function main() {
  const existing = await db
    .select()
    .from(settings)
    .where(eq(settings.id, 1))
    .limit(1);

  if (existing.length === 0) {
    await db
      .insert(settings)
      .values({ id: 1, memberPasscodeHash: hashPasscode(DEFAULT_PASSCODE) });
    console.log(`Created settings row. Member passcode: "${DEFAULT_PASSCODE}"`);
  } else if (!existing[0].memberPasscodeHash) {
    await db
      .update(settings)
      .set({ memberPasscodeHash: hashPasscode(DEFAULT_PASSCODE) })
      .where(eq(settings.id, 1));
    console.log(`Set member passcode: "${DEFAULT_PASSCODE}"`);
  } else {
    console.log("Settings already configured; passcode left unchanged.");
  }

  const haveWorship = await db.select().from(worshipItems).limit(1);
  if (haveWorship.length === 0) {
    await db.insert(worshipItems).values(WORSHIP_SEED);
    console.log(`Seeded ${WORSHIP_SEED.length} worship items.`);
  } else {
    console.log("Worship items already present; skipping.");
  }

  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
