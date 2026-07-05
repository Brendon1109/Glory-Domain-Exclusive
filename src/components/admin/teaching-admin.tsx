"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Plus, Trash2, Loader2, Save, Video } from "lucide-react";
import {
  createTeaching,
  deleteTeaching,
  updateTeachingRecording,
} from "@/server/actions/teachings";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LocalDateTime } from "@/components/local-datetime";
import { MediaUpload } from "./media-upload";
import { cn } from "@/lib/utils";
import { jitsiRoomUrl } from "@/lib/jitsi";
import type { Teaching } from "@/db/schema";

export function TeachingAdmin({ teachings }: { teachings: Teaching[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [kind, setKind] = useState<"live" | "recorded">("live");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createTeaching(fd);
      if (res?.error) setError(res.error);
      else {
        formRef.current?.reset();
        setKind("live");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <h2 className="mb-3 font-semibold text-stone-900">
            {kind === "live" ? "Schedule a teaching" : "Add a recording"}
          </h2>
          <form ref={formRef} onSubmit={create} className="space-y-3">
            <input type="hidden" name="kind" value={kind} />
            <div className="flex rounded-lg bg-stone-100 p-1">
              <button
                type="button"
                onClick={() => setKind("live")}
                className={cn(
                  "flex-1 rounded-md py-2 text-sm font-medium",
                  kind === "live"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-stone-500",
                )}
              >
                Live session
              </button>
              <button
                type="button"
                onClick={() => setKind("recorded")}
                className={cn(
                  "flex-1 rounded-md py-2 text-sm font-medium",
                  kind === "recorded"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-stone-500",
                )}
              >
                Recording
              </button>
            </div>

            <div>
              <Label htmlFor="t-title">Title</Label>
              <Input id="t-title" name="title" required placeholder="e.g. Wednesday Bible Study" />
            </div>
            <div>
              <Label htmlFor="t-desc">Description (optional)</Label>
              <Textarea id="t-desc" name="description" placeholder="What will this teaching cover?" />
            </div>

            {kind === "live" ? (
              <>
                <div>
                  <Label htmlFor="t-when">Date &amp; time</Label>
                  <Input id="t-when" type="datetime-local" name="scheduledAt" />
                  <p className="text-xs text-stone-500">
                    Leave blank to start the session right away.
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm text-stone-700">
                  <input type="checkbox" name="audioOnly" className="h-4 w-4 rounded border-stone-300" />
                  Audio only (best for low data)
                </label>
                <p className="text-xs text-stone-500">
                  A private video room is created automatically. Sessions open
                  on Jitsi Meet in a new tab and have no time limit.
                </p>
              </>
            ) : (
              <div>
                <Label htmlFor="t-rec">Recording link (YouTube or Google Drive)</Label>
                <Input id="t-rec" name="recordingUrl" placeholder="https://youtu.be/…" />
              </div>
            )}

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : kind === "live" ? (
                <CalendarPlus className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {kind === "live" ? "Schedule teaching" : "Add recording"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="font-semibold text-stone-900">
          All teachings ({teachings.length})
        </h2>
        {teachings.length === 0 ? (
          <p className="text-sm text-stone-500">Nothing yet.</p>
        ) : (
          teachings.map((t) => (
            <TeachingRow key={t.id} teaching={t} onChanged={() => router.refresh()} />
          ))
        )}
      </div>
    </div>
  );
}

function TeachingRow({
  teaching,
  onChanged,
}: {
  teaching: Teaching;
  onChanged: () => void;
}) {
  const [rec, setRec] = useState(teaching.recordingUrl ?? "");
  const [pending, startTransition] = useTransition();

  function saveRec() {
    startTransition(async () => {
      await updateTeachingRecording(teaching.id, rec);
      onChanged();
    });
  }
  function remove() {
    if (!confirm("Delete this teaching?")) return;
    startTransition(async () => {
      await deleteTeaching(teaching.id);
      onChanged();
    });
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap gap-2">
            <Badge tone={teaching.kind === "live" ? "amber" : "indigo"}>
              {teaching.kind === "live" ? "Live" : "Recording"}
            </Badge>
            {teaching.audioOnly ? <Badge>Audio only</Badge> : null}
            {teaching.recordingUrl ? <Badge tone="green">Has recording</Badge> : null}
            {teaching.mediaUrl ? (
              <Badge tone="green">
                {teaching.mediaKind === "video" ? "Video" : "Audio"}
              </Badge>
            ) : null}
          </div>
          <p className="font-medium text-stone-900">{teaching.title}</p>
          {teaching.scheduledAt ? (
            <p className="text-xs text-stone-500">
              <LocalDateTime iso={new Date(teaching.scheduledAt).toISOString()} />
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="shrink-0 text-stone-400 hover:text-red-600"
          aria-label="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {teaching.kind === "live" && teaching.roomName ? (
        <div className="mt-3">
          <a
            href={jitsiRoomUrl(teaching.roomName, {
              displayName: "Pastor",
              audioOnly: teaching.audioOnly,
              muted: false,
            })}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "secondary" }), "w-full")}
          >
            <Video className="h-4 w-4" /> Start session as host
          </a>
          <p className="mt-1 text-xs text-stone-500">
            Jitsi will ask you to sign in (Google) the first time — that makes
            you the host and starts the room for everyone.
          </p>
        </div>
      ) : null}

      {teaching.kind === "live" ? (
        <div className="mt-3">
          <Label className="text-xs">Add / replace recording link</Label>
          <div className="flex gap-2">
            <Input
              value={rec}
              onChange={(e) => setRec(e.target.value)}
              placeholder="https://youtu.be/…"
            />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={saveRec}
              disabled={pending}
              aria-label="Save recording link"
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-3">
        <Label className="text-xs">
          Sermon audio/video (plays in the background)
        </Label>
        <div className="mt-1">
          <MediaUpload teachingId={teaching.id} hasMedia={!!teaching.mediaUrl} />
        </div>
      </div>
    </Card>
  );
}
