"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpenText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EnterPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    if (res.ok) {
      router.replace("/");
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "That passcode is not correct.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-ink px-6 py-12 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/30 bg-white/5 text-accent">
        <BookOpenText className="h-8 w-8" strokeWidth={1.6} />
      </div>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-paper">
        Glory Domain
      </h1>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-paper/60">
        Welcome, beloved. Enter the passcode your pastor shared to join the
        teachings, prayer and the Word.
      </p>

      <form
        onSubmit={submit}
        className="mt-9 w-full max-w-sm rounded-2xl bg-surface p-6 text-left shadow-xl"
      >
        <Label htmlFor="passcode">Group passcode</Label>
        <Input
          id="passcode"
          name="passcode"
          type="password"
          inputMode="text"
          autoComplete="off"
          autoFocus
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Enter passcode"
        />
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        <Button
          type="submit"
          size="lg"
          className="mt-4 w-full"
          disabled={loading || passcode.length === 0}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Enter
        </Button>
      </form>

      <p className="mt-6 text-xs text-paper/40">
        Don&apos;t have the passcode? Ask in the WhatsApp prayer group.
      </p>
    </main>
  );
}
