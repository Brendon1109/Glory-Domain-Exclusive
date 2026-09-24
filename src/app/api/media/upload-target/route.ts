import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/session";
import { MAX_MEDIA_BYTES, isMediaContentType, type UploadTarget } from "@/lib/media";
import {
  MediaNotConfiguredError,
  createR2UploadTarget,
  mediaProvider,
} from "@/lib/media-storage";

const fileSchema = z.object({
  filename: z.string().min(1).max(300),
  contentType: z.string().refine(isMediaContentType, "That file type isn't supported."),
  size: z
    .number()
    .int()
    .positive()
    .max(MAX_MEDIA_BYTES, "That file is over the 300 MB limit."),
});

/**
 * Step one of a sermon upload: the admin's browser says what it wants to
 * upload and is told where to send it. Admin only.
 */
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }
  const noStore = { "Cache-Control": "no-store" };

  if (mediaProvider() === "vercel-blob") {
    const target: UploadTarget = {
      provider: "vercel-blob",
      handleUploadUrl: "/api/blob/upload",
    };
    return NextResponse.json(target, { headers: noStore });
  }

  const parsed = fileSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid upload." },
      { status: 400 },
    );
  }
  try {
    const target = await createR2UploadTarget(parsed.data);
    return NextResponse.json(target, { headers: noStore });
  } catch (e) {
    if (e instanceof MediaNotConfiguredError) {
      console.error("[media] upload refused:", e.message);
      return NextResponse.json(
        { error: "Uploads are not set up yet." },
        { status: 503 },
      );
    }
    throw e;
  }
}
