/** Parse YouTube links into an embeddable form + thumbnail (no API key needed). */

export type ParsedYouTube = {
  type: "video" | "playlist";
  videoId?: string;
  playlistId?: string;
  embedUrl: string;
  thumbnail: string | null;
  watchUrl: string;
};

const PLACEHOLDER_THUMB = null;

export function parseYouTube(url: string): ParsedYouTube | null {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }

  const host = u.hostname.replace(/^www\./, "");
  let videoId: string | undefined;
  let playlistId: string | undefined = u.searchParams.get("list") ?? undefined;

  if (host === "youtu.be") {
    videoId = u.pathname.slice(1) || undefined;
  } else if (host.endsWith("youtube.com")) {
    if (u.pathname === "/watch") {
      videoId = u.searchParams.get("v") ?? undefined;
    } else if (u.pathname.startsWith("/embed/")) {
      videoId = u.pathname.split("/")[2] || undefined;
    } else if (u.pathname.startsWith("/shorts/")) {
      videoId = u.pathname.split("/")[2] || undefined;
    } else if (u.pathname === "/playlist") {
      playlistId = u.searchParams.get("list") ?? playlistId;
    }
  } else {
    return null;
  }

  if (!videoId && !playlistId) return null;

  if (videoId) {
    const embed = playlistId
      ? `https://www.youtube.com/embed/${videoId}?list=${playlistId}`
      : `https://www.youtube.com/embed/${videoId}`;
    return {
      type: playlistId ? "playlist" : "video",
      videoId,
      playlistId,
      embedUrl: `${embed}${embed.includes("?") ? "&" : "?"}rel=0`,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      watchUrl: url,
    };
  }

  // Playlist with no specific video id.
  return {
    type: "playlist",
    playlistId,
    embedUrl: `https://www.youtube.com/embed/videoseries?list=${playlistId}&rel=0`,
    thumbnail: PLACEHOLDER_THUMB,
    watchUrl: url,
  };
}
