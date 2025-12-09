import React, { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { BackgroundConfig, WallpaperConfig } from '../types';
import AuraWallpaperRenderer from './AuraWallpaperRenderer';
import { DEFAULT_CONFIG, generateRandomConfig, generateVariations, PRESETS } from '../services/auraWallpaperService';
import { Button } from './ui/Button'; // Assuming you have a Button component

interface BackgroundCreatorProps {
  config: BackgroundConfig;
  onChange: (updates: Partial<BackgroundConfig>) => void;
}



export const BackgroundCreator: React.FC<BackgroundCreatorProps> = ({ config, onChange }) => {
  const [activeTab, setActiveTab] = useState<'solid' | 'aura' | 'image'>('solid');
  
  // Aura State
  const [auraConfig, setAuraConfig] = useState<WallpaperConfig>(config.auraSettings || DEFAULT_CONFIG);
  const [variations, setVariations] = useState<WallpaperConfig[]>([]);

  // Download State
  const [downloadFormat, setDownloadFormat] = useState<'svg' | 'jpeg'>('svg');
  const [downloadSize, setDownloadSize] = useState<'s' | 'm' | 'x' | 'xg'>('m');
  const [isDownloading, setIsDownloading] = useState(false);

  // Download Size Options
  const DOWNLOAD_SIZES = {
    s: { label: 'S (1280×720)', width: 1280, height: 720 },
    m: { label: 'M (1920×1080)', width: 1920, height: 1080 },
    x: { label: 'X (2560×1440)', width: 2560, height: 1440 },
    xg: { label: 'XG (3840×2160)', width: 3840, height: 2160 },
  };




  useEffect(() => {
    // Safely set activeTab, defaulting legacy types to 'solid'
    const newActiveTab = (config.type === 'gradient' || config.type === 'pattern') 
      ? 'solid' 
      : config.type;
    setActiveTab(newActiveTab);
    
    // Load aura state if applicable
    if (config.type === 'aura' && config.auraSettings) {
      setAuraConfig(config.auraSettings);
    }
  }, [config.type, config.auraSettings]);

  // Debounced Variation Generation when auraConfig changes
  useEffect(() => {
    if (activeTab === 'aura') {
      const timer = setTimeout(() => {
        const vars = generateVariations(auraConfig);
        setVariations(vars);
      }, 300); // Debounce to prevent excessive generations
      return () => clearTimeout(timer);
    }
  }, [auraConfig, activeTab]);

  const handleTypeChange = (type: BackgroundConfig['type']) => {
    // Filter type to ensure it's valid for activeTab state
    const newActiveTab = (type === 'gradient' || type === 'pattern') 
      ? 'solid' // Default to solid for legacy or unsupported types
      : type;
    setActiveTab(newActiveTab);
    
    // Reset all options and set appropriate defaults for the selected type
    const resetConfig: Partial<BackgroundConfig> = {
      type,
      customImage: null,
    };
    
    if (type === 'solid') {
      resetConfig.value = '#121212';
    } else if (type === 'aura') {
      const newAuraConfig = { ...auraConfig, width: 300, height: 600 }; // Set initial dimensions for preview
      setAuraConfig(newAuraConfig);
      resetConfig.value = generateAuraWallpaperSvg(newAuraConfig);
      resetConfig.auraSettings = newAuraConfig;
    } else if (type === 'image') {
      // Keep existing image if switching back, otherwise empty
      resetConfig.value = config.customImage ? `url(${config.customImage})` : '';
      resetConfig.customImage = config.customImage;
    }
    
    onChange(resetConfig);
  };

  /* --- SVG Generation for Aura --- */
  const generateAuraWallpaperSvg = (auraConf: WallpaperConfig): string => {
    // Manually construct SVG string based on WallpaperConfig, mimicking AuraWallpaperRenderer's output.
    const { width, height, shapes, baseColor, noise, noiseScale } = auraConf;
    
    // SVG defs for noise and blur filters
    const defs = `
      <defs>
        <filter id="noiseFilter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="${noiseScale / 1000}"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />     
          <feComponentTransfer>
             <feFuncA type="linear" slope="${noise / 100}" /> 
          </feComponentTransfer>
        </filter>
        ${shapes.map(shape => `
          <filter id="blur-${shape.id}" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="${shape.blur}" result="coloredBlur" />
          </filter>
        `).join('')}
      </defs>
    `;

    // Shapes layer
    const shapesSvg = shapes.map(shape => `
      <circle
        cx="${shape.x}%"
        cy="${shape.y}%"
        r="${shape.size / 2}%"
        fill="${shape.color}"
        opacity="${shape.opacity}"
        filter="url(#blur-${shape.id})"
        style="mix-blend-mode: ${shape.blendMode}"
      />
    `).join('');

    // Full SVG string
    const svgString = `
      <svg
        viewBox="0 0 ${width} ${height}"
        width="${width}"
        height="${height}"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        style="background-color: ${baseColor};"
      >
        ${defs}
        <rect width="100%" height="100%" fill="${baseColor}" />
        <g>${shapesSvg}</g>
        <rect
          width="100%"
          height="100%"
          filter="url(#noiseFilter)"
          opacity="1"
          style="mix-blend-mode: overlay;"
        />
      </svg>
    `;
    return `url('data:image/svg+xml;utf8,${encodeURIComponent(svgString)}')`;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ 
          type: 'image', 
          value: `url(${reader.result})`,
          customImage: reader.result as string 
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Download Aura Wallpaper
  const handleDownloadAura = async () => {
    setIsDownloading(true);
    try {
      const size = DOWNLOAD_SIZES[downloadSize];
      const downloadConfig = { ...auraConfig, width: size.width, height: size.height };
      
      // Generate clean SVG (without url() wrapper)
      const { width, height, shapes, baseColor, noise, noiseScale } = downloadConfig;
      
      const defs = `
        <defs>
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="${noiseScale / 1000}" numOctaves="3" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values="0"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="${noise / 100}"/>
            </feComponentTransfer>
          </filter>
          ${shapes.map(shape => `
            <filter id="blur-${shape.id}" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="${shape.blur}" result="coloredBlur"/>
            </filter>
          `).join('')}
        </defs>
      `;

      const shapesSvg = shapes.map(shape => `
        <circle cx="${shape.x}%" cy="${shape.y}%" r="${shape.size / 2}%" 
          fill="${shape.color}" opacity="${shape.opacity}" 
          filter="url(#blur-${shape.id})" style="mix-blend-mode: ${shape.blendMode}"/>
      `).join('');

      const svgString = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" 
  xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
  ${defs}
  <rect width="100%" height="100%" fill="${baseColor}"/>
  <g>${shapesSvg}</g>
  <rect width="100%" height="100%" filter="url(#noiseFilter)" opacity="1" style="mix-blend-mode: overlay;"/>
</svg>`;

      if (downloadFormat === 'svg') {
        // Download as SVG
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aura-wallpaper-${size.width}x${size.height}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Convert to JPEG via Canvas
        const img = new Image();
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
        const svgUrl = URL.createObjectURL(svgBlob);
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `aura-wallpaper-${size.width}x${size.height}.jpg`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }
              setIsDownloading(false);
            }, 'image/jpeg', 0.95);
          }
          URL.revokeObjectURL(svgUrl);
        };
        
        img.onerror = () => {
          console.error('Failed to load SVG for JPEG conversion');
          setIsDownloading(false);
        };
        
        img.src = svgUrl;
        return; // Exit early, setIsDownloading(false) is called in callbacks
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
    setIsDownloading(false);
  };




  return (
    <div className="space-y-4">
      {/* Type Selector */}
      <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-lg">
        {['solid', 'aura', 'image'].map((type) => (
          <button
            key={type}
            onClick={() => handleTypeChange(type as any)}
            className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
              activeTab === type 
                ? 'bg-[rgb(var(--color-accent))] text-white shadow-md' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Controls based on type */}
      <Card variant="glass" className="p-4 bg-black/20 border-white/5">
        {activeTab === 'solid' && (
          <div className="space-y-3">
            <label className="block text-xs font-medium text-gray-400">Cor Sólida</label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={config.value.startsWith('#') ? config.value : '#121212'}
                onChange={(e) => onChange({ value: e.target.value })}
                className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <Input
                value={config.value}
                onChange={(e) => onChange({ value: e.target.value })}
                placeholder="#000000"
                className="font-mono text-xs h-10"
              />
            </div>
          </div>
        )}



        {activeTab === 'aura' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Aura Preview */}
            <div className="relative h-48 w-full rounded-lg border border-white/10 shadow-inner overflow-hidden">
                <AuraWallpaperRenderer config={auraConfig} className="w-full h-full" lowQuality={true} />
            </div>

            {/* Controls */}
            <div className="space-y-3">
                <label className="block text-xs font-medium text-gray-400">Cor Base</label>
                <div className="flex items-center space-x-3">
                    <input
                        type="color"
                        value={auraConfig.baseColor.startsWith('#') ? auraConfig.baseColor : '#000000'}
                        onChange={(e) => setAuraConfig(prev => ({ ...prev, baseColor: e.target.value }))}
                        className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <Input
                        value={auraConfig.baseColor}
                        onChange={(e) => setAuraConfig(prev => ({ ...prev, baseColor: e.target.value }))}
                        placeholder="#000000"
                        className="font-mono text-xs h-10"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Ruído: {auraConfig.noise}%</label>
                    <input 
                        type="range" min="0" max="100" value={auraConfig.noise} 
                        onChange={(e) => setAuraConfig(prev => ({ ...prev, noise: parseInt(e.target.value) }))}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
                <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Escala Ruído: {auraConfig.noiseScale.toFixed(1)}</label>
                    <input 
                        type="range" min="0.1" max="5" step="0.1" value={auraConfig.noiseScale} 
                        onChange={(e) => setAuraConfig(prev => ({ ...prev, noiseScale: parseFloat(e.target.value) }))}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>

            <Button onClick={() => {
                const newConfig = generateRandomConfig(auraConfig);
                setAuraConfig(newConfig);
                onChange({
                    type: 'aura',
                    value: generateAuraWallpaperSvg(newConfig),
                    auraSettings: newConfig
                });
            }} className="w-full">
                Randomize Aura
            </Button>

            {/* Download Section */}
            <div className="pt-3 border-t border-white/10">
              <label className="block text-[10px] text-gray-400 mb-2">Baixar Wallpaper</label>
              <div className="flex gap-2 mb-2">
                <select
                  value={downloadFormat}
                  onChange={(e) => setDownloadFormat(e.target.value as 'svg' | 'jpeg')}
                  className="flex-1 bg-gray-800/50 text-white text-xs px-2 py-1.5 rounded-md border border-white/10 focus:outline-none focus:border-[rgb(var(--color-accent))]"
                >
                  <option value="svg">SVG (Vetorial)</option>
                  <option value="jpeg">JPEG (Imagem)</option>
                </select>
                <select
                  value={downloadSize}
                  onChange={(e) => setDownloadSize(e.target.value as 's' | 'm' | 'x' | 'xg')}
                  className="flex-1 bg-gray-800/50 text-white text-xs px-2 py-1.5 rounded-md border border-white/10 focus:outline-none focus:border-[rgb(var(--color-accent))]"
                >
                  <option value="s">S (1280×720)</option>
                  <option value="m">M (1920×1080)</option>
                  <option value="x">X (2560×1440)</option>
                  <option value="xg">XG (3840×2160)</option>
                </select>
              </div>
              <Button 
                onClick={handleDownloadAura} 
                disabled={isDownloading}
                className="w-full"
              >
                {isDownloading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Gerando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Baixar {downloadFormat.toUpperCase()}
                  </span>
                )}
              </Button>
            </div>

            {/* Presets */}
            <div>
              <label className="block text-[10px] text-gray-400 mb-2">Presets</label>
              <div className="flex gap-2 flex-wrap max-h-[100px] overflow-y-auto custom-scrollbar">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setAuraConfig(prev => ({ ...prev, ...preset.config }));
                      onChange({ 
                        type: 'aura', 
                        value: generateAuraWallpaperSvg({ ...auraConfig, ...preset.config }),
                        auraSettings: { ...auraConfig, ...preset.config } 
                      });
                    }}
                    className="w-12 h-8 rounded-md border border-white/10 hover:border-white/30 transition-all shadow-sm"
                    style={{ background: preset.thumbnail }}
                    title={preset.name}
                  />
                ))}
              </div>
            </div>

            {/* Variations */}
            {variations.length > 0 && (
                <div>
                    <label className="block text-[10px] text-gray-400 mb-2">Variações</label>
                    <div className="flex gap-2 flex-wrap max-h-[100px] overflow-y-auto custom-scrollbar">
                        {variations.map((variant, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setAuraConfig(variant);
                                    onChange({ 
                                      type: 'aura', 
                                      value: generateAuraWallpaperSvg(variant),
                                      auraSettings: variant 
                                    });
                                }}
                                className="w-12 h-8 rounded-md border border-white/10 hover:border-white/30 transition-all shadow-sm"
                            >
                                <AuraWallpaperRenderer config={variant} className="w-full h-full" lowQuality={true} />
                            </button>
                        ))}
                    </div>
                </div>
            )}
          </div>
        )}

        {activeTab === 'image' && (
          <div className="space-y-3">
            <label className="block text-xs text-gray-400">Carregar Imagem</label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg transition-colors text-xs">
                Escolher Arquivo
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
              {config.customImage && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                    Imagem carregada
                  </span>
                  <button 
                    onClick={() => onChange({ type: 'solid', value: '#121212', customImage: null })}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remover
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};