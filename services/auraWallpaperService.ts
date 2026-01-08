import { WallpaperConfig, Shape, BlendMode, Preset, ExportSize } from '../types';

// Helper: HSL String to Object
const parseHsl = (hsl: string) => {
  const match = hsl.match(/hsl\((\d+(?:\.\d+)?),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return { h: 0, s: 0, l: 0 };
  return { h: parseFloat(match[1]), s: parseInt(match[2]), l: parseInt(match[3]) };
};

// Helper: Hex to HSL
const hexToHsl = (hex: string) => {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt("0x" + hex[1] + hex[1]);
    g = parseInt("0x" + hex[2] + hex[2]);
    b = parseInt("0x" + hex[3] + hex[3]);
  } else if (hex.length === 7) {
    r = parseInt("0x" + hex[1] + hex[2]);
    g = parseInt("0x" + hex[3] + hex[4]);
    b = parseInt("0x" + hex[5] + hex[6]);
  }
  r /= 255; g /= 255; b /= 255;
  const cmin = Math.min(r,g,b), cmax = Math.max(r,g,b), delta = cmax - cmin;
  let h = 0, s = 0, l = 0;

  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);
  if (h < 0) h += 360;
  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
};

// Helper: Object to HSL String
const toHslStr = ({ h, s, l }: { h: number, s: number, l: number }) => {
  return `hsl(${h % 360}, ${Math.max(0, Math.min(100, s))}%, ${Math.max(0, Math.min(100, l))
}%)`;
};

const shiftColor = (color: string, dH: number, dS: number, dL: number) => {
  const hsl = color.startsWith('#') ? hexToHsl(color) : parseHsl(color);
  return toHslStr({
    h: hsl.h + dH,
    s: hsl.s + dS,
    l: hsl.l + dL
  });
};

const jitter = (val: number, amount: number) => val + (Math.random() * amount - (amount / 2)
);
const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val)); 

/**
 * DRACONIAN CONTRAST POLICE
 *
 * Strict rules to prevent "Black on Black" or "White on White" scenarios.
 * If the image is invisible, it overrides the config.
 */
const ensureVisibility = (shapes: Shape[], baseColor: string): Shape[] => {
  const baseHsl = baseColor.startsWith('#') ? hexToHsl(baseColor) : parseHsl(baseColor);    

  // Categorize Background Depth
  const isPitchBlack = baseHsl.l < 10; // < 10% Luminance (Very Dangerous area)
  const isDarkBase = baseHsl.l < 40;   // General Dark Mode
  const isLightBase = baseHsl.l > 60;  // General Light Mode

  return shapes.map(s => {
    const shapeHsl = s.color.startsWith('#') ? hexToHsl(s.color) : parseHsl(s.color);
    let newBlend = s.blendMode;
    const newOpacity = Math.max(0.5, s.opacity); // Increase opacity floor
    const newSize = Math.max(30, s.size);

    // --- PITCH BLACK BACKGROUND RULES (Risk Level: HIGH) ---
    if (isPitchBlack) {
      // 1. Forbidden Modes: Overlay, Soft-light, Multiply do NOTHING on black.
      // Force them to emit light.
      if (!['screen', 'lighten', 'color-dodge', 'normal'].includes(newBlend)) {
        newBlend = Math.random() > 0.4 ? 'screen' : 'normal';
      }

      // 2. Force High Luminance
      // Even with Screen mode, dark colors won't show up well.
      if (shapeHsl.l < 50) {
        shapeHsl.l = 50 + Math.random() * 40; // Force to 50% - 90% Lightness
      }

      // 3. Force Saturation
      if (shapeHsl.s < 50) {
        shapeHsl.s = 50 + Math.random() * 50;
      }
    }

    // --- DARK MODE RULES (Risk Level: MEDIUM) ---
    else if (isDarkBase) {
      // 1. Forbid Darkening
      if (['multiply', 'darken', 'color-burn', 'difference'].includes(newBlend)) {
        newBlend = Math.random() > 0.5 ? 'overlay' : 'screen';
      }

      // 2. Overlay Safety Check
      // Overlay darkens the darks. If shape is dark on dark bg, it vanishes.
      if (['overlay', 'soft-light'].includes(newBlend) && shapeHsl.l < 60) {
         shapeHsl.l = 60 + Math.random() * 30; // Bump lightness if using overlay
      }

      // 3. General Visibility
      if (shapeHsl.l < 30) {
         shapeHsl.l = 40 + Math.random() * 40;
      }
    }

    // --- LIGHT MODE RULES (Risk Level: MEDIUM) ---
    else if (isLightBase) {
      // 1. Forbid Lightening
      if (['screen', 'lighten', 'color-dodge', 'plus'].includes(newBlend)) {
        newBlend = Math.random() > 0.5 ? 'multiply' : 'normal';
      }

      // 2. Force Darker Colors
      if (shapeHsl.l > 60) {
        shapeHsl.l = Math.random() * 50; // 0% - 50%
      }

      // 3. Normal Mode Contrast
      // If color is too close to white bg, darken it
      if (newBlend === 'normal' && shapeHsl.l > baseHsl.l - 20) {
         shapeHsl.l = Math.max(0, baseHsl.l - 40);
      }
    }

    return {
      ...s,
      color: toHslStr(shapeHsl),
      opacity: newOpacity,
      size: newSize,
      blendMode: newBlend
    };
  });
};

export const generateVariations = (baseConfig: WallpaperConfig): WallpaperConfig[] => {     
  const variations: WallpaperConfig[] = [];

  // Strategy 1: "Composition Remix"
  variations.push({
    ...baseConfig,
    shapes: ensureVisibility(baseConfig.shapes.map(s => ({
      ...s,
      x: clamp(jitter(s.x, 40), 0, 100),
      y: clamp(jitter(s.y, 40), 0, 100),
      size: clamp(jitter(s.size, 30), 25, 150),
      id: s.id + '-remix'
    })), baseConfig.baseColor)
  });

  // Strategy 2: "Atmosphere Shift"
  // Ensure base shift doesn't make it pitch black
  const atmosBase = shiftColor(baseConfig.baseColor, 10, -5, 5);
  
  variations.push({
    ...baseConfig,
    baseColor: atmosBase,
    noise: clamp(baseConfig.noise - 10, 10, 50),
    shapes: ensureVisibility(baseConfig.shapes.map(s => ({
      ...s,
      blur: Math.min(150, s.blur * 1.3),
      blendMode: Math.random() > 0.5 ? 'screen' : 'soft-light',
      opacity: clamp(s.opacity * 0.9, 0.4, 0.9),
      id: s.id + '-atmos'
    })), atmosBase)
  });

  // Strategy 3: "Deep Contrast"
  const contrastBase = shiftColor(baseConfig.baseColor, 0, 10, -10);
  variations.push({
    ...baseConfig,
    baseColor: contrastBase,
    noise: clamp(baseConfig.noise + 15, 20, 80),
    shapes: ensureVisibility(baseConfig.shapes.map(s => ({
      ...s,
      color: shiftColor(s.color, 0, 20, 5),
      blendMode: Math.random() > 0.5 ? 'color-dodge' : 'normal', // Avoid Overlay here too  
      opacity: clamp(s.opacity + 0.2, 0.6, 1),
      id: s.id + '-deep'
    })), contrastBase)
  });

  // Strategy 4: "Analogous Flow"
  const hueShift = 30 + Math.random() * 30;
  const flowBase = shiftColor(baseConfig.baseColor, hueShift, 0, 0);
  variations.push({
    ...baseConfig,
    baseColor: flowBase,
    shapes: ensureVisibility(baseConfig.shapes.map(s => ({
      ...s,
      color: shiftColor(s.color, hueShift, 0, 0),
      x: clamp(jitter(s.x, 15), -10, 110),
      y: clamp(jitter(s.y, 15), -10, 110),
      id: s.id + '-flow'
    })), flowBase)
  });

  // Strategy 5: "Vibrant Pop"
  const popBase = shiftColor(baseConfig.baseColor, 180, 0, 0);
  variations.push({
    ...baseConfig,
    baseColor: popBase,
    shapes: ensureVisibility(baseConfig.shapes.map(s => ({
      ...s,
      color: shiftColor(s.color, 180, 20, 0),
      blendMode: 'normal', // Safer than overlay for pop
      id: s.id + '-pop'
    })), popBase)
  });

  return variations;
};

// --- Constants (from samples/aurawall-v0/constants.ts) ---
export const EXPORT_SIZES: ExportSize[] = [
  { name: 'iPhone 16/15 Pro', width: 1179, height: 2556 },
  { name: 'iPhone 16/15 Plus', width: 1290, height: 2796 },
  { name: 'Android Common', width: 1080, height: 2400 },
  { name: '4K Desktop', width: 3840, height: 2160 },
  { name: 'Macbook Air/Pro', width: 2560, height: 1600 },
  { name: 'Instagram Story', width: 1080, height: 1920 },
  { name: 'iPad / Tablet', width: 2048, height: 2732 },
];

export const DEFAULT_CONFIG: WallpaperConfig = {
  width: 1179,
  height: 2556,
  noise: 25,
  noiseScale: 1.5,
  baseColor: '#0f0c29',
  shapes: [
    { id: 'def1', type: 'circle', x: 80, y: 20, size: 100, color: '#ff00cc', opacity: 0.4, blur: 100, blendMode: 'screen' },
    { id: 'def2', type: 'circle', x: 20, y: 80, size: 120, color: '#333399', opacity: 0.6, blur: 120, blendMode: 'screen' },
    { id: 'def3', type: 'circle', x: 50, y: 50, size: 80, color: '#00d4ff', opacity: 0.3, blur: 80, blendMode: 'overlay' },
  ],
};

export const PRESETS: Preset[] = [
  // --- AURA & ETHEREAL ---
  {
    id: 'angel-aura',
    name: 'Angel Aura',
    category: 'Aura',
    thumbnail: 'linear-gradient(135deg, #fdf4ff 0%, #d8b4fe 100%)',
    config: {
      baseColor: '#faf5ff', // Very pale purple white
      noise: 22,
      noiseScale: 1.2,
      shapes: [
        { id: 'aa1', type: 'circle', x: 20, y: 20, size: 120, color: '#d8b4fe', opacity: 0.6, blur: 100, blendMode: 'multiply' }, // Soft Lavender
        { id: 'aa2', type: 'circle', x: 80, y: 80, size: 140, color: '#f9a8d4', opacity: 0.5, blur: 120, blendMode: 'multiply' }, // Soft Pink
        { id: 'aa3', type: 'circle', x: 50, y: 50, size: 90, color: '#bae6fd', opacity: 0.7, blur: 80, blendMode: 'multiply' }, // Soft Blue
        { id: 'aa4', type: 'circle', x: 50, y: 40, size: 60, color: '#ffffff', opacity: 0.9, blur: 60, blendMode: 'overlay' }, // White Highlight
      ]
    }
  },
  {
    id: 'soul-glow',
    name: 'Soul Glow',
    category: 'Aura',
    thumbnail: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%)',
    config: {
      baseColor: '#0f0518', // Deep Void Purple
      noise: 35,
      noiseScale: 2,
      shapes: [
        { id: 'sg1', type: 'circle', x: 50, y: 50, size: 110, color: '#7c3aed', opacity: 0.5, blur: 100, blendMode: 'screen' }, // Violet Glow
        { id: 'sg2', type: 'circle', x: 50, y: 50, size: 70, color: '#db2777', opacity: 0.6, blur: 80, blendMode: 'screen' }, // Pink Core
        { id: 'sg3', type: 'circle', x: 50, y: 50, size: 40, color: '#fcd34d', opacity: 0.8, blur: 40, blendMode: 'overlay' }, // Gold Center
      ]
    }
  },

  // --- SOFT & PASTEL ---
  {
    id: 'cotton-candy',
    name: 'Daydream',
    category: 'Soft',
    thumbnail: 'linear-gradient(135deg, #fff1f2 0%, #fda4af 100%)',
    config: {
      baseColor: '#fff1f2', // Rose Water
      noise: 18,
      noiseScale: 1.0,
      shapes: [
        { id: 'cc1', type: 'circle', x: 10, y: 10, size: 130, color: '#fecdd3', opacity: 0.8, blur: 120, blendMode: 'multiply' },
        { id: 'cc2', type: 'circle', x: 90, y: 90, size: 120, color: '#bfdbfe', opacity: 0.7, blur: 100, blendMode: 'multiply' },
        { id: 'cc3', type: 'circle', x: 50, y: 50, size: 80, color: '#fef3c7', opacity: 0.6, blur: 80, blendMode: 'multiply' },
      ]
    }
  },
  {
    id: 'dune-haze',
    name: 'Dune Haze',
    category: 'Soft',
    thumbnail: 'linear-gradient(135deg, #f5f5f4 0%, #d6d3d1 100%)',
    config: {
      baseColor: '#e7e5e4', // Warm Grey
      noise: 40,
      noiseScale: 1.8,
      shapes: [
        { id: 'dh1', type: 'circle', x: 50, y: 20, size: 150, color: '#a8a29e', opacity: 0.4, blur: 120, blendMode: 'multiply' },
        { id: 'dh2', type: 'circle', x: 50, y: 120, size: 100, color: '#fbbf24', opacity: 0.3, blur: 100, blendMode: 'overlay' }, // Subtle Gold sun
        { id: 'dh3', type: 'circle', x: 10, y: 60, size: 80, color: '#d1d5db', opacity: 0.5, blur: 60, blendMode: 'multiply' },
      ]
    }
  },

  // --- ABSTRACT & ARTISTIC ---
  {
    id: 'chroma-flow',
    name: 'Chromesthesia',
    category: 'Abstract',
    thumbnail: 'linear-gradient(135deg, #000000 0%, #22d3ee 50%, #e879f9 100%)',
    config: {
      baseColor: '#101010', // Soft Black
      noise: 30,
      noiseScale: 1.5,
      shapes: [
        { id: 'cf1', type: 'circle', x: 20, y: 30, size: 100, color: '#22d3ee', opacity: 0.6, blur: 100, blendMode: 'screen' }, // Cyan
        { id: 'cf2', type: 'circle', x: 80, y: 70, size: 120, color: '#e879f9', opacity: 0.5, blur: 120, blendMode: 'screen' }, // Magenta
        { id: 'cf3', type: 'circle', x: 50, y: 50, size: 90, color: '#facc15', opacity: 0.4, blur: 80, blendMode: 'overlay' }, // Yellow intersection
        { id: 'cf4', type: 'circle', x: 50, y: 50, size: 150, color: '#ffffff', opacity: 0.1, blur: 60, blendMode: 'overlay' }, // White wash
      ]
    }
  },
  {
    id: 'iridescent-oil',
    name: 'Iridescent',
    category: 'Abstract',
    thumbnail: 'linear-gradient(135deg, #d4d4d8 0%, #a1a1aa 100%)',
    config: {
      baseColor: '#71717a', // Mid Grey
      noise: 25,
      noiseScale: 1.2,
      shapes: [
        { id: 'io1', type: 'circle', x: 30, y: 30, size: 100, color: '#f472b6', opacity: 0.6, blur: 80, blendMode: 'color-dodge' }, // Pink Pop
        { id: 'io2', type: 'circle', x: 70, y: 70, size: 110, color: '#34d399', opacity: 0.5, blur: 90, blendMode: 'color-dodge' }, // Green Pop
        { id: 'io3', type: 'circle', x: 50, y: 50, size: 140, color: '#60a5fa', opacity: 0.5, blur: 100, blendMode: 'overlay' }, // Blue wash
      ]
    }
  },

  // --- DARK & MOODY ---
  {
    id: 'midnight-oil',
    name: 'Midnight',
    category: 'Dark',
    thumbnail: 'linear-gradient(135deg, #020617 0%, #1e1b4b 100%)',
    config: {
      baseColor: '#020617', // Rich Black
      noise: 45,
      noiseScale: 2.5,
      shapes: [
        { id: 'mo1', type: 'circle', x: 10, y: 90, size: 130, color: '#1d4ed8', opacity: 0.5, blur: 120, blendMode: 'screen' }, // Deep Blue
        { id: 'mo2', type: 'circle', x: 90, y: 10, size: 100, color: '#be185d', opacity: 0.4, blur: 100, blendMode: 'screen' }, // Deep Pink
        { id: 'mo3', type: 'circle', x: 50, y: 50, size: 60, color: '#ffffff', opacity: 0.1, blur: 50, blendMode: 'overlay' }, // Ghostly center
      ]
    }
  },
  {
    id: 'burnt-ember',
    name: 'Ember',
    category: 'Dark',
    thumbnail: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)',
    config: {
      baseColor: '#2a0a0a', // Dark Red/Brown
      noise: 50,
      noiseScale: 3,
      shapes: [
        { id: 'be1', type: 'circle', x: 50, y: 120, size: 120, color: '#ef4444', opacity: 0.6, blur: 100, blendMode: 'screen' }, // Fire
        { id: 'be2', type: 'circle', x: 50, y: 50, size: 150, color: '#000000', opacity: 0.8, blur: 80, blendMode: 'overlay' }, // Shadow
        { id: 'be3', type: 'circle', x: 50, y: 20, size: 80, color: '#fdba74', opacity: 0.3, blur: 100, blendMode: 'color-dodge' }, // Sparks
      ]
    }
  },

  // --- NEON & CYBER ---
  {
    id: 'cyber-mist',
    name: 'Cyber Mist',
    category: 'Neon',
    thumbnail: 'linear-gradient(135deg, #111827 0%, #10b981 100%)',
    config: {
      baseColor: '#030712',
      noise: 40,
      noiseScale: 2,
      shapes: [
        { id: 'cm1', type: 'circle', x: 0, y: 50, size: 100, color: '#10b981', opacity: 0.5, blur: 100, blendMode: 'screen' }, // Emerald
        { id: 'cm2', type: 'circle', x: 100, y: 50, size: 100, color: '#8b5cf6', opacity: 0.5, blur: 100, blendMode: 'screen' }, // Violet
        { id: 'cm3', type: 'circle', x: 50, y: 0, size: 120, color: '#06b6d4', opacity: 0.4, blur: 100, blendMode: 'overlay' }, // Cyan Top
      ]
    }
  },
  {
    id: 'heat-map',
    name: 'Heatmap',
    category: 'Neon',
    thumbnail: 'linear-gradient(135deg, #312e81 0%, #f43f5e 100%)',
    config: {
      baseColor: '#1e1b4b', // Indigo Base
      noise: 30,
      noiseScale: 1.5,
      shapes: [
        { id: 'hm1', type: 'circle', x: 30, y: 30, size: 100, color: '#f43f5e', opacity: 0.7, blur: 90, blendMode: 'screen' }, // Rose
        { id: 'hm2', type: 'circle', x: 70, y: 70, size: 110, color: '#3b82f6', opacity: 0.7, blur: 90, blendMode: 'screen' }, // Blue
        { id: 'hm3', type: 'circle', x: 50, y: 50, size: 80, color: '#ffffff', opacity: 0.3, blur: 50, blendMode: 'overlay' }, // Highlight
      ]
    }
  }
];

export const generateRandomConfig = (baseConfig: WallpaperConfig): WallpaperConfig => {
  // Logic adapted from samples/aurawall-v0/App.tsx handleRandomize
  const numShapes = Math.floor(Math.random() * 3) + 3; // 3 to 5 shapes
  const newShapes: Shape[] = [];

  // Helper to create HSL string
  const getHSL = (h: number, s: number, l: number) => `hsl(${h}, ${s}%, ${l}%)`;

  // 1. Pick a base hue
  const baseHue = Math.floor(Math.random() * 360);

  // 2. Decide Strategy: Dark Theme vs Light Theme
  const isDarkTheme = Math.random() > 0.4; // 60% chance of Dark Theme

  // Set Base Color
  const baseColor = isDarkTheme
    ? getHSL(baseHue, 40, Math.floor(Math.random() * 10) + 5) // L: 5-15%
    : getHSL(baseHue, 20, Math.floor(Math.random() * 10) + 88); // L: 88-98%

  // Set Safe Blend Modes based on Theme
  const safeBlendModes: BlendMode[] = isDarkTheme
    ? ['screen', 'color-dodge', 'normal', 'lighten']
    : ['multiply', 'overlay', 'normal', 'difference'];

  // Shape Color Harmony Strategy
  const strategy = Math.random();
  let shapeHues: number[] = [];

  if (strategy < 0.33) {
    // Analogous (Close neighbors)
    shapeHues = Array(numShapes).fill(0).map(() => (baseHue + Math.random() * 60 - 30) % 360);
  } else if (strategy < 0.66) {
    // Complementary (Opposites)
    shapeHues = Array(numShapes).fill(0).map((_, i) => i % 2 === 0 ? baseHue : (baseHue + 180) % 360);
  } else {
    // Triadic (Three colors evenly spaced)
    shapeHues = Array(numShapes).fill(0).map((_, i) => (baseHue + (i * 120)) % 360);      
  }

  // Create shapes
  for (let i = 0; i < numShapes; i++) {
    const h = shapeHues[i];
    const s = Math.random() * 40 + 60; // Keep saturation high (60-100%)

    // Shape Lightness: STRICT CONTRAST against Base
    const l = isDarkTheme
      ? Math.random() * 40 + 50  // 50% - 90%
      : Math.random() * 40 + 10; // 10% - 50%

    const blendMode = safeBlendModes[Math.floor(Math.random() * safeBlendModes.length)];  

    newShapes.push({
      id: `rand-${Date.now()}-${i}`,
      type: 'circle',
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 80 + 60, // 60-140
      color: getHSL(h, s, l),
      opacity: Math.random() * 0.4 + 0.5, // 0.5 - 0.9
      blur: Math.random() * 60 + 60, // 60 - 120
      blendMode: blendMode
    });
  }

  const randomConfig = {
    ...baseConfig,
    baseColor,
    noise: Math.floor(Math.random() * 25) + 20, // 20-45% noise
    noiseScale: Math.random() * 1.5 + 1.5,
    shapes: newShapes
  };

  return randomConfig;
};