export type YouTubeSourceKind = "channel" | "playlist";

export type YouTubeResolutionMethod =
  | "direct-feed"
  | "direct-channel-id"
  | "direct-playlist-id"
  | "youtube-api-handle"
  | "youtube-api-username"
  | "youtube-api-video"
  | "html-link"
  | "html-channel-id";

export interface YouTubeFeedResolution {
  originalUrl: string;
  feedUrl: string;
  title?: string;
  kind: YouTubeSourceKind;
  method: YouTubeResolutionMethod;
  channelId?: string;
  playlistId?: string;
  validated?: boolean;
}

export type YouTubeUrlDescriptor =
  | { kind: "channel-id"; originalUrl: string; channelId: string; feedUrl: string }
  | { kind: "playlist"; originalUrl: string; playlistId: string; feedUrl: string }
  | { kind: "feed"; originalUrl: string; feedUrl: string; channelId?: string; playlistId?: string }
  | { kind: "handle"; originalUrl: string; handle: string; pageUrl: string }
  | { kind: "username"; originalUrl: string; username: string; pageUrl: string }
  | { kind: "custom"; originalUrl: string; customName: string; pageUrl: string }
  | { kind: "video"; originalUrl: string; videoId: string; pageUrl: string };

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
]);

const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{6,20}$/;
const CHANNEL_ID_PATTERN = /^UC[A-Za-z0-9_-]{20,30}$/;
const PLAYLIST_ID_PATTERN = /^[A-Za-z0-9_-]{10,80}$/;

export const buildYouTubeChannelFeedUrl = (channelId: string): string =>
  `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;

export const buildYouTubePlaylistFeedUrl = (playlistId: string): string =>
  `https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(playlistId)}`;

function normalizeInputUrl(input: string): URL | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    return new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
}

function canonicalPageUrl(pathname: string): string {
  return `https://www.youtube.com${pathname}`;
}

export function parseYouTubeUrl(input: string): YouTubeUrlDescriptor | null {
  const parsed = normalizeInputUrl(input);
  if (!parsed) return null;

  const host = parsed.hostname.toLowerCase();
  const originalUrl = input.trim();
  const segments = parsed.pathname.split("/").filter(Boolean);

  if (host === "youtu.be") {
    const videoId = segments[0] || "";
    return VIDEO_ID_PATTERN.test(videoId)
      ? {
          kind: "video",
          originalUrl,
          videoId,
          pageUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
        }
      : null;
  }

  if (!YOUTUBE_HOSTS.has(host)) return null;

  if (parsed.pathname === "/feeds/videos.xml") {
    const channelId = parsed.searchParams.get("channel_id") || undefined;
    const playlistId = parsed.searchParams.get("playlist_id") || undefined;
    if (channelId && CHANNEL_ID_PATTERN.test(channelId)) {
      return {
        kind: "feed",
        originalUrl,
        channelId,
        feedUrl: buildYouTubeChannelFeedUrl(channelId),
      };
    }
    if (playlistId && PLAYLIST_ID_PATTERN.test(playlistId)) {
      return {
        kind: "feed",
        originalUrl,
        playlistId,
        feedUrl: buildYouTubePlaylistFeedUrl(playlistId),
      };
    }
    return null;
  }

  const playlistId = parsed.searchParams.get("list");
  if (playlistId && PLAYLIST_ID_PATTERN.test(playlistId)) {
    return {
      kind: "playlist",
      originalUrl,
      playlistId,
      feedUrl: buildYouTubePlaylistFeedUrl(playlistId),
    };
  }

  if (segments[0] === "channel" && CHANNEL_ID_PATTERN.test(segments[1] || "")) {
    const channelId = segments[1];
    return {
      kind: "channel-id",
      originalUrl,
      channelId,
      feedUrl: buildYouTubeChannelFeedUrl(channelId),
    };
  }

  if (segments[0]?.startsWith("@") && segments[0].length > 1) {
    const handle = decodeURIComponent(segments[0].slice(1));
    return {
      kind: "handle",
      originalUrl,
      handle,
      pageUrl: canonicalPageUrl(`/@${encodeURIComponent(handle)}`),
    };
  }

  if (segments[0] === "user" && segments[1]) {
    const username = decodeURIComponent(segments[1]);
    return {
      kind: "username",
      originalUrl,
      username,
      pageUrl: canonicalPageUrl(`/user/${encodeURIComponent(username)}`),
    };
  }

  if (segments[0] === "c" && segments[1]) {
    const customName = decodeURIComponent(segments[1]);
    return {
      kind: "custom",
      originalUrl,
      customName,
      pageUrl: canonicalPageUrl(`/c/${encodeURIComponent(customName)}`),
    };
  }

  let videoId = "";
  if (parsed.pathname === "/watch") videoId = parsed.searchParams.get("v") || "";
  if (["shorts", "live", "embed"].includes(segments[0] || "")) {
    videoId = segments[1] || "";
  }
  if (VIDEO_ID_PATTERN.test(videoId)) {
    return {
      kind: "video",
      originalUrl,
      videoId,
      pageUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
    };
  }

  return null;
}

function decodeHtmlAttribute(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&#38;/g, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'");
}

function readTagAttributes(tag: string): Map<string, string> {
  const attributes = new Map<string, string>();
  const pattern = /([:\w-]+)\s*=\s*(["'])(.*?)\2/gs;
  for (const match of tag.matchAll(pattern)) {
    attributes.set(match[1].toLowerCase(), decodeHtmlAttribute(match[3]));
  }
  return attributes;
}

export function extractYouTubeFeedFromHtml(
  html: string,
  originalUrl: string,
): YouTubeFeedResolution | null {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const attributes = readTagAttributes(match[0]);
    if ((attributes.get("type") || "").toLowerCase() !== "application/rss+xml") continue;
    const href = attributes.get("href");
    if (!href) continue;
    const descriptor = parseYouTubeUrl(href);
    if (!descriptor || !('feedUrl' in descriptor)) continue;
    const channelId = "channelId" in descriptor ? descriptor.channelId : undefined;
    const playlistId = "playlistId" in descriptor ? descriptor.playlistId : undefined;
    return {
      originalUrl,
      feedUrl: descriptor.feedUrl,
      kind: playlistId ? "playlist" : "channel",
      method: "html-link",
      channelId,
      playlistId,
    };
  }

  const channelPatterns = [
    /itemprop=["']channelId["']\s+content=["'](UC[A-Za-z0-9_-]+)["']/i,
    /content=["'](UC[A-Za-z0-9_-]+)["']\s+itemprop=["']channelId["']/i,
    /["']externalId["']\s*:\s*["'](UC[A-Za-z0-9_-]+)["']/i,
    /["']channelId["']\s*:\s*["'](UC[A-Za-z0-9_-]+)["']/i,
    /["']browseId["']\s*:\s*["'](UC[A-Za-z0-9_-]+)["']/i,
  ];

  for (const pattern of channelPatterns) {
    const channelId = html.match(pattern)?.[1];
    if (!channelId || !CHANNEL_ID_PATTERN.test(channelId)) continue;
    return {
      originalUrl,
      feedUrl: buildYouTubeChannelFeedUrl(channelId),
      kind: "channel",
      method: "html-channel-id",
      channelId,
    };
  }

  return null;
}

export function resolutionFromDirectDescriptor(
  descriptor: YouTubeUrlDescriptor,
): YouTubeFeedResolution | null {
  if (!("feedUrl" in descriptor)) return null;
  const channelId = "channelId" in descriptor ? descriptor.channelId : undefined;
  const playlistId = "playlistId" in descriptor ? descriptor.playlistId : undefined;
  const isPlaylist = Boolean(playlistId);
  const method: YouTubeResolutionMethod =
    descriptor.kind === "feed"
      ? "direct-feed"
      : isPlaylist
        ? "direct-playlist-id"
        : "direct-channel-id";
  return {
    originalUrl: descriptor.originalUrl,
    feedUrl: descriptor.feedUrl,
    kind: isPlaylist ? "playlist" : "channel",
    method,
    channelId,
    playlistId,
  };
}
