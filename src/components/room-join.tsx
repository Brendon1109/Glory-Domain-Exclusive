"use client";
import { useEffect, useState } from "react";
import { Video } from "lucide-react";
import { JitsiRoom } from "./jitsi-room";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function RoomJoin({
  roomName,
  audioOnly,
}: {
  roomName: string;
  audioOnly: boolean;
}) {
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("gd_display_name");
    if (saved) setName(saved);
  }, []);

  function join() {
    const n = name.trim() || "Guest";
    localStorage.setItem("gd_display_name", n);
    setName(n);
    setJoined(true);
  }

  if (joined) {
    return (
      <div className="h-[72vh] overflow-hidden rounded-2xl border border-stone-200 bg-black">
        <JitsiRoom
          roomName={roomName}
          displayName={name.trim() || "Guest"}
          audioOnly={audioOnly}
        />
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
      <Button onClick={join} size="lg" className="mt-4 w-full">
        <Video className="h-4 w-4" /> Join the teaching
      </Button>
    </div>
  );
}
