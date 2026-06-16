"use client";
import { useEffect, useState } from "react";

/**
 * Formats a timestamp in the *viewer's* locale and timezone. Renders nothing on
 * the server to avoid hydration/timezone mismatches, then fills in on mount.
 */
export function LocalDateTime({
  iso,
  mode = "datetime",
}: {
  iso: string;
  mode?: "datetime" | "date" | "time";
}) {
  const [text, setText] = useState("");
  useEffect(() => {
    const opts: Intl.DateTimeFormatOptions =
      mode === "date"
        ? { weekday: "short", month: "short", day: "numeric" }
        : mode === "time"
          ? { hour: "numeric", minute: "2-digit" }
          : {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            };
    setText(new Intl.DateTimeFormat(undefined, opts).format(new Date(iso)));
  }, [iso, mode]);
  return <span suppressHydrationWarning>{text || "…"}</span>;
}
