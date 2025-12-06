import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { HeaderConfig, ContentConfig, LayoutPreset, BackgroundConfig } from '../types';
import { useExtendedTheme } from './useExtendedTheme';

const defaultHeaderConfig: HeaderConfig = {
  style: 'minimal',
  position: 'sticky',
  height: 'normal',
  showTitle: true,
  customTitle: 'Personal News',
  logoUrl: null,
  logoSize: 'md',
  // Appearance defaults
  backgroundColor: '#0a0a0c',
  backgroundOpacity: 95,
  blurIntensity: 'medium',
  borderColor: '#ffffff',
  borderOpacity: 8,
  categoryBackgroundColor: '#ffffff',
  categoryBackgroundOpacity: 3,
};

const defaultContentConfig: ContentConfig = {
  showAuthor: true,
  showDate: true,
  showTime: false,
  showTags: true,
  layoutMode: 'default',
  density: 'comfortable',
};

const defaultBackgroundConfig: BackgroundConfig = {
  type: 'solid',
  value: '#121212',
};

export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: 'magazine',
    name: 'Magazine',
    description: 'Layout clássico com destaque visual e 3 colunas.',
    header: { style: 'centered', position: 'static', height: 'spacious', showTitle: true },
    content: { layoutMode: 'grid', density: 'comfortable', showAuthor: true, showDate: true, showTags: true }
  },
  {
    id: 'portal',
    name: 'News Portal',
    description: 'Alta densidade com sidebar lateral, ideal para muitas notícias.',
    header: { style: 'default', position: 'sticky', height: 'compact', showTitle: true },
    content: { layoutMode: 'list', density: 'compact', showAuthor: false, showDate: true, showTime: true, showTags: true }
  },
  {
    id: 'minimal',
    name: 'Minimalista',
    description: 'Foco total no texto. Uma coluna centralizada.',
    header: { style: 'minimal', position: 'floating', height: 'normal', showTitle: false },
    content: { layoutMode: 'minimal', density: 'spacious', showAuthor: true, showDate: false, showTags: false }
  },
  {
    id: 'modern',
    name: 'Moderno',
    description: 'Cards em estilo Masonry (Pinterest) com header flutuante.',
    header: { style: 'default', position: 'floating', height: 'normal', showTitle: true },
    content: { layoutMode: 'masonry', density: 'comfortable', showAuthor: true, showDate: true, showTags: true }
  },
  {
    id: 'immersive',
    name: 'Immersive',
    description: 'Experiência cinematográfica estilo Netflix.',
    header: { style: 'minimal', position: 'floating', height: 'normal', showTitle: false },
    content: { layoutMode: 'immersive', density: 'spacious', showAuthor: true, showDate: true, showTags: false }
  },
  {
    id: 'brutalist',
    name: 'Brutalist',
    description: 'Design cru, tipografia grande e alto contraste.',
    header: { style: 'default', position: 'static', height: 'spacious', showTitle: true },
    content: { layoutMode: 'brutalist', density: 'spacious', showAuthor: true, showDate: true, showTags: true }
  },
  {
    id: 'timeline',
    name: 'Timeline',
    description: 'Linha do tempo cronológica vertical.',
    header: { style: 'centered', position: 'sticky', height: 'compact', showTitle: true },
    content: { layoutMode: 'timeline', density: 'comfortable', showAuthor: true, showDate: true, showTags: true }
  },
  {
    id: 'bento',
    name: 'Bento',
    description: 'Grid assimétrico estilo dashboard.',
    header: { style: 'default', position: 'floating', height: 'normal', showTitle: true },
    content: { layoutMode: 'bento', density: 'compact', showAuthor: false, showDate: true, showTags: false }
  }
];

export const useAppearance = () => {
  const { themeSettings, updateThemeSettings, currentTheme, customThemes, defaultPresets, setCurrentTheme, removeCustomTheme } = useExtendedTheme();

  const [headerConfig, setHeaderConfig] = useLocalStorage<HeaderConfig>(
    'appearance-header',
    defaultHeaderConfig
  );

  const [contentConfig, setContentConfig] = useLocalStorage<ContentConfig>(
    'appearance-content',
    defaultContentConfig
  );

  const [backgroundConfig, setBackgroundConfig] = useLocalStorage<BackgroundConfig>(
    'appearance-background',
    defaultBackgroundConfig
  );

  const [activeLayoutId, setActiveLayoutId] = useLocalStorage<string | null>(
    'appearance-active-layout',
    null
  );

  const updateHeaderConfig = useCallback((updates: Partial<HeaderConfig>) => {
    setHeaderConfig((prev) => ({ ...prev, ...updates }));
    setActiveLayoutId(null);
  }, [setHeaderConfig, setActiveLayoutId]);

  const updateContentConfig = useCallback((updates: Partial<ContentConfig>) => {
    setContentConfig((prev) => ({ ...prev, ...updates }));
    setActiveLayoutId(null);
  }, [setContentConfig, setActiveLayoutId]);

  const updateBackgroundConfig = useCallback((updates: Partial<BackgroundConfig>) => {
    setBackgroundConfig((prev) => ({ ...prev, ...updates }));
  }, [setBackgroundConfig]);

  const applyLayoutPreset = useCallback((presetId: string) => {
    const preset = LAYOUT_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setHeaderConfig(prev => ({ ...prev, ...preset.header }));
      setContentConfig(prev => ({ ...prev, ...preset.content }));
      setActiveLayoutId(presetId);
    }
  }, [setHeaderConfig, setContentConfig, setActiveLayoutId]);

  const resetAppearance = useCallback(() => {
    setHeaderConfig(defaultHeaderConfig);
    setContentConfig(defaultContentConfig);
    setBackgroundConfig(defaultBackgroundConfig);
    setActiveLayoutId(null);
  }, [setHeaderConfig, setContentConfig, setBackgroundConfig, setActiveLayoutId]);

  return {
    headerConfig,
    contentConfig,
    backgroundConfig,
    activeLayoutId,
    updateHeaderConfig,
    updateContentConfig,
    updateBackgroundConfig,
    applyLayoutPreset,
    resetAppearance,
    themeSettings,
    updateThemeSettings,
    currentTheme,
    customThemes,
    defaultPresets,
    setCurrentTheme,
    removeCustomTheme,
  };
};
