import React, { useState } from 'react';

interface ThemeSelectorProps {
    setThemeColor: (color: string) => void;
}

// 5 carefully curated color presets
const COLOR_PRESETS = [
    { name: 'Ocean', value: '59 130 246', hex: '#3b82f6' },      // Blue
    { name: 'Emerald', value: '16 185 129', hex: '#10b981' },    // Green
    { name: 'Sunset', value: '249 115 22', hex: '#f97316' },     // Orange
    { name: 'Rose', value: '244 63 94', hex: '#f43f5e' },        // Pink/Red
    { name: 'Violet', value: '139 92 246', hex: '#8b5cf6' },     // Purple
];

const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '59 130 246';
    
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    
    return `${r} ${g} ${b}`;
};

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ setThemeColor }) => {
    const [customColor, setCustomColor] = useState('#3b82f6');
    const [activePreset, setActivePreset] = useState<string | null>(null);

    const handlePresetClick = (preset: typeof COLOR_PRESETS[0]) => {
        setActivePreset(preset.name);
        setThemeColor(preset.value);
    };

    const handleCustomColorChange = (hex: string) => {
        setCustomColor(hex);
        setActivePreset(null);
        const rgbValue = hexToRgb(hex);
        setThemeColor(rgbValue);
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
                                ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110' 
                                : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: preset.hex }}
                        title={preset.name}
                    >
                        {activePreset === preset.name && (
                            <svg className="absolute inset-0 m-auto w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
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
                        className={`w-10 h-10 rounded-full border-2 border-dashed border-gray-500 flex items-center justify-center transition-all hover:border-white ${
                            activePreset === null ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''
                        }`}
                        style={{ backgroundColor: activePreset === null ? customColor : 'transparent' }}
                    >
                        {activePreset !== null && (
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Labels */}
            <div className="flex items-center gap-3 text-[10px] text-gray-500 uppercase tracking-wider">
                {COLOR_PRESETS.map(preset => (
                    <span key={preset.name} className="w-10 text-center truncate">{preset.name}</span>
                ))}
                <span className="w-10 text-center">Custom</span>
            </div>
        </div>
    );
};
