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
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  retryAttempts?: number;
  retryDelay?: number;
  sizes?: string;
  srcSet?: string;
}

const LazyImageComponent: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder,
  className = '',
  onLoad,
  onError,
  retryAttempts = 3,
  retryDelay = 1000,
  sizes = '(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw',
  srcSet,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Create intersection observer
  useEffect(() => {
    if (!imgRef.current) return;

    // Check for native lazy loading support (optional optimization, but we keep IO for animation)
    // If we purely relied on native, we wouldn't know when to setIsInView for the fade-in.
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: '100px', // Increased margin for pre-loading
        threshold: 0.01,
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  // Handle image loading with retry logic
  const handleImageLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
    setCurrentAttempt(0);
    onLoad?.();
  }, [onLoad]);

  const handleImageError = useCallback(() => {
    if (currentAttempt < retryAttempts) {
      // Retry after delay
      setTimeout(() => {
        setCurrentAttempt(prev => prev + 1);
      }, retryDelay);
    } else {
      setHasError(true);
      setIsLoaded(true); // Ensure error placeholder is visible
      onError?.();
    }
  }, [currentAttempt, retryAttempts, retryDelay, onError]);

  // Determine which source to show
  const getImageSrc = () => {
    if (hasError) {
      return DEFAULT_ERROR_PLACEHOLDER;
    }
    if (isInView || currentAttempt > 0) { // If retrying, keep trying src
      return src;
    }
    return placeholder || DEFAULT_PLACEHOLDER;
  };

  return (
    <img
      ref={imgRef}
      src={getImageSrc()}
      alt={hasError ? "" : alt} // Hide alt text on error to avoid overlay
      className={`transition-opacity duration-500 ease-in-out ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      } ${className} ${!isLoaded ? 'bg-gray-800 animate-pulse' : ''}`}
      onLoad={handleImageLoad}
      onError={handleImageError}
      loading="lazy"
      sizes={sizes}
      srcSet={!hasError && isInView ? srcSet : undefined} // Disable srcSet on error
    />
  );
};

export const LazyImage = React.memo(LazyImageComponent);
