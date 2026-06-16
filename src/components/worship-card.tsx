"use client";
import { useState } from "react";
import { Play, Music, ExternalLink } from "lucide-react";
import { parseYouTube } from "@/lib/youtube";
import type { WorshipItem } from "@/db/schema";

export function WorshipCard({ item }: { item: WorshipItem }) {
  const [playing, setPlaying] = useState(false);
  const yt = parseYouTube(item.youtubeUrl);
  const canEmbed = !!yt && (yt.type === "video" || !!yt.playlistId);

  if (playing && yt) {
    return (
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-black shadow-sm">
        <div className="relative aspect-video">
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`${yt.embedUrl}&autoplay=1`}
            title={item.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        <div className="p-3">
          <p className="truncate text-sm font-semibold text-white">{item.title}</p>
        </div>
      </div>
    );
  }

  const Thumb = (
    <span className="group relative block aspect-video w-full overflow-hidden bg-stone-900 text-left">
      {yt?.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={yt.thumbnail}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-90"
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-700 to-violet-800">
          <Music className="h-10 w-10 text-white/70" />
        </span>
      )}
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/55 text-white transition group-hover:bg-red-600">
          {canEmbed ? (
            <Play className="h-7 w-7" fill="currentColor" />
          ) : (
            <ExternalLink className="h-6 w-6" />
          )}
        </span>
      </span>
    </span>
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      {canEmbed ? (
        <button type="button" onClick={() => setPlaying(true)} className="w-full">
          {Thumb}
        </button>
      ) : (
        <a href={item.youtubeUrl} target="_blank" rel="noreferrer" className="block">
          {Thumb}
        </a>
      )}
      <div className="flex items-center justify-between gap-2 p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-stone-900">{item.title}</p>
          <p className="text-xs capitalize text-stone-500">{item.kind}</p>
        </div>
        <a
          href={item.youtubeUrl}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-stone-400 hover:text-stone-700"
          aria-label="Open on YouTube"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
