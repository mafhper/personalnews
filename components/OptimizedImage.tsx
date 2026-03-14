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
    (
      variant: "brand" | "neutral",
      label: string,
      accentLabel?: string,
    ): string =>
      buildImagePlaceholderDataUri({
        width,
        height,
        label: label || fallbackText || "Personal News",
        eyebrow: accentLabel || "Visual local",
        tone: variant,
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
        ? buildSvgPlaceholder("brand", fallbackText, "Visual local")
        : nextLevel === 2
          ? buildSvgPlaceholder("neutral", fallbackText, "Reserva local")
          : buildSvgPlaceholder("neutral", "Imagem indisponivel", "Offline");

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
      setCurrentSrc(buildSvgPlaceholder("brand", fallbackText, "Visual local"));
      setImageState('loading');
      setFallbackLevel(1);
    }
  }, [buildSvgPlaceholder, fallbackText, src]);

  const showFallbackOverlay =
    imageState === 'error' ||
    !src ||
    fallbackLevel > 0 ||
    (imageState === 'loading' && !currentSrc);

  const overlayEyebrow =
    imageState === 'error'
      ? 'Visual offline'
      : fallbackLevel > 0 || !src
        ? 'Visual local'
        : 'Carregando visual';

  return (
    <div className={`relative overflow-hidden w-full h-full ${className}`}>
      {/* Loading placeholder - prevents layout shift */}
      {imageState === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,#14213a_0%,#0a1019_100%)]">
          <div className="text-center px-4">
            <div className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-white/45">
              {fallbackLevel === 0 ? 'Carregando visual' : 'Reserva local'}
            </div>
            <div className="mt-2 text-sm font-semibold text-white/72">
              {fallbackText}
            </div>
          </div>
        </div>
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
        <div className="absolute inset-x-4 bottom-4 z-10">
          <div className="max-w-[19rem] rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white shadow-2xl backdrop-blur-xl">
            <div className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-white/52">
              {overlayEyebrow}
            </div>
            <div className="mt-2 text-sm font-semibold leading-snug text-white/88">
              {fallbackText}
            </div>
            <div className="mt-2 text-xs leading-relaxed text-white/60">
              {imageState === 'error'
                ? 'A leitura continua com superficie local e contraste preservado.'
                : 'Contexto visual preservado localmente para manter ritmo e leitura.'}
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {imageState === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,#151922_0%,#0e131b_100%)]">
          <div className="text-center px-4">
            <div className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-white/38">
              Visual offline
            </div>
            <div className="mt-2 text-sm font-semibold text-white/70">
              {fallbackText}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
