import React, { Suspense, lazy } from 'react';
import type { BackgroundConfig, ExtendedTheme } from '../types';

const AuraWallpaperRenderer = lazy(() => import('./AuraWallpaperRenderer'));

const unwrapCssUrl = (value: string): string => {
  const trimmed = value.trim();
  const match = /^url\((.*)\)$/is.exec(trimmed);
  if (!match) return trimmed;

  const inner = match[1].trim();
  if (
    (inner.startsWith('"') && inner.endsWith('"')) ||
    (inner.startsWith("'") && inner.endsWith("'"))
  ) {
    return inner.slice(1, -1);
  }
  return inner;
};

const isImageSource = (value: string): boolean =>
  /^(data:image\/|blob:|https?:\/\/|file:)/i.test(value);

const resolveBackgroundImageSource = (
  backgroundConfig: BackgroundConfig,
): string | null => {
  if (backgroundConfig.type !== 'image') return null;

  const customImage = backgroundConfig.customImage?.trim();
  if (customImage) return customImage;

  const value = unwrapCssUrl(backgroundConfig.value || '');
  return isImageSource(value) ? value : null;
};

export const BackgroundLayer = React.memo(({ backgroundConfig, currentTheme }: { backgroundConfig: BackgroundConfig, currentTheme: ExtendedTheme }) => (
  (() => {
    const isLightTheme = currentTheme.id.includes('light');
    const imageSource = resolveBackgroundImageSource(backgroundConfig);
    const overlayClass =
      backgroundConfig.type === 'solid'
        ? ''
        : isLightTheme
          ? backgroundConfig.type === 'image'
            ? 'bg-white/25'
            : 'bg-white/40' // Less aggressive wash than before 
          : backgroundConfig.type === 'image'
            ? 'bg-black/30'
            : 'bg-black/40';

    return (
  <div
    className={`pointer-events-none fixed inset-0 z-[-1] overflow-hidden transition-colors duration-500 ease-in-out ${backgroundConfig.type === 'solid' ? "bg-[rgb(var(--color-background))]" : ""}`}
    style={
      backgroundConfig.type === 'gradient' || backgroundConfig.type === 'image' || backgroundConfig.type === 'aura'
        ? {
          backgroundImage: backgroundConfig.type === 'image' ? undefined : backgroundConfig.value,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: `rgb(${currentTheme.colors.background})`, // Fallback color
        }
        : { backgroundColor: backgroundConfig.value || `rgb(${currentTheme.colors.background})` } // Solid background
    }
  >
    {backgroundConfig.type === 'image' && imageSource && (
      <img
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
        src={imageSource}
      />
    )}

    {/* Aura Wallpaper Background Layer */}
    {backgroundConfig.type === 'aura' && backgroundConfig.auraSettings && (
      <div className="absolute inset-0">
        <Suspense fallback={null}>
          <AuraWallpaperRenderer
            config={{ ...backgroundConfig.auraSettings, width: window.innerWidth, height: window.innerHeight }}
            className="w-full h-full"
            lowQuality={false} // Always render high quality for main background
          />
        </Suspense>
      </div>
    )}
    {/* Overlay para melhorar a legibilidade - menos intenso para imagens */}
    {backgroundConfig.type !== 'solid' && (
      <div className={`absolute inset-0 ${overlayClass}`}></div>
    )}

    {/* Gradiente de transição para o fundo */}
    {backgroundConfig.type !== 'solid' && (
      <div
        className="absolute inset-x-0 bottom-0 h-[30vh]"
        style={{
          background: `linear-gradient(to bottom, transparent, rgb(var(--color-background)))`,
        }}
      ></div>
    )}
  </div>
    );
  })()
));
