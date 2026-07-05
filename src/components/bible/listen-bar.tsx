"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Pause, Play, Square } from "lucide-react";
import { cn } from "@/lib/utils";

type Verse = { n: number; t: string };
type VoicePref = "female" | "male";
const RATES = [1, 1.25, 1.5, 0.75];
const VOICE_PREF_KEY = "gd_voice_pref";

// speechSynthesis support never changes at runtime, so the store never emits.
const emptySubscribe = () => () => {};
const supportedSnapshot = () => "speechSynthesis" in window;
const supportedServerSnapshot = () => false;

// --- Device voice discovery --------------------------------------------------
// getVoices() returns a fresh array on every call and is often empty until
// voiceschanged fires; cache the list so useSyncExternalStore gets a stable
// snapshot and re-renders only when the set of voices actually changes.
const NO_VOICES: SpeechSynthesisVoice[] = [];
let voicesCache = NO_VOICES;
let voicesKey = "";
const subscribeVoices = (cb: () => void) => {
  if (!("speechSynthesis" in window)) return () => {};
  window.speechSynthesis.addEventListener("voiceschanged", cb);
  return () => window.speechSynthesis.removeEventListener("voiceschanged", cb);
};
const voicesSnapshot = () => {
  if (!("speechSynthesis" in window)) return NO_VOICES;
  const vs = window.speechSynthesis.getVoices();
  const key = vs.map((v) => v.voiceURI).join("|");
  if (key !== voicesKey) {
    voicesKey = key;
    voicesCache = vs;
  }
  return voicesCache;
};
const voicesServerSnapshot = () => NO_VOICES;

// Rank voices so the most natural one wins: platform "enhanced"/"natural"/
// "premium" voices first, legacy robotic engines and novelty voices last.
const GOOD = /(natural|neural|premium|enhanced|siri)/;
const ROBOTIC = /(compact|espeak|eloquence)/;
const NOVELTY =
  /\b(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox)\b/;
function scoreVoice(v: SpeechSynthesisVoice): number {
  const n = v.name.toLowerCase();
  let s = 0;
  if (GOOD.test(n)) s += 4;
  if (n.includes("google") || n.includes("microsoft")) s += 2;
  if (ROBOTIC.test(n)) s -= 6;
  if (NOVELTY.test(n)) s -= 8;
  return s;
}

// The Web Speech API doesn't expose gender, so infer it from well-known
// platform voice names (Apple, Google, Microsoft, Amazon).
const FEMALE =
  /\b(female|woman|samantha|ava|allison|susan|zira|aria|jenny|michelle|karen|moira|tessa|nicky|serena|martha|catherine|joanna|salli|kimberly|kendra|ivy|emma|olivia|libby|sonia|natasha|hazel|fiona|veena|kate|stephanie|lisa|amy|nicole|kathy|vicki|victoria|anna)\b/;
const MALE =
  /\b(male|man|daniel|aaron|fred|alex|arthur|oliver|david|mark|guy|ryan|christopher|eric|andrew|brian|matthew|justin|joey|rishi|james|william|thomas|george|lee|russell|liam|oscar|gordon)\b/;
function voiceGender(v: SpeechSynthesisVoice | null): VoicePref | null {
  if (!v) return null;
  const n = v.name.toLowerCase();
  // "female" contains "male", so check female first.
  if (FEMALE.test(n)) return "female";
  if (MALE.test(n)) return "male";
  return null;
}

function englishVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  return voices
    .filter((v) => v.lang.toLowerCase().startsWith("en"))
    .sort((a, b) => scoreVoice(b) - scoreVoice(a));
}

function pickVoice(
  english: SpeechSynthesisVoice[],
  pref: VoicePref | null,
): SpeechSynthesisVoice | null {
  if (english.length === 0) return null;
  if (pref) {
    const match = english.find((v) => voiceGender(v) === pref);
    if (match) return match;
  }
  return english[0];
}

const isApple =
  typeof navigator !== "undefined" &&
  /iphone|ipad|ipod/i.test(navigator.userAgent);

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
  const voices = useSyncExternalStore(
    subscribeVoices,
    voicesSnapshot,
    voicesServerSnapshot,
  );
  const english = useMemo(() => englishVoices(voices), [voices]);

  const [status, setStatus] = useState<"idle" | "playing" | "paused">("idle");
  const [rateIdx, setRateIdx] = useState(0);
  const [voicePref, setVoicePref] = useState<VoicePref | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const s = localStorage.getItem(VOICE_PREF_KEY);
      return s === "male" || s === "female" ? s : null;
    } catch {
      return null;
    }
  });
  const indexRef = useRef(0);
  const rateRef = useRef(RATES[0]);
  const englishRef = useRef(english);
  const prefRef = useRef(voicePref);
  // Chrome garbage-collects utterances that aren't referenced, dropping their
  // onend events — keep the active one alive here. It also doubles as an
  // identity guard so onend fired by cancel() is ignored.
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  // Pending re-speak scheduled after a rate/voice change (see restartCurrent).
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    englishRef.current = english;
    prefRef.current = voicePref;
  }, [english, voicePref]);

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current !== null) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!supported) return;
    return () => {
      clearRestartTimer();
      utteranceRef.current = null;
      window.speechSynthesis.cancel();
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
      const voice = pickVoice(englishRef.current, prefRef.current);
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
      } else {
        u.lang = "en-US";
      }
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

  // Restart the current verse with the latest rate/voice. cancel() of an
  // actively speaking utterance is processed asynchronously on iOS Safari and
  // Chrome for Android, and a speak() in the same tick gets flushed with the
  // queue — defer the re-speak so it survives.
  function restartCurrent() {
    utteranceRef.current = null;
    window.speechSynthesis.cancel();
    clearRestartTimer();
    restartTimerRef.current = setTimeout(() => {
      restartTimerRef.current = null;
      speakVerse(indexRef.current);
    }, 100);
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
    if (status === "playing") restartCurrent();
  }

  function choosePref(g: VoicePref) {
    setVoicePref(g);
    prefRef.current = g;
    try {
      localStorage.setItem(VOICE_PREF_KEY, g);
    } catch {
      // Storage may be blocked (private mode); the choice still applies now.
    }
    if (status === "playing") restartCurrent();
  }

  if (!supported) return null;

  const hasBothGenders =
    translation !== "shona" &&
    english.some((v) => voiceGender(v) === "female") &&
    english.some((v) => voiceGender(v) === "male");
  const activeGender =
    voicePref ?? voiceGender(pickVoice(english, null));
  // No enhanced/natural voice on this Apple device — the robotic compact
  // default is all we have, so point the listener at the free upgrade.
  const showAppleTip =
    isApple &&
    translation !== "shona" &&
    english.length > 0 &&
    scoreVoice(english[0]) < 4;

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
      {hasBothGenders ? (
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>Voice</span>
          <div className="flex rounded-full bg-stone-100 p-0.5">
            {(["female", "male"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => choosePref(g)}
                className={cn(
                  "min-h-9 rounded-full px-3.5 text-xs font-semibold capitalize transition-colors",
                  activeGender === g
                    ? "bg-surface text-ink shadow-sm"
                    : "text-faint",
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {translation === "shona" ? (
        <p className="text-xs text-faint">
          Listening works best with the KJV or WEB translations.
        </p>
      ) : null}
      {showAppleTip ? (
        <p className="text-xs text-faint">
          For a much more natural voice on iPhone: Settings &rarr;
          Accessibility &rarr; Spoken Content &rarr; Voices &rarr; English,
          then download an Enhanced voice (e.g. Ava or Evan). The app will use
          it automatically.
        </p>
      ) : null}
    </div>
  );
}
