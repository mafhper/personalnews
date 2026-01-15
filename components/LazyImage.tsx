import React, { useState, useRef, useEffect, useCallback } from 'react';

const DEFAULT_PLACEHOLDER = `data:image/svg+xml;base64,${btoa(`
  <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#374151;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#1f2937;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)" />
  </svg>
`)}`;

const DEFAULT_ERROR_PLACEHOLDER = `data:image/svg+xml;base64,${btoa(`
  <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gradError" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#1f2937;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#111827;stop-opacity:1" />
      </linearGradient>
      <pattern id="pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" fill="#374151" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#gradError)" />
    <rect width="100%" height="100%" fill="url(#pattern)" />
    <path d="M30 50 L50 30 L70 50 L50 70 Z" fill="none" stroke="#374151" stroke-width="2" opacity="0.5" />
  </svg>
`)}`;

interface LazyImageProps {
  src: string | undefined | null;
  alt: string;
  placeholder?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  retryAttempts?: number;
  retryDelay?: number;
  sizes?: string;
  srcSet?: string;
  fallbacks?: string[];
  priority?: boolean; // If true, load immediately without waiting for intersection
  // CLS Prevention: explicit dimensions
  width?: number;
  height?: number;
  aspectRatio?: string; // e.g., '16/9', '4/3', '1/1'
  fill?: boolean; // If true, image fills parent container (disables aspectRatio)
}

const LazyImageComponent: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder,
  className = '',
  onLoad,
  onError,
  retryAttempts = 2,
  retryDelay = 500,
  sizes = '(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw',
  srcSet,
  fallbacks = [],
  priority = false,
  width,
  height,
  aspectRatio = '16/9', // Default aspect ratio for content images
  fill = false, // When true, image fills parent (ignores aspectRatio)
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority); // If priority, start as in view
  const [hasError, setHasError] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [currentSrcIndex, setCurrentSrcIndex] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // List of all valid sources to try
  const sources = [src, ...fallbacks].filter((s): s is string => typeof s === 'string' && s.length > 0);

  // Log for debugging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[LazyImage] Initialized', {
        src: src?.substring(0, 60) + '...',
        priority,
        sourcesCount: sources.length,
        isInView: isInView
      });
    }
  }, [src, priority, sources.length, isInView]);

  // Create intersection observer (skip if priority)
  useEffect(() => {
    if (priority) {
      // If priority, we're already in view, no need for observer
      return;
    }

    if (!imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();

          if (process.env.NODE_ENV === 'development') {
            console.log('[LazyImage] Entered viewport', {
              src: src?.substring(0, 60) + '...'
            });
          }
        }
      },
      {
        rootMargin: '200px', // Pre-load earlier
        threshold: 0.01,
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, src]);

  const handleImageLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);

    if (process.env.NODE_ENV === 'development') {
      console.log('[LazyImage] Image loaded successfully', {
        src: sources[currentSrcIndex]?.substring(0, 60) + '...',
        srcIndex: currentSrcIndex
      });
    }

    onLoad?.();
  }, [onLoad, sources, currentSrcIndex]);

  const handleImageError = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[LazyImage] Image load error', {
        src: sources[currentSrcIndex]?.substring(0, 60) + '...',
        attempt: currentAttempt + 1,
        maxAttempts: retryAttempts,
        srcIndex: currentSrcIndex,
        totalSources: sources.length
      });
    }

    if (currentAttempt < retryAttempts) {
      // Retry current source
      setTimeout(() => {
        setCurrentAttempt(prev => prev + 1);
      }, retryDelay);
    } else {
      // Current source failed all retries. Try next source in the chain.
      const nextIndex = currentSrcIndex + 1;
      if (nextIndex < sources.length) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[LazyImage] Trying next fallback', {
            nextSrc: sources[nextIndex]?.substring(0, 60) + '...',
            nextIndex
          });
        }
        setCurrentSrcIndex(nextIndex);
        setCurrentAttempt(0);
      } else {
        // Absolutely all sources failed
        if (process.env.NODE_ENV === 'development') {
          console.error('[LazyImage] All sources failed', {
            totalSources: sources.length
          });
        }
        setHasError(true);
        setIsLoaded(true); // Show the error placeholder
        onError?.();
      }
    }
  }, [currentAttempt, retryAttempts, retryDelay, onError, currentSrcIndex, sources]);

  // Determine current image source
  const getImageSrc = () => {
    if (hasError || sources.length === 0) {
      return DEFAULT_ERROR_PLACEHOLDER;
    }

    // While loading or not in view, show placeholder
    if (!isInView && currentAttempt === 0 && currentSrcIndex === 0) {
      return placeholder || DEFAULT_PLACEHOLDER;
    }

    return sources[currentSrcIndex];
  };

  // Reset state if src changes significantly
  useEffect(() => {
    // We need to reset the state when the src prop changes to handle the new image load
    // This is a valid use case for derived state from props where a key change isn't possible
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoaded(false);
    setHasError(false);
    setCurrentAttempt(0);
    setCurrentSrcIndex(0);
  }, [src]);

  const currentSrc = getImageSrc();
  const shouldUseLazy = !priority; // Only use lazy loading if not priority

  // Compute style for aspect-ratio based sizing (CLS prevention)
  // When fill is true, skip aspectRatio to let parent container control dimensions
  const imageStyle: React.CSSProperties = {
    ...(fill ? {} : { aspectRatio }),
    ...(width && !fill ? { width } : {}),
    ...(height && !fill ? { height } : {}),
    objectPosition: 'center', // Always center the image
  };

  return (
    <img
      ref={imgRef}
      src={currentSrc}
      alt={hasError ? "" : alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      style={imageStyle}
      className={`transition-opacity duration-300 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-80'
        } ${className} ${!isLoaded ? 'bg-gray-800' : ''}`}
      onLoad={handleImageLoad}
      onError={handleImageError}
      loading={shouldUseLazy ? "lazy" : "eager"}
      sizes={sizes}
      // Disable srcSet if we're on a fallback to avoid confusion
      srcSet={!hasError && isInView && currentSrcIndex === 0 ? srcSet : undefined}
    />
  );
};

export const LazyImage = React.memo(LazyImageComponent);