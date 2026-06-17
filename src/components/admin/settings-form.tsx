"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { updateSettings } from "@/server/actions/settings";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Settings } from "@/db/schema";

export function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [pending, startTransition] = useTransition();

  function saveSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");
    setErr("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await updateSettings(fd);
      if (r?.error) setErr(r.error);
      else {
        setMsg("Settings saved.");
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardContent>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">
          App settings
        </h2>
        <form onSubmit={saveSettings} className="space-y-3">
          <div>
            <Label htmlFor="s-name">Ministry name</Label>
            <Input id="s-name" name="ministryName" defaultValue={settings.ministryName} required />
          </div>
          <div>
            <Label htmlFor="s-chat">WhatsApp — message the pastor</Label>
            <Input
              id="s-chat"
              name="whatsappChatUrl"
              defaultValue={settings.whatsappChatUrl ?? ""}
              placeholder="https://wa.me/263716976332"
            />
          </div>
          <div>
            <Label htmlFor="s-group">WhatsApp — group invite link</Label>
            <Input
              id="s-group"
              name="whatsappGroupUrl"
              defaultValue={settings.whatsappGroupUrl ?? ""}
              placeholder="https://chat.whatsapp.com/…"
            />
          </div>

          <hr className="border-line" />
          <p className="text-sm font-medium text-ink">
            Daily verse override (optional)
          </p>
          <p className="text-xs text-muted">
            Leave blank to use the automatic verse of the day.
          </p>
          <div>
            <Label htmlFor="s-ref">Reference</Label>
            <Input
              id="s-ref"
              name="dailyVerseOverrideRef"
              defaultValue={settings.dailyVerseOverrideRef ?? ""}
              placeholder="e.g. John 3:16"
            />
          </div>
          <div>
            <Label htmlFor="s-text">Verse text</Label>
            <Textarea
              id="s-text"
              name="dailyVerseOverrideText"
              defaultValue={settings.dailyVerseOverrideText ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="s-date">Only on this date (optional)</Label>
            <Input
              id="s-date"
              type="date"
              name="dailyVerseOverrideDate"
              defaultValue={settings.dailyVerseOverrideDate ?? ""}
            />
          </div>

          {err ? <p className="text-sm text-red-600">{err}</p> : null}
          {msg ? <p className="text-sm text-green-700">{msg}</p> : null}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save settings
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
