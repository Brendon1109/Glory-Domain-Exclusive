/**
 * Sermon media upload rules, shared by the admin upload button and the
 * server that authorises uploads. Safe to import on the client.
 */
export const MEDIA_CONTENT_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/aac",
  "audio/ogg",
  "audio/wav",
  "audio/x-m4a",
  "audio/webm",
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

export const MAX_MEDIA_BYTES = 300 * 1024 * 1024; // 300 MB

export function isMediaContentType(t: string): boolean {
  return (MEDIA_CONTENT_TYPES as readonly string[]).includes(t);
}

/**
 * Where the browser should send a file, from POST /api/media/upload-target.
 * Vercel Blob runs its own client upload protocol against handleUploadUrl.
 * R2 takes a single presigned PUT straight from the browser, with exactly
 * these headers, and the file then plays from publicUrl.
 */
export type UploadTarget =
  | { provider: "vercel-blob"; handleUploadUrl: string }
  | {
      provider: "r2";
      uploadUrl: string;
      headers: Record<string, string>;
      publicUrl: string;
    };
