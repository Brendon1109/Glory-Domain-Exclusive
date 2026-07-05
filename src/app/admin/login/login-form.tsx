"use client";
import { useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    let res: Response;
    try {
      res = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setLoading(false);
      return;
    }
    if (res.ok) {
      // Hard navigation: guarantees the fresh session cookie is sent, avoids
      // the client router cache, and keeps the spinner up until the page swaps.
      window.location.replace("/admin");
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "That password is not correct.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-paper px-6 py-12 text-center">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-paper">
        <ShieldCheck className="h-7 w-7" strokeWidth={1.7} />
      </div>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
        Pastor Admin
      </h1>
      <p className="mt-2 max-w-xs text-sm text-muted">
        Sign in to schedule teachings, post worship and answer prayer requests.
      </p>

      <form
        onSubmit={submit}
        className="mt-8 w-full max-w-sm rounded-2xl border border-line bg-surface p-6 text-left shadow-sm"
      >
        <Label htmlFor="password">Admin password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter admin password"
        />
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        <Button
          type="submit"
          size="lg"
          className="mt-4 w-full"
          disabled={loading || password.length === 0}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Sign in
        </Button>
      </form>
    </main>
  );
}
