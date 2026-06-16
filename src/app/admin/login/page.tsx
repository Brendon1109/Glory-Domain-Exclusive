"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.replace("/admin");
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "That password is not correct.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-stone-100 px-6 py-12 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-700 text-white">
        <ShieldCheck className="h-8 w-8" />
      </div>
      <h1 className="text-xl font-bold text-stone-900">Pastor Admin</h1>
      <p className="mt-2 max-w-xs text-sm text-stone-500">
        Sign in to schedule teachings, post worship and answer prayer requests.
      </p>

      <form
        onSubmit={submit}
        className="mt-8 w-full max-w-sm rounded-2xl bg-white p-6 text-left shadow-md"
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
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <Button
          type="submit"
          size="lg"
          className="mt-4 w-full"
          disabled={loading || password.length === 0}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign in
        </Button>
      </form>
    </main>
  );
}
