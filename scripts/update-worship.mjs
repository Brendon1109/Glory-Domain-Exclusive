// One-off: replace the placeholder search-link worship items in the live DB with
// real, thumbnail-capable YouTube videos (matched by their original seed title).
//   node scripts/update-worship.mjs
import { config } from "dotenv";
config({ path: ".env.local" });
import pg from "pg";

// [ oldSeedTitle, newTitle, kind, youtubeUrl ]
const items = [
  ["Praise & Worship Songs", "Who You Say I Am — Hillsong Worship", "song", "https://www.youtube.com/watch?v=lKw6uqtGFfo"],
  ["Gospel Worship Mix", "Jireh — Elevation Worship & Maverick City", "song", "https://www.youtube.com/watch?v=mC-zw0zCCtg"],
  ["Hillsong Worship", "Holy Forever — Bethel Music", "song", "https://www.youtube.com/watch?v=oOXvQz_gtfA"],
  ["Bethel Music Worship", "Goodness of God — Bethel Music", "song", "https://www.youtube.com/watch?v=IvSuGyJQ6oM"],
  ["Shona Gospel Worship", "Sezva Ndiri — Takesure Zamar Ncube", "song", "https://www.youtube.com/watch?v=ABo1YKicmhQ"],
  ["African Gospel Praise", "African Gospel Praise Mix", "playlist", "https://www.youtube.com/watch?v=eD9p-jpQ7rk"],
  ["Soaking & Spontaneous Worship", "Soaking Worship — Instrumental", "song", "https://www.youtube.com/watch?v=XiC3MV41Dpo"],
  ["Classic Hymns of Faith", "Amazing Grace — Rosemary Siemens", "song", "https://www.youtube.com/watch?v=rxuSdBDib-s"],
];

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
let updated = 0;
for (const [oldTitle, title, kind, url] of items) {
  const r = await pool.query(
    "update worship_items set title=$1, kind=$2, youtube_url=$3 where title=$4",
    [title, kind, url, oldTitle],
  );
  updated += r.rowCount ?? 0;
  console.log(`${oldTitle}  ->  ${r.rowCount} row(s)`);
}
await pool.end();
console.log(`\nUpdated ${updated} worship item(s).`);
process.exit(0);
