"use client";
import { useState } from "react";
import { Play, ExternalLink } from "lucide-react";
import { parseYouTube } from "@/lib/youtube";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";

export function RecordingPlayer({ url, title }: { url: string; title: string }) {
  const yt = parseYouTube(url);
  const [playing, setPlaying] = useState(false);

  if (yt && playing) {
    return (
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-black">
        <div className="relative aspect-video">
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`${yt.embedUrl}&autoplay=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  if (yt) {
    return (
      <button
        type="button"
        onClick={() => setPlaying(true)}
        className="group relative block aspect-video w-full overflow-hidden rounded-2xl border border-stone-200 bg-stone-900"
      >
        {yt.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={yt.thumbnail}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-90"
          />
        ) : null}
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/55 text-white transition group-hover:bg-red-600">
            <Play className="h-8 w-8" fill="currentColor" />
          </span>
        </span>
      </button>
    );
  }

  // Non-YouTube link (e.g. Google Drive) — open in a new tab.
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={cn(buttonVariants({ variant: "default", size: "lg" }), "w-full")}
    >
      <ExternalLink className="h-4 w-4" /> Open the recording
    </a>
  );
}
