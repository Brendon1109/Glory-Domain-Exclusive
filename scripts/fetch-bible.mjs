// Downloads the full public-domain KJV + WEB Bibles and writes them to
// data/bible/<id>.json in the app's chapter-keyed shape.
//   Usage: npm run bible:fetch
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const BOOK_IDS = [
  "GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA",
  "1KI", "2KI", "1CH", "2CH", "EZR", "NEH", "EST", "JOB", "PSA", "PRO",
  "ECC", "SNG", "ISA", "JER", "LAM", "EZK", "DAN", "HOS", "JOL", "AMO",
  "OBA", "JON", "MIC", "NAM", "HAB", "ZEP", "HAG", "ZEC", "MAL", "MAT",
  "MRK", "LUK", "JHN", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", "PHP",
  "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAS", "1PE",
  "2PE", "1JN", "2JN", "3JN", "JUD", "REV",
];

// Freely-licensed translations from the getBible v2 dataset.
//   kjv/web: public domain · shona: GFDL (Shona Bible)
const SOURCES = {
  kjv: "https://api.getbible.net/v2/kjv.json",
  web: "https://api.getbible.net/v2/web.json",
  shona: "https://api.getbible.net/v2/shona.json",
};

function asArray(maybe) {
  return Array.isArray(maybe) ? maybe : Object.values(maybe ?? {});
}

async function build(id, url) {
  process.stdout.write(`Fetching ${id.toUpperCase()} ... `);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const data = await res.json();

  const booksOut = {};
  asArray(data.books).forEach((book, i) => {
    // Map by canonical book number (nr) so partial canons (e.g. a NT-only
    // translation) land in the correct books rather than by array position.
    const nr = Number(book.nr ?? i + 1);
    const bid = BOOK_IDS[nr - 1];
    if (!bid) return;
    const chapters = {};
    for (const ch of asArray(book.chapters)) {
      const num = ch.chapter ?? ch.nr;
      chapters[String(num)] = asArray(ch.verses).map((v) =>
        String(v.text ?? "").replace(/\s+/g, " ").trim(),
      );
    }
    booksOut[bid] = chapters;
  });

  const out = { translation: id.toUpperCase(), books: booksOut };
  const dir = path.join(process.cwd(), "data", "bible");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${id}.json`), JSON.stringify(out));
  console.log(`wrote ${Object.keys(booksOut).length} books -> data/bible/${id}.json`);
}

for (const [id, url] of Object.entries(SOURCES)) {
  await build(id, url);
}
console.log("Done. Restart the dev server to pick up the new Bible data.");
