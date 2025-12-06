
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

export interface HeaderConfig {
  style: 'default' | 'centered' | 'minimal';
  position: 'static' | 'sticky' | 'floating' | 'hidden';
  height: 'compact' | 'normal' | 'spacious';
  showTitle: boolean;
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
}

export interface ContentConfig {
  showAuthor: boolean;
  showDate: boolean;
  showTime: boolean;
  showTags: boolean;
  layoutMode: 'default' | 'grid' | 'magazine' | 'list' | 'masonry' | 'minimal' | 'immersive' | 'brutalist' | 'timeline' | 'bento' | 'newspaper' | 'focus' | 'gallery' | 'compact' | 'split' | 'cyberpunk' | 'terminal' | 'polaroid';
  density: 'compact' | 'comfortable' | 'spacious';
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

export interface BackgroundConfig {
  type: 'solid' | 'gradient' | 'pattern' | 'image';
  value: string;
  gradientSettings?: GradientSettings;
  patternSettings?: {
    name: string;
    colors: string[];
    scale?: number;
    opacity?: number;
  };
  customImage?: string | null;
}

export interface AppearanceSettings {
  header: HeaderConfig;
  content: ContentConfig;
  theme: ThemeSettings;
  background: BackgroundConfig;
}
