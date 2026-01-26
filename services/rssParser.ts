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
import { sanitizeWithDomPurify, sanitizeHtmlContent, sanitizeArticleDescription } from "../utils/sanitization";

// Configurações otimizadas
const MAX_RETRY_ATTEMPTS = 2;
const RETRY_DELAY_BASE_MS = 1000;

const logger = getLogger();

// --- HELPERS ---


function cleanDescription(text: string): string {
  if (!text) return "";
  return sanitizeArticleDescription(text, 500);
}

function sanitizeTitle(title: string): string {
  if (!title) return "No Title";
  return sanitizeHtmlContent(title).replace(/[\n\r]+/g, " ").trim();
}

function sanitizeAuthor(author: string): string {
  if (!author) return "";
  return sanitizeHtmlContent(author).replace(/[\n\r]+/g, " ").trim();
}

/**
 * Helper to extract attributes safely
 */
function getAttr(el: Element, name: string): string | null {
  return el.getAttribute(name);
}

/**
 * Normalize image URL - resolve relative URLs and protocol-relative URLs
 */
function normalizeImageUrl(url: string, baseUrl?: string): string | null {
  if (!url || url.trim().length === 0) return null;

  let normalized = url.trim();

  // Remove leading/trailing whitespace and quotes
  normalized = normalized.replace(/^["']|["']$/g, '');

  // Skip data URIs and invalid patterns
  if (normalized.startsWith('data:') || normalized.startsWith('javascript:') || normalized.startsWith('#')) {
    return null;
  }

  // Handle protocol-relative URLs (//example.com/image.jpg)
  if (normalized.startsWith('//')) {
    normalized = 'https:' + normalized;
  }

  // Handle relative URLs if we have a base URL
  if (baseUrl && !normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    try {
      const base = new URL(baseUrl);
      // If URL starts with /, it's absolute path on same domain
      if (normalized.startsWith('/')) {
        normalized = base.origin + normalized;
      } else {
        // Relative path
        normalized = new URL(normalized, baseUrl).href;
      }
    } catch {
      // If base URL is invalid, try to construct from feed URL
      return null;
    }
  }

  // Validate final URL
  try {
    const urlObj = new URL(normalized);
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return null;
    }
    return normalized;
  } catch {
    return null;
  }
}

/**
 * Check if an image element is likely a featured/hero image
 */
function isFeaturedImage(img: Element, parent?: Element | null): boolean {
  // Check parent figure/div classes
  if (parent) {
    const parentClass = parent.getAttribute('class') || '';
    const parentTag = parent.tagName.toLowerCase();

    // Common featured image patterns
    if (
      parentClass.includes('featured') ||
      parentClass.includes('hero') ||
      parentClass.includes('cover') ||
      parentClass.includes('header') ||
      parentClass.includes('banner') ||
      (parentTag === 'figure' && (parentClass.includes('image') || parentClass.includes('img')))
    ) {
      return true;
    }
  }

  // Check image attributes
  const imgClass = img.getAttribute('class') || '';
  const imgId = img.getAttribute('id') || '';
  const fetchPriority = img.getAttribute('fetchpriority');

  if (
    imgClass.includes('featured') ||
    imgClass.includes('hero') ||
    imgClass.includes('cover') ||
    imgClass.includes('wp-post-image') ||
    imgId.includes('featured') ||
    imgId.includes('hero') ||
    fetchPriority === 'high'
  ) {
    return true;
  }

  // Check dimensions - large images are more likely to be featured
  const width = parseInt(img.getAttribute('width') || '0');
  const height = parseInt(img.getAttribute('height') || '0');
  if (width >= 800 || height >= 600) {
    return true;
  }

  return false;
}

/**
 * Parse srcset attribute and return best image URL
 */
function parseSrcset(srcset: string): { url: string; width: number } | null {
  if (!srcset || srcset.trim().length === 0) return null;

  const sources = srcset.split(',').map(s => s.trim()).filter(s => s);
  if (sources.length === 0) return null;

  const parsedSources: { url: string; width: number }[] = [];

  for (const source of sources) {
    const parts = source.split(/\s+/);
    const url = parts[0];

    // Look for width descriptor (e.g., "640w")
    const widthPart = parts.find(p => p.endsWith('w'));
    const width = widthPart ? parseInt(widthPart) : 0;

    // Also check for pixel density (e.g., "2x")
    const densityPart = parts.find(p => p.endsWith('x'));
    const density = densityPart ? parseFloat(densityPart) : 1;

    // Estimate width from density if no width specified
    const estimatedWidth = width || (density > 1 ? 800 * density : 800);

    parsedSources.push({ url, width: estimatedWidth });
  }

  // Sort by width descending and return the largest
  parsedSources.sort((a, b) => b.width - a.width);

  return parsedSources.length > 0 ? parsedSources[0] : null;
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
  isFeatured?: boolean; // Whether this is likely a featured/hero image
}

/**
 * Select the best image from candidates
 */
function selectBestImage(candidates: ImageCandidate[], articleLink?: string): string | undefined {
  if (candidates.length === 0) return undefined;

  // Normalize all URLs first
  const normalizedCandidates = candidates
    .map(c => {
      const normalizedUrl = normalizeImageUrl(c.url, articleLink);
      if (!normalizedUrl) return null;
      return { ...c, url: normalizedUrl };
    })
    .filter((c): c is ImageCandidate => c !== null);

  if (normalizedCandidates.length === 0) return undefined;

  // Sort by score (descending)
  normalizedCandidates.sort((a, b) => {
    // 1. Prefer featured images (highest priority)
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;

    // 2. Prefer images with width >= 800 (likely headers/featured)
    const aIsLarge = (a.width || 0) >= 800;
    const bIsLarge = (b.width || 0) >= 800;
    if (aIsLarge && !bIsLarge) return -1;
    if (!aIsLarge && bIsLarge) return 1;

    // 3. Prefer media:content/enclosure over thumbnail/html
    const scoreA = a.score + (a.source === 'media:content' || a.source === 'enclosure' ? 2 : 0);
    const scoreB = b.score + (b.source === 'media:content' || b.source === 'enclosure' ? 2 : 0);

    // 4. Sort by known width
    if (a.width && b.width && a.width !== b.width) return b.width - a.width;

    // 5. Sort by file size (if known)
    if (a.size && b.size && a.size !== b.size) return b.size - a.size;

    return scoreB - scoreA;
  });

  // Filter out tiny tracking pixels or icons (unless it's the only option)
  const viable = normalizedCandidates.filter(c => {
    // Allow small images only if they're featured or from reliable sources
    if (c.width && c.width <= 50) {
      return c.isFeatured || c.source === 'media:content' || c.source === 'enclosure';
    }
    return true;
  });

  // Filter out common placeholder/tracking patterns
  const filtered = viable.filter(c => {
    const urlLower = c.url.toLowerCase();
    // Skip common tracking/placeholder patterns
    if (
      urlLower.includes('pixel') ||
      urlLower.includes('tracking') ||
      urlLower.includes('beacon') ||
      urlLower.includes('spacer') ||
      urlLower.includes('1x1') ||
      urlLower.includes('blank.gif') ||
      urlLower.includes('transparent.gif')
    ) {
      return false;
    }
    return true;
  });

  return filtered.length > 0 ? filtered[0].url : (viable.length > 0 ? viable[0].url : normalizedCandidates[0].url);
}

// --- PARSERS ---

/**
 * Parser para resposta JSON (RSS2JSON)
 */
function parseRss2JsonResponse(jsonContent: string, _feedUrl: string): { title: string; articles: Article[] } {
  let data;
  try {
    data = JSON.parse(jsonContent);
  } catch {
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

      // Extract image from multiple possible sources
      const jsonImageCandidates: ImageCandidate[] = [];

      // Check thumbnail
      if (item.thumbnail) {
        const normalized = normalizeImageUrl(item.thumbnail, link);
        if (normalized) {
          jsonImageCandidates.push({
            url: normalized,
            source: 'media:thumbnail',
            score: 5
          });
        }
      }

      // Check enclosure
      if (item.enclosure?.link && item.enclosure?.type?.startsWith('image/')) {
        const normalized = normalizeImageUrl(item.enclosure.link, link);
        if (normalized) {
          jsonImageCandidates.push({
            url: normalized,
            size: item.enclosure.length ? parseInt(item.enclosure.length) : undefined,
            source: 'enclosure',
            score: 10
          });
        }
      }

      // Extract from content/description HTML if available
      const htmlContent = item.content || item.description || "";
      if (htmlContent && typeof DOMParser !== 'undefined') {
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlContent, 'text/html');
          const images = doc.getElementsByTagName('img');

          for (let j = 0; j < Math.min(images.length, 5); j++) {
            const img = images[j];
            const src = img.getAttribute('src');
            const srcset = img.getAttribute('srcset');
            const dataSrc = img.getAttribute('data-src') ||
              img.getAttribute('data-original') ||
              img.getAttribute('data-lazy-src');

            const isFeatured = isFeaturedImage(img, img.parentElement);
            const width = parseInt(img.getAttribute('width') || '0');

            if (srcset) {
              const parsed = parseSrcset(srcset);
              if (parsed) {
                const normalized = normalizeImageUrl(parsed.url, link);
                if (normalized) {
                  jsonImageCandidates.push({
                    url: normalized,
                    width: parsed.width || width || undefined,
                    source: 'html',
                    score: isFeatured ? 12 : 8,
                    isFeatured
                  });
                }
              }
            }

            if (dataSrc) {
              const normalized = normalizeImageUrl(dataSrc, link);
              if (normalized) {
                jsonImageCandidates.push({
                  url: normalized,
                  width: width || undefined,
                  source: 'html',
                  score: isFeatured ? 10 : 7,
                  isFeatured
                });
              }
            }

            if (src) {
              const normalized = normalizeImageUrl(src, link);
              if (normalized) {
                jsonImageCandidates.push({
                  url: normalized,
                  width: width || undefined,
                  source: 'html',
                  score: isFeatured ? 8 : 5,
                  isFeatured
                });
              }
            }
          }
        } catch {
          // Fallback to regex if DOMParser fails
        }
      }

      const imageUrl = selectBestImage(jsonImageCandidates, link);

      // Log only if no image found (for debugging)
      if (process.env.NODE_ENV === 'development' && !imageUrl && jsonImageCandidates.length === 0) {
        console.warn(`[ImageExtraction] No images found for: "${title.substring(0, 50)}..."`, {
          link: link.substring(0, 60) + '...'
        });
      }

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
    } catch {
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
            const normalized = normalizeImageUrl(url, link);
            if (normalized) {
              imageCandidates.push({
                url: normalized,
                size: parseInt(getAttr(enc, "length") || "0"),
                source: 'enclosure',
                score: 10
              });
            }
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
          const normalized = normalizeImageUrl(url, link);
          if (normalized) {
            imageCandidates.push({
              url: normalized,
              width: width || undefined,
              height: height || undefined,
              source: 'media:content',
              score: 10 + (width > 600 ? 5 : 0) // Bonus for high res
            });
          }
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
          const normalized = normalizeImageUrl(url, link);
          if (normalized) {
            imageCandidates.push({
              url: normalized,
              width: width || undefined,
              source: 'media:thumbnail',
              score: 5
            });
          }
        }
      }

      // 4. Extract from Content/Description HTML
      const htmlContent = contentRaw || descriptionRaw || "";

      if (process.env.NODE_ENV === 'development') {
        logger.debugTag('FEED', `Starting HTML extraction for: "${title.substring(0, 50)}..."`, {
          htmlContentLength: htmlContent.length,
          hasDOMParser: typeof DOMParser !== 'undefined',
          link: link.substring(0, 60) + '...'
        });
      }

      try {
        // Use DOMParser if available (browser/jsdom)
        if (typeof DOMParser !== 'undefined') {
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlContent, 'text/html');

          // First, try to find featured images in figure/picture elements
          const figures = doc.getElementsByTagName('figure');
          for (let f = 0; f < figures.length; f++) {
            const figure = figures[f];
            const figureImages = figure.getElementsByTagName('img');
            if (figureImages.length > 0) {
              const img = figureImages[0];
              const src = img.getAttribute('src');
              const srcset = img.getAttribute('srcset');
              const dataSrc = img.getAttribute('data-src') ||
                img.getAttribute('data-original') ||
                img.getAttribute('data-lazy-src') ||
                img.getAttribute('data-lazy') ||
                img.getAttribute('data-srcset');

              const isFeatured = isFeaturedImage(img, figure);
              const width = parseInt(img.getAttribute('width') || '0');
              const height = parseInt(img.getAttribute('height') || '0');

              // Handle srcset first (best quality)
              if (srcset) {
                const parsed = parseSrcset(srcset);
                if (parsed) {
                  const normalized = normalizeImageUrl(parsed.url, link);
                  if (normalized) {
                    imageCandidates.push({
                      url: normalized,
                      width: parsed.width || width || undefined,
                      height: height || undefined,
                      source: 'html',
                      score: isFeatured ? 15 : 10, // Higher score for featured
                      isFeatured
                    });
                  }
                }
              }

              // Handle data-src (lazy loading) - often the actual high-res image
              if (dataSrc) {
                const normalized = normalizeImageUrl(dataSrc, link);
                if (normalized) {
                  imageCandidates.push({
                    url: normalized,
                    width: width || undefined,
                    height: height || undefined,
                    source: 'html',
                    score: isFeatured ? 12 : 8,
                    isFeatured
                  });
                }
              }

              // Handle standard src
              if (src) {
                const normalized = normalizeImageUrl(src, link);
                if (normalized) {
                  imageCandidates.push({
                    url: normalized,
                    width: width || undefined,
                    height: height || undefined,
                    source: 'html',
                    score: isFeatured ? 10 : 6,
                    isFeatured
                  });
                }
              }
            }
          }

          // Then, process all other images
          const images = doc.getElementsByTagName('img');
          for (let j = 0; j < images.length; j++) {
            const img = images[j];

            // Skip if already processed in figure
            let alreadyProcessed = false;
            let parent = img.parentElement;
            while (parent) {
              if (parent.tagName.toLowerCase() === 'figure') {
                alreadyProcessed = true;
                break;
              }
              parent = parent.parentElement;
            }
            if (alreadyProcessed) continue;

            const src = img.getAttribute('src');
            const srcset = img.getAttribute('srcset');
            const dataSrc = img.getAttribute('data-src') ||
              img.getAttribute('data-original') ||
              img.getAttribute('data-lazy-src') ||
              img.getAttribute('data-lazy') ||
              img.getAttribute('data-srcset');

            const isFeatured = isFeaturedImage(img, img.parentElement);
            const width = parseInt(img.getAttribute('width') || '0');
            const height = parseInt(img.getAttribute('height') || '0');

            // Handle srcset (often contains higher res versions)
            if (srcset) {
              const parsed = parseSrcset(srcset);
              if (parsed) {
                const normalized = normalizeImageUrl(parsed.url, link);
                if (normalized) {
                  imageCandidates.push({
                    url: normalized,
                    width: parsed.width || width || undefined,
                    height: height || undefined,
                    source: 'html',
                    score: isFeatured ? 12 : 8,
                    isFeatured
                  });
                }
              }
            }

            // Handle data-src (lazy loading)
            if (dataSrc) {
              const normalized = normalizeImageUrl(dataSrc, link);
              if (normalized) {
                imageCandidates.push({
                  url: normalized,
                  width: width || undefined,
                  height: height || undefined,
                  source: 'html',
                  score: isFeatured ? 10 : 7,
                  isFeatured
                });
              }
            }

            // Handle standard src
            if (src) {
              const normalized = normalizeImageUrl(src, link);
              if (normalized) {
                imageCandidates.push({
                  url: normalized,
                  width: width || undefined,
                  height: height || undefined,
                  source: 'html',
                  score: isFeatured ? 8 : 5,
                  isFeatured
                });
              }
            }

            if (imageCandidates.length > 20) break; // Limit processing
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[ImageExtraction] ⚠️ DOMParser not available, using regex fallback', {
              articleTitle: title.substring(0, 50) + '...'
            });
          }
          throw new Error('DOMParser not available');
        }
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[ImageExtraction] ⚠️ DOMParser failed, using regex fallback', {
            error: e instanceof Error ? e.message : String(e),
            articleTitle: title.substring(0, 50) + '...'
          });
        }
        // Fallback regex - improved patterns
        const imgPatterns = [
          /<img[^>]+src=["']([^"']+)["'][^>]*>/gi,
          /<img[^>]+srcset=["']([^"']+)["'][^>]*>/gi,
          /<img[^>]+data-src=["']([^"']+)["'][^>]*>/gi,
        ];

        const searchContent = htmlContent.substring(0, 5000); // Increased search window
        for (const pattern of imgPatterns) {
          let match;
          while ((match = pattern.exec(searchContent)) !== null) {
            if (match[1]) {
              const normalized = normalizeImageUrl(match[1], link);
              if (normalized) {
                imageCandidates.push({
                  url: normalized,
                  source: 'html',
                  score: 3
                });
                if (imageCandidates.length > 5) break;
              }
            }
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

      // Select best image (normalization happens inside selectBestImage)
      const imageUrl = selectBestImage(imageCandidates, link);

      // Final validation - the URL should already be normalized, but double-check
      let validImageUrl: string | undefined = undefined;
      if (imageUrl) {
        // Additional validation to filter out placeholders and invalid images
        const urlLower = imageUrl.toLowerCase();

        // Skip common placeholder patterns
        if (
          urlLower.includes('?text=') ||
          urlLower.match(/^[a-z0-9]{6}\?text=/i) ||
          (urlLower.includes('placeholder') && !urlLower.includes('image')) ||
          (urlLower.includes('blank') && urlLower.includes('.gif'))
        ) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[ImageValidation] Rejected placeholder pattern', { url: imageUrl.substring(0, 80) });
          }
          validImageUrl = undefined;
        } else {
          try {
            const urlObj = new URL(imageUrl);
            if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
              // Check if it looks like an image URL
              const pathname = urlObj.pathname.toLowerCase();
              const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?|$|#)/i.test(pathname);
              const hasImageIndicator = pathname.includes('image') || pathname.includes('img') || pathname.includes('photo') || pathname.includes('media');
              const hasImageParam = urlObj.searchParams.has('image') || urlObj.searchParams.has('img') || urlObj.searchParams.has('photo');

              // More lenient validation - accept if it has extension, indicator, param, or is from known image CDNs
              const isKnownImageCdn = urlObj.hostname.includes('cdn') ||
                urlObj.hostname.includes('images') ||
                urlObj.hostname.includes('media') ||
                urlObj.hostname.includes('static') ||
                urlObj.hostname.includes('assets') ||
                urlObj.hostname.includes('uploads') ||
                urlObj.hostname.includes('wp-content');

              if (hasImageExtension || hasImageIndicator || hasImageParam || isKnownImageCdn) {
                validImageUrl = imageUrl;

                if (process.env.NODE_ENV === 'development') {
                  logger.debugTag('FEED', 'Accepted image URL', {
                    url: imageUrl.substring(0, 80),
                    hasImageExtension,
                    hasImageIndicator,
                    hasImageParam,
                    isKnownImageCdn
                  });
                }
              } else {
                if (process.env.NODE_ENV === 'development') {
                  logger.debugTag('FEED', 'Rejected - no image indicators', {
                    url: imageUrl.substring(0, 80),
                    pathname: pathname.substring(0, 50)
                  });
                }
              }
            }
          } catch (e) {
            // Invalid URL - already normalized, so this shouldn't happen, but just in case
            if (process.env.NODE_ENV === 'development') {
              console.warn('[ImageValidation] ❌ Failed to validate URL', { url: imageUrl.substring(0, 80), error: e });
            }
            validImageUrl = undefined;
          }
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[ImageValidation] ⚠️ No image URL selected', {
            candidatesCount: imageCandidates.length,
            articleTitle: title.substring(0, 50) + '...'
          });
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
    } catch {
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
        } catch {
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