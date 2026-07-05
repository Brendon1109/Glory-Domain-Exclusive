/**
 * Build a direct meet.jit.si link for a room. We open Jitsi in a new tab
 * instead of embedding it: embedded (iframe) calls on meet.jit.si are cut
 * after 5 minutes, direct visits are not.
 *
 * Options travel in the URL hash as `key=value` pairs joined with `&`
 * (see https://jitsi.github.io/handbook/docs/user-guide/user-guide-advanced).
 * Values are JSON-parsed by Jitsi, so strings must be JSON-encoded, e.g.
 * `#userInfo.displayName=%22Grace%22&config.startAudioOnly=true`.
 */
export function jitsiRoomUrl(
  roomName: string,
  opts?: { displayName?: string; audioOnly?: boolean; muted?: boolean },
): string {
  const params: string[] = [];
  if (opts?.displayName) {
    params.push(
      `userInfo.displayName=${encodeURIComponent(JSON.stringify(opts.displayName))}`,
    );
  }
  if (opts?.audioOnly) {
    params.push(
      "config.startAudioOnly=true",
      "config.startWithVideoMuted=true",
    );
  }
  if (opts?.muted) {
    params.push("config.startWithAudioMuted=true");
  }
  // Keep phones in the browser instead of pushing the Jitsi app install page.
  params.push("config.disableDeepLinking=true");
  // Skip Jitsi's prejoin screen (second name prompt + extra "Join meeting"
  // tap) — the app already collected the member's name. Matches the old
  // embed's `prejoinPageEnabled: false`.
  params.push("config.prejoinConfig.enabled=false");

  return `https://meet.jit.si/${encodeURIComponent(roomName)}#${params.join("&")}`;
}
