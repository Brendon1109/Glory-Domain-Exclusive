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
    <main className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-indigo-700 to-indigo-900 px-6 py-12 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-amber-300">
        <BookOpenText className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold text-white">Glory Domain</h1>
      <p className="mt-2 max-w-xs text-sm text-indigo-100">
        Welcome, beloved. Enter the passcode your pastor shared to join the
        teachings, prayer and the Word.
      </p>

      <form
        onSubmit={submit}
        className="mt-8 w-full max-w-sm rounded-2xl bg-white p-6 text-left shadow-xl"
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
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <Button
          type="submit"
          size="lg"
          className="mt-4 w-full"
          disabled={loading || passcode.length === 0}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Enter
        </Button>
      </form>

      <p className="mt-6 text-xs text-indigo-200">
        Don&apos;t have the passcode? Ask in the WhatsApp prayer group.
      </p>
    </main>
  );
}
