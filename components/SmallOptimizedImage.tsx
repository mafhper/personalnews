/**
 * SmallOptimizedImage.tsx
 *
 * Componente de imagem otimizado para imagens pequenas (thumbnails)
 * Resolve problemas de flickering e layout shift
 *
 * @author Matheus Pereira
 * @version 1.0.0
 */

import React, { useState, useCallback } from 'react';
import { buildImagePlaceholderDataUri } from '../utils/imagePlaceholders';

interface SmallOptimizedImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackText: string;
  size: number; // Para imagens quadradas ou width para retangulares
  height?: number; // Opcional para imagens retangulares
  priority?: boolean;
}

export const SmallOptimizedImage: React.FC<SmallOptimizedImageProps> = ({
  src,
  alt,
  className = '',
  fallbackText,
  size,
  height,
  priority = false
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState(src);
  const [fallbackLevel, setFallbackLevel] = useState(0);

  const actualHeight = height || size;
  const actualWidth = size;

  // Generate fallback URLs
  const generateFallbackUrl = useCallback((level: number, originalSrc?: string): string => {
    switch (level) {
      case 0:
        // Original image
        return originalSrc || '';
      case 1:
        return buildImagePlaceholderDataUri({
          width: actualWidth,
          height: actualHeight,
          label: fallbackText || 'Personal News',
          eyebrow: 'Visual local',
          tone: 'neutral',
        });
      case 2:
      default:
        return buildImagePlaceholderDataUri({
          width: actualWidth,
          height: actualHeight,
          label: fallbackText || 'Personal News',
          eyebrow: 'Offline',
          headline: 'Imagem indisponivel',
          tone: 'neutral',
      });
    }
  }, [actualHeight, actualWidth, fallbackText]);
  const localPlaceholder = generateFallbackUrl(1, undefined);
  const offlinePlaceholder = generateFallbackUrl(2, undefined);

  const handleImageLoad = useCallback(() => {
    setImageState('loaded');
  }, []);

  const handleImageError = useCallback(() => {
    const nextLevel = fallbackLevel + 1;
    const nextSrc = generateFallbackUrl(nextLevel, src);

    if (nextLevel <= 2) {
      setFallbackLevel(nextLevel);
      setCurrentSrc(nextSrc);
      setImageState('loading');
    } else {
      setImageState('error');
    }
  }, [fallbackLevel, generateFallbackUrl, src]);

  // Initialize current source
  React.useEffect(() => {
    if (src) {
      setCurrentSrc(src);
      setImageState('loading');
      setFallbackLevel(0);
    } else {
      // No source provided, go directly to placeholder
      setCurrentSrc(generateFallbackUrl(1, undefined));
      setImageState('loading');
      setFallbackLevel(1);
    }
  }, [src, generateFallbackUrl]);

  return (
    <div
      className={`relative overflow-hidden flex-shrink-0 ${className}`}
    >
      {/* Loading placeholder - prevents layout shift */}
      {imageState === 'loading' && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-center bg-cover"
          style={{ backgroundImage: `url("${localPlaceholder}")` }}
        >
          <div className="rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-center text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-white/58 backdrop-blur-sm">
            {fallbackLevel === 0 ? 'Carregando visual' : 'Visual local'}
          </div>
        </div>
      )}

      {/* Actual image */}
      <img
        src={currentSrc}
        alt={alt}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
          imageState === 'loaded' ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading={priority ? "eager" : "lazy"}
      />

      {/* Error state */}
      {imageState === 'error' && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-center bg-cover"
          style={{ backgroundImage: `url("${offlinePlaceholder}")` }}
        >
          <div className="rounded-full border border-white/10 bg-black/42 px-3 py-1.5 text-center text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-white/52 backdrop-blur-sm">
            Offline
          </div>
        </div>
      )}
    </div>
  );
};
