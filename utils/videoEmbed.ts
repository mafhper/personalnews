export interface VideoEmbedDetails {
  provider: "youtube" | "vimeo" | "twitch";
  embedUrl: string;
  id: string;
}

const buildEmbedUrl = (baseUrl: string, params: Record<string, string>): string => {
  const parsed = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    parsed.searchParams.set(key, value);
  });
  return parsed.toString();
};

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

const getWindowHostname = (): string => {
  if (typeof window === "undefined") return "localhost";

  const hostname = window.location.hostname.trim();
  return hostname || "localhost";
};

const buildYouTubeEmbedUrl = (id: string): string =>
  buildEmbedUrl(`https://www.youtube.com/embed/${id}`, {
    autoplay: "1",
    modestbranding: "1",
    rel: "0",
  });

const buildVimeoEmbedUrl = (id: string): string =>
  buildEmbedUrl(`https://player.vimeo.com/video/${id}`, {
    autoplay: "1",
  });

const buildTwitchEmbedUrl = (channel: string): string =>
  buildEmbedUrl("https://player.twitch.tv/", {
    channel,
    parent: getWindowHostname(),
    muted: "false",
  });

export function getVideoEmbedDetails(url: string): VideoEmbedDetails | null {
  if (!url) return null;

  const youtubeId = getYouTubeVideoId(url);
  if (youtubeId) {
    return {
      provider: "youtube",
      id: youtubeId,
      embedUrl: buildYouTubeEmbedUrl(youtubeId),
    };
  }

  const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      provider: "vimeo",
      id: vimeoMatch[1],
      embedUrl: buildVimeoEmbedUrl(vimeoMatch[1]),
    };
  }

  const twitchMatch = url.match(/(?:twitch\.tv\/)([^"&?/\s]+)/i);
  if (twitchMatch && twitchMatch[1]) {
    return {
      provider: "twitch",
      id: twitchMatch[1],
      embedUrl: buildTwitchEmbedUrl(twitchMatch[1]),
    };
  }

  return null;
}

export function getVideoEmbed(url: string): string | null {
  return getVideoEmbedDetails(url)?.embedUrl ?? null;
}
