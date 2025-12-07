
export interface ContentConfig {
  showAuthor: boolean;
  showDate: boolean;
  showTime: boolean;
  showTags: boolean;
  layoutMode: 'default' | 'grid' | 'magazine' | 'list' | 'masonry' | 'minimal' | 'immersive' | 'brutalist' | 'timeline' | 'bento' | 'newspaper' | 'focus' | 'gallery' | 'compact' | 'split' | 'cyberpunk' | 'terminal' | 'polaroid' | 'modern';
  density: 'compact' | 'comfortable' | 'spacious';
  paginationType?: 'numbered' | 'loadMore' | 'infinite';
}

export interface HeaderConfig {
  style: 'default' | 'centered' | 'minimal';
  position: 'static' | 'sticky' | 'floating' | 'hidden';
  height: 'ultra-compact' | 'tiny' | 'compact' | 'normal' | 'spacious';
  showTitle: boolean;
  showLogo?: boolean;
  customTitle: string;
  logoUrl: string | null;
  logoSize: 'sm' | 'md' | 'lg';
  customFavicon?: string | null;
  useThemeColor?: boolean;
  // New appearance controls
  backgroundColor?: string;
  backgroundOpacity?: number; // 0-100
  blurIntensity?: 'none' | 'light' | 'medium' | 'heavy';
  borderColor?: string;
  borderOpacity?: number; // 0-100
  categoryBackgroundColor?: string;
  categoryBackgroundOpacity?: number; // 0-100
  // Simplified controls (new)
  bgColor?: string;
  bgOpacity?: number; // 0-1
  blur?: number; // 0-30
  // Advanced Customization
  customLogoSvg?: string;
  logoColor?: string;
  logoColorMode?: 'custom' | 'theme' | 'original';
  syncFavicon?: boolean;
  titleColor?: string;
  titleGradient?: {
    enabled: boolean;
    from: string;
    to: string;
    direction: string; // 'to right', 'to bottom', etc.
  };
}

export interface FeedSource {
  url: string;
  categoryId?: string;
  customTitle?: string;
}

export interface FeedCategory {
  id: string;
  name: string;
  color: string;
  description?: string;
  order: number;
  isDefault?: boolean;
  isPinned?: boolean;
  layoutMode?: ContentConfig['layoutMode'];
}

export interface LayoutPreset {
  id: string;
  name: string;
  description: string;
  icon?: string;
  header: Partial<HeaderConfig>;
  content: Partial<ContentConfig>;
}

export interface Article {
  title: string;
  link: string;
  pubDate: Date;
  sourceTitle: string;
  imageUrl?: string;
  description?: string;
  content?: string;
  author?: string;
  categories?: string[];
}

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
}

export type ThemeColor = 'blue' | 'green' | 'purple' | 'orange' | 'red';

export interface AppSettings {
  themeColor: ThemeColor;
  backgroundImage: string | null;
}

export interface UserSettings {
  themeColor: ThemeColor;
  backgroundImage: string | null;
  weatherCity: string;
  timeFormat: '12h' | '24h';
}

// Extended Theme System
export interface LayoutBreakpoint {
  name: string;
  minWidth: number;
  maxWidth?: number;
  columns: number;
  gap: string;
  padding: string;
  fontSize: string;
  lineHeight: string;
}

export interface AdaptiveLayoutConfig {
  breakpoints: LayoutBreakpoint[];
  containerQueries: boolean;
  fluidTypography: boolean;
  responsiveImages: boolean;
  adaptiveGrid: boolean;
}

export interface ExtendedTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
  };
  layout: 'compact' | 'comfortable' | 'spacious';
  density: 'low' | 'medium' | 'high';
  borderRadius: 'none' | 'small' | 'medium' | 'large';
  shadows: boolean;
  animations: boolean;
  adaptiveLayout?: AdaptiveLayoutConfig;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  theme: ExtendedTheme;
  category: 'light' | 'dark' | 'colorful' | 'minimal';
}

export interface ThemeSettings {
  currentTheme: ExtendedTheme;
  customThemes: ExtendedTheme[];
  autoDetectSystemTheme: boolean;
  systemThemeOverride: 'light' | 'dark' | null;
  themeTransitions: boolean;
}



export interface GradientStop {
  id: string;
  color: string;
  opacity: number;
  position: number;
}

export interface GradientSettings {
  type: 'linear' | 'radial';
  angle: number;
  stops: GradientStop[];
}

// Aura Wall Interfaces
export interface ColorStop {
  offset: number;
  color: string;
}

export type BlendMode =
  | 'normal' | 'screen' | 'overlay' | 'multiply' | 'color-dodge'
  | 'soft-light' | 'difference' | 'lighten' | 'darken' | 'color-burn';

export interface Shape {
  id: string;
  type: 'circle';     // Geometric primitive
  x: number;          // X position in % (0-100)
  y: number;          // Y position in % (0-100)
  size: number;       // Size relative to width (e.g., 80 = 80% of width)
  color: string;      // Shape color (Hex/RGBA)
  opacity: number;    // Transparency (0.0 - 1.0)
  blur: number;       // Gaussian Blur (px)
  blendMode: BlendMode; // Blend mode
}

export interface WallpaperConfig {
  width: number;      // Export width (px)
  height: number;     // Export height (px)
  baseColor: string;  // Background color (Hex)
  noise: number;      // Noise intensity (0-100)
  noiseScale: number; // Noise size (1-20)
  shapes: Shape[];    // Array of visual layers
}

export interface Preset {
  id: string;
  name: string;
  category: 'Aura' | 'Neon' | 'Dark' | 'Soft' | 'Abstract';
  thumbnail: string; // CSS Gradient string for UI
  config: Partial<WallpaperConfig>;
}

export interface ExportSize {
  name: string;
  width: number;
  height: number;
}

export interface BackgroundConfig {
  type: 'solid' | 'gradient' | 'pattern' | 'image' | 'aura';
  value: string; // The CSS value (e.g., color, gradient string, url("data:image/svg+xml,..."))
  customImage?: string | null; // For type 'image'
  auraSettings?: WallpaperConfig; // For type 'aura'
  // patternSettings and gradientSettings are deprecated and will be removed in future versions
}

export interface AppearanceSettings {
  header: HeaderConfig;
  content: ContentConfig;
  theme: ThemeSettings;
  background: BackgroundConfig;
}
