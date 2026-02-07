import React, { forwardRef } from 'react';
import { WallpaperConfig } from '../types';

interface AuraWallpaperRendererProps {
  config: WallpaperConfig;
  className?: string;
  style?: React.CSSProperties;
  lowQuality?: boolean; // New prop for thumbnails
}

const AuraWallpaperRenderer = forwardRef<SVGSVGElement, AuraWallpaperRendererProps>(({ config, className, style, lowQuality = false }, ref) => {
  const { width, height, shapes, baseColor, noise, noiseScale } = config;

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${width} ${height}`}
      className={className}        
      style={{
        ...style,
        backgroundColor: baseColor,
      }}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        {/* Noise Filter - Only render if not lowQuality */}
        {!lowQuality && (
          <filter id="noiseFilter">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={noiseScale / 1000}
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />     
            <feComponentTransfer>
               <feFuncA type="linear" slope={noise / 100} /> 
            </feComponentTransfer>
          </filter>
        )}

        {/* Shape Blur Filter */}
        {shapes.map((shape) => (
           <filter key={`blur-${shape.id}`} id={`blur-${shape.id}`} x="-100%" y="-100%" width="300%" height="300%">
             <feGaussianBlur stdDeviation={lowQuality ? shape.blur / 2 : shape.blur} result="coloredBlur" />
           </filter>
        ))}
      </defs>

      {/* Base Background */}
      <rect width="100%" height="100%" fill={baseColor} />

      {/* Shapes Layer */}
      <g>
        {shapes.map((shape) => (
          <circle
            key={shape.id}
            cx={`${shape.x}%`}
            cy={`${shape.y}%`}
            r={`${shape.size / 2}%`}
            fill={shape.color}
            opacity={shape.opacity}
            filter={`url(#blur-${shape.id})`}
            style={{ mixBlendMode: shape.blendMode }}
          />
        ))}
      </g>

      {/* Noise Overlay */}
      {!lowQuality && (
        <rect
          width="100%"
          height="100%"
          filter="url(#noiseFilter)"
          opacity={1}
          style={{ mixBlendMode: 'overlay' }}
        />
      )}
    </svg>
  );
});

AuraWallpaperRenderer.displayName = 'AuraWallpaperRenderer';

export default AuraWallpaperRenderer;
