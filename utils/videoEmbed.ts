export interface VideoEmbedDetails {
  provider: "youtube" | "vimeo" | "twitch";
  embedUrl: string;
  id: string;
  externalUrl: string;
  mayRequireExternalFallback: boolean;
}

export interface VideoEmbedContext {
  origin?: string | null;
  runtime?: "web" | "desktop";
  autoplay?: boolean;
}

const buildEmbedUrl = (
  baseUrl: string,
  params: Record<string, string>,
): string => {
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
    (item) =>
      item === "embed" || item === "shorts" || item === "live" || item === "v",
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

const getWindowOrigin = (): string | null => {
  if (typeof window === "undefined") return null;

  const { origin, protocol } = window.location;
  if (!origin || (protocol !== "http:" && protocol !== "https:")) {
    return null;
  }

  return origin;
};

const getDefaultVideoContext = (): Required<VideoEmbedContext> => ({
  autoplay: true,
  origin: getWindowOrigin(),
  runtime:
    typeof window !== "undefined" &&
    ((
      window as Window & {
        __TAURI__?: unknown;
        __TAURI_INTERNALS__?: unknown;
      }
    ).__TAURI__ ||
      (
        window as Window & {
          __TAURI__?: unknown;
          __TAURI_INTERNALS__?: unknown;
        }
      ).__TAURI_INTERNALS__)
      ? "desktop"
      : "web",
});

const resolveVideoContext = (
  context?: VideoEmbedContext,
): Required<VideoEmbedContext> => ({
  ...getDefaultVideoContext(),
  ...context,
});

const buildYouTubeEmbedUrl = (
  id: string,
  context?: VideoEmbedContext,
): string => {
  const { autoplay, origin } = resolveVideoContext(context);
  const params: Record<string, string> = {
    autoplay: autoplay ? "1" : "0",
    enablejsapi: "1",
    playsinline: "1",
    rel: "0",
  };

  if (origin) {
    params.origin = origin;
  }

  return buildEmbedUrl(`https://www.youtube.com/embed/${id}`, params);
};

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

export function getVideoEmbedDetails(
  url: string,
  context?: VideoEmbedContext,
): VideoEmbedDetails | null {
  if (!url) return null;

  const resolvedContext = resolveVideoContext(context);

  const youtubeId = getYouTubeVideoId(url);
  if (youtubeId) {
    return {
      provider: "youtube",
      id: youtubeId,
      embedUrl: buildYouTubeEmbedUrl(youtubeId, resolvedContext),
      externalUrl: url,
      mayRequireExternalFallback: resolvedContext.runtime === "desktop",
    };
  }

  const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      provider: "vimeo",
      id: vimeoMatch[1],
      embedUrl: buildVimeoEmbedUrl(vimeoMatch[1]),
      externalUrl: url,
      mayRequireExternalFallback: false,
    };
  }

  const twitchMatch = url.match(/(?:twitch\.tv\/)([^"&?/\s]+)/i);
  if (twitchMatch && twitchMatch[1]) {
    return {
      provider: "twitch",
      id: twitchMatch[1],
      embedUrl: buildTwitchEmbedUrl(twitchMatch[1]),
      externalUrl: url,
      mayRequireExternalFallback: false,
    };
  }

  return null;
}

export function getVideoEmbed(url: string): string | null {
  return getVideoEmbedDetails(url)?.embedUrl ?? null;
}
