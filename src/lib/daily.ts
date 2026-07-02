/** Pure, deterministic "pick of the day" helpers (safe on client or server). */

/** Whole days since the Unix epoch (UTC) — same value for everyone on a calendar day. */
export function dayNumber(d: Date): number {
  return Math.floor(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 86400000,
  );
}

/**
 * Deterministically pick `count` items for the given day, rotating through the
 * array as days advance. Everyone sees the same picks on the same day.
 */
export function pickForDay<T>(arr: T[], date: Date, count = 1, offset = 0): T[] {
  if (arr.length === 0) return [];
  const start =
    (((dayNumber(date) + offset) % arr.length) + arr.length) % arr.length;
  const out: T[] = [];
  for (let i = 0; i < Math.min(count, arr.length); i++) {
    out.push(arr[(start + i) % arr.length]);
  }
  return out;
}

/** Week counter that advances every Sunday (Sunday–Saturday stays constant). */
export function weekNumber(d: Date): number {
  return Math.floor((dayNumber(d) + 4) / 7);
}

/** Deterministic weekly picks — the same all week, rotating each Sunday. */
export function pickForWeek<T>(arr: T[], date: Date, count = 1, offset = 0): T[] {
  if (arr.length === 0) return [];
  const start =
    (((weekNumber(date) + offset) % arr.length) + arr.length) % arr.length;
  const out: T[] = [];
  for (let i = 0; i < Math.min(count, arr.length); i++) {
    out.push(arr[(start + i) % arr.length]);
  }
  return out;
}
