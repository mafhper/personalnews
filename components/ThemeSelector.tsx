import React, { useState } from 'react';

interface ThemeSelectorProps {
    setThemeColor: (colors: { accent: string; surface?: string }, presetName?: string) => void;
    currentAccent?: string;
}

// 5 carefully curated color presets with matching surface tones for both light and dark modes
const COLOR_PRESETS = [
    { 
        name: 'Ocean', 
        value: '59 130 246', 
        darkSurface: '15 23 42', 
        lightSurface: '240 245 255',
        hex: '#3b82f6' 
    },
    { 
        name: 'Emerald', 
        value: '16 185 129', 
        darkSurface: '6 31 23', 
        lightSurface: '235 250 242',
        hex: '#10b981' 
    },
    { 
        name: 'Sunset', 
        value: '249 115 22', 
        darkSurface: '28 15 10', 
        lightSurface: '255 245 235',
        hex: '#f97316' 
    },
    { 
        name: 'Rose', 
        value: '244 63 94', 
        darkSurface: '31 7 12', 
        lightSurface: '255 240 245',
        hex: '#f43f5e' 
    },
    { 
        name: 'Violet', 
        value: '139 92 246', 
        darkSurface: '15 10 31', 
        lightSurface: '245 240 255',
        hex: '#8b5cf6' 
    },
];

const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '59 130 246';
    
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    
    return `${r} ${g} ${b}`;
};

const getSwatchIconClass = (rgb: string): string => {
    const [r, g, b] = rgb.split(' ').map(Number);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 160 ? 'text-slate-950' : 'text-white';
};

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ setThemeColor, currentAccent }) => {
    const [customColor, setCustomColor] = useState('#3b82f6');
    
    // Check if we are currently in dark mode to select the appropriate surface
    const isDarkMode = document.documentElement.classList.contains('dark') || 
                       window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Determine active preset based on currentAccent
    const activePreset = React.useMemo(() => {
        if (!currentAccent) return null;
        const matching = COLOR_PRESETS.find(p => p.value === currentAccent);
        return matching ? matching.name : null;
    }, [currentAccent]);

    const labelClass =
        'text-[rgb(var(--theme-text-secondary-readable,var(--color-textSecondary)))]';

    const handlePresetClick = (preset: typeof COLOR_PRESETS[0]) => {
        const surface = isDarkMode ? preset.darkSurface : preset.lightSurface;
        setThemeColor({ accent: preset.value, surface }, preset.name);
    };

    const handleCustomColorChange = (hex: string) => {
        setCustomColor(hex);
        const rgbValue = hexToRgb(hex);
        setThemeColor({ accent: rgbValue });
    };

    return (
        <div className="space-y-4">
            {/* Color Presets */}
            <div className="flex items-center gap-3">
                {COLOR_PRESETS.map(preset => (
                    <button
                        key={preset.name}
                        onClick={() => handlePresetClick(preset)}
                        className={`group relative w-10 h-10 rounded-full transition-all duration-200 ${
                            activePreset === preset.name 
                                ? 'ring-2 ring-[rgb(var(--color-text))] ring-offset-2 ring-offset-[rgb(var(--theme-surface-readable,var(--color-surface)))] scale-110' 
                                : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: preset.hex }}
                        title={preset.name}
                    >
                        {activePreset === preset.name && (
                            <svg className={`absolute inset-0 m-auto w-4 h-4 ${getSwatchIconClass(preset.value)}`} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        )}
                    </button>
                ))}
                
                {/* Custom Color Picker */}
                <div className="relative">
                    <input
                        type="color"
                        value={customColor}
                        onChange={(e) => handleCustomColorChange(e.target.value)}
                        className="absolute inset-0 w-10 h-10 opacity-0 cursor-pointer"
                        title="Custom color"
                    />
                    <div 
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-[rgb(var(--color-border))]/55 transition-all hover:border-[rgb(var(--color-text))] ${
                            activePreset === null ? 'ring-2 ring-[rgb(var(--color-text))] ring-offset-2 ring-offset-[rgb(var(--theme-surface-readable,var(--color-surface)))]' : ''
                        }`}
                        style={{ backgroundColor: activePreset === null ? customColor : 'transparent' }}
                    >
                        {activePreset !== null && (
                            <svg className={`h-4 w-4 ${labelClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Labels */}
            <div className={`flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.12em] ${labelClass}`}>
                {COLOR_PRESETS.map(preset => (
                    <span key={preset.name} className="w-10 text-center truncate">{preset.name}</span>
                ))}
                <span className="w-10 text-center">Custom</span>
            </div>
        </div>
    );
};
