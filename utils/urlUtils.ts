/**
 * urlUtils.ts
 * 
 * Utilities for URL manipulation and normalization.
 */

/**
 * Normalizes a URL for consistent comparison.
 * - Trims whitespace
 * - Ensures protocol is present (defaults to https if missing)
 * - Removes trailing slash
 * - Lowercases hostname
 */
export const normalizeUrl = (url: string): string => {
  if (!url) return '';
  
  try {
    let target = url.trim();
    
    // Add protocol if missing
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = 'https://' + target;
    }
    
    const urlObj = new URL(target);
    
    // Lowercase hostname and remove trailing slash from pathname
    const hostname = urlObj.hostname.toLowerCase();
    let pathname = urlObj.pathname;
    
    if (pathname.endsWith('/') && pathname.length > 1) {
      pathname = pathname.slice(0, -1);
    }
    
    // Reconstruct normalized URL
    let normalized = `${urlObj.protocol}//${hostname}${pathname}${urlObj.search}${urlObj.hash}`;
    
    // Final check for trailing slash if no search/hash
    if (!urlObj.search && !urlObj.hash && normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1);
    }

    return normalized;
  } catch (e) {
    // Fallback for invalid URLs
    return url.trim().toLowerCase().replace(/\/$/, '');
  }
};

/**
 * Compares two URLs for equality after normalization.
 */
export const areUrlsEqual = (url1: string, url2: string): boolean => {
  if (!url1 || !url2) return false;
  return normalizeUrl(url1) === normalizeUrl(url2);
};
