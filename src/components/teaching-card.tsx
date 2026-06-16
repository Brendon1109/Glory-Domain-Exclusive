import Link from "next/link";
import { Play, Radio, Video, CalendarClock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LocalDateTime } from "./local-datetime";
import type { Teaching } from "@/db/schema";

export function TeachingCard({
  teaching,
  context,
}: {
  teaching: Teaching;
  context: "upcoming" | "recorded";
}) {
  const start = teaching.scheduledAt ? new Date(teaching.scheduledAt) : null;
  const now = Date.now();
  const liveNow =
    context === "upcoming" &&
    start !== null &&
    now >= start.getTime() - 10 * 60 * 1000 &&
    now <= start.getTime() + 3 * 60 * 60 * 1000;

  return (
    <Card className="p-4">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        {liveNow ? (
          <Badge tone="live">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Live now
          </Badge>
        ) : context === "recorded" ? (
          <Badge tone="indigo">Recorded</Badge>
        ) : (
          <Badge tone="amber">Upcoming</Badge>
        )}
        {teaching.audioOnly ? <Badge>Audio only</Badge> : null}
      </div>

      <h3 className="font-semibold text-stone-900">{teaching.title}</h3>

      {start ? (
        <p className="mt-0.5 flex items-center gap-1 text-sm text-stone-500">
          <CalendarClock className="h-3.5 w-3.5" />
          <LocalDateTime iso={start.toISOString()} />
        </p>
      ) : null}

      {teaching.description ? (
        <p className="mt-1 line-clamp-2 text-sm text-stone-600">
          {teaching.description}
        </p>
      ) : null}

      <Link
        href={`/teachings/${teaching.id}`}
        className={cn(
          buttonVariants({ variant: context === "recorded" ? "secondary" : "default" }),
          "mt-3 w-full",
        )}
      >
        {context === "recorded" ? (
          <>
            <Play className="h-4 w-4" /> Watch
          </>
        ) : liveNow ? (
          <>
            <Radio className="h-4 w-4" /> Join now
          </>
        ) : (
          <>
            <Video className="h-4 w-4" /> Open
          </>
        )}
      </Link>
    </Card>
  );
}
