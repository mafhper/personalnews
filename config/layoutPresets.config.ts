/**
 * layoutPresets.config.ts
 *
 * Arquivo centralizado de configuração dos presets de layout.
 * Edite este arquivo para ajustar as configurações de cada layout.
 *
 * IMPORTANTE: Após editar, execute `npm run build` para aplicar as mudanças.
 *
 * @author Matheus Pereira
 */

import type { HeaderConfig, ContentConfig } from "../types";

// ============================================================================
// CONFIGURAÇÃO PADRÃO DO HEADER
// Usada como base para todos os layouts que não especificam valores
// ============================================================================
export const DEFAULT_HEADER: Partial<HeaderConfig> = {
  style: "default",
  position: "floating", // 'floating' | 'sticky' | 'static' | 'hidden'
  height: "normal", // 'ultra-compact' | 'tiny' | 'compact' | 'normal' | 'spacious'
  showTitle: true,
  showLogo: true,
  backgroundColor: "#0a0a0c",
  backgroundOpacity: 95,
  blurIntensity: "medium", // 'none' | 'light' | 'medium' | 'heavy'
  borderColor: "#ffffff",
  borderOpacity: 8,
};

// ============================================================================
// CONFIGURAÇÃO PADRÃO DO CONTEÚDO
// ============================================================================
export const DEFAULT_CONTENT: Partial<ContentConfig> = {
  density: "comfortable", // 'compact' | 'comfortable' | 'spacious'
  showAuthor: true,
  showDate: true,
  showTags: true,
};

// ============================================================================
// DEFINIÇÕES DOS PRESETS
// Cada preset pode sobrescrever apenas as propriedades que diferem do padrão
// ============================================================================

export interface LayoutPresetConfig {
  id: string;
  name: string;
  description: string;
  header: Partial<HeaderConfig>;
  content: Partial<ContentConfig>;
}

export const LAYOUT_PRESETS_CONFIG: LayoutPresetConfig[] = [
  // --------------------------------------------------------------------------
  // MASONRY - Layout padrão com grade dinâmica
  // --------------------------------------------------------------------------
  {
    id: "masonry",
    name: "Masonry Default",
    description: "Layout padrão com grade dinâmica e header flutuante.",
    header: {
      style: "default", // Options: 'default' | 'centered' | 'minimal'
      position: "floating", // Options: 'static' | 'sticky' | 'floating' | 'hidden'
      height: "normal", // Options: 'ultra-compact' | 'tiny' | 'compact' | 'normal' | 'spacious'
      showTitle: true, // Options: true | false
      showLogo: true, // Options: true | false
      backgroundColor: "#1F1F1F", // Hex color
      backgroundOpacity: 60, // Range: 0-100
      blurIntensity: "heavy", // Options: 'none' | 'light' | 'medium' | 'heavy'
      borderColor: "#ffffff", // Hex color
      borderOpacity: 8, // Range: 0-100
    },
    content: {
      layoutMode: "masonry", // Options: 'masonry' | 'magazine' | 'modern' | 'newspaper' | 'minimal' | 'focus' | 'immersive' | 'timeline' | 'bento' | 'pocketfeeds'
      density: "comfortable", // Options: 'compact' | 'comfortable' | 'spacious'
      showAuthor: true, // Options: true | false
      showDate: true, // Options: true | false
      showTime: true, // Options: true | false
      showTags: true, // Options: true | false
      paginationType: "numbered", // Options: 'numbered' | 'loadMore' | 'infinite'
    },
  },

  // --------------------------------------------------------------------------
  // MAGAZINE - Layout clássico editorial
  // --------------------------------------------------------------------------
  {
    id: "magazine",
    name: "Magazine",
    description: "Layout clássico com header sólido e navegação central.",
    header: {
      style: "centered", // Options: 'default' | 'centered' | 'minimal'
      position: "floating", // Options: 'static' | 'sticky' | 'floating' | 'hidden'
      height: "normal", // Options: 'ultra-compact' | 'tiny' | 'compact' | 'normal' | 'spacious'
      showTitle: true, // Options: true | false
      showLogo: true, // Options: true | false
      backgroundColor: "#1a1a1a", // Hex color
      backgroundOpacity: 98, // Range: 0-100
      blurIntensity: "heavy", // Options: 'none' | 'light' | 'medium' | 'heavy'
      borderColor: "#ffffff", // Hex color
      borderOpacity: 10, // Range: 0-100
    },
    content: {
      layoutMode: "magazine", // Options: 'masonry' | 'magazine' | 'modern' | 'newspaper' | 'minimal' | 'focus' | 'immersive' | 'timeline' | 'bento' | 'pocketfeeds'
      density: "comfortable", // Options: 'compact' | 'comfortable' | 'spacious'
      showAuthor: true, // Options: true | false
      showDate: true, // Options: true | false
      showTime: true, // Options: true | false
      showTags: true, // Options: true | false
      paginationType: "numbered", // Options: 'numbered' | 'loadMore' | 'infinite'
    },
  },

  // --------------------------------------------------------------------------
  // MODERN - Portal editorial moderno
  // --------------------------------------------------------------------------
  {
    id: "modern",
    name: "Modern Portal",
    description:
      "Layout editorial moderno com hero sections e destaques visuais.",
    header: {
      style: "default", // Options: 'default' | 'centered' | 'minimal'
      position: "floating", // Options: 'static' | 'sticky' | 'floating' | 'hidden'
      height: "normal", // Options: 'ultra-compact' | 'tiny' | 'compact' | 'normal' | 'spacious'
      showTitle: true, // Options: true | false
      showLogo: true, // Options: true | false
      backgroundColor: "#1F1F1F", // Hex color
      backgroundOpacity: 60, // Range: 0-100
      blurIntensity: "heavy", // Options: 'none' | 'light' | 'medium' | 'heavy'
      borderColor: "#ffffff", // Hex color
      borderOpacity: 8, // Range: 0-100
    },
    content: {
      layoutMode: "modern", // Options: 'masonry' | 'magazine' | 'modern' | 'newspaper' | 'minimal' | 'focus' | 'immersive' | 'timeline' | 'bento' | 'pocketfeeds'
      density: "comfortable", // Options: 'compact' | 'comfortable' | 'spacious'
      showAuthor: true, // Options: true | false
      showDate: true, // Options: true | false
      showTime: true, // Options: true | false
      showTags: true, // Options: true | false
      paginationType: "numbered", // Options: 'numbered' | 'loadMore' | 'infinite'
    },
  },

  // --------------------------------------------------------------------------
  // NEWSPAPER - Estilo jornal clássico
  // --------------------------------------------------------------------------
  {
    id: "newspaper",
    name: "Newspaper",
    description: "Estilo jornal clássico, denso e informativo.",
    header: {
      style: "default", // Options: 'default' | 'centered' | 'minimal'
      position: "floating", // Options: 'static' | 'sticky' | 'floating' | 'hidden'
      height: "normal", // Options: 'ultra-compact' | 'tiny' | 'compact' | 'normal' | 'spacious'
      showTitle: true, // Options: true | false
      showLogo: true, // Options: true | false
      backgroundColor: "#111827", // Hex color
      backgroundOpacity: 100, // Range: 0-100
      blurIntensity: "none", // Options: 'none' | 'light' | 'medium' | 'heavy'
      borderColor: "#374151", // Hex color
      borderOpacity: 25, // Range: 0-100
    },
    content: {
      layoutMode: "newspaper", // Options: 'masonry' | 'magazine' | 'modern' | 'newspaper' | 'minimal' | 'focus' | 'immersive' | 'timeline' | 'bento' | 'pocketfeeds'
      density: "comfortable", // Options: 'compact' | 'comfortable' | 'spacious'
      showAuthor: true, // Options: true | false
      showDate: true, // Options: true | false
      showTime: true, // Options: true | false
      showTags: true, // Options: true | false
      paginationType: "numbered", // Options: 'numbered' | 'loadMore' | 'infinite'
    },
  },

  // --------------------------------------------------------------------------
  // MINIMAL - Foco no conteúdo
  // --------------------------------------------------------------------------
  {
    id: "minimal",
    name: "Minimal",
    description: "Foco no conteúdo. Header flutuante transparente.",
    header: {
      style: "minimal", // Options: 'default' | 'centered' | 'minimal'
      position: "floating", // Options: 'static' | 'sticky' | 'floating' | 'hidden'
      height: "normal", // Options: 'ultra-compact' | 'tiny' | 'compact' | 'normal' | 'spacious'
      showTitle: true, // Options: true | false
      showLogo: true, // Options: true | false
      backgroundColor: "#000000", // Hex color
      backgroundOpacity: 40, // Range: 0-100
      blurIntensity: "heavy", // Options: 'none' | 'light' | 'medium' | 'heavy'
      borderColor: "transparent", // Hex color
      borderOpacity: 0, // Range: 0-100
    },
    content: {
      layoutMode: "minimal", // Options: 'masonry' | 'magazine' | 'modern' | 'newspaper' | 'minimal' | 'focus' | 'immersive' | 'timeline' | 'bento' | 'pocketfeeds'
      density: "comfortable", // Options: 'compact' | 'comfortable' | 'spacious'
      showAuthor: true, // Options: true | false
      showDate: true, // Options: true | false
      showTime: true, // Options: true | false
      showTags: true, // Options: true | false
      paginationType: "numbered", // Options: 'numbered' | 'loadMore' | 'infinite'
    },
  },

  // --------------------------------------------------------------------------
  // FOCUS - Leitura sem distrações
  // --------------------------------------------------------------------------
  {
    id: "focus",
    name: "Focus",
    description:
      "Leitura sem distrações. Header oculto e layout de coluna única.",
    header: {
      style: "default", // Options: 'default' | 'centered' | 'minimal'
      position: "floating", // Options: 'static' | 'sticky' | 'floating' | 'hidden'
      height: "normal", // Options: 'ultra-compact' | 'tiny' | 'compact' | 'normal' | 'spacious'
      showTitle: true, // Options: true | false
      showLogo: true, // Options: true | false
      backgroundColor: "#1F1F1F", // Hex color
      backgroundOpacity: 60, // Range: 0-100
      blurIntensity: "none", // Options: 'none' | 'light' | 'medium' | 'heavy'
      borderColor: "#ffffff", // Hex color
      borderOpacity: 8, // Range: 0-100
    },
    content: {
      layoutMode: "focus", // Options: 'masonry' | 'magazine' | 'modern' | 'newspaper' | 'minimal' | 'focus' | 'immersive' | 'timeline' | 'bento' | 'pocketfeeds'
      density: "comfortable", // Options: 'compact' | 'comfortable' | 'spacious'
      showAuthor: true, // Options: true | false
      showDate: true, // Options: true | false
      showTime: true, // Options: true | false
      showTags: true, // Options: true | false
      paginationType: "numbered", // Options: 'numbered' | 'loadMore' | 'infinite'
    },
  },

  // --------------------------------------------------------------------------
  // IMMERSIVE - Experiência full-screen
  // --------------------------------------------------------------------------
  {
    id: "immersive",
    name: "Immersive",
    description: "Experiência full-screen com header ultra-discreto.",
    header: {
      style: "minimal", // Options: 'default' | 'centered' | 'minimal'
      position: "floating", // Options: 'static' | 'sticky' | 'floating' | 'hidden'
      height: "normal", // Options: 'ultra-compact' | 'tiny' | 'compact' | 'normal' | 'spacious'
      showTitle: true, // Options: true | false
      showLogo: true, // Options: true | false
      backgroundColor: "#000000", // Hex color
      backgroundOpacity: 0, // Range: 0-100
      blurIntensity: "none", // Options: 'none' | 'light' | 'medium' | 'heavy'
      borderColor: "transparent", // Hex color
      borderOpacity: 0, // Range: 0-100
    },
    content: {
      layoutMode: "immersive", // Options: 'masonry' | 'magazine' | 'modern' | 'newspaper' | 'minimal' | 'focus' | 'immersive' | 'timeline' | 'bento' | 'pocketfeeds'
      density: "comfortable", // Options: 'compact' | 'comfortable' | 'spacious'
      showAuthor: true, // Options: true | false
      showDate: true, // Options: true | false
      showTime: true, // Options: true | false
      showTags: true, // Options: true | false
      paginationType: "numbered", // Options: 'numbered' | 'loadMore' | 'infinite'
    },
  },

  // --------------------------------------------------------------------------
  // BRUTALIST - Alto contraste, bordas fortes
  // --------------------------------------------------------------------------
  {
    id: "brutalist",
    name: "Brutalist",
    description: "Bordas fortes, alto contraste e tipografia marcante.",
    header: {
      style: "default", // Options: 'default' | 'centered' | 'minimal'
      position: "floating", // Options: 'static' | 'sticky' | 'floating' | 'hidden'
      height: "normal", // Options: 'ultra-compact' | 'tiny' | 'compact' | 'normal' | 'spacious'
      showTitle: true, // Options: true | false
      showLogo: true, // Options: true | false
      backgroundColor: "#000000", // Hex color
      backgroundOpacity: 100, // Range: 0-100
      blurIntensity: "none", // Options: 'none' | 'light' | 'medium' | 'heavy'
      borderColor: "#ffffff", // Hex color
      borderOpacity: 100, // Range: 0-100
    },
    content: {
      layoutMode: "brutalist", // Options: 'masonry' | 'magazine' | 'modern' | 'newspaper' | 'minimal' | 'focus' | 'immersive' | 'timeline' | 'bento' | 'pocketfeeds'
      density: "comfortable", // Options: 'compact' | 'comfortable' | 'spacious'
      showAuthor: true, // Options: true | false
      showDate: true, // Options: true | false
      showTime: true, // Options: true | false
      showTags: true, // Options: true | false
      paginationType: "numbered", // Options: 'numbered' | 'loadMore' | 'infinite'
    },
  },

  // --------------------------------------------------------------------------
  // TIMELINE - Navegação por tempo
  // --------------------------------------------------------------------------
  {
    id: "timeline",
    name: "Timeline",
    description: "Navegação por tempo. Header sticky compacto.",
    header: {
      style: "default", // Options: 'default' | 'centered' | 'minimal'
      position: "floating", // Options: 'static' | 'sticky' | 'floating' | 'hidden'
      height: "normal", // Options: 'ultra-compact' | 'tiny' | 'compact' | 'normal' | 'spacious'
      showTitle: true, // Options: true | false
      showLogo: true, // Options: true | false
      backgroundColor: "#1f2937", // Hex color
      backgroundOpacity: 90, // Range: 0-100
      blurIntensity: "light", // Options: 'none' | 'light' | 'medium' | 'heavy'
      borderColor: "#374151", // Hex color
      borderOpacity: 50, // Range: 0-100
    },
    content: {
      layoutMode: "timeline", // Options: 'masonry' | 'magazine' | 'modern' | 'newspaper' | 'minimal' | 'focus' | 'immersive' | 'timeline' | 'bento' | 'pocketfeeds'
      density: "comfortable", // Options: 'compact' | 'comfortable' | 'spacious'
      showAuthor: true, // Options: true | false
      showDate: true, // Options: true | false
      showTime: true, // Options: true | false
      showTags: true, // Options: true | false
      paginationType: "numbered", // Options: 'numbered' | 'loadMore' | 'infinite'
    },
  },

  // --------------------------------------------------------------------------
  // BENTO - Layout modular moderno
  // --------------------------------------------------------------------------
  {
    id: "bento",
    name: "Bento Grid",
    description: "Layout modular moderno.",
    header: {
      style: "default", // Options: 'default' | 'centered' | 'minimal'
      position: "floating", // Options: 'static' | 'sticky' | 'floating' | 'hidden'
      height: "normal", // Options: 'ultra-compact' | 'tiny' | 'compact' | 'normal' | 'spacious'
      showTitle: true, // Options: true | false
      showLogo: true, // Options: true | false
      backgroundColor: "#1a1a1a", // Hex color
      backgroundOpacity: 60, // Range: 0-100
      blurIntensity: "heavy", // Options: 'none' | 'light' | 'medium' | 'heavy'
      borderColor: "#ffffff", // Hex color
      borderOpacity: 5, // Range: 0-100
    },
    content: {
      layoutMode: "bento", // Options: 'masonry' | 'magazine' | 'modern' | 'newspaper' | 'minimal' | 'focus' | 'immersive' | 'timeline' | 'bento' | 'pocketfeeds'
      density: "comfortable", // Options: 'compact' | 'comfortable' | 'spacious'
      showAuthor: true, // Options: true | false
      showDate: true, // Options: true | false
      showTime: true, // Options: true | false
      showTags: true, // Options: true | false
      paginationType: "numbered", // Options: 'numbered' | 'loadMore' | 'infinite'
    },
  },

  // --------------------------------------------------------------------------
  // POCKETFEEDS - Layout focado em Podcasts
  // --------------------------------------------------------------------------
  {
    id: "pocketfeeds",
    name: "PocketFeeds",
    description: "Layout focado em podcasts com player de áudio integrado.",
    header: {
      style: "default", // Options: 'default' | 'centered' | 'minimal'
      position: "floating", // Options: 'static' | 'sticky' | 'floating' | 'hidden'
      height: "normal", // Options: 'ultra-compact' | 'tiny' | 'compact' | 'normal' | 'spacious'
      showTitle: true, // Options: true | false
      showLogo: true, // Options: true | false
      backgroundColor: "#1F1F1F", // Hex color
      backgroundOpacity: 50, // Range: 0-100
      blurIntensity: "heavy", // Options: 'none' | 'light' | 'medium' | 'heavy'
      borderColor: "#ffffff", // Hex color
      borderOpacity: 8, // Range: 0-100
    },
    content: {
      layoutMode: "pocketfeeds", // Options: 'masonry' | 'magazine' | 'modern' | 'newspaper' | 'minimal' | 'focus' | 'immersive' | 'timeline' | 'bento' | 'pocketfeeds'
      density: "comfortable", // Options: 'compact' | 'comfortable' | 'spacious'
      showAuthor: true, // Options: true | false
      showDate: true, // Options: true | false
      showTime: true, // Options: true | false
      showTags: true, // Options: true | false
      paginationType: "numbered", // Options: 'numbered' | 'loadMore' | 'infinite'
    },
  },
];

// ============================================================================
// FUNÇÃO PARA MESCLAR PRESET COM DEFAULTS
// Usada pelo useAppearance.ts para gerar o preset final
// ============================================================================
export function buildLayoutPreset(preset: LayoutPresetConfig) {
  return {
    id: preset.id,
    name: preset.name,
    description: preset.description,
    header: { ...DEFAULT_HEADER, ...preset.header },
    content: { ...DEFAULT_CONTENT, ...preset.content },
  };
}

// ============================================================================
// PRESETS PRONTOS PARA USO (com defaults aplicados)
// ============================================================================
export const BUILT_LAYOUT_PRESETS =
  LAYOUT_PRESETS_CONFIG.map(buildLayoutPreset);
