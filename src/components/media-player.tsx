"use client";
import { useEffect, useRef } from "react";
import { PictureInPicture2 } from "lucide-react";

// Lock-screen / notification controls so playback survives switching apps.
function applyMediaSession(el: HTMLMediaElement, title: string) {
  if (!("mediaSession" in navigator)) return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist: "Glory Domain",
      artwork: [{ src: "/icons/icon.svg", sizes: "512x512", type: "image/svg+xml" }],
    });
    navigator.mediaSession.setActionHandler("play", () => el.play());
    navigator.mediaSession.setActionHandler("pause", () => el.pause());
    navigator.mediaSession.setActionHandler("seekbackward", (d) => {
      el.currentTime = Math.max(0, el.currentTime - (d.seekOffset ?? 10));
    });
    navigator.mediaSession.setActionHandler("seekforward", (d) => {
      el.currentTime = el.currentTime + (d.seekOffset ?? 10);
    });
  } catch {
    /* not supported */
  }
}

function MediaAudio({ src, title }: { src: string; title: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const on = () => applyMediaSession(el, title);
    el.addEventListener("play", on);
    return () => el.removeEventListener("play", on);
  }, [title]);
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-[0_1px_2px_rgba(20,18,15,0.03)]">
      <audio ref={ref} src={src} controls preload="metadata" className="w-full" />
      <p className="mt-2 text-xs text-muted">
        Keeps playing when you switch apps or lock your screen — pause it to stop.
      </p>
    </div>
  );
}

function MediaVideo({ src, title }: { src: string; title: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const on = () => applyMediaSession(el, title);
    el.addEventListener("play", on);
    return () => el.removeEventListener("play", on);
  }, [title]);
  async function pip() {
    const el = ref.current;
    if (el && "requestPictureInPicture" in el) {
      try {
        await el.requestPictureInPicture();
      } catch {
        /* not supported / blocked */
      }
    }
  }
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-black">
      <video ref={ref} src={src} controls playsInline preload="metadata" className="w-full" />
      <div className="flex items-center justify-between gap-2 bg-surface p-3">
        <p className="text-xs text-muted">
          Tap “Pop out” to keep watching while you use other apps.
        </p>
        <button
          type="button"
          onClick={pip}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-ink"
        >
          <PictureInPicture2 className="h-4 w-4" /> Pop out
        </button>
      </div>
    </div>
  );
}

export function MediaPlayer({
  src,
  kind,
  title,
}: {
  src: string;
  kind: "audio" | "video" | null;
  title: string;
}) {
  return kind === "video" ? (
    <MediaVideo src={src} title={title} />
  ) : (
    <MediaAudio src={src} title={title} />
  );
}
