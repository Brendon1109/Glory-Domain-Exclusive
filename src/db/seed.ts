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
  { title: "Who You Say I Am — Hillsong Worship", kind: "song", youtubeUrl: "https://www.youtube.com/watch?v=lKw6uqtGFfo", sortOrder: 1 },
  { title: "Jireh — Elevation Worship & Maverick City", kind: "song", youtubeUrl: "https://www.youtube.com/watch?v=mC-zw0zCCtg", sortOrder: 2 },
  { title: "Holy Forever — Bethel Music", kind: "song", youtubeUrl: "https://www.youtube.com/watch?v=oOXvQz_gtfA", sortOrder: 3 },
  { title: "Goodness of God — Bethel Music", kind: "song", youtubeUrl: "https://www.youtube.com/watch?v=IvSuGyJQ6oM", sortOrder: 4 },
  { title: "Sezva Ndiri — Takesure Zamar Ncube", kind: "song", youtubeUrl: "https://www.youtube.com/watch?v=ABo1YKicmhQ", sortOrder: 5 },
  { title: "African Gospel Praise Mix", kind: "playlist", youtubeUrl: "https://www.youtube.com/watch?v=eD9p-jpQ7rk", sortOrder: 6 },
  { title: "Soaking Worship — Instrumental", kind: "song", youtubeUrl: "https://www.youtube.com/watch?v=XiC3MV41Dpo", sortOrder: 7 },
  { title: "Amazing Grace — Rosemary Siemens", kind: "song", youtubeUrl: "https://www.youtube.com/watch?v=rxuSdBDib-s", sortOrder: 8 },
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
