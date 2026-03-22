/**
 * OptimizedImage.tsx
 *
 * Componente de imagem otimizado que resolve problemas de:
 * - Flickering durante carregamento
 * - Layout shift
 * - Fallbacks robustos
 * - Performance
 *
 * @author Matheus Pereira
 * @version 1.0.0
 */

import React, { useState, useCallback } from 'react';
import { buildImagePlaceholderDataUri } from '../utils/imagePlaceholders';

interface OptimizedImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackText: string;
  width: number;
  height: number;
  priority?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  fallbackText,
  width,
  height,
  priority = false
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState(src);
  const [fallbackLevel, setFallbackLevel] = useState(0);

  const buildSvgPlaceholder = useCallback(
    (variant: "brand" | "neutral", label: string): string =>
      buildImagePlaceholderDataUri({
        width,
        height,
        label: label || fallbackText || "Personal News",
        tone: variant,
        variant: "ambient",
      }),
    [fallbackText, height, width],
  );

  // Generate fallback URLs
  const handleImageLoad = useCallback(() => {
    setImageState('loaded');
  }, []);

  const handleImageError = useCallback(() => {
    const nextLevel = fallbackLevel + 1;
    const nextSrc =
      nextLevel === 1
        ? buildSvgPlaceholder("brand", fallbackText)
        : nextLevel === 2
          ? buildSvgPlaceholder("neutral", fallbackText)
          : buildSvgPlaceholder("neutral", "Imagem indisponivel");

    if (nextLevel <= 3) {
      setFallbackLevel(nextLevel);
      setCurrentSrc(nextSrc);
      setImageState('loading');
    } else {
      setImageState('error');
    }
  }, [buildSvgPlaceholder, fallbackLevel, fallbackText]);

  // Initialize current source
  React.useEffect(() => {
    if (src) {
      setCurrentSrc(src);
      setImageState('loading');
      setFallbackLevel(0);
    } else {
      setCurrentSrc(buildSvgPlaceholder("brand", fallbackText));
      setImageState('loading');
      setFallbackLevel(1);
    }
  }, [buildSvgPlaceholder, fallbackText, src]);

  const showFallbackOverlay =
    imageState === 'error' || !src || fallbackLevel > 0;

  return (
    <div className={`relative overflow-hidden w-full h-full ${className}`}>
      {/* Loading placeholder - prevents layout shift */}
      {imageState === 'loading' && (
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{
            backgroundImage: `url("${fallbackLevel > 0 ? currentSrc : buildSvgPlaceholder("brand", fallbackText)}")`,
          }}
        />
      )}

      {/* Actual image */}
      <img
        src={currentSrc}
        alt={alt}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          imageState === 'loaded' ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading={priority ? 'eager' : 'lazy'}
      />

      {showFallbackOverlay && (
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: `url("${currentSrc}")` }}
        />
      )}
    </div>
  );
};
