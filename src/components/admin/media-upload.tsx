"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { Upload, Loader2, Trash2 } from "lucide-react";
import { setTeachingMedia, clearTeachingMedia } from "@/server/actions/teachings";
import { Button } from "@/components/ui/button";

export function MediaUpload({
  teachingId,
  hasMedia,
}: {
  teachingId: string;
  hasMedia: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setPct(0);
    const kind = file.type.startsWith("video") ? "video" : "audio";
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/blob/upload",
        contentType: file.type,
        onUploadProgress: (p) => setPct(Math.round(p.percentage)),
      });
      setPct(null);
      startTransition(async () => {
        const res = await setTeachingMedia(teachingId, blob.url, kind);
        if (res?.error) setError(res.error);
        else router.refresh();
      });
    } catch (err) {
      setPct(null);
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove() {
    if (!confirm("Remove this audio/video?")) return;
    startTransition(async () => {
      await clearTeachingMedia(teachingId);
      router.refresh();
    });
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*,video/*"
        hidden
        onChange={onFile}
      />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={pct !== null || pending}
        >
          {pct !== null ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> {pct}%
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />{" "}
              {hasMedia ? "Replace file" : "Upload audio/video"}
            </>
          )}
        </Button>
        {hasMedia ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={remove}
            disabled={pending}
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
