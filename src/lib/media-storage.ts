import "server-only";
import { AwsV4Signer } from "aws4fetch";
import { nanoid } from "nanoid";
import type { UploadTarget } from "./media";

/**
 * Where sermon media is stored, chosen by configuration:
 *   MEDIA_STORAGE=r2   Cloudflare R2 (set in wrangler.jsonc for the Worker)
 *   unset              Vercel Blob, which authenticates through Vercel's own
 *                      OIDC and so only works on Vercel
 *
 * R2 needs MEDIA_R2_ACCOUNT_ID, MEDIA_R2_BUCKET, MEDIA_R2_ACCESS_KEY_ID,
 * MEDIA_R2_SECRET_ACCESS_KEY and MEDIA_PUBLIC_BASE_URL. Until all five are
 * set, uploads are refused with a clear error rather than half working.
 * docs/CLOUDFLARE-MOVE.md says where each value comes from.
 */
export type MediaProvider = UploadTarget["provider"];

export function mediaProvider(): MediaProvider {
  return process.env.MEDIA_STORAGE === "r2" ? "r2" : "vercel-blob";
}

export class MediaNotConfiguredError extends Error {}

// Long enough to finish 300 MB on a slow line, short enough that a leaked
// URL is soon useless. A presigned URL can only write the one key it names.
const PRESIGN_SECONDS = 60 * 60;

function r2Config() {
  const accountId = process.env.MEDIA_R2_ACCOUNT_ID;
  const bucket = process.env.MEDIA_R2_BUCKET;
  const accessKeyId = process.env.MEDIA_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.MEDIA_R2_SECRET_ACCESS_KEY;
  const publicBase = process.env.MEDIA_PUBLIC_BASE_URL?.replace(/\/+$/, "");
  if (!accountId || !bucket || !accessKeyId || !secretAccessKey || !publicBase) {
    return null;
  }
  return { accountId, bucket, accessKeyId, secretAccessKey, publicBase };
}

/** A fresh, unguessable key that keeps a readable file name at the end. */
function mediaKey(filename: string): string {
  const base =
    filename
      .normalize("NFKD")
      .replace(/[^\w.-]+/g, "-")
      .replace(/^[-.]+|-+$/g, "")
      .slice(-80) || "media";
  return `teachings/${nanoid(16)}/${base}`;
}

/**
 * A presigned PUT straight to R2's S3 endpoint (presigned URLs do not work
 * on a bucket's custom domain). Content-Type and Content-Length are part of
 * the signature, so the browser must send exactly the declared type and size,
 * which is what holds an upload to the checked type and the 300 MB cap.
 */
export async function createR2UploadTarget(file: {
  contentType: string;
  size: number;
  filename: string;
}): Promise<UploadTarget> {
  const cfg = r2Config();
  if (!cfg) throw new MediaNotConfiguredError("R2 media storage is not configured.");
  const key = mediaKey(file.filename);
  const url = new URL(
    `https://${cfg.accountId}.r2.cloudflarestorage.com/${cfg.bucket}/${key}`,
  );
  url.searchParams.set("X-Amz-Expires", String(PRESIGN_SECONDS));
  const signed = await new AwsV4Signer({
    method: "PUT",
    url: url.toString(),
    headers: {
      "content-type": file.contentType,
      "content-length": String(file.size),
    },
    accessKeyId: cfg.accessKeyId,
    secretAccessKey: cfg.secretAccessKey,
    service: "s3",
    region: "auto",
    signQuery: true,
    allHeaders: true,
  }).sign();
  return {
    provider: "r2",
    uploadUrl: signed.url.toString(),
    headers: { "Content-Type": file.contentType },
    publicUrl: `${cfg.publicBase}/${key}`,
  };
}
