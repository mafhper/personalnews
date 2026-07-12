import {
  extractYouTubeFeedFromHtml,
  parseYouTubeUrl,
  resolutionFromDirectDescriptor,
  type YouTubeFeedResolution,
  type YouTubeUrlDescriptor,
} from "../../../shared/youtubeFeedResolver";

interface Env {
  ALLOWED_ORIGINS: string;
}

const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MAX_FEED_BYTES = 3 * 1024 * 1024;
const PAGE_TIMEOUT_MS = 12_000;

class ResolverError extends Error {
  constructor(
    message: string,
    readonly status = 422,
    readonly code = "youtube_resolution_failed",
  ) {
    super(message);
  }
}

function allowedOrigin(request: Request, env: Env): string | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  const allowed = env.ALLOWED_ORIGINS.split(",").map((item) => item.trim());
  return allowed.includes(origin) ? origin : null;
}

function corsHeaders(origin: string | null): HeadersInit {
  return {
    ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
    Vary: "Origin",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Accept,Content-Type",
  };
}

function json(
  body: unknown,
  status: number,
  origin: string | null,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Cache-Control": "no-store",
    },
  });
}

async function fetchTextWithLimit(
  url: string,
  maxBytes: number,
  accept: string,
): Promise<string> {
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(PAGE_TIMEOUT_MS),
    headers: {
      Accept: accept,
      "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.7",
      "User-Agent":
        "Mozilla/5.0 (compatible; PersonalNewsFeedResolver/1.0; +https://github.com/mafhper/personalnews)",
    },
  });
  if (!response.ok) {
    throw new ResolverError(
      `YouTube returned HTTP ${response.status}`,
      response.status === 404 ? 404 : 502,
      response.status === 404 ? "youtube_source_not_found" : "youtube_upstream_error",
    );
  }
  const declaredLength = Number.parseInt(response.headers.get("content-length") || "0", 10);
  if (declaredLength > maxBytes) {
    throw new ResolverError("YouTube response exceeded the allowed size", 502, "response_too_large");
  }
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new ResolverError("YouTube response exceeded the allowed size", 502, "response_too_large");
  }
  return text;
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

async function validateFeed(
  resolution: YouTubeFeedResolution,
): Promise<YouTubeFeedResolution> {
  const feedUrl = new URL(resolution.feedUrl);
  if (feedUrl.hostname !== "www.youtube.com" || feedUrl.pathname !== "/feeds/videos.xml") {
    throw new ResolverError("Resolved feed is not a canonical YouTube feed", 403, "invalid_feed_host");
  }
  const xml = await fetchTextWithLimit(
    resolution.feedUrl,
    MAX_FEED_BYTES,
    "application/atom+xml,application/xml,text/xml",
  );
  if (!/<feed\b/i.test(xml) || !/<entry\b/i.test(xml)) {
    throw new ResolverError("Resolved URL is not a usable YouTube Atom feed", 422, "invalid_youtube_feed");
  }
  const title = xml.match(/<title(?:\s[^>]*)?>([\s\S]*?)<\/title>/i)?.[1];
  return {
    ...resolution,
    title: title ? decodeXmlText(title) : resolution.title,
    validated: true,
  };
}

async function resolveDescriptor(
  descriptor: YouTubeUrlDescriptor,
): Promise<YouTubeFeedResolution> {
  const direct = resolutionFromDirectDescriptor(descriptor);
  if (direct) return validateFeed(direct);

  if (!("pageUrl" in descriptor)) {
    throw new ResolverError("Unsupported YouTube URL", 400, "unsupported_youtube_url");
  }

  let pageUrl = descriptor.pageUrl;
  if (descriptor.kind === "video") {
    try {
      const oembedUrl = new URL("https://www.youtube.com/oembed");
      oembedUrl.searchParams.set("url", descriptor.pageUrl);
      oembedUrl.searchParams.set("format", "json");
      const oembedText = await fetchTextWithLimit(
        oembedUrl.toString(),
        128 * 1024,
        "application/json",
      );
      const authorUrl = (JSON.parse(oembedText) as { author_url?: unknown }).author_url;
      if (typeof authorUrl === "string") {
        const authorDescriptor = parseYouTubeUrl(authorUrl);
        if (authorDescriptor && "pageUrl" in authorDescriptor) pageUrl = authorDescriptor.pageUrl;
      }
    } catch {
      // Fall back to the video page when oEmbed is temporarily unavailable.
    }
  }

  const html = await fetchTextWithLimit(
    pageUrl,
    MAX_HTML_BYTES,
    "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
  );
  const discovered = extractYouTubeFeedFromHtml(html, descriptor.originalUrl);
  if (!discovered) {
    throw new ResolverError("No RSS feed was found on the YouTube page", 404, "youtube_feed_not_found");
  }
  return validateFeed(discovered);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = allowedOrigin(request, env);
    const requestedOrigin = request.headers.get("origin");
    if (requestedOrigin && !origin) {
      return json({ error: "Origin not allowed", code: "origin_not_allowed" }, 403, null);
    }
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    const requestUrl = new URL(request.url);
    if (request.method === "GET" && requestUrl.pathname === "/health") {
      return json({ status: "ok", service: "personalnews-youtube-resolver" }, 200, origin);
    }
    if (request.method !== "GET" || requestUrl.pathname !== "/api/v1/youtube/resolve") {
      return json({ error: "Not found", code: "not_found" }, 404, origin);
    }

    try {
      const inputUrl = requestUrl.searchParams.get("url") || "";
      const descriptor = parseYouTubeUrl(inputUrl);
      if (!descriptor) {
        throw new ResolverError("Unsupported YouTube URL", 400, "unsupported_youtube_url");
      }
      return json(await resolveDescriptor(descriptor), 200, origin);
    } catch (error) {
      if (error instanceof ResolverError) {
        return json({ error: error.message, code: error.code }, error.status, origin);
      }
      const message = error instanceof Error ? error.message : "Unknown resolver error";
      return json({ error: message, code: "youtube_upstream_error" }, 502, origin);
    }
  },
};
