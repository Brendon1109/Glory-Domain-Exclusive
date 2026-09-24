"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { Upload, Loader2, Trash2 } from "lucide-react";
import { setTeachingMedia, clearTeachingMedia } from "@/server/actions/teachings";
import { Button } from "@/components/ui/button";
import type { UploadTarget } from "@/lib/media";

/** Asks the server where this file should go (Vercel Blob or R2). */
async function getUploadTarget(file: File): Promise<UploadTarget> {
  const res = await fetch("/api/media/upload-target", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      size: file.size,
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? "Upload failed.");
  return data as UploadTarget;
}

/** A presigned PUT, through XMLHttpRequest because fetch has no upload progress. */
function putWithProgress(
  url: string,
  file: File,
  headers: Record<string, string>,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (${xhr.status}).`));
    xhr.onerror = () =>
      reject(new Error("Upload failed. Check the connection and try again."));
    xhr.send(file);
  });
}

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
      const target = await getUploadTarget(file);
      let mediaUrl: string;
      if (target.provider === "r2") {
        await putWithProgress(target.uploadUrl, file, target.headers, setPct);
        mediaUrl = target.publicUrl;
      } else {
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: target.handleUploadUrl,
          contentType: file.type,
          onUploadProgress: (p) => setPct(Math.round(p.percentage)),
        });
        mediaUrl = blob.url;
      }
      setPct(null);
      startTransition(async () => {
        const res = await setTeachingMedia(teachingId, mediaUrl, kind);
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
