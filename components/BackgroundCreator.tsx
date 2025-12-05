import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { BackgroundConfig } from '../types';

interface BackgroundCreatorProps {
  config: BackgroundConfig;
  onChange: (updates: Partial<BackgroundConfig>) => void;
}

const GRADIENT_PRESETS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
  'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  'linear-gradient(135deg, #FC466B 0%, #3F5EFB 100%)',
  'radial-gradient(circle at center, #2b32b2 0%, #1488cc 100%)',
  'linear-gradient(to right, #434343 0%, black 100%)',
  'linear-gradient(to top, #30cfd0 0%, #330867 100%)',
  'linear-gradient(to top, #5f72bd 0%, #9b23ea 100%)',
];

const PATTERN_TYPES = [
  { id: 'nebula', name: 'Nebula', description: 'Gradientes etéreos' },
  { id: 'geometric', name: 'Geometric', description: 'Formas abstratas' },
  { id: 'flow', name: 'Flow', description: 'Curvas suaves' },
  { id: 'hexagons', name: 'Hexagons', description: 'Colmeia complexa' },
  { id: 'dots', name: 'Dots', description: 'Padrão simples' },
  { id: 'grid', name: 'Grid', description: 'Grade diagonal' },
];

const PATTERN_SIZES = [
  { id: 'small', name: 'Pequeno', scale: 0.5 },
  { id: 'medium', name: 'Médio', scale: 1 },
  { id: 'large', name: 'Grande', scale: 2 },
  { id: 'fullscreen', name: 'Tela Cheia', scale: 4 },
];

export const BackgroundCreator: React.FC<BackgroundCreatorProps> = ({ config, onChange }) => {
  const [activeTab, setActiveTab] = useState<'solid' | 'gradient' | 'pattern' | 'image'>('solid');
  const [baseColor, setBaseColor] = useState('#ffffff');
  const [patternSize, setPatternSize] = useState<string>('medium');
  const [opacity, setOpacity] = useState(0.2);

  useEffect(() => {
    setActiveTab(config.type);
    if (config.patternSettings?.colors?.[0]) {
      setBaseColor(config.patternSettings.colors[0]);
    }
    if (config.patternSettings?.scale) {
      const size = PATTERN_SIZES.find(s => s.scale === config.patternSettings!.scale);
      if (size) setPatternSize(size.id);
    }
    if (config.patternSettings?.opacity) {
      setOpacity(config.patternSettings.opacity);
    }
  }, [config.type, config.patternSettings]);

  const handleTypeChange = (type: BackgroundConfig['type']) => {
    setActiveTab(type);
    let newValue = config.value;
    if (type === 'solid' && config.value.includes('gradient')) newValue = '#121212';
    if (type === 'gradient' && !config.value.includes('gradient')) newValue = GRADIENT_PRESETS[0];
    
    onChange({ type, value: newValue });
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

  const generatePattern = (patternId: string, color: string, sizeId: string, op: number = 0.2) => {
    let svg = '';
    const encodedColor = encodeURIComponent(color);
    const sizeConfig = PATTERN_SIZES.find(s => s.id === sizeId) || PATTERN_SIZES[1];
    const scale = sizeConfig.scale;
    
    // Base sizes that will be scaled
    const baseSize = Math.round(200 * scale);
    const largeSize = Math.round(400 * scale);

    switch (patternId) {
      case 'nebula':
        // Improved Nebula: Smoother gradients, better scaling, using opacity param
        svg = `data:image/svg+xml,%3Csvg width='${largeSize}' height='${largeSize}' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cfilter id='blur'%3E%3CfeGaussianBlur in='SourceGraphic' stdDeviation='${40 * scale}'/%3E%3C/filter%3E%3CradialGradient id='grad1' cx='50%25' cy='50%25' r='50%25' fx='50%25' fy='50%25'%3E%3Cstop offset='0%25' stop-color='${encodedColor}' stop-opacity='${op}'/%3E%3Cstop offset='100%25' stop-color='${encodedColor}' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='400' height='400' fill='transparent'/%3E%3Cg filter='url(%23blur)'%3E%3Ccircle cx='0' cy='0' r='${250 * scale}' fill='url(%23grad1)'/%3E%3Ccircle cx='400' cy='400' r='${300 * scale}' fill='url(%23grad1)'/%3E%3Ccircle cx='400' cy='0' r='${200 * scale}' fill='url(%23grad1)'/%3E%3Ccircle cx='0' cy='400' r='${180 * scale}' fill='url(%23grad1)'/%3E%3Ccircle cx='200' cy='200' r='${150 * scale}' fill='url(%23grad1)' fill-opacity='${op * 0.5}'/%3E%3C/g%3E%3C/svg%3E`;
        break;

      case 'geometric':
        let shapes = '';
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * baseSize;
            const y = Math.random() * baseSize;
            const size = (Math.random() * 30 + 10) * scale;
            const shapeOpacity = (Math.random() * 0.15 + 0.05) * (op / 0.2); // Adjust based on base opacity
            const rotate = Math.random() * 360;
            if (i % 3 === 0) {
                shapes += `%3Crect x='${x}' y='${y}' width='${size}' height='${size}' transform='rotate(${rotate} ${x + size/2} ${y + size/2})' fill='${encodedColor}' fill-opacity='${shapeOpacity}'/%3E`;
            } else if (i % 3 === 1) {
                shapes += `%3Ccircle cx='${x}' cy='${y}' r='${size/2}' fill='${encodedColor}' fill-opacity='${shapeOpacity}'/%3E`;
            } else {
                shapes += `%3Cpolygon points='${x},${y - size} ${x + size},${y + size} ${x - size},${y + size}' fill='${encodedColor}' fill-opacity='${shapeOpacity}'/%3E`;
            }
        }
        svg = `data:image/svg+xml,%3Csvg width='${baseSize}' height='${baseSize}' viewBox='0 0 ${baseSize} ${baseSize}' xmlns='http://www.w3.org/2000/svg'%3E${shapes}%3C/svg%3E`;
        break;

      case 'flow':
        const wavePath = `M0 ${baseSize/2} C ${baseSize/4} 0 ${baseSize/4} ${baseSize} ${baseSize/2} ${baseSize/2} C ${baseSize*3/4} 0 ${baseSize*3/4} ${baseSize} ${baseSize} ${baseSize/2}`;
        svg = `data:image/svg+xml,%3Csvg width='${baseSize}' height='${baseSize}' viewBox='0 0 ${baseSize} ${baseSize}' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='${wavePath}' stroke='${encodedColor}' stroke-width='${2 * scale}' fill='none' opacity='${op}'/%3E%3Cpath d='M0 ${baseSize/2 + 20*scale} C ${baseSize/4} ${20*scale} ${baseSize/4} ${baseSize + 20*scale} ${baseSize/2} ${baseSize/2 + 20*scale} C ${baseSize*3/4} ${20*scale} ${baseSize*3/4} ${baseSize + 20*scale} ${baseSize} ${baseSize/2 + 20*scale}' stroke='${encodedColor}' stroke-width='${2 * scale}' fill='none' opacity='${op * 0.75}'/%3E%3Cpath d='M0 ${baseSize/2 - 20*scale} C ${baseSize/4} ${-20*scale} ${baseSize/4} ${baseSize - 20*scale} ${baseSize/2} ${baseSize/2 - 20*scale} C ${baseSize*3/4} ${-20*scale} ${baseSize*3/4} ${baseSize - 20*scale} ${baseSize} ${baseSize/2 - 20*scale}' stroke='${encodedColor}' stroke-width='${2 * scale}' fill='none' opacity='${op * 0.5}'/%3E%3C/svg%3E`;
        break;

      case 'hexagons':
        const hexSize = Math.round(56 * scale);
        const hexHeight = Math.round(100 * scale);
        svg = `data:image/svg+xml,%3Csvg width='${hexSize}' height='${hexHeight}' viewBox='0 0 56 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='${encodedColor}' fill-opacity='${op * 0.5}'%3E%3Cpath d='M28 66L0 50L0 16L28 0L56 16L56 50L28 66L28 100'/%3E%3Cpath d='M28 0L28 34L0 50L0 84L28 100L56 84L56 50L28 34'/%3E%3C/g%3E%3C/svg%3E`;
        break;

      case 'dots':
        const dotSize = Math.round(20 * scale);
        svg = `data:image/svg+xml,%3Csvg width='${dotSize}' height='${dotSize}' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='${encodedColor}' fill-opacity='${op}' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E`;
        break;

      case 'grid':
        const gridSize = Math.round(40 * scale);
        svg = `data:image/svg+xml,%3Csvg width='${gridSize}' height='${gridSize}' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='${encodedColor}' fill-opacity='${op * 0.5}' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E`;
        break;
    }
    return `url("${svg}")`;
  };

  const handlePatternChange = (patternId: string, color: string, sizeId: string, op: number) => {
    setBaseColor(color);
    setPatternSize(sizeId);
    setOpacity(op);
    const sizeConfig = PATTERN_SIZES.find(s => s.id === sizeId) || PATTERN_SIZES[1];
    onChange({ 
      type: 'pattern',
      value: generatePattern(patternId, color, sizeId, op),
      patternSettings: { name: patternId, colors: [color], scale: sizeConfig.scale, opacity: op }
    });
  };

  return (
    <div className="space-y-6">
      {/* Type Selector */}
      <div className="flex space-x-2 bg-gray-800/50 p-1 rounded-lg">
        {['solid', 'gradient', 'pattern', 'image'].map((type) => (
          <button
            key={type}
            onClick={() => handleTypeChange(type as any)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              activeTab === type 
                ? 'bg-[rgb(var(--color-accent))] text-white shadow-lg' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Controls based on type */}
      <Card variant="glass" className="p-6">
        {activeTab === 'solid' && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-300">Cor Sólida</label>
            <div className="flex items-center space-x-4">
              <input
                type="color"
                value={config.value.startsWith('#') ? config.value : '#121212'}
                onChange={(e) => onChange({ value: e.target.value })}
                className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <Input
                value={config.value}
                onChange={(e) => onChange({ value: e.target.value })}
                placeholder="#000000"
                className="font-mono"
              />
            </div>
          </div>
        )}

        {activeTab === 'gradient' && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-300">Presets</label>
            <div className="grid grid-cols-2 gap-3">
              {GRADIENT_PRESETS.map((gradient, i) => (
                <button
                  key={i}
                  onClick={() => onChange({ value: gradient })}
                  className={`h-16 rounded-lg border-2 transition-all ${config.value === gradient ? 'border-white' : 'border-white/10 hover:border-white/30'}`}
                  style={{ background: gradient }}
                />
              ))}
            </div>
            <label className="block text-sm font-medium text-gray-300 mt-4">CSS Personalizado</label>
            <Input
              value={config.value}
              onChange={(e) => onChange({ value: e.target.value })}
              placeholder="linear-gradient(...)"
              className="font-mono"
            />
          </div>
        )}

        {activeTab === 'pattern' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Cor do Padrão</label>
              <div className="flex items-center space-x-4">
                <input
                  type="color"
                  value={baseColor}
                  onChange={(e) => handlePatternChange(config.patternSettings?.name || 'nebula', e.target.value, patternSize, opacity)}
                  className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <Input
                  value={baseColor}
                  onChange={(e) => handlePatternChange(config.patternSettings?.name || 'nebula', e.target.value, patternSize, opacity)}
                  placeholder="#ffffff"
                  className="font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Tamanho do Padrão</label>
              <div className="grid grid-cols-4 gap-2">
                {PATTERN_SIZES.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => handlePatternChange(config.patternSettings?.name || 'nebula', baseColor, size.id, opacity)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      patternSize === size.id
                        ? 'bg-[rgb(var(--color-accent))] text-white shadow-lg'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    {size.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Opacidade: {Math.round(opacity * 100)}%</label>
              <input
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                value={opacity}
                onChange={(e) => handlePatternChange(config.patternSettings?.name || 'nebula', baseColor, patternSize, parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Estilo do Padrão</label>
              <div className="grid grid-cols-2 gap-3">
                {PATTERN_TYPES.map((pattern) => (
                  <button
                    key={pattern.id}
                    onClick={() => handlePatternChange(pattern.id, baseColor, patternSize, opacity)}
                    className={`px-4 py-3 rounded-lg text-left transition-all ${
                      config.patternSettings?.name === pattern.id
                        ? 'bg-[rgb(var(--color-accent))] text-white shadow-lg ring-2 ring-white/20'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    <span className="font-medium block">{pattern.name}</span>
                    <span className="text-xs opacity-70">{pattern.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'image' && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-300">Carregar Imagem</label>
            <div className="flex items-center space-x-4">
              <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors text-sm">
                Escolher Arquivo
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
              {config.customImage && (
                <span className="text-sm text-green-400">Imagem carregada</span>
              )}
            </div>
            {config.customImage && (
              <div className="mt-4 h-32 rounded-lg bg-cover bg-center border border-white/10" style={{ backgroundImage: config.value }}></div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
