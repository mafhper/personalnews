import React, { Suspense, lazy } from 'react';
import type { BackgroundConfig, ExtendedTheme } from '../types';

const AuraWallpaperRenderer = lazy(() => import('./AuraWallpaperRenderer'));

export const BackgroundLayer = React.memo(({ backgroundConfig, currentTheme }: { backgroundConfig: BackgroundConfig, currentTheme: ExtendedTheme }) => (
  <div
    className={`fixed inset-0 z-[-1] transition-colors duration-500 ease-in-out ${backgroundConfig.type === 'solid' ? "bg-[rgb(var(--color-background))]" : ""}`}
    style={
      backgroundConfig.type === 'gradient' || backgroundConfig.type === 'image' || backgroundConfig.type === 'aura'
        ? {
          backgroundImage: backgroundConfig.value,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: backgroundConfig.type === 'image' ? 'fixed' : 'scroll', // Only image gets fixed attachment
          backgroundColor: `rgb(${currentTheme.colors.background})`, // Fallback color
        }
        : { backgroundColor: backgroundConfig.value || `rgb(${currentTheme.colors.background})` } // Solid background
    }
  >
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
      <div className={`absolute inset-0 ${backgroundConfig.type === 'image' ? 'bg-black/30' : 'bg-black/40'}`}></div>
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
));
