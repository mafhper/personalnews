import {
  extractYouTubeFeedFromHtml,
  parseYouTubeUrl,
  resolutionFromDirectDescriptor,
  type YouTubeFeedResolution,
} from "../../../shared/youtubeFeedResolver";
import { SecurityValidationError, validateTargetFeedUrl } from "./security";

const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MAX_FEED_BYTES = 3 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 12_000;
const YOUTUBE_PAGE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
]);

export class YouTubeResolutionError extends Error {
  constructor(
    message: string,
    readonly status = 422,
    readonly code = "youtube_resolution_failed",
  ) {
    super(message);
    this.name = "YouTubeResolutionError";
  }
}

async function readTextWithLimit(response: Response, maxBytes: number): Promise<string> {
  const declaredLength = Number.parseInt(response.headers.get("content-length") || "0", 10);
  if (declaredLength > maxBytes) {
    throw new YouTubeResolutionError("YouTube response exceeded the allowed size", 502, "response_too_large");
  }

  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new YouTubeResolutionError("YouTube response exceeded the allowed size", 502, "response_too_large");
  }
  return text;
}

async function fetchValidatedYouTubePage(
  pageUrl: string,
  fetchImpl: typeof fetch,
): Promise<string> {
  let current = await validateTargetFeedUrl(pageUrl);

  for (let redirects = 0; redirects <= 3; redirects += 1) {
    if (!YOUTUBE_PAGE_HOSTS.has(current.hostname.toLowerCase())) {
      throw new SecurityValidationError("YouTube resolver redirects must stay on YouTube", 403);
    }

    const response = await fetchImpl(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.7",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36 PersonalNews/1.0",
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new YouTubeResolutionError("YouTube returned an invalid redirect", 502);
      current = await validateTargetFeedUrl(new URL(location, current).toString());
      continue;
    }

    if (!response.ok) {
      throw new YouTubeResolutionError(
        `YouTube channel page returned HTTP ${response.status}`,
        response.status === 404 ? 404 : 502,
        response.status === 404 ? "youtube_source_not_found" : "youtube_upstream_error",
      );
    }
    return readTextWithLimit(response, MAX_HTML_BYTES);
  }

  throw new YouTubeResolutionError("Too many YouTube redirects", 508, "too_many_redirects");
}

function decodeXmlText(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

async function validateResolution(
  resolution: YouTubeFeedResolution,
  fetchImpl: typeof fetch,
): Promise<YouTubeFeedResolution> {
  const validatedUrl = await validateTargetFeedUrl(resolution.feedUrl);
  if (validatedUrl.hostname !== "www.youtube.com" || validatedUrl.pathname !== "/feeds/videos.xml") {
    throw new SecurityValidationError("Resolved feed must be a canonical YouTube feed", 403);
  }

  const response = await fetchImpl(validatedUrl, {
    redirect: "error",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      Accept: "application/atom+xml,application/xml,text/xml",
      "User-Agent": "PersonalNews/1.0 YouTube feed validation",
    },
  });
  if (!response.ok) {
    throw new YouTubeResolutionError(
      `Resolved YouTube feed returned HTTP ${response.status}`,
      response.status === 404 ? 404 : 502,
      "invalid_youtube_feed",
    );
  }

  const content = await readTextWithLimit(response, MAX_FEED_BYTES);
  if (!/<feed\b/i.test(content) || !/<entry\b/i.test(content)) {
    throw new YouTubeResolutionError("Resolved URL is not a usable YouTube Atom feed", 422, "invalid_youtube_feed");
  }
  const title = content.match(/<title(?:\s[^>]*)?>([\s\S]*?)<\/title>/i)?.[1];
  return {
    ...resolution,
    title: title ? decodeXmlText(title) : resolution.title,
    validated: true,
  };
}

export async function resolveYouTubeFeed(
  inputUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<YouTubeFeedResolution> {
  const descriptor = parseYouTubeUrl(inputUrl);
  if (!descriptor) {
    throw new YouTubeResolutionError("Unsupported YouTube URL", 400, "unsupported_youtube_url");
  }

  const direct = resolutionFromDirectDescriptor(descriptor);
  if (direct) return validateResolution(direct, fetchImpl);

  if (!("pageUrl" in descriptor)) {
    throw new YouTubeResolutionError("Unsupported YouTube URL", 400, "unsupported_youtube_url");
  }

  let pageUrl = descriptor.pageUrl;
  if (descriptor.kind === "video") {
    try {
      const oembedUrl = new URL("https://www.youtube.com/oembed");
      oembedUrl.searchParams.set("url", descriptor.pageUrl);
      oembedUrl.searchParams.set("format", "json");
      const response = await fetchImpl(oembedUrl, {
        redirect: "error",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: { Accept: "application/json" },
      });
      if (response.ok) {
        const payload = JSON.parse(await readTextWithLimit(response, 128 * 1024)) as {
          author_url?: unknown;
        };
        if (typeof payload.author_url === "string") {
          const authorDescriptor = parseYouTubeUrl(payload.author_url);
          if (authorDescriptor && "pageUrl" in authorDescriptor) pageUrl = authorDescriptor.pageUrl;
        }
      }
    } catch {
      // Fall back to the video page when oEmbed is temporarily unavailable.
    }
  }

  const html = await fetchValidatedYouTubePage(pageUrl, fetchImpl);
  const discovered = extractYouTubeFeedFromHtml(html, descriptor.originalUrl);
  if (!discovered) {
    throw new YouTubeResolutionError(
      "No RSS feed was found on the YouTube page",
      404,
      "youtube_feed_not_found",
    );
  }
  return validateResolution(discovered, fetchImpl);
}
