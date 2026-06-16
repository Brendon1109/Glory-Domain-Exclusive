"use client";
import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

export function InstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("gd_install_dismissed") === "1") return;
    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    localStorage.setItem("gd_install_dismissed", "1");
    setVisible(false);
  }

  if (!visible || !evt) return null;

  return (
    <div className="fixed inset-x-3 bottom-24 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 shadow-lg">
      <Download className="h-5 w-5 shrink-0 text-indigo-700" />
      <p className="flex-1 text-sm text-stone-700">
        Add Glory Domain to your home screen
      </p>
      <button
        type="button"
        onClick={async () => {
          await evt.prompt();
          setVisible(false);
        }}
        className="rounded-lg bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white"
      >
        Install
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="text-stone-400 hover:text-stone-700"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
