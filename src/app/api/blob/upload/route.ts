import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/session";

// Generates client-upload tokens so the pastor can upload sermon audio/video
// directly to Vercel Blob (bypassing the serverless body-size limit).
export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        if (!(await isAdmin())) throw new Error("Not allowed");
        return {
          allowedContentTypes: [
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
          ],
          maximumSizeInBytes: 300 * 1024 * 1024, // 300 MB
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
