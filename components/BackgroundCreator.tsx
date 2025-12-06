import React, { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { BackgroundConfig, GradientStop } from '../types';

interface BackgroundCreatorProps {
  config: BackgroundConfig;
  onChange: (updates: Partial<BackgroundConfig>) => void;
}

const PATTERN_TYPES = [
  { id: 'aurora', name: 'Aurora', description: 'Ondas boreais dançantes' },
  { id: 'constellation', name: 'Constelação', description: 'Estrelas conectadas no cosmos' },
  { id: 'topography', name: 'Topografia', description: 'Curvas de nível elegantes' },
  { id: 'sakura', name: 'Sakura', description: 'Pétalas de cerejeira flutuantes' },
  { id: 'circuit', name: 'Circuito', description: 'Linhas tech futuristas' },
  { id: 'waves', name: 'Ondas', description: 'Mar em movimento' },
  { id: 'diamonds', name: 'Diamantes', description: 'Arte déco geométrica' },
  { id: 'noise', name: 'Noise', description: 'Textura orgânica sutil' },
];

const PATTERN_SIZES = [
  { id: 'small', name: 'Pequeno', scale: 0.5 },
  { id: 'medium', name: 'Médio', scale: 1 },
  { id: 'large', name: 'Grande', scale: 2 },
  { id: 'fullscreen', name: 'Tela Cheia', scale: 4 },
];

const DEFAULT_STOPS: GradientStop[] = [
  { id: '1', color: '#667eea', opacity: 1, position: 0 },
  { id: '2', color: '#764ba2', opacity: 1, position: 100 },
];

export const BackgroundCreator: React.FC<BackgroundCreatorProps> = ({ config, onChange }) => {
  const [activeTab, setActiveTab] = useState<'solid' | 'gradient' | 'pattern' | 'image'>('solid');
  
  // Pattern State
  const [baseColor, setBaseColor] = useState('#ffffff');
  const [patternSize, setPatternSize] = useState<string>('medium');
  const [opacity, setOpacity] = useState(0.2);

  // Gradient State
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear');
  const [gradientAngle, setGradientAngle] = useState(135);
  const [gradientStops, setGradientStops] = useState<GradientStop[]>(DEFAULT_STOPS);
  const [selectedStopId, setSelectedStopId] = useState<string>(DEFAULT_STOPS[0].id);

  useEffect(() => {
    setActiveTab(config.type);
    
    // Load pattern state if applicable
    if (config.type === 'pattern') {
      if (config.patternSettings?.colors?.[0]) setBaseColor(config.patternSettings.colors[0]);
      if (config.patternSettings?.scale) {
        const size = PATTERN_SIZES.find(s => s.scale === config.patternSettings!.scale);
        if (size) setPatternSize(size.id);
      }
      if (config.patternSettings?.opacity) setOpacity(config.patternSettings.opacity);
    }

    // Load gradient state if applicable
    if (config.type === 'gradient' && config.gradientSettings) {
      setGradientType(config.gradientSettings.type);
      setGradientAngle(config.gradientSettings.angle);
      setGradientStops(config.gradientSettings.stops);
      if (config.gradientSettings.stops.length > 0) {
        setSelectedStopId(config.gradientSettings.stops[0].id);
      }
    }
  }, [config.type, config.patternSettings, config.gradientSettings]);

  const handleTypeChange = (type: BackgroundConfig['type']) => {
    setActiveTab(type);
    
    // Reset all options and set appropriate defaults for the selected type
    const resetConfig: Partial<BackgroundConfig> = {
      type,
      customImage: null,
      patternSettings: undefined,
      gradientSettings: undefined,
    };
    
    if (type === 'solid') {
      resetConfig.value = '#121212';
    } else if (type === 'gradient') {
      resetConfig.value = generateGradientString(gradientType, gradientAngle, gradientStops);
      resetConfig.gradientSettings = { type: gradientType, angle: gradientAngle, stops: gradientStops };
    } else if (type === 'pattern') {
      // Keep current pattern or set default
      const patternName = config.patternSettings?.name || 'aurora';
      resetConfig.value = generatePattern(patternName, baseColor, patternSize, opacity);
      resetConfig.patternSettings = { name: patternName, colors: [baseColor], scale: PATTERN_SIZES.find(s => s.id === patternSize)?.scale || 1, opacity };
    } else if (type === 'image') {
      // Keep existing image if switching back, otherwise empty
      resetConfig.value = config.customImage ? `url(${config.customImage})` : '';
      resetConfig.customImage = config.customImage;
    }
    
    onChange(resetConfig);
  };

  /* --- Gradient Logic --- */

  const generateGradientString = (type: 'linear' | 'radial', angle: number, stops: GradientStop[]) => {
    const sortedStops = [...stops].sort((a, b) => a.position - b.position);
    const stopsString = sortedStops.map(stop => {
      // Convert hex to rgba for opacity support
      const r = parseInt(stop.color.slice(1, 3), 16);
      const g = parseInt(stop.color.slice(3, 5), 16);
      const b = parseInt(stop.color.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${stop.opacity}) ${stop.position}%`;
    }).join(', ');

    if (type === 'linear') {
      return `linear-gradient(${angle}deg, ${stopsString})`;
    } else {
      return `radial-gradient(circle at center, ${stopsString})`;
    }
  };

  const updateGradient = useCallback(() => {
    const value = generateGradientString(gradientType, gradientAngle, gradientStops);
    onChange({ 
      type: 'gradient', 
      value, 
      gradientSettings: { type: gradientType, angle: gradientAngle, stops: gradientStops } 
    });
  }, [gradientType, gradientAngle, gradientStops, onChange]);

  // Debounced update for gradient changes to avoid excessive renders
  useEffect(() => {
    if (activeTab === 'gradient') {
        const timeoutId = setTimeout(updateGradient, 50);
        return () => clearTimeout(timeoutId);
    }
  }, [gradientType, gradientAngle, gradientStops]);

  const addStop = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newStop: GradientStop = { id: newId, color: '#ffffff', opacity: 1, position: 50 };
    setGradientStops(prev => [...prev, newStop].sort((a, b) => a.position - b.position));
    setSelectedStopId(newId);
  };

  const removeStop = (id: string) => {
    if (gradientStops.length <= 2) return; // Minimum 2 stops
    setGradientStops(prev => prev.filter(s => s.id !== id));
    if (selectedStopId === id) {
        setSelectedStopId(gradientStops.find(s => s.id !== id)?.id || '');
    }
  };

  const updateStop = (id: string, updates: Partial<GradientStop>) => {
    setGradientStops(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  /* --- Pattern Logic --- */
  
  // ... (Pattern logic remains mostly the same, just reusing the generator)
  const generatePattern = (patternId: string, color: string, sizeId: string, op: number = 0.2) => {
    let svg = '';
    const encodedColor = encodeURIComponent(color);
    const sizeConfig = PATTERN_SIZES.find(s => s.id === sizeId) || PATTERN_SIZES[1];
    const scale = sizeConfig.scale;
    const baseSize = Math.round(200 * scale);
    const largeSize = Math.round(400 * scale);

    switch (patternId) {
      case 'aurora':
        // Beautiful aurora borealis waves
        svg = `data:image/svg+xml,%3Csvg width='${largeSize}' height='${largeSize}' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='auroraGrad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='${encodedColor}' stop-opacity='${op}'/%3E%3Cstop offset='50%25' stop-color='${encodedColor}' stop-opacity='${op * 0.3}'/%3E%3Cstop offset='100%25' stop-color='${encodedColor}' stop-opacity='${op}'/%3E%3C/linearGradient%3E%3Cfilter id='auroraBlur'%3E%3CfeGaussianBlur stdDeviation='${15 * scale}'/%3E%3C/filter%3E%3C/defs%3E%3Cpath d='M0,200 Q100,100 200,200 T400,200 Q300,300 200,200 T0,200' fill='none' stroke='url(%23auroraGrad)' stroke-width='${60 * scale}' filter='url(%23auroraBlur)'/%3E%3Cpath d='M0,150 Q150,50 300,150 T400,100' fill='none' stroke='${encodedColor}' stroke-opacity='${op * 0.5}' stroke-width='${40 * scale}' filter='url(%23auroraBlur)'/%3E%3Cpath d='M0,280 Q200,180 400,280' fill='none' stroke='${encodedColor}' stroke-opacity='${op * 0.4}' stroke-width='${30 * scale}' filter='url(%23auroraBlur)'/%3E%3C/svg%3E`;
        break;
      case 'constellation':
        // Stars connected with delicate lines
        const stars = [];
        const connections = [];
        const points: Array<{x: number, y: number}> = [];
        for (let i = 0; i < 20; i++) {
          const x = Math.random() * baseSize;
          const y = Math.random() * baseSize;
          const size = (Math.random() * 3 + 1) * scale;
          points.push({x, y});
          stars.push(`%3Ccircle cx='${x}' cy='${y}' r='${size}' fill='${encodedColor}' fill-opacity='${op * 1.5}'/%3E`);
          // Create a subtle glow around brighter stars
          if (i % 3 === 0) {
            stars.push(`%3Ccircle cx='${x}' cy='${y}' r='${size * 3}' fill='${encodedColor}' fill-opacity='${op * 0.2}'/%3E`);
          }
        }
        // Connect nearby stars
        for (let i = 0; i < points.length; i++) {
          for (let j = i + 1; j < points.length; j++) {
            const dist = Math.sqrt(Math.pow(points[i].x - points[j].x, 2) + Math.pow(points[i].y - points[j].y, 2));
            if (dist < baseSize * 0.3 && Math.random() > 0.5) {
              connections.push(`%3Cline x1='${points[i].x}' y1='${points[i].y}' x2='${points[j].x}' y2='${points[j].y}' stroke='${encodedColor}' stroke-opacity='${op * 0.3}' stroke-width='${0.5 * scale}'/%3E`);
            }
          }
        }
        svg = `data:image/svg+xml,%3Csvg width='${baseSize}' height='${baseSize}' viewBox='0 0 ${baseSize} ${baseSize}' xmlns='http://www.w3.org/2000/svg'%3E${connections.join('')}${stars.join('')}%3C/svg%3E`;
        break;
      case 'topography':
        // Elegant contour lines like a map
        const contours = [];
        for (let i = 0; i < 8; i++) {
          const offset = i * 20 * scale;
          const amplitude = 30 + i * 5;
          contours.push(`%3Cpath d='M0,${100 + offset} Q${baseSize * 0.25},${100 + offset - amplitude} ${baseSize * 0.5},${100 + offset} T${baseSize},${100 + offset}' fill='none' stroke='${encodedColor}' stroke-opacity='${op * (1 - i * 0.1)}' stroke-width='${1.5 * scale}'/%3E`);
        }
        svg = `data:image/svg+xml,%3Csvg width='${baseSize}' height='${baseSize}' viewBox='0 0 ${baseSize} ${baseSize}' xmlns='http://www.w3.org/2000/svg'%3E${contours.join('')}%3C/svg%3E`;
        break;
      case 'sakura':
        // Floating cherry blossom petals
        const petals = [];
        for (let i = 0; i < 12; i++) {
          const x = Math.random() * baseSize;
          const y = Math.random() * baseSize;
          const rot = Math.random() * 360;
          const petalSize = (8 + Math.random() * 8) * scale;
          const petalOp = (op * 0.5) + (Math.random() * op * 0.5);
          petals.push(`%3Cg transform='translate(${x},${y}) rotate(${rot})'%3E%3Cellipse cx='0' cy='0' rx='${petalSize}' ry='${petalSize * 0.6}' fill='${encodedColor}' fill-opacity='${petalOp}'/%3E%3Cellipse cx='${petalSize * 0.8}' cy='${petalSize * 0.5}' rx='${petalSize * 0.8}' ry='${petalSize * 0.5}' fill='${encodedColor}' fill-opacity='${petalOp * 0.8}'/%3E%3C/g%3E`);
        }
        svg = `data:image/svg+xml,%3Csvg width='${baseSize}' height='${baseSize}' viewBox='0 0 ${baseSize} ${baseSize}' xmlns='http://www.w3.org/2000/svg'%3E${petals.join('')}%3C/svg%3E`;
        break;
      case 'circuit':
        // Futuristic circuit board lines
        const circuits = [];
        const nodePoints: Array<{x: number, y: number}> = [];
        const gridStep = baseSize / 8;
        for (let i = 0; i < 6; i++) {
          const startX = Math.floor(Math.random() * 8) * gridStep;
          const startY = Math.floor(Math.random() * 8) * gridStep;
          let path = `M${startX},${startY}`;
          let currentX = startX, currentY = startY;
          for (let j = 0; j < 4; j++) {
            const dir = Math.floor(Math.random() * 4);
            if (dir === 0) currentX += gridStep;
            else if (dir === 1) currentX -= gridStep;
            else if (dir === 2) currentY += gridStep;
            else currentY -= gridStep;
            currentX = Math.max(0, Math.min(baseSize, currentX));
            currentY = Math.max(0, Math.min(baseSize, currentY));
            path += ` L${currentX},${currentY}`;
          }
          circuits.push(`%3Cpath d='${path}' stroke='${encodedColor}' stroke-opacity='${op}' stroke-width='${1.5 * scale}' fill='none'/%3E`);
          nodePoints.push({x: startX, y: startY}, {x: currentX, y: currentY});
        }
        const nodes = nodePoints.map(p => `%3Ccircle cx='${p.x}' cy='${p.y}' r='${3 * scale}' fill='${encodedColor}' fill-opacity='${op * 1.2}'/%3E`);
        svg = `data:image/svg+xml,%3Csvg width='${baseSize}' height='${baseSize}' viewBox='0 0 ${baseSize} ${baseSize}' xmlns='http://www.w3.org/2000/svg'%3E${circuits.join('')}${nodes.join('')}%3C/svg%3E`;
        break;
      case 'waves':
        // Layered ocean waves
        const waveLines = [];
        for (let i = 0; i < 6; i++) {
          const yOffset = 30 + i * 30 * scale;
          const amplitude = 15 + i * 3;
          const waveOp = op * (1 - i * 0.12);
          waveLines.push(`%3Cpath d='M0,${yOffset} Q${baseSize * 0.125},${yOffset - amplitude} ${baseSize * 0.25},${yOffset} T${baseSize * 0.5},${yOffset} T${baseSize * 0.75},${yOffset} T${baseSize},${yOffset}' fill='none' stroke='${encodedColor}' stroke-opacity='${waveOp}' stroke-width='${2 * scale}' stroke-linecap='round'/%3E`);
        }
        svg = `data:image/svg+xml,%3Csvg width='${baseSize}' height='${baseSize}' viewBox='0 0 ${baseSize} ${baseSize}' xmlns='http://www.w3.org/2000/svg'%3E${waveLines.join('')}%3C/svg%3E`;
        break;
      case 'diamonds':
        // Art deco geometric diamonds
        const diamondSize = 40 * scale;
        const diamonds = [];
        for (let row = 0; row < 5; row++) {
          for (let col = 0; col < 5; col++) {
            const x = col * diamondSize + (row % 2) * (diamondSize / 2);
            const y = row * diamondSize * 0.6;
            const diamondOp = op * (0.3 + Math.random() * 0.4);
            diamonds.push(`%3Cpolygon points='${x},${y + diamondSize * 0.3} ${x + diamondSize * 0.5},${y} ${x + diamondSize},${y + diamondSize * 0.3} ${x + diamondSize * 0.5},${y + diamondSize * 0.6}' fill='none' stroke='${encodedColor}' stroke-opacity='${diamondOp}' stroke-width='${1 * scale}'/%3E`);
          }
        }
        svg = `data:image/svg+xml,%3Csvg width='${baseSize}' height='${baseSize}' viewBox='0 0 ${baseSize} ${baseSize}' xmlns='http://www.w3.org/2000/svg'%3E${diamonds.join('')}%3C/svg%3E`;
        break;
      case 'noise':
        // Organic noise texture with scattered shapes
        const noiseElements = [];
        for (let i = 0; i < 100; i++) {
          const x = Math.random() * baseSize;
          const y = Math.random() * baseSize;
          const size = (0.5 + Math.random() * 2) * scale;
          const noiseOp = op * (0.1 + Math.random() * 0.3);
          noiseElements.push(`%3Ccircle cx='${x}' cy='${y}' r='${size}' fill='${encodedColor}' fill-opacity='${noiseOp}'/%3E`);
        }
        svg = `data:image/svg+xml,%3Csvg width='${baseSize}' height='${baseSize}' viewBox='0 0 ${baseSize} ${baseSize}' xmlns='http://www.w3.org/2000/svg'%3E${noiseElements.join('')}%3C/svg%3E`;
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

  const selectedStop = gradientStops.find(s => s.id === selectedStopId);

  return (
    <div className="space-y-4">
      {/* Type Selector */}
      <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-lg">
        {['solid', 'gradient', 'pattern', 'image'].map((type) => (
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

        {activeTab === 'gradient' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Gradient Presets */}
            <div>
              <label className="block text-[10px] text-gray-400 mb-2">Presets</label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { name: 'Twilight', stops: [{ id: '1', color: '#667eea', opacity: 1, position: 0 }, { id: '2', color: '#764ba2', opacity: 1, position: 100 }], angle: 135 },
                  { name: 'Sunset', stops: [{ id: '1', color: '#f093fb', opacity: 1, position: 0 }, { id: '2', color: '#f5576c', opacity: 1, position: 100 }], angle: 90 },
                  { name: 'Ocean', stops: [{ id: '1', color: '#4facfe', opacity: 1, position: 0 }, { id: '2', color: '#00f2fe', opacity: 1, position: 100 }], angle: 45 },
                  { name: 'Forest', stops: [{ id: '1', color: '#0f9b0f', opacity: 1, position: 0 }, { id: '2', color: '#000000', opacity: 1, position: 100 }], angle: 180 },
                  { name: 'Midnight', stops: [{ id: '1', color: '#0c0c0c', opacity: 1, position: 0 }, { id: '2', color: '#1a1a2e', opacity: 1, position: 50 }, { id: '3', color: '#16213e', opacity: 1, position: 100 }], angle: 180 },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setGradientStops(preset.stops);
                      setGradientAngle(preset.angle);
                    }}
                    className="w-12 h-8 rounded-md border border-white/10 hover:border-white/30 transition-all shadow-sm"
                    style={{ background: `linear-gradient(${preset.angle}deg, ${preset.stops.map(s => `${s.color} ${s.position}%`).join(', ')})` }}
                    title={preset.name}
                  />
                ))}
              </div>
            </div>

            {/* Type & Angle */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Tipo</label>
                    <div className="flex bg-gray-800 rounded-md p-0.5">
                        <button onClick={() => setGradientType('linear')} className={`flex-1 py-1 text-[10px] rounded ${gradientType === 'linear' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}>Linear</button>
                        <button onClick={() => setGradientType('radial')} className={`flex-1 py-1 text-[10px] rounded ${gradientType === 'radial' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}>Radial</button>
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Ângulo: {gradientAngle}°</label>
                    <input 
                        type="range" min="0" max="360" value={gradientAngle} 
                        onChange={(e) => setGradientAngle(parseInt(e.target.value))}
                        disabled={gradientType === 'radial'}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>

            {/* Visual Editor Bar */}
            <div className="relative h-8 rounded-lg w-full cursor-pointer shadow-inner border border-white/10"
                 style={{ background: generateGradientString('linear', 90, gradientStops) }}
                 onClick={addStop}
            >
                {gradientStops.map(stop => (
                    <div
                        key={stop.id}
                        onClick={(e) => { e.stopPropagation(); setSelectedStopId(stop.id); }}
                        className={`absolute top-0 bottom-0 w-3 -ml-1.5 border-2 cursor-grab hover:scale-110 transition-transform shadow-md ${selectedStopId === stop.id ? 'border-white z-10 scale-110' : 'border-black/50 z-0'}`}
                        style={{ left: `${stop.position}%`, backgroundColor: stop.color }}
                    />
                ))}
            </div>
            <div className="text-[10px] text-gray-500 text-center mt-1">Clique na barra para adicionar cor</div>

            {/* Stop Properties */}
            {selectedStop && (
                <div className="bg-gray-800/50 p-3 rounded-lg border border-white/5 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-300">Editar Cor</span>
                        {gradientStops.length > 2 && (
                            <button onClick={() => removeStop(selectedStop.id)} className="text-[10px] text-red-400 hover:text-red-300">Remover</button>
                        )}
                    </div>
                    
                    <div className="flex gap-3">
                        <input 
                            type="color" 
                            value={selectedStop.color}
                            onChange={(e) => updateStop(selectedStop.id, { color: e.target.value })}
                            className="w-8 h-8 rounded bg-transparent cursor-pointer"
                        />
                        <div className="flex-1 space-y-2">
                            <div className="flex justify-between text-[10px] text-gray-400">
                                <span>Posição: {selectedStop.position}%</span>
                                <span>Opacidade: {Math.round(selectedStop.opacity * 100)}%</span>
                            </div>
                            <input 
                                type="range" min="0" max="100" value={selectedStop.position}
                                onChange={(e) => updateStop(selectedStop.id, { position: parseInt(e.target.value) })}
                                className="w-full h-1 bg-gray-700 rounded-lg block mb-2"
                            />
                            <input 
                                type="range" min="0" max="1" step="0.01" value={selectedStop.opacity}
                                onChange={(e) => updateStop(selectedStop.id, { opacity: parseFloat(e.target.value) })}
                                className="w-full h-1 bg-gray-700 rounded-lg block"
                            />
                        </div>
                    </div>
                </div>
            )}
          </div>
        )}

        {activeTab === 'pattern' && (
          <div className="space-y-4">
            {/* Pattern Preview */}
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Preview</label>
              <div 
                className="h-16 rounded-lg border border-white/10 shadow-inner"
                style={{ 
                  backgroundImage: config.value,
                  backgroundSize: 'auto',
                  backgroundRepeat: 'repeat',
                  backgroundColor: 'rgb(var(--color-background))',
                  filter: `hue-rotate(${config.patternSettings?.hue || 0}deg) ${
                    config.patternSettings?.effect === 'invert' ? 'invert(1)' : 
                    config.patternSettings?.effect === 'sepia' ? 'sepia(1)' : 
                    config.patternSettings?.effect === 'saturate' ? 'saturate(2)' : ''
                  }`
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Cor Base</label>
                    <div className="flex items-center gap-2">
                        <input
                        type="color"
                        value={baseColor}
                        onChange={(e) => handlePatternChange(config.patternSettings?.name || 'nebula', e.target.value, patternSize, opacity)}
                        className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                        />
                        <Input
                        value={baseColor}
                        onChange={(e) => handlePatternChange(config.patternSettings?.name || 'nebula', e.target.value, patternSize, opacity)}
                        className="font-mono text-xs h-8"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Opacidade: {Math.round(opacity * 100)}%</label>
                    <input
                        type="range"
                        min="0.05" max="1" step="0.05"
                        value={opacity}
                        onChange={(e) => handlePatternChange(config.patternSettings?.name || 'nebula', baseColor, patternSize, parseFloat(e.target.value))}
                        className="w-full h-1 bg-gray-700 rounded-lg mt-3"
                    />
                </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 mb-2">Tamanho</label>
              <div className="flex bg-gray-800 rounded-lg p-0.5">
                {PATTERN_SIZES.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => handlePatternChange(config.patternSettings?.name || 'nebula', baseColor, size.id, opacity)}
                    className={`flex-1 py-1 text-[10px] rounded transition-all ${
                      patternSize === size.id
                        ? 'bg-[rgb(var(--color-accent))] text-white shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {size.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Hue Rotation & Effects */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Rotação de Cor: {config.patternSettings?.hue || 0}°</label>
                <input
                  type="range" min="0" max="360" step="15"
                  value={config.patternSettings?.hue || 0}
                  onChange={(e) => onChange({ 
                    ...config, 
                    patternSettings: { ...config.patternSettings!, hue: parseInt(e.target.value) }
                  })}
                  className="w-full h-1 bg-gray-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Efeito</label>
                <select
                  value={config.patternSettings?.effect || 'none'}
                  onChange={(e) => onChange({ 
                    ...config, 
                    patternSettings: { ...config.patternSettings!, effect: e.target.value }
                  })}
                  className="w-full bg-gray-800 border-gray-700 text-gray-300 text-[10px] rounded-lg h-7 px-2"
                >
                  <option value="none">Nenhum</option>
                  <option value="invert">Invertido</option>
                  <option value="sepia">Sépia</option>
                  <option value="saturate">Saturado</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-1">
                {PATTERN_TYPES.map((pattern) => (
                  <button
                    key={pattern.id}
                    onClick={() => handlePatternChange(pattern.id, baseColor, patternSize, opacity)}
                    className={`px-2 py-2 rounded-lg text-center transition-all border ${
                      config.patternSettings?.name === pattern.id
                        ? 'bg-[rgb(var(--color-accent))]/20 border-[rgb(var(--color-accent))] text-white'
                        : 'bg-gray-800/50 border-transparent text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-xs font-medium block">{pattern.name}</span>
                  </button>
                ))}
            </div>
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