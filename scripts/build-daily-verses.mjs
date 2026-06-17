// Rewrites data/verses/daily-verses.json into modern English by pulling each
// curated reference's text from the bundled World English Bible (WEB), with
// "Yahweh" rendered as the familiar "the LORD".  Run: node scripts/build-daily-verses.mjs
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const NAME_TO_ID = {
  genesis: "GEN", exodus: "EXO", leviticus: "LEV", numbers: "NUM",
  deuteronomy: "DEU", joshua: "JOS", judges: "JDG", ruth: "RUT",
  "1 samuel": "1SA", "2 samuel": "2SA", "1 kings": "1KI", "2 kings": "2KI",
  "1 chronicles": "1CH", "2 chronicles": "2CH", ezra: "EZR", nehemiah: "NEH",
  esther: "EST", job: "JOB", psalms: "PSA", psalm: "PSA", proverbs: "PRO",
  ecclesiastes: "ECC", "song of solomon": "SNG", isaiah: "ISA", jeremiah: "JER",
  lamentations: "LAM", ezekiel: "EZK", daniel: "DAN", hosea: "HOS", joel: "JOL",
  amos: "AMO", obadiah: "OBA", jonah: "JON", micah: "MIC", nahum: "NAM",
  habakkuk: "HAB", zephaniah: "ZEP", haggai: "HAG", zechariah: "ZEC",
  malachi: "MAL", matthew: "MAT", mark: "MRK", luke: "LUK", john: "JHN",
  acts: "ACT", romans: "ROM", "1 corinthians": "1CO", "2 corinthians": "2CO",
  galatians: "GAL", ephesians: "EPH", philippians: "PHP", colossians: "COL",
  "1 thessalonians": "1TH", "2 thessalonians": "2TH", "1 timothy": "1TI",
  "2 timothy": "2TI", titus: "TIT", philemon: "PHM", hebrews: "HEB",
  james: "JAS", "1 peter": "1PE", "2 peter": "2PE", "1 john": "1JN",
  "2 john": "2JN", "3 john": "3JN", jude: "JUD", revelation: "REV",
};

function modernize(t) {
  let s = t
    .replace(/Yahweh's/g, "the LORD's")
    .replace(/Yahweh/g, "the LORD")
    .replace(/\bYah\b/g, "the LORD")
    .replace(/[“”"]/g, "") // drop double-quote marks (keep apostrophes for contractions)
    .replace(/\s+/g, " ")
    .trim();
  s = s.replace(/([.!?])([A-Za-z])/g, "$1 $2"); // ensure a space after sentence breaks
  s = s.replace(/[,;]\s*$/, "."); // tidy a trailing comma/semicolon into a full stop
  s = s.charAt(0).toUpperCase() + s.slice(1); // capitalize the first letter
  return s;
}

const refsPath = path.join(process.cwd(), "data", "verses", "daily-verses.json");
const refs = JSON.parse(await readFile(refsPath, "utf8"));
const web = JSON.parse(
  await readFile(path.join(process.cwd(), "data", "bible", "web.json"), "utf8"),
);

const out = refs.map(({ ref, text }) => {
  const m = ref.match(/^(.+?)\s+(\d+):(\d+)$/);
  if (!m) return { ref, text };
  const id = NAME_TO_ID[m[1].trim().toLowerCase()];
  const verses = id && web.books[id] && web.books[id][m[2]];
  const found = verses && verses[Number(m[3]) - 1];
  if (!found) {
    console.log("MISS (kept KJV):", ref);
    return { ref, text };
  }
  return { ref, text: modernize(found) };
});

await writeFile(refsPath, JSON.stringify(out, null, 2) + "\n");
console.log(`Wrote ${out.length} verses in modern English (WEB).`);
