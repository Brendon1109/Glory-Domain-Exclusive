"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { ExternalLink, Video } from "lucide-react";
import { jitsiRoomUrl } from "@/lib/jitsi";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

// Installed home-screen app (display-mode: standalone): there are no tabs
// there — links to Jitsi open in an in-app browser view instead.
const STANDALONE_QUERY = "(display-mode: standalone)";

function subscribeStandalone(onChange: () => void) {
  const mql = window.matchMedia(STANDALONE_QUERY);
  if (typeof mql.addEventListener !== "function") return () => {};
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function isStandalone() {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia(STANDALONE_QUERY).matches || nav.standalone === true;
}

export function RoomJoin({
  roomName,
  audioOnly,
}: {
  roomName: string;
  audioOnly: boolean;
}) {
  const [name, setName] = useState("");
  const [opened, setOpened] = useState(false);
  const standalone = useSyncExternalStore(
    subscribeStandalone,
    isStandalone,
    () => false,
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem("gd_display_name");
      if (saved) setName(saved);
    } catch {
      // Storage blocked (private mode, cookies disabled) — skip the restore.
    }
  }, []);

  function openSession() {
    const n = name.trim() || "Guest";
    try {
      localStorage.setItem("gd_display_name", n);
    } catch {
      // Storage blocked — joining still works, the name just isn't saved.
    }
    setName(n);
    const url = jitsiRoomUrl(roomName, {
      displayName: n,
      audioOnly,
      muted: true,
    });
    // No "noopener" feature here: passing it makes window.open return null
    // even when the tab opens, which would trip the popup-blocked fallback
    // on every tap. We sever the opener link manually instead.
    const w = window.open(url, "_blank");
    if (!w) {
      // Popup blocked — open the session in this tab instead.
      window.location.assign(url);
      return;
    }
    w.opener = null;
    setOpened(true);
  }

  if (opened) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-stone-700">
          {standalone
            ? "The session opened on Jitsi Meet. If you arrived before the pastor, the room starts when the pastor joins. If your microphone or camera won't turn on, open this page in your browser (Safari on iPhone) and join from there."
            : "The session opened in a new tab on Jitsi Meet. If you arrived before the pastor, the room starts when the pastor joins."}
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={openSession}
          className="mt-4"
        >
          <ExternalLink className="h-4 w-4" /> Reopen the session
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <Label htmlFor="name">Your name</Label>
      <Input
        id="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Sister Grace"
      />
      <p className="mt-2 text-xs text-stone-500">
        {audioOnly
          ? "This session is audio-only to save data."
          : "Tip: keep your camera off to use less data."}
      </p>
      <Button onClick={openSession} size="lg" className="mt-4 w-full">
        <Video className="h-4 w-4" /> Join the teaching
      </Button>
      <p className="mt-2 text-center text-xs text-stone-500">
        {standalone
          ? "Opens Jitsi Meet in a browser view — no app needed. If your microphone won't work there, open this page in your browser (Safari on iPhone) and join from there."
          : "Opens in a new tab — no app needed."}
      </p>
    </div>
  );
}
