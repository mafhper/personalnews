import React, { useEffect, useState } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  isClickable?: boolean;
  customSrc?: string | null;
  useThemeColor?: boolean;
}

const Logo: React.FC<LogoProps> = ({
  size = 'md',
  className = '',
  onClick,
  isClickable = false,
  customSrc,
  useThemeColor = false
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6', // 24px - small size
    md: 'w-7 h-7', // 28px - matches title height (text-xl)
    lg: 'w-16 h-16' // 64px - large size
  };

  const baseClasses = isClickable
    ? 'cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg'
    : '';

  const backgroundClasses = '';

  return (
    <div
      className={`${sizeClasses[size]} ${backgroundClasses} flex items-center justify-center ${className} ${baseClasses}`}
      onClick={onClick}
      title={isClickable ? "Ir para a página inicial" : undefined}
    >
      <LogoImage customSrc={customSrc} useThemeColor={useThemeColor} />
    </div>
  );
};

const LogoImage: React.FC<{ customSrc?: string | null; useThemeColor: boolean }> = ({ customSrc, useThemeColor }) => {
  const [sanitizedSvg, setSanitizedSvg] = useState<string | null>(null);
  const [autoLogoSrc, setAutoLogoSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!customSrc?.trim().startsWith('<svg')) {
      setSanitizedSvg(null);
      return;
    }

    let cancelled = false;
    const sanitizeSvg = async () => {
      try {
        const mod = await import('dompurify');
        const purifier = mod.default ?? mod;
        const cleaned = purifier.sanitize(customSrc, {
          USE_PROFILES: { svg: true, svgFilters: true },
          ADD_TAGS: ['use'],
          ADD_ATTR: ['href', 'xlink:href']
        });
        if (!cancelled) setSanitizedSvg(cleaned);
      } catch {
        if (!cancelled) setSanitizedSvg(customSrc);
      }
    };

    sanitizeSvg();
    return () => { cancelled = true; };
  }, [customSrc]);

  const base = `${import.meta.env.BASE_URL}`;
  const lightLogo = `${base}icons/light/logo.svg`;
  const darkLogo = `${base}icons/dark/logo.svg`;
  const fallbackLogo = `${base}assets/logo.svg`;
  const rootLightLogo = `${base}logo.svg`;
  const rootDarkLogo = `${base}logo-dark.svg`;
  const defaultLogoHints = [
    '/icons/light/logo.svg',
    '/icons/dark/logo.svg',
    '/assets/logo.svg',
    '/logo.svg',
    '/logo-dark.svg',
  ];

  const isAutoDefaultLogo =
    !customSrc ||
    defaultLogoHints.some((hint) => customSrc.includes(hint));
  const prefersDarkTheme =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    Boolean(window.matchMedia('(prefers-color-scheme: dark)')?.matches);
  const initialThemeLogo = prefersDarkTheme ? darkLogo : lightLogo;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;

    const pickLogo = () => {
      try {
        const value = getComputedStyle(root).getPropertyValue('--color-background').trim();
        const values = (value.match(/\d+(\.\d+)?/g) || []).map(Number);
        const [r, g, b] = values;
        if ([r, g, b].some((n) => Number.isNaN(n))) {
          const bodyColor = getComputedStyle(document.body).backgroundColor;
          const bodyValues = (bodyColor.match(/\d+(\.\d+)?/g) || []).map(Number);
          const [br, bg, bb] = bodyValues;
          if ([br, bg, bb].some((n) => Number.isNaN(n))) throw new Error('invalid');
          const bodyLuminance = (0.2126 * br + 0.7152 * bg + 0.0722 * bb) / 255;
          setAutoLogoSrc(bodyLuminance < 0.5 ? darkLogo : lightLogo);
          return;
        }
        const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        const isDark = luminance < 0.5;
        setAutoLogoSrc(isDark ? darkLogo : lightLogo);
      } catch {
        const prefersDark = Boolean(window.matchMedia?.('(prefers-color-scheme: dark)')?.matches);
        setAutoLogoSrc(prefersDark ? darkLogo : lightLogo);
      }
    };

    pickLogo();
    const observer = new MutationObserver(pickLogo);
    observer.observe(root, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, [darkLogo, lightLogo]);

  if (customSrc?.trim().startsWith('<svg')) {
    if (!sanitizedSvg) {
      return <div className="w-full h-full" />;
    }
    return (
      <div
        className={`w-full h-full [&>svg]:w-full [&>svg]:h-full ${useThemeColor ? 'text-[rgb(var(--color-accent))] [&>svg]:fill-current [&>svg_path]:fill-current' : ''}`}
        dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
      />
    );
  }

  // Prefer theme-aware default unless there is a real custom user logo URL.
  const src = isAutoDefaultLogo
    ? (autoLogoSrc || initialThemeLogo || darkLogo || lightLogo)
    : (customSrc || autoLogoSrc || initialThemeLogo || darkLogo || lightLogo);

  if (useThemeColor) {
    return (
      <div
        className="w-full h-full bg-[rgb(var(--color-accent))]"
        style={{
          maskImage: `url(${src})`,
          maskSize: 'contain',
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskImage: `url(${src})`,
          WebkitMaskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
        }}
      />
    );
  }

  return (
    <img
      src={src}
      onError={(e) => {
        const img = e.target as HTMLImageElement;
        const fallbackOrder = [darkLogo, lightLogo, rootDarkLogo, rootLightLogo, fallbackLogo];
        const currentIndex = fallbackOrder.findIndex((candidate) => img.src.includes(candidate));
        const next = fallbackOrder[currentIndex + 1] || fallbackLogo;
        if (!img.src.includes(next)) img.src = next;
      }}
      alt="Personal News Logo"
      className="w-full h-full object-contain"
    />
  );
};

export default Logo;
