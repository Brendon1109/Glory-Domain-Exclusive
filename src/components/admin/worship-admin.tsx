"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { createWorshipItem, deleteWorshipItem } from "@/server/actions/worship";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { WorshipItem } from "@/db/schema";

export function WorshipAdmin({ items }: { items: WorshipItem[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createWorshipItem(fd);
      if (res?.error) setError(res.error);
      else {
        formRef.current?.reset();
        router.refresh();
      }
    });
  }
  function remove(id: string) {
    if (!confirm("Remove this worship item?")) return;
    startTransition(async () => {
      await deleteWorshipItem(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <h2 className="mb-3 font-semibold text-stone-900">
            Add praise &amp; worship
          </h2>
          <form ref={formRef} onSubmit={create} className="space-y-3">
            <div>
              <Label htmlFor="w-title">Title</Label>
              <Input id="w-title" name="title" required placeholder="e.g. Sunday Worship Set" />
            </div>
            <div>
              <Label htmlFor="w-kind">Type</Label>
              <select
                id="w-kind"
                name="kind"
                className="h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-base text-stone-900"
              >
                <option value="playlist">Playlist</option>
                <option value="album">Album</option>
                <option value="song">Song</option>
              </select>
            </div>
            <div>
              <Label htmlFor="w-url">YouTube link</Label>
              <Input
                id="w-url"
                name="youtubeUrl"
                required
                placeholder="https://www.youtube.com/playlist?list=…"
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h2 className="font-semibold text-stone-900">
          Current worship ({items.length})
        </h2>
        {items.length === 0 ? (
          <p className="text-sm text-stone-500">Nothing yet.</p>
        ) : (
          items.map((i) => (
            <Card key={i.id} className="flex items-center justify-between gap-2 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-stone-900">
                  {i.title}
                </p>
                <p className="truncate text-xs text-stone-500">
                  {i.kind} · {i.youtubeUrl}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(i.id)}
                disabled={pending}
                className="shrink-0 text-stone-400 hover:text-red-600"
                aria-label="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
