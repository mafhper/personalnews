import React, { memo, useEffect } from 'react';
import type { Article } from '../types';
import { LazyImage } from './LazyImage';

interface ArticleImageProps {
  article: Article;
  className?: string;
  alt?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

/**
 * ArticleImage - Centralized component for handling article images
 * 
 * Features:
 * - Robust source chain: Original -> Secondary (if available) -> Picsum Fallback
 * - Lazy loading with intersection observer (or immediate load if priority)
 * - Automatic retry logic
 * - Prevents layout shift
 * - Hides broken image icons
 */
export const ArticleImage: React.FC<ArticleImageProps> = memo(({
  article,
  className = '',
  alt = '',
  width,
  height,
  priority = false
}) => {
  // Only use Picsum as fallback if we had an original imageUrl that failed
  // Don't use Picsum if there was never an imageUrl to begin with
  const shouldUseFallback = article.imageUrl !== undefined && article.imageUrl !== null;
  const fallbackUrl = shouldUseFallback 
    ? `https://picsum.photos/seed/${encodeURIComponent(article.link)}/${width || 1200}/${height || 800}`
    : null;
  
  // Chain of sources to try in order
  const sourcesChain = [
    article.imageUrl,
    // Only add Picsum fallback if we had an original imageUrl
    fallbackUrl
  ].filter((s): s is string => typeof s === 'string' && s.length > 0);

  // Determine primary source and its fallbacks
  const primarySrc = sourcesChain[0];
  const remainingFallbacks = sourcesChain.slice(1);

  // Log image loading for debugging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const logData = {
        articleLink: article.link.substring(0, 60) + '...',
        originalImageUrl: article.imageUrl?.substring(0, 80) + '...' || 'NONE',
        primarySrc: primarySrc?.substring(0, 80) + '...' || 'NONE',
        hasImageUrl: !!article.imageUrl,
        isUsingFallback: !article.imageUrl && !!primarySrc,
        priority,
        fallbacksCount: remainingFallbacks.length,
        sourcesChain: sourcesChain.map(s => s.substring(0, 60) + '...')
      };
      
      if (!article.imageUrl) {
        console.warn('[ArticleImage] No imageUrl found for article', logData);
      } else {
        console.log('[ArticleImage] Rendering image', logData);
      }
    }
  }, [article.link, primarySrc, article.imageUrl, priority, remainingFallbacks.length, sourcesChain]);

  // If no image URL at all, return a placeholder div instead of trying to load Picsum
  if (!article.imageUrl && sourcesChain.length === 0) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[ArticleImage] No image sources available, rendering placeholder', {
        articleLink: article.link.substring(0, 60) + '...'
      });
    }
    
    return (
      <div 
        className={`${className} bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center`}
        style={{ minHeight: height || 200, minWidth: width || 300 }}
      >
        <div className="text-center p-4 min-w-0 max-w-full">
          <div className="text-gray-500 text-xs font-medium uppercase tracking-widest mb-2 truncate px-2">
            {article.sourceTitle}
          </div>
          <div className="text-gray-600 text-xs">
            Sem imagem
          </div>
        </div>
      </div>
    );
  }

  return (
    <LazyImage
      src={primarySrc}
      fallbacks={remainingFallbacks}
      alt={alt || article.title}
      className={className}
      retryAttempts={2}
      retryDelay={500}
      priority={priority}
    />
  );
});

ArticleImage.displayName = 'ArticleImage';
