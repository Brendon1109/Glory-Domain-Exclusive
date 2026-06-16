"use client";
import { useEffect, useRef } from "react";

type JitsiApi = {
  dispose: () => void;
  addEventListener: (event: string, cb: (payload: unknown) => void) => void;
  executeCommand: (command: string, ...args: unknown[]) => void;
};

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (
      domain: string,
      options: Record<string, unknown>,
    ) => JitsiApi;
  }
}

const SCRIPT_ID = "jitsi-external-api";
const DOMAIN = "meet.jit.si";

/**
 * Embeds a Jitsi meeting using the External API script (loaded client-side
 * only, so it never runs during SSR). The whole Jitsi integration lives here,
 * so switching to 8x8 JaaS later is a localized change.
 */
export function JitsiRoom({
  roomName,
  displayName,
  audioOnly,
}: {
  roomName: string;
  displayName: string;
  audioOnly: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<JitsiApi | null>(null);

  useEffect(() => {
    let cancelled = false;

    function start() {
      if (cancelled || !containerRef.current || !window.JitsiMeetExternalAPI) {
        return;
      }
      apiRef.current = new window.JitsiMeetExternalAPI(DOMAIN, {
        roomName,
        parentNode: containerRef.current,
        userInfo: { displayName },
        configOverwrite: {
          startAudioOnly: audioOnly,
          startWithAudioMuted: true,
          startWithVideoMuted: audioOnly,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
        },
        interfaceConfigOverwrite: {
          MOBILE_APP_PROMO: false,
          SHOW_JITSI_WATERMARK: false,
        },
      });
    }

    if (window.JitsiMeetExternalAPI) {
      start();
    } else {
      const existing = document.getElementById(
        SCRIPT_ID,
      ) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener("load", start);
      } else {
        const script = document.createElement("script");
        script.id = SCRIPT_ID;
        script.src = `https://${DOMAIN}/external_api.js`;
        script.async = true;
        script.onload = start;
        document.body.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      try {
        apiRef.current?.dispose();
      } catch {
        /* ignore */
      }
    };
  }, [roomName, displayName, audioOnly]);

  return <div ref={containerRef} className="h-full w-full" />;
}
