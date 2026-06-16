"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Check } from "lucide-react";
import { setPrayerStatus, deletePrayerRequest } from "@/server/actions/prayer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LocalDateTime } from "@/components/local-datetime";
import type { PrayerRequest } from "@/db/schema";

export function PrayerAdmin({ requests }: { requests: PrayerRequest[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function update(id: string, status: "new" | "praying" | "answered") {
    startTransition(async () => {
      await setPrayerStatus(id, status);
      router.refresh();
    });
  }
  function remove(id: string) {
    if (!confirm("Delete this prayer request?")) return;
    startTransition(async () => {
      await deletePrayerRequest(id);
      router.refresh();
    });
  }

  if (requests.length === 0) {
    return <p className="text-sm text-stone-500">No prayer requests yet.</p>;
  }

  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <Card key={r.id} className="p-4">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-stone-800">{r.name}</span>
            {r.status === "praying" ? <Badge tone="amber">Praying</Badge> : null}
            {r.status === "answered" ? <Badge tone="green">Answered</Badge> : null}
          </div>
          <p className="whitespace-pre-wrap text-sm text-stone-700">{r.body}</p>
          <p className="mt-1 text-xs text-stone-400">
            <LocalDateTime iso={new Date(r.createdAt).toISOString()} />
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={r.status === "praying" ? "default" : "outline"}
              onClick={() => update(r.id, "praying")}
              disabled={pending}
            >
              Praying
            </Button>
            <Button
              size="sm"
              variant={r.status === "answered" ? "default" : "outline"}
              onClick={() => update(r.id, "answered")}
              disabled={pending}
            >
              <Check className="h-4 w-4" /> Answered
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => remove(r.id)}
              disabled={pending}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
