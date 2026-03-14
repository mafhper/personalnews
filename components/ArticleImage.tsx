import React, { memo, useEffect } from 'react';
import type { Article } from '../types';
import { LazyImage } from './LazyImage';
import { logger } from '../services/logger';
import { buildImagePlaceholderDataUri } from '../utils/imagePlaceholders';

interface ArticleImageProps {
  article: Article;
  className?: string;
  alt?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  fill?: boolean; // When true, image fills parent container
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
  priority = false,
  fill = false
}) => {
  const placeholderWidth = width || 1200;
  const placeholderHeight = height || 800;
  const editorialFallback = buildImagePlaceholderDataUri({
    width: placeholderWidth,
    height: placeholderHeight,
    label: article.sourceTitle || 'Personal News',
    eyebrow: 'Visual local',
    tone: 'brand',
  });
  const offlineFallback = buildImagePlaceholderDataUri({
    width: placeholderWidth,
    height: placeholderHeight,
    label: article.sourceTitle || 'Personal News',
    eyebrow: 'Offline',
    headline: 'Imagem indisponivel',
    tone: 'neutral',
  });

  const sourcesChain = [
    article.imageUrl || editorialFallback,
    article.imageUrl ? editorialFallback : undefined,
    offlineFallback,
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
        logger.debugTag('SYSTEM', 'No imageUrl found for article', logData);
      } else {
        logger.debugTag('SYSTEM', 'Rendering image', logData);
      }
    }
  }, [article.link, primarySrc, article.imageUrl, priority, remainingFallbacks.length, sourcesChain]);

  return (
    <LazyImage
      src={primarySrc}
      fallbacks={remainingFallbacks}
      alt={alt || article.title}
      placeholder={editorialFallback}
      className={className}
      retryAttempts={2}
      retryDelay={500}
      priority={priority}
      width={width}
      height={height}
      aspectRatio={fill ? undefined : "16/9"}
      fill={fill}
    />
  );
});

ArticleImage.displayName = 'ArticleImage';
