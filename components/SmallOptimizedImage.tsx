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

interface SmallOptimizedImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackText: string;
  size: number; // Para imagens quadradas ou width para retangulares
  height?: number; // Opcional para imagens retangulares
}

export const SmallOptimizedImage: React.FC<SmallOptimizedImageProps> = ({
  src,
  alt,
  className = '',
  fallbackText,
  size,
  height
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState(src);
  const [fallbackLevel, setFallbackLevel] = useState(0);

  const actualHeight = height || size;
  const actualWidth = size;

  // Generate fallback URLs
  const generateFallbackUrl = useCallback((level: number, originalSrc?: string): string => {
    const color1 = '374151'; // Gray-700
    const color2 = '9CA3AF'; // Gray-400

    switch (level) {
      case 0:
        // Original image
        return originalSrc || '';
      case 1:
        // SVG placeholder with text
        return `data:image/svg+xml,${encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="${actualWidth}" height="${actualHeight}">
            <rect width="100%" height="100%" fill="#${color1}"/>
            <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="#${color2}" text-anchor="middle" dominant-baseline="middle">
              ${fallbackText.substring(0, 3)}
            </text>
          </svg>
        `)}`;
      case 2:
      default:
        // Final fallback - simple colored SVG
        return `data:image/svg+xml,${encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="${actualWidth}" height="${actualHeight}">
            <rect width="100%" height="100%" fill="#6B7280"/>
            <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="12" fill="#F3F4F6" text-anchor="middle" dominant-baseline="middle">
              IMG
            </text>
          </svg>
        `)}`;
    }
  }, [fallbackText, actualWidth, actualHeight]);

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
          className="absolute inset-0 bg-gray-700 flex items-center justify-center"
        >
          <div className="text-gray-400 text-xs font-medium">
            {fallbackLevel === 0 ? '...' : fallbackText.substring(0, 3)}
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
        loading="lazy"
      />

      {/* Error state */}
      {imageState === 'error' && (
        <div
          className="absolute inset-0 bg-gray-800 flex items-center justify-center"
        >
          <div className="text-gray-500 text-xs font-medium">
            ⚠️
          </div>
        </div>
      )}
    </div>
  );
};
