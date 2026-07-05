"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Pause, Play, Square } from "lucide-react";
import { cn } from "@/lib/utils";

type Verse = { n: number; t: string };
const RATES = [1, 1.25, 1.5, 0.75];

// speechSynthesis support never changes at runtime, so the store never emits.
const emptySubscribe = () => () => {};
const supportedSnapshot = () => "speechSynthesis" in window;
const supportedServerSnapshot = () => false;

export function ListenBar({
  verses,
  translation,
  onActiveVerse,
}: {
  verses: Verse[];
  translation: string;
  onActiveVerse: (n: number | null) => void;
}) {
  const supported = useSyncExternalStore(
    emptySubscribe,
    supportedSnapshot,
    supportedServerSnapshot,
  );
  const [status, setStatus] = useState<"idle" | "playing" | "paused">("idle");
  const [rateIdx, setRateIdx] = useState(0);
  const indexRef = useRef(0);
  const rateRef = useRef(RATES[0]);
  // Chrome garbage-collects utterances that aren't referenced, dropping their
  // onend events — keep the active one alive here. It also doubles as an
  // identity guard so onend fired by cancel() is ignored.
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  // Pending re-speak scheduled after a rate change (see cycleRate).
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current !== null) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    const pickVoice = () => {
      // getVoices() is often empty until voiceschanged fires.
      voiceRef.current =
        synth.getVoices().find((v) => v.lang.startsWith("en")) ?? null;
    };
    pickVoice();
    synth.addEventListener("voiceschanged", pickVoice);
    return () => {
      synth.removeEventListener("voiceschanged", pickVoice);
      clearRestartTimer();
      utteranceRef.current = null;
      synth.cancel();
    };
  }, [supported, clearRestartTimer]);

  // speechSynthesis is not background-capable media: on iOS the utterance
  // chain dies as soon as the screen auto-locks or the tab is hidden. Hold a
  // screen wake lock while playing (best-effort; iOS Safari 16.4+), and if the
  // page still gets hidden, fold to "paused" — indexRef keeps the verse, so a
  // single tap on Resume continues instead of the bar lying with "Pause".
  useEffect(() => {
    if (status !== "playing") return;
    let lock: WakeLockSentinel | null = null;
    let done = false;
    navigator.wakeLock
      ?.request("screen")
      .then((l) => {
        if (done) l.release().catch(() => {});
        else lock = l;
      })
      .catch(() => {});
    const onVisibility = () => {
      if (document.visibilityState !== "hidden") return;
      clearRestartTimer();
      utteranceRef.current = null;
      window.speechSynthesis.cancel();
      setStatus("paused");
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      done = true;
      document.removeEventListener("visibilitychange", onVisibility);
      lock?.release().catch(() => {});
    };
  }, [status, clearRestartTimer]);

  function speakVerse(i: number) {
    const verse = verses[i];
    if (!verse) return;
    const u = new SpeechSynthesisUtterance(verse.t);
    u.rate = rateRef.current;
    if (translation === "shona") {
      u.lang = "sn";
    } else {
      u.lang = "en-US";
      if (voiceRef.current) u.voice = voiceRef.current;
    }
    u.onend = () => {
      // cancel() also fires onend — only advance if this is still the
      // active utterance.
      if (utteranceRef.current !== u) return;
      utteranceRef.current = null;
      const next = i + 1;
      if (next < verses.length) {
        speakVerse(next);
      } else {
        indexRef.current = 0;
        setStatus("idle");
        onActiveVerse(null);
      }
    };
    u.onerror = () => {
      // A failed utterance (e.g. no voice for the language, synthesis-failed)
      // fires error *instead of* end, which would otherwise strand the bar in
      // "playing". Same identity guard as onend: newer engines report
      // cancel() as an "interrupted" error. Fold to "paused" so the position
      // is kept and one tap retries.
      if (utteranceRef.current !== u) return;
      utteranceRef.current = null;
      setStatus("paused");
    };
    utteranceRef.current = u;
    indexRef.current = i;
    onActiveVerse(verse.n);
    document
      .getElementById(`v${verse.n}`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
    window.speechSynthesis.speak(u);
  }

  function togglePlay() {
    clearRestartTimer();
    if (status === "playing") {
      // Native speechSynthesis.pause()/resume() is broken on iOS Safari, so
      // pause cancels outright and resume re-speaks the remembered verse.
      utteranceRef.current = null;
      window.speechSynthesis.cancel();
      setStatus("paused");
      return;
    }
    utteranceRef.current = null;
    window.speechSynthesis.cancel();
    setStatus("playing");
    speakVerse(status === "paused" ? indexRef.current : 0);
  }

  function stop() {
    clearRestartTimer();
    utteranceRef.current = null;
    window.speechSynthesis.cancel();
    indexRef.current = 0;
    setStatus("idle");
    onActiveVerse(null);
  }

  function cycleRate() {
    const next = (rateIdx + 1) % RATES.length;
    setRateIdx(next);
    rateRef.current = RATES[next];
    if (status === "playing") {
      // Restart the current verse at the new rate. cancel() of an actively
      // speaking utterance is processed asynchronously on iOS Safari and
      // Chrome for Android, and a speak() in the same tick gets flushed with
      // the queue — defer the re-speak so it survives.
      utteranceRef.current = null;
      window.speechSynthesis.cancel();
      clearRestartTimer();
      restartTimerRef.current = setTimeout(() => {
        restartTimerRef.current = null;
        speakVerse(indexRef.current);
      }, 100);
    }
  }

  if (!supported) return null;

  return (
    <div
      className={cn(
        "space-y-1.5",
        // Keep Pause/Stop reachable while playback auto-scrolls the chapter.
        status !== "idle" && "sticky top-14 z-20 bg-paper pb-1",
      )}
    >
      <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-2.5 py-1">
        <button
          type="button"
          onClick={togglePlay}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-xs font-semibold text-ink transition-colors hover:bg-stone-100"
        >
          {status === "playing" ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          {status === "idle"
            ? "Listen"
            : status === "playing"
              ? "Pause"
              : "Resume"}
        </button>
        {status !== "idle" ? (
          <button
            type="button"
            onClick={stop}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-xs font-semibold text-muted transition-colors hover:bg-stone-100 hover:text-ink"
          >
            <Square className="h-3.5 w-3.5" /> Stop
          </button>
        ) : null}
        <button
          type="button"
          onClick={cycleRate}
          className={cn(
            "ml-auto inline-flex min-h-11 items-center rounded-full bg-stone-100 px-3.5 text-xs font-semibold transition-colors",
            rateIdx === 0 ? "text-muted" : "text-ink",
          )}
        >
          {RATES[rateIdx]}x
        </button>
      </div>
      {translation === "shona" ? (
        <p className="text-xs text-faint">
          Listening works best with the KJV or WEB translations.
        </p>
      ) : null}
    </div>
  );
}
