/**
 * Enhanced RSS Parser - Versão otimizada
 *
 * Melhorias implementadas:
 * - Sistema de fallback com múltiplos provedores RSS-to-JSON
 * - Cache persistente mais agressivo
 * - Suporte a JSON Feed nativo
 * - Retry inteligente com circuit breaker
 * - Validação robusta de respostas
 *
 * @version 2.0.1
 * @author Matheus Pereira
 */

import type { Article } from "../types";
import { getLogger } from "./logger";
import { getCachedArticles, setCachedArticles } from "./smartCache";
import { parseSecureRssXml } from "./secureXmlParser";
import { proxyManager } from "./proxyManager";
import { getAlternativeUrls } from "./feedUrlMapper";
import { sanitizeWithDomPurify } from "../utils/sanitization";

// Configurações otimizadas
const DEFAULT_TIMEOUT_MS = 15000; // Timeout aumentado para 15s para evitar falhas prematuras
const MAX_RETRY_ATTEMPTS = 2;
const RETRY_DELAY_BASE_MS = 1000;

const logger = getLogger();

// --- HELPERS ---


function cleanDescription(text: string): string {
  if (!text) return "";
  // Remove tags HTML básicas para o preview, mas mantém estrutura básica se necessário
  return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function sanitizeTitle(title: string): string {
  if (!title) return "No Title";
  return title.replace(/[\n\r]+/g, " ").trim();
}

function sanitizeAuthor(author: string): string {
  if (!author) return "";
  return author.replace(/[\n\r]+/g, " ").trim();
}

/**
 * Helper to extract attributes safely
 */
function getAttr(el: Element, name: string): string | null {
  return el.getAttribute(name);
}

/**
 * Interface for image candidates
 */
interface ImageCandidate {
  url: string;
  width?: number;
  height?: number;
  size?: number; // file size in bytes
  score: number;
  source: 'enclosure' | 'media:content' | 'media:thumbnail' | 'html';
}

/**
 * Select the best image from candidates
 */
function selectBestImage(candidates: ImageCandidate[]): string | undefined {
  if (candidates.length === 0) return undefined;

  // Sort by score (descending)
  candidates.sort((a, b) => {
    // 1. Prefer images with width >= 800 (likely headers/featured)
    const aIsLarge = (a.width || 0) >= 800;
    const bIsLarge = (b.width || 0) >= 800;
    if (aIsLarge && !bIsLarge) return -1;
    if (!aIsLarge && bIsLarge) return 1;

    // 2. Prefer media:content/enclosure over thumbnail/html
    const scoreA = a.score + (a.source === 'media:content' || a.source === 'enclosure' ? 2 : 0);
    const scoreB = b.score + (b.source === 'media:content' || b.source === 'enclosure' ? 2 : 0);

    // 3. Sort by known width
    if (a.width && b.width && a.width !== b.width) return b.width - a.width;

    // 4. Sort by file size (if known)
    if (a.size && b.size && a.size !== b.size) return b.size - a.size;

    return scoreB - scoreA;
  });

  // Filter out tiny tracking pixels or icons (unless it's the only option)
  const viable = candidates.filter(c => !c.width || c.width > 50);

  return viable.length > 0 ? viable[0].url : candidates[0].url;
}

// --- PARSERS ---

/**
 * Parser para resposta JSON (RSS2JSON)
 */
function parseRss2JsonResponse(jsonContent: string, _feedUrl: string): { title: string; articles: Article[] } {
  let data;
  try {
    data = JSON.parse(jsonContent);
  } catch (e) {
    throw new Error("Failed to parse JSON response");
  }

  if (data.status !== 'ok' && !data.items) {
    throw new Error("Invalid RSS2JSON response format");
  }

  const channelTitle = sanitizeTitle(data.feed?.title || "Untitled Feed");
  const articles: Article[] = [];

  const items = data.items || [];
  for (const item of items) {
    try {
      const title = sanitizeTitle(item.title || "No Title");
      const link = item.link || "";
      const pubDate = new Date(item.pubDate || item.created || Date.now());
      const description = cleanDescription(item.description || item.content || "").substring(0, 500);
      const content = sanitizeWithDomPurify(item.content || item.description || "");
      const author = sanitizeAuthor(item.author || "");
      const categories = Array.isArray(item.categories) ? item.categories : [];

      let imageUrl = item.thumbnail || item.enclosure?.link;

      // Validação básica de URL de imagem
      if (imageUrl && !imageUrl.startsWith('http')) imageUrl = undefined;

      if (title !== "No Title" && link) {
        articles.push({
          title,
          link,
          pubDate,
          description,
          content,
          imageUrl,
          author,
          categories,
          sourceTitle: channelTitle,
        });
      }
    } catch (e) {
      logger.warn("Failed to parse JSON item", { component: "rssParser" });
    }
  }

  return { title: channelTitle, articles };
}

/**
 * Parser para resposta XML pura
 */
function parseXmlResponse(xmlContent: string, _feedUrl: string): { title: string; articles: Article[] } {
  const xmlDoc = parseSecureRssXml(xmlContent);

  const parseErrors = xmlDoc.getElementsByTagName("parsererror");
  if (parseErrors.length > 0) {
    throw new Error(`XML parsing error: ${parseErrors[0].textContent}`);
  }

  let channelTitle = "Untitled Feed";
  let items: HTMLCollectionOf<Element> | NodeListOf<Element>;

  const channels = xmlDoc.getElementsByTagName("channel");
  if (channels.length > 0) {
    const titleElements = channels[0].getElementsByTagName("title");
    channelTitle = titleElements[0]?.textContent?.trim() || "Untitled Feed";
    channelTitle = sanitizeTitle(channelTitle);
    items = xmlDoc.getElementsByTagName("item");
  } else {
    const feeds = xmlDoc.getElementsByTagName("feed");
    if (feeds.length > 0) {
      const titleElements = feeds[0].getElementsByTagName("title");
      channelTitle = titleElements[0]?.textContent?.trim() || "Untitled Feed";
      channelTitle = sanitizeTitle(channelTitle);
      items = xmlDoc.getElementsByTagName("entry");
    } else {
      const rdfItems = xmlDoc.getElementsByTagName("item");
      if (rdfItems.length > 0) {
        const rdfChannels = xmlDoc.getElementsByTagName("channel");
        if (rdfChannels.length > 0) {
          const titleElements = rdfChannels[0].getElementsByTagName("title");
          channelTitle = titleElements[0]?.textContent?.trim() || "Untitled Feed";
          channelTitle = sanitizeTitle(channelTitle);
        }
        items = rdfItems;
      } else {
        throw new Error("Unsupported RSS format");
      }
    }
  }

  const articles: Article[] = [];

  for (let i = 0; i < Math.min(items.length, 50); i++) {
    const item = items[i];

    try {
      const titleElements = item.getElementsByTagName("title");
      const rawTitle = titleElements[0]?.textContent?.trim() || "No Title";
      const title = sanitizeTitle(rawTitle);

      let link = "";
      const linkElements = item.getElementsByTagName("link");
      if (linkElements.length > 0) {
        link = linkElements[0].textContent?.trim() || linkElements[0].getAttribute("href") || "";
      }

      let pubDate = new Date();
      const pubDateElements = item.getElementsByTagName("pubDate");
      const publishedElements = item.getElementsByTagName("published");
      const dcDateElements = item.getElementsByTagName("date");
      const dateElement = pubDateElements[0] || publishedElements[0] || dcDateElements[0];
      if (dateElement?.textContent) {
        const parsedDate = new Date(dateElement.textContent.trim());
        if (!isNaN(parsedDate.getTime())) {
          pubDate = parsedDate;
        }
      }

      let descriptionRaw = "";
      let contentRaw = "";

      const descElements = item.getElementsByTagName("description");
      const summaryElements = item.getElementsByTagName("summary");
      const contentElements = item.getElementsByTagName("content");
      const encodedContentElements = item.getElementsByTagName("content:encoded");
      const bodyElements = item.getElementsByTagName("body");

      const descEl = descElements[0] || summaryElements[0];
      if (descEl?.textContent) descriptionRaw = descEl.textContent;

      const contentEl = encodedContentElements[0] || contentElements[0] || bodyElements[0] || descElements[0];
      if (contentEl?.textContent) contentRaw = contentEl.textContent;

      if (!descriptionRaw && contentRaw) descriptionRaw = contentRaw;
      if (!contentRaw && descriptionRaw) contentRaw = descriptionRaw;

      const description = cleanDescription(descriptionRaw).substring(0, 500);
      const content = sanitizeWithDomPurify(contentRaw);

      let author = "";
      const authorElements = item.getElementsByTagName("author");
      const creatorElements = item.getElementsByTagName("creator");
      const dcCreatorElements = item.getElementsByTagName("dc:creator");
      const authorElement = authorElements[0] || dcCreatorElements[0] || creatorElements[0];
      if (authorElement?.textContent) {
        author = sanitizeAuthor(authorElement.textContent.trim());
      }

      const categories: string[] = [];
      const categoryElements = item.getElementsByTagName("category");
      for (let j = 0; j < categoryElements.length; j++) {
        const catText = categoryElements[j].textContent?.trim();
        if (catText) categories.push(catText);
      }

      // --- IMPROVED IMAGE EXTRACTION ---
      const imageCandidates: ImageCandidate[] = [];
      let audioUrl = "";
      let audioDuration = "";

      // 1. Check Enclosures
      const enclosureElements = item.getElementsByTagName("enclosure");
      for (let j = 0; j < enclosureElements.length; j++) {
        const enc = enclosureElements[j];
        const type = getAttr(enc, "type") || "";
        const url = getAttr(enc, "url");

        if (url) {
          if (type.startsWith("image/")) {
            imageCandidates.push({
              url,
              size: parseInt(getAttr(enc, "length") || "0"),
              source: 'enclosure',
              score: 10
            });
          } else if (type.startsWith("audio/") && !audioUrl) {
            audioUrl = url;
          }
        }
      }

      // 2. Check Media Content/Group (Recursive)
      const processMediaElement = (el: Element) => {
        const url = getAttr(el, "url");
        const type = getAttr(el, "type") || getAttr(el, "medium") || "";
        const width = parseInt(getAttr(el, "width") || "0");
        const height = parseInt(getAttr(el, "height") || "0");

        if (url && (type.startsWith("image") || type === "image")) {
          imageCandidates.push({
            url,
            width,
            height,
            source: 'media:content',
            score: 10 + (width > 600 ? 5 : 0) // Bonus for high res
          });
        }
      };

      const mediaGroups = item.getElementsByTagName("media:group");
      for (let j = 0; j < mediaGroups.length; j++) {
        const contents = mediaGroups[j].getElementsByTagName("media:content");
        for (let k = 0; k < contents.length; k++) processMediaElement(contents[k]);
      }

      const mediaContents = item.getElementsByTagName("media:content");
      for (let j = 0; j < mediaContents.length; j++) processMediaElement(mediaContents[j]);

      // 3. Check Media Thumbnail
      const mediaThumbnails = item.getElementsByTagName("media:thumbnail");
      for (let j = 0; j < mediaThumbnails.length; j++) {
        const url = getAttr(mediaThumbnails[j], "url");
        const width = parseInt(getAttr(mediaThumbnails[j], "width") || "0");
        if (url) {
          imageCandidates.push({
            url,
            width,
            source: 'media:thumbnail',
            score: 5
          });
        }
      }

      // 4. Extract from Content/Description HTML
      const htmlContent = contentRaw || descriptionRaw || "";
      const imgPatterns = [
        /<img[^>]+src=["']([^"']+)["'][^>]*>/gi, // Global match
      ];

      const searchContent = htmlContent.substring(0, 3000);
      for (const pattern of imgPatterns) {
        let match;
        while ((match = pattern.exec(searchContent)) !== null) {
          if (match[1]) {
            imageCandidates.push({
              url: match[1],
              source: 'html',
              score: 1
            });
            if (imageCandidates.length > 3) break;
          }
        }
      }

      // Podcast Duration
      if (audioUrl && !audioDuration) {
        const itunesDuration = item.getElementsByTagName("itunes:duration")[0];
        const plainDuration = item.getElementsByTagName("duration")[0];
        if (itunesDuration?.textContent) audioDuration = itunesDuration.textContent.trim();
        else if (plainDuration?.textContent) audioDuration = plainDuration.textContent.trim();
      }

      const imageUrl = selectBestImage(imageCandidates);

      let validImageUrl: string | undefined = undefined;
      if (imageUrl) {
        try {
          const urlObj = new URL(imageUrl);
          if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
            if (!imageUrl.includes('?text=') && !imageUrl.match(/^[A-Z0-9]{6}\?text=/i) && imageUrl.includes('.')) {
              validImageUrl = imageUrl;
            }
          }
        } catch (e) {
          // Invalid URL
        }
      }

      if (title !== "No Title" && link) {
        articles.push({
          title,
          link,
          pubDate,
          description,
          content: content || undefined,
          imageUrl: validImageUrl,
          author: author || undefined,
          categories,
          sourceTitle: channelTitle,
          audioUrl: audioUrl || undefined,
          audioDuration: audioDuration || undefined,
        });
      }
    } catch (error) {
      logger.warn(`Failed to parse article ${i + 1}`, { component: "rssParser" });
    }
  }

  return { title: channelTitle, articles };
}

// --- PROVIDERS (DEFINED AFTER PARSERS) ---

// --- FETCHING ---

function validateResponse(content: string): boolean {
  if (!content || content.trim().length === 0) return false;
  const trimmed = content.trim();
  if (trimmed.toLowerCase().includes('<!doctype html') || trimmed.toLowerCase().startsWith('<html')) {
    return false;
  }
  return trimmed.startsWith('<') || trimmed.startsWith('{');
}

async function fetchRssFeed(
  url: string,
  _signal?: AbortSignal
): Promise<{ title: string; articles: Article[] }> {
  const urlsToTry = getAlternativeUrls(url);
  let lastError: Error = new Error("Unknown error");

  for (const currentUrl of urlsToTry) {
    try {
      // Use ProxyManager for robust fetching with failover
      const result = await proxyManager.tryProxiesWithFailover(currentUrl);

      // Parse the content returned by the proxy
      // We try to detect if it's JSON (RSS2JSON) or XML
      const content = result.content;

      if (!validateResponse(content)) {
        throw new Error(`Invalid response format from proxy (${result.proxyUsed})`);
      }

      // Try parsing as JSON first if it looks like JSON
      if (content.trim().startsWith('{')) {
        try {
          const jsonResult = parseRss2JsonResponse(content, currentUrl);
          if (jsonResult.articles.length > 0) return jsonResult;
        } catch (e) {
          // Identify if it was just a failed JSON parse or if content is actually XML
          // proceed to XML parsing
        }
      }

      // Fallback to XML parsing
      const xmlResult = parseXmlResponse(content, currentUrl);
      if (xmlResult.articles.length > 0) return xmlResult;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      logger.warn(`Failed to fetch/parse ${currentUrl} via ProxyManager`, {
        component: 'rssParser',
        additionalData: { error: lastError.message }
      });
    }
  }

  throw new Error(`Failed to fetch RSS feed: ${lastError.message}`);
}

// function fetchRssFeed removed (replaced by new implementation above)

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function parseRssUrlWithRetry(
  url: string,
  options: {
    timeout?: number;
    maxRetries?: number;
    signal?: AbortSignal;
  } = {}
): Promise<{ title: string; articles: Article[] }> {
  const { maxRetries = MAX_RETRY_ATTEMPTS, signal } = options;
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fetchRssFeed(url, signal);

      if (result.articles.length > 0) {
        setCachedArticles(url, result.articles, result.title);
      }

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (signal?.aborted) {
        throw new Error("Request was cancelled");
      }

      if (attempt === maxRetries) break;

      const delay = RETRY_DELAY_BASE_MS * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }

  logger.error(`All ${maxRetries} attempts failed`, lastError, {
    component: "rssParser",
    additionalData: { feedUrl: url },
  });

  throw lastError;
}

export async function parseRssUrl(
  url: string,
  options: {
    timeout?: number;
    maxRetries?: number;
    signal?: AbortSignal;
    skipCache?: boolean;
  } = {}
): Promise<{ title: string; articles: Article[] }> {
  const { skipCache = false } = options;

  if (!skipCache) {
    const cachedArticles = getCachedArticles(url);
    if (cachedArticles && cachedArticles.length > 0) {
      logger.debug(`Using cached articles`, {
        component: "rssParser",
        additionalData: { feedUrl: url, cachedCount: cachedArticles.length },
      });

      return {
        title: cachedArticles[0].sourceTitle,
        articles: cachedArticles,
      };
    }
  }

  try {
    return await parseRssUrlWithRetry(url, options);
  } catch (error) {
    logger.warn(`Creating placeholder for failed feed`, {
      component: "rssParser",
      additionalData: {
        url,
        error: error instanceof Error ? error.message : String(error)
      },
    });

    return {
      title: "Feed Unavailable",
      articles: [{
        title: "RSS Feed Temporarily Unavailable",
        link: url,
        pubDate: new Date(),
        description: `Unable to fetch this RSS feed. This may be due to CORS restrictions or temporary server issues. The feed will be retried automatically.`,
        sourceTitle: "System Notice",
        categories: ["system", "unavailable"],
      }],
    };
  }
}

export interface OpmlFeed {
  url: string;
  title?: string;
  category?: string;
}

export function parseOpml(fileContent: string): OpmlFeed[] {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(fileContent, "text/xml");
  const feeds: OpmlFeed[] = [];

  const processOutline = (outline: Element, parentCategory?: string) => {
    const xmlUrl = outline.getAttribute("xmlUrl");
    const text = outline.getAttribute("text") || outline.getAttribute("title");

    if (xmlUrl) {
      feeds.push({
        url: xmlUrl,
        title: text || undefined,
        category: parentCategory
      });
    }
    else if (outline.children.length > 0) {
      const categoryName = text || parentCategory;

      for (let i = 0; i < outline.children.length; i++) {
        const child = outline.children[i];
        if (child.tagName.toLowerCase() === 'outline') {
          processOutline(child, categoryName);
        }
      }
    }
  };

  const body = xmlDoc.getElementsByTagName("body")[0];
  if (body) {
    for (let i = 0; i < body.children.length; i++) {
      const child = body.children[i];
      if (child.tagName.toLowerCase() === 'outline') {
        processOutline(child);
      }
    }
  }

  return feeds;
}