/**
 * Production RSS Parser for GitHub Pages
 * 
 * This parser works with static hosting by using:
 * 1. RSS2JSON API as primary method
 * 2. Multiple CORS proxies as fallback
 * 3. Relaxed XML validation for production
 * 4. Intelligent caching and retry logic
 */

import type { Article } from "../types";
import { getLogger } from "./logger";
import { perfDebugger } from "./performanceUtils";
import { getCachedArticles, setCachedArticles } from "./smartCache";

// Import image extraction utilities from rssParser
// These functions are shared between parsers
interface ImageCandidate {
  url: string;
  width?: number;
  height?: number;
  size?: number;
  score: number;
  source: 'enclosure' | 'media:content' | 'media:thumbnail' | 'html';
  isFeatured?: boolean;
}

/**
 * Normalize image URL - resolve relative URLs and protocol-relative URLs
 */
function normalizeImageUrl(url: string, baseUrl?: string): string | null {
  if (!url || url.trim().length === 0) return null;
  
  let normalized = url.trim();
  normalized = normalized.replace(/^["']|["']$/g, '');
  
  if (normalized.startsWith('data:') || normalized.startsWith('javascript:') || normalized.startsWith('#')) {
    return null;
  }
  
  if (normalized.startsWith('//')) {
    normalized = 'https:' + normalized;
  }
  
  if (baseUrl && !normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    try {
      const base = new URL(baseUrl);
      if (normalized.startsWith('/')) {
        normalized = base.origin + normalized;
      } else {
        normalized = new URL(normalized, baseUrl).href;
      }
    } catch {
      return null;
    }
  }
  
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
  if (parent) {
    const parentClass = parent.getAttribute('class') || '';
    const parentTag = parent.tagName.toLowerCase();
    
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
    const widthPart = parts.find(p => p.endsWith('w'));
    const width = widthPart ? parseInt(widthPart) : 0;
    const densityPart = parts.find(p => p.endsWith('x'));
    const density = densityPart ? parseFloat(densityPart) : 1;
    const estimatedWidth = width || (density > 1 ? 800 * density : 800);
    parsedSources.push({ url, width: estimatedWidth });
  }
  
  parsedSources.sort((a, b) => b.width - a.width);
  return parsedSources.length > 0 ? parsedSources[0] : null;
}

/**
 * Select the best image from candidates
 */
function selectBestImage(candidates: ImageCandidate[], articleLink?: string): string | undefined {
  if (candidates.length === 0) return undefined;

  const normalizedCandidates = candidates
    .map(c => {
      const normalizedUrl = normalizeImageUrl(c.url, articleLink);
      if (!normalizedUrl) return null;
      return { ...c, url: normalizedUrl };
    })
    .filter((c): c is ImageCandidate => c !== null);

  if (normalizedCandidates.length === 0) return undefined;

  normalizedCandidates.sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    const aIsLarge = (a.width || 0) >= 800;
    const bIsLarge = (b.width || 0) >= 800;
    if (aIsLarge && !bIsLarge) return -1;
    if (!aIsLarge && bIsLarge) return 1;
    const scoreA = a.score + (a.source === 'media:content' || a.source === 'enclosure' ? 2 : 0);
    const scoreB = b.score + (b.source === 'media:content' || b.source === 'enclosure' ? 2 : 0);
    if (a.width && b.width && a.width !== b.width) return b.width - a.width;
    if (a.size && b.size && a.size !== b.size) return b.size - a.size;
    return scoreB - scoreA;
  });

  const viable = normalizedCandidates.filter(c => {
    if (c.width && c.width <= 50) {
      return c.isFeatured || c.source === 'media:content' || c.source === 'enclosure';
    }
    return true;
  });

  const filtered = viable.filter(c => {
    const urlLower = c.url.toLowerCase();
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

// Production-ready CORS proxies and APIs
const RSS_APIS = [
  {
    name: "RSS2JSON",
    url: "https://api.rss2json.com/v1/api.json?rss_url=",
    type: "json" as const,
    rateLimit: 10000, // 10k requests/day
  },
  {
    name: "AllOrigins",
    url: "https://api.allorigins.win/get?url=",
    type: "proxy" as const,
    rateLimit: 200, // 200 requests/hour
  },
  {
    name: "CorsProxy",
    url: "https://corsproxy.io/?",
    type: "proxy" as const,
    rateLimit: 100, // 100 requests/hour
  },
  {
    name: "ProxyCors",
    url: "https://proxy.cors.sh/",
    type: "proxy" as const,
    rateLimit: 1000, // 1k requests/day
  }
];

const DEFAULT_TIMEOUT_MS = 10000; // 10 seconds for production
const MAX_RETRY_ATTEMPTS = 2; // Reduced retries for production
const RETRY_DELAY_BASE_MS = 2000; // 2 second base delay

const logger = getLogger();

/**
 * Enhanced fetch with timeout for production
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeout}ms`);
    }

    throw error;
  }
}

/**
 * Parse RSS using RSS2JSON API (returns JSON directly)
 */
async function parseRssWithRss2Json(feedUrl: string): Promise<Article[]> {
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
  
  const response = await fetchWithTimeout(apiUrl);
  
  if (!response.ok) {
    throw new Error(`RSS2JSON API failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.status !== 'ok') {
    throw new Error(`RSS2JSON API error: ${data.message || 'Unknown error'}`);
  }

  // Convert RSS2JSON format to our Article format with improved image extraction
  const articles: Article[] = [];
  
  for (const item of data.items || []) {
    try {
      const link = item.link || '';
      const imageCandidates: ImageCandidate[] = [];
      
      // Check thumbnail
      if (item.thumbnail) {
        const normalized = normalizeImageUrl(item.thumbnail, link);
        if (normalized) {
          imageCandidates.push({
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
          imageCandidates.push({
            url: normalized,
            size: item.enclosure.length ? parseInt(item.enclosure.length) : undefined,
            source: 'enclosure',
            score: 10
          });
        }
      }
      
      // Extract from content/description HTML if available (use RAW, not cleaned)
      // Note: RSS2JSON may already provide HTML in content/description fields
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
                  imageCandidates.push({
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
                imageCandidates.push({
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
                imageCandidates.push({
                  url: normalized,
                  width: width || undefined,
                  source: 'html',
                  score: isFeatured ? 8 : 5,
                  isFeatured
                });
              }
            }
          }
        } catch (e) {
          // Fallback to regex if DOMParser fails
          const imgPattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
          const searchContent = htmlContent.substring(0, 3000);
          let match;
          let count = 0;
          while ((match = imgPattern.exec(searchContent)) !== null && count < 3) {
            if (match[1]) {
              const normalized = normalizeImageUrl(match[1], link);
              if (normalized) {
                imageCandidates.push({
                  url: normalized,
                  source: 'html',
                  score: 3
                });
                count++;
              }
            }
          }
        }
      }
      
      const imageUrl = selectBestImage(imageCandidates, link);
      
      // Final validation
      let validImageUrl: string | undefined = undefined;
      if (imageUrl) {
        const urlLower = imageUrl.toLowerCase();
        if (
          !urlLower.includes('?text=') &&
          !urlLower.match(/^[a-z0-9]{6}\?text=/i) &&
          !(urlLower.includes('placeholder') && !urlLower.includes('image')) &&
          !(urlLower.includes('blank') && urlLower.includes('.gif'))
        ) {
          try {
            const urlObj = new URL(imageUrl);
            if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
              const pathname = urlObj.pathname.toLowerCase();
              const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?|$|#)/i.test(pathname);
              const hasImageIndicator = pathname.includes('image') || pathname.includes('img') || pathname.includes('photo') || pathname.includes('media');
              const hasImageParam = urlObj.searchParams.has('image') || urlObj.searchParams.has('img') || urlObj.searchParams.has('photo');
              const isKnownImageCdn = urlObj.hostname.includes('cdn') || 
                                     urlObj.hostname.includes('images') ||
                                     urlObj.hostname.includes('media') ||
                                     urlObj.hostname.includes('static') ||
                                     urlObj.hostname.includes('assets') ||
                                     urlObj.hostname.includes('uploads') ||
                                     urlObj.hostname.includes('wp-content');
              
              if (hasImageExtension || hasImageIndicator || hasImageParam || isKnownImageCdn) {
                validImageUrl = imageUrl;
              }
            }
          } catch (e) {
            // Invalid URL
          }
        }
      }
      
      // Log only if no image found (for debugging)
      if (process.env.NODE_ENV === 'development' && !validImageUrl && imageCandidates.length === 0) {
        console.warn(`[ImageExtraction] No images found for: "${(item.title || 'No Title').substring(0, 50)}..."`, {
          link: link.substring(0, 60) + '...'
        });
      }
      
      articles.push({
    title: item.title || 'No Title',
        link: link,
    pubDate: new Date(item.pubDate || Date.now()),
    description: cleanDescription(item.description || ''),
        imageUrl: validImageUrl,
    author: item.author || undefined,
    categories: item.categories || [],
    sourceTitle: data.feed?.title || 'Unknown Feed',
      });
    } catch (e) {
      // Skip invalid items
      logger.warn("Failed to parse RSS2JSON item", { component: "productionRssParser" });
    }
  }

  return articles;
}

/**
 * Parse RSS using CORS proxy (returns XML)
 */
async function parseRssWithProxy(feedUrl: string, proxyUrl: string): Promise<Article[]> {
  let fetchUrl: string;
  
  if (proxyUrl.includes("allorigins.win")) {
    fetchUrl = `${proxyUrl}${encodeURIComponent(feedUrl)}`;
  } else {
    fetchUrl = `${proxyUrl}${encodeURIComponent(feedUrl)}`;
  }

  const response = await fetchWithTimeout(fetchUrl);
  
  if (!response.ok) {
    throw new Error(`Proxy failed: ${response.status} ${response.statusText}`);
  }

  let xmlContent = await response.text();

  // Handle AllOrigins response format
  if (proxyUrl.includes("allorigins.win")) {
    try {
      const jsonResponse = JSON.parse(xmlContent);
      if (jsonResponse.contents) {
        xmlContent = jsonResponse.contents;
      } else {
        throw new Error("No contents in AllOrigins response");
      }
    } catch (e) {
      throw new Error(`Failed to parse AllOrigins response: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (!xmlContent.trim()) {
    throw new Error("Empty RSS feed received from proxy");
  }

  // Parse XML with relaxed validation for production
  return parseRssXmlProduction(xmlContent, feedUrl);
}

/**
 * Production XML parser with relaxed validation
 */
function parseRssXmlProduction(xmlContent: string, feedUrl: string): Article[] {
  // Use native DOMParser with minimal validation
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, "application/xml");

  // Check for parsing errors
  const parseErrors = xmlDoc.getElementsByTagName("parsererror");
  if (parseErrors.length > 0) {
    throw new Error(`XML parsing error: ${parseErrors[0].textContent}`);
  }

  let channelTitle = "Unknown Feed";
  let items: HTMLCollectionOf<Element> | NodeListOf<Element>;

  // Try RSS 2.0 format first
  const channels = xmlDoc.getElementsByTagName("channel");
  if (channels.length > 0) {
    const titleElements = channels[0].getElementsByTagName("title");
    channelTitle = titleElements[0]?.textContent?.trim() || "Unknown Feed";
    items = xmlDoc.getElementsByTagName("item");
  } else {
    // Try Atom format
    const feeds = xmlDoc.getElementsByTagName("feed");
    if (feeds.length > 0) {
      const titleElements = feeds[0].getElementsByTagName("title");
      channelTitle = titleElements[0]?.textContent?.trim() || "Unknown Feed";
      items = xmlDoc.getElementsByTagName("entry");
    } else {
      // Try RDF format
      const rdfItems = xmlDoc.getElementsByTagName("item");
      if (rdfItems.length > 0) {
        items = rdfItems;
      } else {
        throw new Error("No RSS items found in feed");
      }
    }
  }

  const articles: Article[] = [];

  for (let i = 0; i < Math.min(items.length, 50); i++) { // Limit to 50 items for performance
    const item = items[i];

    try {
      // Extract title
      const titleElements = item.getElementsByTagName("title");
      const title = titleElements[0]?.textContent?.trim() || "No Title";

      // Extract link
      let link = "";
      const linkElements = item.getElementsByTagName("link");
      if (linkElements.length > 0) {
        link = linkElements[0].textContent?.trim() || linkElements[0].getAttribute("href") || "";
      }

      // Extract publication date
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

      // Extract RAW content/description BEFORE cleaning (needed for image extraction)
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

      // Clean description for final use (after image extraction)
      const description = cleanDescription(descriptionRaw).substring(0, 300);

      // Extract author
      let author = "";
      const authorElements = item.getElementsByTagName("author");
      const creatorElements = item.getElementsByTagName("creator");

      const authorElement = authorElements[0] || creatorElements[0];
      if (authorElement?.textContent) {
        author = authorElement.textContent.trim();
      }

      // Extract categories
      const categories: string[] = [];
      const categoryElements = item.getElementsByTagName("category");
      for (let j = 0; j < Math.min(categoryElements.length, 5); j++) { // Limit categories
        const catText = categoryElements[j].textContent?.trim();
        if (catText) categories.push(catText);
      }

      // --- IMPROVED IMAGE EXTRACTION ---
      const imageCandidates: ImageCandidate[] = [];

      // 1. Check Enclosures
      const enclosureElements = item.getElementsByTagName("enclosure");
      for (let j = 0; j < enclosureElements.length; j++) {
        const enclosure = enclosureElements[j];
        const type = enclosure.getAttribute("type") || "";
        const url = enclosure.getAttribute("url");
        if (url && type.startsWith("image/")) {
          const normalized = normalizeImageUrl(url, link);
          if (normalized) {
            imageCandidates.push({
              url: normalized,
              size: parseInt(enclosure.getAttribute("length") || "0"),
              source: 'enclosure',
              score: 10
            });
          }
        }
      }

      // 2. Check Media Content/Group
      const processMediaElement = (el: Element) => {
        const url = el.getAttribute("url");
        const type = el.getAttribute("type") || el.getAttribute("medium") || "";
        const width = parseInt(el.getAttribute("width") || "0");
        const height = parseInt(el.getAttribute("height") || "0");
        if (url && (type.startsWith("image") || type === "image")) {
          const normalized = normalizeImageUrl(url, link);
          if (normalized) {
            imageCandidates.push({
              url: normalized,
              width: width || undefined,
              height: height || undefined,
              source: 'media:content',
              score: 10 + (width > 600 ? 5 : 0)
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
        const url = mediaThumbnails[j].getAttribute("url");
        const width = parseInt(mediaThumbnails[j].getAttribute("width") || "0");
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

      // 4. Extract from Content/Description HTML (use RAW content, not cleaned)
      const htmlContent = contentRaw || descriptionRaw || "";
      
      
      if (htmlContent && typeof DOMParser !== 'undefined') {
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlContent, 'text/html');
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
                            img.getAttribute('data-lazy-src');
              
              const isFeatured = isFeaturedImage(img, figure);
              const width = parseInt(img.getAttribute('width') || '0');
              const height = parseInt(img.getAttribute('height') || '0');
              
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
                      score: isFeatured ? 15 : 10,
                      isFeatured
                    });
                  }
                }
              }
              
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
          
          const images = doc.getElementsByTagName('img');
          for (let j = 0; j < images.length; j++) {
            const img = images[j];
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
                          img.getAttribute('data-lazy-src');
            
            const isFeatured = isFeaturedImage(img, img.parentElement);
            const width = parseInt(img.getAttribute('width') || '0');
            const height = parseInt(img.getAttribute('height') || '0');
            
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
            
            if (imageCandidates.length > 20) break;
          }
        } catch (e) {
          // Fallback regex
          const imgPatterns = [
            /<img[^>]+src=["']([^"']+)["'][^>]*>/gi,
            /<img[^>]+srcset=["']([^"']+)["'][^>]*>/gi,
            /<img[^>]+data-src=["']([^"']+)["'][^>]*>/gi,
          ];
          const searchContent = htmlContent.substring(0, 5000);
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
      }

      const imageUrl = selectBestImage(imageCandidates, link);

      // Log image extraction only in development and only if no image found
      if (process.env.NODE_ENV === 'development' && !imageUrl && imageCandidates.length === 0) {
        console.warn(`[ImageExtraction] No images found for: "${title.substring(0, 50)}..."`, {
          link: link.substring(0, 60) + '...'
        });
      }

      // Final validation
      let validImageUrl: string | undefined = undefined;
      if (imageUrl) {
        const urlLower = imageUrl.toLowerCase();
        if (
          !urlLower.includes('?text=') &&
          !urlLower.match(/^[a-z0-9]{6}\?text=/i) &&
          !(urlLower.includes('placeholder') && !urlLower.includes('image')) &&
          !(urlLower.includes('blank') && urlLower.includes('.gif'))
        ) {
          try {
            const urlObj = new URL(imageUrl);
            if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
              const pathname = urlObj.pathname.toLowerCase();
              const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?|$|#)/i.test(pathname);
              const hasImageIndicator = pathname.includes('image') || pathname.includes('img') || pathname.includes('photo') || pathname.includes('media');
              const hasImageParam = urlObj.searchParams.has('image') || urlObj.searchParams.has('img') || urlObj.searchParams.has('photo');
              const isKnownImageCdn = urlObj.hostname.includes('cdn') || 
                                     urlObj.hostname.includes('images') ||
                                     urlObj.hostname.includes('media') ||
                                     urlObj.hostname.includes('static') ||
                                     urlObj.hostname.includes('assets') ||
                                     urlObj.hostname.includes('uploads') ||
                                     urlObj.hostname.includes('wp-content');
              
              if (hasImageExtension || hasImageIndicator || hasImageParam || isKnownImageCdn) {
                validImageUrl = imageUrl;
              }
            }
          } catch (e) {
            // Invalid URL
          }
        }
      }

      // Only add valid articles
      if (title !== "No Title" && link) {
        articles.push({
          title,
          link,
          pubDate,
          description,
          imageUrl: validImageUrl,
          author: author || undefined,
          categories,
          sourceTitle: channelTitle,
        });
      }
    } catch (error) {
      logger.warn(`Failed to parse article ${i + 1} from ${feedUrl}`, {
        component: "productionRssParser",
        additionalData: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  return articles;
}

/**
 * Clean HTML description text (simplified for production)
 */
function cleanDescription(description: string): string {
  if (!description) return "";

  let cleanText = description;
  
  // Primeiro, decodifica entidades HTML para detectar tags codificadas
  cleanText = cleanText
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
  
  // Agora remove todas as tags HTML (incluindo as decodificadas)
  cleanText = cleanText
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove scripts
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "") // Remove iframes
    .replace(/<[^>]*>/g, ""); // Remove all HTML tags
  
  // Por último, decodifica entidades restantes e limpa
  cleanText = cleanText
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
    
  return cleanText;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate retry delay with exponential backoff
 */
function getRetryDelay(attempt: number): number {
  return RETRY_DELAY_BASE_MS * Math.pow(2, attempt - 1);
}

/**
 * Main RSS parsing function with multiple fallback methods
 */
async function parseRssUrlWithFallback(
  url: string,
  options: {
    timeout?: number;
    maxRetries?: number;
    signal?: AbortSignal;
  } = {}
): Promise<{ title: string; articles: Article[] }> {
  const { maxRetries = MAX_RETRY_ATTEMPTS, signal } = options;

  let lastError: Error = new Error("Unknown error");

  // Try each RSS API/proxy in order
  for (let apiIndex = 0; apiIndex < RSS_APIS.length; apiIndex++) {
    const api = RSS_APIS[apiIndex];
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.debug(`Trying ${api.name} (attempt ${attempt}/${maxRetries})`, {
          component: "productionRssParser",
          additionalData: { feedUrl: url, api: api.name, attempt },
        });

        perfDebugger.log(`Fetching RSS via ${api.name} (attempt ${attempt}): ${url}`);

        let articles: Article[];
        let title: string;

        if (api.type === "json") {
          // Use RSS2JSON API
          articles = await parseRssWithRss2Json(url);
          title = articles[0]?.sourceTitle || "Unknown Feed";
        } else {
          // Use CORS proxy
          articles = await parseRssWithProxy(url, api.url);
          title = articles[0]?.sourceTitle || "Unknown Feed";
        }

        // Cache successful results
        if (articles.length > 0) {
          setCachedArticles(url, articles, title);
        }

        logger.info(`Successfully fetched feed via ${api.name} on attempt ${attempt}`, {
          component: "productionRssParser",
          additionalData: {
            feedUrl: url,
            api: api.name,
            articlesCount: articles.length,
            attempt,
          },
        });

        return { title, articles };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if we should abort due to signal
        if (signal?.aborted) {
          throw new Error("Request was cancelled");
        }

        logger.warn(`${api.name} attempt ${attempt} failed`, {
          component: "productionRssParser",
          additionalData: {
            feedUrl: url,
            api: api.name,
            attempt,
            error: lastError.message,
          },
        });

        // Don't retry on the last attempt or last API
        if (attempt === maxRetries || apiIndex === RSS_APIS.length - 1) {
          break;
        }

        // Wait before retrying
        const delay = getRetryDelay(attempt);
        await sleep(delay);
      }
    }
  }

  // All APIs failed
  logger.error(`All RSS APIs failed for feed`, lastError, {
    component: "productionRssParser",
    additionalData: {
      feedUrl: url,
      apisAttempted: RSS_APIS.length,
      maxRetries,
    },
  });

  throw lastError;
}

/**
 * Main export function - works in both development and production
 */
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

  // Check cache first (unless skipping)
  if (!skipCache) {
    const cachedArticles = getCachedArticles(url);
    if (cachedArticles && cachedArticles.length > 0) {
          logger.debug(`Using cached articles for feed`, {
        component: "productionRssParser",
        additionalData: {
          feedUrl: url,
          cachedCount: cachedArticles.length,
        },
      });
      
      return {
        title: cachedArticles[0].sourceTitle || "Cached Feed",
        articles: cachedArticles,
      };
    }
  }

  // No cache hit or cache skipped, fetch from RSS APIs
  logger.info(`Fetching feed with production parser`, {
    component: "productionRssParser",
    additionalData: {
      feedUrl: url,
      timeout: options.timeout || DEFAULT_TIMEOUT_MS,
      maxRetries: options.maxRetries || MAX_RETRY_ATTEMPTS,
      skipCache,
    },
  });

  return await parseRssUrlWithFallback(url, options);
}