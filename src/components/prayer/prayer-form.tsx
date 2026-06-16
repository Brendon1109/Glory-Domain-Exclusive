"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2 } from "lucide-react";
import { createPrayerRequest } from "@/server/actions/prayer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function PrayerForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setDone(false);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createPrayerRequest(fd);
      if (res?.error) {
        setError(res.error);
      } else {
        setDone(true);
        formRef.current?.reset();
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardContent>
        <form ref={formRef} onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="name">Your name (optional)</Label>
            <Input id="name" name="name" placeholder="Anonymous" maxLength={80} />
          </div>
          <div>
            <Label htmlFor="body">Prayer request</Label>
            <Textarea
              id="body"
              name="body"
              required
              placeholder="Share what you'd like prayer for…"
              maxLength={2000}
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {done ? (
            <p className="text-sm text-green-700">
              Thank you — your request has been shared. 🙏
            </p>
          ) : null}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Share request
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
