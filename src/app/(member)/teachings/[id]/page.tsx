import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getTeaching } from "@/lib/queries";
import { RoomJoin } from "@/components/room-join";
import { RecordingPlayer } from "@/components/recording-player";
import { MediaPlayer } from "@/components/media-player";

export default async function TeachingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teaching = await getTeaching(id);
  if (!teaching) notFound();

  const isLive = teaching.kind === "live" && !!teaching.roomName;

  return (
    <div className="space-y-4">
      <Link
        href="/teachings"
        className="inline-flex items-center text-sm text-stone-500 hover:text-stone-800"
      >
        <ChevronLeft className="h-4 w-4" /> Back to teachings
      </Link>

      <div>
        <h1 className="text-xl font-bold text-stone-900">{teaching.title}</h1>
        {teaching.description ? (
          <p className="mt-1 text-sm text-stone-600">{teaching.description}</p>
        ) : null}
      </div>

      {isLive ? (
        <RoomJoin roomName={teaching.roomName!} audioOnly={teaching.audioOnly} />
      ) : null}

      {teaching.mediaUrl ? (
        <MediaPlayer
          src={teaching.mediaUrl}
          kind={(teaching.mediaKind as "audio" | "video" | null) ?? "audio"}
          title={teaching.title}
        />
      ) : null}

      {teaching.recordingUrl ? (
        <div>
          {isLive ? (
            <h2 className="mb-2 mt-4 text-sm font-semibold uppercase tracking-wide text-stone-500">
              Recording
            </h2>
          ) : null}
          <RecordingPlayer url={teaching.recordingUrl} title={teaching.title} />
        </div>
      ) : null}

      {!isLive && !teaching.recordingUrl && !teaching.mediaUrl ? (
        <div className="rounded-xl border border-line bg-surface p-5 text-sm text-muted">
          This teaching isn&apos;t available to watch yet.
        </div>
      ) : null}
    </div>
  );
}
