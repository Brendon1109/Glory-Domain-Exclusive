import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/session";
import { MAX_MEDIA_BYTES, MEDIA_CONTENT_TYPES } from "@/lib/media";
import { mediaProvider } from "@/lib/media-storage";

// Generates client-upload tokens so the pastor can upload sermon audio/video
// directly to Vercel Blob (bypassing the serverless body-size limit). Only
// used while media storage is Vercel Blob, see src/lib/media-storage.ts.
export async function POST(request: NextRequest) {
  if (mediaProvider() !== "vercel-blob") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        if (!(await isAdmin())) throw new Error("Not allowed");
        return {
          allowedContentTypes: [...MEDIA_CONTENT_TYPES],
          maximumSizeInBytes: MAX_MEDIA_BYTES,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        /* nothing extra */
      },
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 400 },
    );
  }
}
