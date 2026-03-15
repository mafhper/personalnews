import { DOMParser } from "@xmldom/xmldom";
import type { ArticleWire } from "../../../shared/contracts/backend";
import { BackendHttpError } from "./errors";

const USER_AGENT = "PersonalNewsBackend/1.0 (+https://github.com/mafhper/personalnews)";
const MAX_XML_SIZE_BYTES = 10 * 1024 * 1024;
const UPSTREAM_FETCH_TIMEOUT_MS = 12_000;
const IMAGE_PLACEHOLDER_PATTERNS = [
  /\/blank\.(gif|png|jpg|jpeg|webp)/i,
  /\/spacer\.(gif|png|jpg|jpeg|webp)/i,
  /pixel\.(gif|png|jpg|jpeg|webp)/i,
  /[?&](w|width)=1(&|$)/i,
  /[?&](h|height)=1(&|$)/i,
];

function extractYouTubeVideoId(value: string | null | undefined): string | null {
  if (!value) return null;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname;

  if (host === "youtu.be") {
    const id = path.replace(/^\/+/, "").split("/")[0];
    return id || null;
  }

  if (host.endsWith("youtube.com")) {
    const queryId = parsed.searchParams.get("v");
    if (queryId) return queryId;

    const parts = path.split("/").filter(Boolean);
    const markerIndex = parts.findIndex((item) => item === "v" || item === "embed" || item === "shorts");
    if (markerIndex >= 0 && parts[markerIndex + 1]) {
      return parts[markerIndex + 1];
    }
  }

  return null;
}

function decodeCommonHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function parseFirstSrcsetEntry(srcset: string): string | null {
  const first = srcset.split(",")[0]?.trim();
  if (!first) return null;
  const candidate = first.split(/\s+/)[0]?.trim();
  return candidate || null;
}

function extractAttributeValue(tag: string, attributeName: string): string | null {
  const pattern = new RegExp(`${attributeName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const match = tag.match(pattern);
  if (!match) return null;
  return (match[1] || match[2] || match[3] || "").trim() || null;
}

function extractFirstImageUrlFromHtml(html: string | null | undefined): string | null {
  if (!html || html.trim().length === 0) return null;

  const imgTags = html.match(/<img\b[^>]*>/gi);
  if (!imgTags || imgTags.length === 0) return null;

  for (const tag of imgTags) {
    const src = extractAttributeValue(tag, "src");
    if (src) return src;

    const dataSrc = extractAttributeValue(tag, "data-src");
    if (dataSrc) return dataSrc;

    const dataOriginal = extractAttributeValue(tag, "data-original");
    if (dataOriginal) return dataOriginal;

    const srcset = extractAttributeValue(tag, "srcset");
    if (srcset) {
      const firstSrcset = parseFirstSrcsetEntry(srcset);
      if (firstSrcset) return firstSrcset;
    }
  }

  return null;
}

function normalizeImageCandidate(rawValue: string | null | undefined, articleLink?: string): string | null {
  const decoded = decodeCommonHtmlEntities((rawValue || "").trim());
  if (!decoded) return null;
  if (decoded.startsWith("data:")) return null;

  let resolved = decoded;
  if (resolved.startsWith("//")) {
    resolved = `https:${resolved}`;
  }

  try {
    resolved = articleLink ? new URL(resolved, articleLink).toString() : new URL(resolved).toString();
  } catch {
    return null;
  }

  if (IMAGE_PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(resolved))) {
    return null;
  }

  return resolved;
}

function extractRssEnclosureImageUrl(enclosure: Element | null): string | null {
  if (!enclosure) return null;
  const type = (enclosure.getAttribute("type") || "").toLowerCase();
  if (type && !type.startsWith("image/")) return null;
  return enclosure.getAttribute("url");
}

function extractAtomEnclosureImageUrl(links: Element[]): string | null {
  for (const link of links) {
    const rel = (link.getAttribute("rel") || "").toLowerCase();
    if (rel && rel !== "enclosure") continue;
    const type = (link.getAttribute("type") || "").toLowerCase();
    if (type && !type.startsWith("image/")) continue;
    const href = link.getAttribute("href");
    if (href) return href;
  }
  return null;
}

function normalizeFeedImageUrl(
  imageUrl: string | null | undefined,
  fallbackLink?: string,
  articleLink?: string
): string | undefined {
  const raw = (imageUrl || "").trim();
  const fallback = (fallbackLink || "").trim();
  const normalized = normalizeImageCandidate(raw, articleLink);

  const fromImage = extractYouTubeVideoId(normalized || raw);
  const fromFallback = extractYouTubeVideoId(fallback);
  const youtubeVideoId = fromImage || fromFallback;
  if (youtubeVideoId) {
    return `https://i.ytimg.com/vi/${youtubeVideoId}/hqdefault.jpg`;
  }

  if (normalized) return normalized;
  return undefined;
}

function cleanText(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeDate(raw: string | null | undefined): string {
  if (!raw) return new Date().toISOString();
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function textOf(node: Element | null): string {
  return node?.textContent?.trim() || "";
}

function firstChildByTag(parent: Document | Element, tagName: string): Element | null {
  const list = parent.getElementsByTagName(tagName);
  if (!list || list.length === 0) return null;
  return list.item(0) as Element | null;
}

function allChildrenByTag(parent: Document | Element, tagName: string): Element[] {
  const list = parent.getElementsByTagName(tagName);
  const out: Element[] = [];
  for (let i = 0; i < list.length; i += 1) {
    const item = list.item(i);
    if (item) out.push(item as Element);
  }
  return out;
}

function parseRss(doc: Document, feedUrl: string): { title: string; articles: ArticleWire[] } {
  const channel = firstChildByTag(doc, "channel");
  if (!channel) {
    return { title: "Feed", articles: [] };
  }

  const title = textOf(firstChildByTag(channel, "title")) || "Feed";
  const items = allChildrenByTag(channel, "item");

  const articles: ArticleWire[] = items
    .map((item) => {
      const linkNode = firstChildByTag(item, "link");
      const articleLink = textOf(linkNode) || textOf(firstChildByTag(item, "guid"));
      const enclosure = firstChildByTag(item, "enclosure");
      const mediaContent = firstChildByTag(item, "media:content");
      const mediaThumb = firstChildByTag(item, "media:thumbnail");
      const descriptionRaw =
        textOf(firstChildByTag(item, "description")) ||
        textOf(firstChildByTag(item, "content:encoded")) ||
        textOf(firstChildByTag(item, "content"));
      const contentRaw =
        textOf(firstChildByTag(item, "content:encoded")) ||
        textOf(firstChildByTag(item, "description")) ||
        undefined;
      const imageCandidate =
        mediaContent?.getAttribute("url") ||
        mediaThumb?.getAttribute("url") ||
        extractRssEnclosureImageUrl(enclosure) ||
        extractFirstImageUrlFromHtml(contentRaw) ||
        extractFirstImageUrlFromHtml(descriptionRaw);

      const categories = allChildrenByTag(item, "category")
        .map((cat) => textOf(cat))
        .filter(Boolean);

      return {
        title: textOf(firstChildByTag(item, "title")) || "Untitled",
        link: articleLink,
        pubDate: normalizeDate(
          textOf(firstChildByTag(item, "pubDate")) ||
            textOf(firstChildByTag(item, "updated")) ||
            textOf(firstChildByTag(item, "dc:date"))
        ),
        sourceTitle: title,
        feedUrl,
        description: cleanText(descriptionRaw).slice(0, 800),
        content: contentRaw,
        author:
          textOf(firstChildByTag(item, "author")) ||
          textOf(firstChildByTag(item, "dc:creator")) ||
          undefined,
        imageUrl: normalizeFeedImageUrl(imageCandidate, articleLink, articleLink),
        categories: categories.length > 0 ? categories : undefined,
      };
    })
    .filter((item) => Boolean(item.link));

  return { title, articles };
}

function parseAtom(doc: Document, feedUrl: string): { title: string; articles: ArticleWire[] } {
  const feed = firstChildByTag(doc, "feed");
  if (!feed) {
    return { title: "Feed", articles: [] };
  }

  const title = textOf(firstChildByTag(feed, "title")) || "Feed";
  const entries = allChildrenByTag(feed, "entry");

  const articles: ArticleWire[] = entries
    .map((entry) => {
      const links = allChildrenByTag(entry, "link");
      const primaryLink =
        links.find((link) => (link.getAttribute("rel") || "alternate") === "alternate") || links[0];
      const articleLink = (primaryLink?.getAttribute("href") || "").trim();
      const summaryRaw =
        textOf(firstChildByTag(entry, "summary")) || textOf(firstChildByTag(entry, "content"));
      const contentRaw =
        textOf(firstChildByTag(entry, "content")) || textOf(firstChildByTag(entry, "summary")) || undefined;
      const imageCandidate =
        firstChildByTag(entry, "media:content")?.getAttribute("url") ||
        firstChildByTag(entry, "media:thumbnail")?.getAttribute("url") ||
        extractAtomEnclosureImageUrl(links) ||
        extractFirstImageUrlFromHtml(contentRaw) ||
        extractFirstImageUrlFromHtml(summaryRaw);

      const categories = allChildrenByTag(entry, "category")
        .map((cat) => cat.getAttribute("term") || textOf(cat))
        .filter(Boolean) as string[];

      return {
        title: textOf(firstChildByTag(entry, "title")) || "Untitled",
        link: articleLink,
        pubDate: normalizeDate(
          textOf(firstChildByTag(entry, "updated")) || textOf(firstChildByTag(entry, "published"))
        ),
        sourceTitle: title,
        feedUrl,
        description: cleanText(summaryRaw).slice(0, 800),
        content: contentRaw,
        author:
          textOf(firstChildByTag(firstChildByTag(entry, "author") || entry, "name")) ||
          textOf(firstChildByTag(entry, "author")) ||
          undefined,
        imageUrl: normalizeFeedImageUrl(imageCandidate, articleLink, articleLink),
        categories: categories.length > 0 ? categories : undefined,
      };
    })
    .filter((item) => Boolean(item.link));

  return { title, articles };
}

function parseXml(body: string): Document {
  if (body.length > MAX_XML_SIZE_BYTES) {
    throw new BackendHttpError(422, `XML payload too large (${body.length} bytes)`);
  }

  if (/<!ENTITY[^>]*(SYSTEM|PUBLIC)/i.test(body)) {
    throw new BackendHttpError(422, "Potential XXE content blocked");
  }

  const doc = new DOMParser({
    errorHandler: {
      warning() {
        // noop
      },
      error(message: string) {
        throw new BackendHttpError(422, `XML parse error: ${message}`);
      },
      fatalError(message: string) {
        throw new BackendHttpError(422, `XML fatal error: ${message}`);
      },
    },
  }).parseFromString(body, "text/xml");

  return doc;
}

export async function fetchAndParseFeed(url: string): Promise<{ title: string; articles: ArticleWire[] }> {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), UPSTREAM_FETCH_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(url, {
      signal: timeoutController.signal,
      headers: {
        "user-agent": USER_AGENT,
        accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
      },
    });
  } catch (error) {
    if (timeoutController.signal.aborted) {
      throw new BackendHttpError(
        504,
        `Upstream feed timeout after ${UPSTREAM_FETCH_TIMEOUT_MS}ms`,
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new BackendHttpError(
      response.status,
      `Upstream feed request failed: ${response.status}`,
    );
  }

  const body = await response.text();
  if (!body || body.trim().length < 30) {
    throw new BackendHttpError(422, "Upstream feed returned an empty payload");
  }

  const doc = parseXml(body);
  const rssParsed = parseRss(doc, url);
  const atomParsed = rssParsed.articles.length === 0 ? parseAtom(doc, url) : rssParsed;

  if (atomParsed.articles.length === 0) {
    throw new BackendHttpError(422, "No feed entries found in payload");
  }

  atomParsed.articles.sort((a, b) => +new Date(b.pubDate) - +new Date(a.pubDate));

  return atomParsed;
}
