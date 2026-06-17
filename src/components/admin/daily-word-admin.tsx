"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { createDailyWord, deleteDailyWord } from "@/server/actions/daily-word";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LocalDateTime } from "@/components/local-datetime";
import type { DailyWord } from "@/db/schema";

export function DailyWordAdmin({ words }: { words: DailyWord[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createDailyWord(fd);
      if (res?.error) setError(res.error);
      else {
        formRef.current?.reset();
        router.refresh();
      }
    });
  }
  function remove(id: string) {
    if (!confirm("Delete this teaching?")) return;
    startTransition(async () => {
      await deleteDailyWord(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <h2 className="mb-1 font-display text-lg font-semibold text-ink">
            Post today&apos;s word
          </h2>
          <p className="mb-3 text-xs text-muted">
            The most recent teaching shows on every member&apos;s home screen.
          </p>
          <form ref={formRef} onSubmit={create} className="space-y-3">
            <div>
              <Label htmlFor="dw-title">Title (optional)</Label>
              <Input id="dw-title" name="title" placeholder="e.g. Walking in Faith" maxLength={160} />
            </div>
            <div>
              <Label htmlFor="dw-body">Teaching</Label>
              <Textarea
                id="dw-body"
                name="body"
                required
                className="min-h-40"
                placeholder="Write today's teaching for the church family…"
                maxLength={8000}
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Post teaching
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-ink">
          Past teachings ({words.length})
        </h2>
        {words.length === 0 ? (
          <p className="text-sm text-muted">Nothing posted yet.</p>
        ) : (
          words.map((w) => (
            <Card key={w.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  {w.title ? (
                    <p className="font-medium text-ink">{w.title}</p>
                  ) : null}
                  <p className="mt-0.5 line-clamp-3 whitespace-pre-wrap text-sm text-muted">
                    {w.body}
                  </p>
                  <p className="mt-1 text-xs text-faint">
                    <LocalDateTime
                      iso={new Date(w.createdAt).toISOString()}
                      mode="date"
                    />
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(w.id)}
                  disabled={pending}
                  className="shrink-0 text-faint hover:text-red-600"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
