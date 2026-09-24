// Splits data/bible/<t>.json into small static files under public/bible-data,
// so no request ever reads or parses a whole translation. Runs before every
// dev and build (predev, prebuild). The output is generated, never committed.
//
//   chapters/<t>/<BOOK>/<n>.json  one chapter, a JSON array of verse strings
//   search/<t>/<nn>.txt           about SHARD_BYTES of verses per file, one
//                                 verse per line as BOOK\tchapter\tverse\ttext,
//                                 in the same order the search always used
//   manifest.json                 per translation, the books present and the
//                                 search shards in order
//
// On Vercel the API routes read these with fs (traced in next.config.ts). On
// Cloudflare Workers they are static assets read through the ASSETS binding.

import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "data", "bible");
const OUT = path.join(ROOT, "public", "bible-data");
const TRANSLATIONS = ["kjv", "web", "shona"];
const SHARD_BYTES = 512 * 1024;

await fs.rm(OUT, { recursive: true, force: true });

const manifest = { version: 1, translations: {} };
let files = 0;

for (const t of TRANSLATIONS) {
  const raw = JSON.parse(await fs.readFile(path.join(SRC, `${t}.json`), "utf8"));
  const books = [];
  const shards = [];
  let shard = [];
  let shardBytes = 0;

  const flush = async () => {
    if (!shard.length) return;
    const name = `${String(shards.length).padStart(2, "0")}.txt`;
    await write(path.join(OUT, "search", t, name), shard.join("\n") + "\n");
    shards.push(name);
    shard = [];
    shardBytes = 0;
  };

  // Object.entries gives the same book and chapter order the old whole file
  // search walked, so results come back in the same order as before.
  for (const [bookId, chapters] of Object.entries(raw.books)) {
    books.push(bookId);
    for (const [ch, verses] of Object.entries(chapters)) {
      await write(
        path.join(OUT, "chapters", t, bookId, `${ch}.json`),
        JSON.stringify(verses),
      );
      verses.forEach((text, i) => {
        if (typeof text !== "string" || /[\t\n\r]/.test(text)) {
          throw new Error(`${t} ${bookId} ${ch}:${i + 1} has a tab or newline, the shard format cannot hold it`);
        }
        // The search finds matches in the lowercased shard and slices the
        // original at the same offsets, so lowercasing must not change length.
        if (text.toLowerCase().length !== text.length) {
          throw new Error(`${t} ${bookId} ${ch}:${i + 1} changes length when lowercased, the search offsets would drift`);
        }
        const line = `${bookId}\t${ch}\t${i + 1}\t${text}`;
        shard.push(line);
        shardBytes += Buffer.byteLength(line) + 1;
      });
    }
    // Cut shards on book boundaries once they pass the target size.
    if (shardBytes >= SHARD_BYTES) await flush();
  }
  await flush();
  manifest.translations[t] = { books, shards };
}

await write(path.join(OUT, "manifest.json"), JSON.stringify(manifest));
console.log(`bible-data: ${files} files written to public/bible-data`);

async function write(file, content) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content);
  files += 1;
}
