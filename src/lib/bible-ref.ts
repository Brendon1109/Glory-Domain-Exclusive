import { BOOKS, type BibleBook } from "@/lib/bible-books";

export type BibleRefSuggestion = {
  bookId: string;
  label: string;
  href: string;
  chapter?: number;
  verse?: number;
};

// Periods double as abbreviation marks ("matt.") and chapter.verse
// separators ("jn3.16"), so they become spaces instead of vanishing.
function normalize(input: string): string {
  return input.toLowerCase().replace(/\./g, " ").replace(/\s+/g, " ").trim();
}

// Standard abbreviations -> canonical book id. Lowercase, no spaces
// (a "1 sam" style input is compacted before lookup).
const ALIASES = new Map<string, string>([
  ["gen", "GEN"],
  ["exo", "EXO"],
  ["ex", "EXO"],
  ["lev", "LEV"],
  ["num", "NUM"],
  ["deu", "DEU"],
  ["deut", "DEU"],
  ["dt", "DEU"],
  ["jos", "JOS"],
  ["josh", "JOS"],
  ["jdg", "JDG"],
  ["judg", "JDG"],
  ["rut", "RUT"],
  ["ru", "RUT"],
  ["1sa", "1SA"],
  ["1sam", "1SA"],
  ["2sa", "2SA"],
  ["2sam", "2SA"],
  ["1ki", "1KI"],
  ["1kgs", "1KI"],
  ["2ki", "2KI"],
  ["2kgs", "2KI"],
  ["1ch", "1CH"],
  ["1chr", "1CH"],
  ["2ch", "2CH"],
  ["2chr", "2CH"],
  ["ezr", "EZR"],
  ["neh", "NEH"],
  ["est", "EST"],
  ["psa", "PSA"],
  ["ps", "PSA"],
  ["psalm", "PSA"],
  ["psalms", "PSA"],
  ["pro", "PRO"],
  ["prov", "PRO"],
  ["ecc", "ECC"],
  ["eccl", "ECC"],
  ["sng", "SNG"],
  ["song", "SNG"],
  ["sos", "SNG"],
  ["isa", "ISA"],
  ["is", "ISA"],
  ["jer", "JER"],
  ["lam", "LAM"],
  ["ezk", "EZK"],
  ["ezek", "EZK"],
  ["eze", "EZK"],
  ["dan", "DAN"],
  ["hos", "HOS"],
  ["jol", "JOL"],
  ["amo", "AMO"],
  ["oba", "OBA"],
  ["ob", "OBA"],
  ["jon", "JON"],
  ["mic", "MIC"],
  ["nam", "NAM"],
  ["nah", "NAM"],
  ["hab", "HAB"],
  ["zep", "ZEP"],
  ["zeph", "ZEP"],
  ["hag", "HAG"],
  ["zec", "ZEC"],
  ["zech", "ZEC"],
  ["mal", "MAL"],
  ["mat", "MAT"],
  ["matt", "MAT"],
  ["mt", "MAT"],
  ["mrk", "MRK"],
  ["mk", "MRK"],
  ["luk", "LUK"],
  ["lk", "LUK"],
  ["jhn", "JHN"],
  ["jn", "JHN"],
  ["act", "ACT"],
  ["rom", "ROM"],
  ["ro", "ROM"],
  ["1co", "1CO"],
  ["1cor", "1CO"],
  ["2co", "2CO"],
  ["2cor", "2CO"],
  ["gal", "GAL"],
  ["eph", "EPH"],
  ["php", "PHP"],
  ["phil", "PHP"],
  ["col", "COL"],
  ["1th", "1TH"],
  ["1thess", "1TH"],
  ["2th", "2TH"],
  ["2thess", "2TH"],
  ["1ti", "1TI"],
  ["1tim", "1TI"],
  ["2ti", "2TI"],
  ["2tim", "2TI"],
  ["tit", "TIT"],
  ["phm", "PHM"],
  ["phlm", "PHM"],
  ["philem", "PHM"],
  ["heb", "HEB"],
  ["jas", "JAS"],
  ["jam", "JAS"],
  ["1pe", "1PE"],
  ["1pet", "1PE"],
  ["2pe", "2PE"],
  ["2pet", "2PE"],
  ["1jn", "1JN"],
  ["2jn", "2JN"],
  ["3jn", "3JN"],
  ["jud", "JUD"],
  ["jude", "JUD"],
  ["rev", "REV"],
]);

type IndexedBook = BibleBook & {
  nameNorm: string; // e.g. "1 john"
  nameBare: string; // e.g. "john" (leading book-number stripped)
};

const INDEX: IndexedBook[] = BOOKS.map((b) => {
  const nameNorm = normalize(b.name);
  return { ...b, nameNorm, nameBare: nameNorm.replace(/^[1-3] /, "") };
});

type ParsedRef = {
  num: string; // "" or "1".."3"
  letters: string;
  chapter?: number;
  verse?: number;
};

function parseRef(raw: string): ParsedRef | null {
  const text = normalize(raw);
  if (!text) return null;
  let rest = text;
  let num = "";
  // A leading 1-3 is a book number only when followed by letters (or
  // nothing yet), so "13" never reads as book "1" chapter "3".
  const numMatch = rest.match(/^([1-3])(?:\s+|(?=[a-z])|$)/);
  if (numMatch) {
    num = numMatch[1];
    rest = rest.slice(numMatch[0].length);
  }
  const letterMatch = rest.match(/^[a-z][a-z ]*/);
  const letters = letterMatch ? letterMatch[0].trim() : "";
  if (!num && !letters) return null;
  if (letterMatch) rest = rest.slice(letterMatch[0].length);
  if (!rest) return { num, letters };
  const cv = rest.match(/^(\d+)(?:\s*[:v]\s*|\s+)?(\d+)?$/);
  if (!cv) return null;
  const parsed: ParsedRef = { num, letters, chapter: parseInt(cv[1], 10) };
  if (cv[2]) parsed.verse = parseInt(cv[2], 10);
  return parsed;
}

function matchBooks(num: string, letters: string): IndexedBook[] {
  const spaced = num ? (letters ? `${num} ${letters}` : num) : letters;
  const compact = `${num}${letters}`;
  const aliasId = ALIASES.get(compact);
  return INDEX.filter(
    (b) =>
      b.nameNorm.startsWith(spaced) ||
      b.id.toLowerCase() === compact ||
      b.id === aliasId ||
      (!num && b.nameBare.startsWith(letters)),
  );
}

export function suggestBibleRefs(
  input: string,
  limit = 8,
): BibleRefSuggestion[] {
  const ref = parseRef(input);
  if (!ref || limit < 1) return [];
  const books = matchBooks(ref.num, ref.letters);
  if (books.length === 0) return [];

  if (ref.chapter === undefined) {
    return books.slice(0, limit).map((b) => ({
      bookId: b.id,
      label: b.name,
      href: `/bible/${b.id}/1`,
    }));
  }

  const book = books[0];
  // Single-chapter books (Obadiah, Philemon, 2–3 John, Jude): by convention
  // "Jude 24" cites verse 24, so a lone number past 1 reads as a verse.
  const soleChapterVerse =
    book.chapters === 1 && ref.verse === undefined && ref.chapter > 1;
  const chapter = soleChapterVerse
    ? 1
    : Math.min(Math.max(ref.chapter, 1), book.chapters);
  const verseNum = soleChapterVerse ? ref.chapter : ref.verse;
  if (verseNum === undefined) {
    return [
      {
        bookId: book.id,
        label: `${book.name} ${chapter}`,
        href: `/bible/${book.id}/${chapter}`,
        chapter,
      },
    ];
  }

  const verse = Math.max(verseNum, 1);
  return [
    {
      bookId: book.id,
      label: `${book.name} ${chapter}:${verse}`,
      href: `/bible/${book.id}/${chapter}#v${verse}`,
      chapter,
      verse,
    },
  ];
}
