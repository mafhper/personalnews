export interface VideoEmbedDetails {
  provider: "youtube" | "vimeo" | "twitch";
  embedUrl: string;
  id: string;
}

const getSafeUrl = (value: string): URL | null => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

const getYouTubeVideoId = (value: string): string | null => {
  const parsed = getSafeUrl(value);
  if (!parsed) return null;

  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = parsed.pathname.replace(/^\/+/, "").split("/")[0];
    return id || null;
  }

  if (!host.endsWith("youtube.com")) return null;

  const queryId = parsed.searchParams.get("v");
  if (queryId) return queryId;

  const parts = parsed.pathname.split("/").filter(Boolean);
  const markerIndex = parts.findIndex(
    (item) => item === "embed" || item === "shorts" || item === "live" || item === "v",
  );

  if (markerIndex >= 0 && parts[markerIndex + 1]) {
    return parts[markerIndex + 1];
  }

  return null;
};

export function getVideoEmbedDetails(url: string): VideoEmbedDetails | null {
  if (!url) return null;

  const youtubeId = getYouTubeVideoId(url);
  if (youtubeId) {
    return {
      provider: "youtube",
      id: youtubeId,
      embedUrl: `https://www.youtube.com/embed/${youtubeId}?autoplay=1&modestbranding=1&rel=0`,
    };
  }

  const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      provider: "vimeo",
      id: vimeoMatch[1],
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
    };
  }

  const twitchMatch = url.match(/(?:twitch\.tv\/)([^"&?/\s]+)/i);
  if (twitchMatch && twitchMatch[1]) {
    const parent =
      typeof window !== "undefined" ? window.location.hostname : "localhost";
    return {
      provider: "twitch",
      id: twitchMatch[1],
      embedUrl: `https://player.twitch.tv/?channel=${twitchMatch[1]}&parent=${parent}&muted=false`,
    };
  }

  return null;
}

export function getVideoEmbed(url: string): string | null {
  return getVideoEmbedDetails(url)?.embedUrl ?? null;
}
