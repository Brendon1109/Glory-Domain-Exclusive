"use client";
import { useEffect, useState } from "react";
import { Bell, BellRing, Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

type State = "unknown" | "unsupported" | "off" | "on" | "busy";

export function NotifyButton() {
  const [state, setState] = useState<State>("unknown");
  const [hint, setHint] = useState("");

  useEffect(() => {
    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window &&
      !!VAPID;
    if (!supported) {
      setState("unsupported");
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? "on" : "off"))
      .catch(() => setState("off"));

    const iOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (iOS && !standalone) {
      setHint(
        "On iPhone: first add the app to your Home screen (Share → Add to Home Screen), then turn this on.",
      );
    }
  }, []);

  async function enable() {
    setState("busy");
    setHint("");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState("off");
        setHint("Notifications are blocked — allow them in your browser settings.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID as string),
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      setState("on");
    } catch {
      setState("off");
      setHint("Couldn’t turn on notifications. Please try again.");
    }
  }

  async function disable() {
    setState("busy");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("off");
    } catch {
      setState("off");
    }
  }

  if (state === "unknown" || state === "unsupported") return null;

  return (
    <div>
      {state === "on" ? (
        <button
          type="button"
          onClick={disable}
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
        >
          <BellRing className="h-5 w-5 text-accent" /> Daily message alerts are on
        </button>
      ) : (
        <button
          type="button"
          onClick={enable}
          disabled={state === "busy"}
          className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "w-full")}
        >
          {state === "busy" ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          Get the daily message
        </button>
      )}
      {hint ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
