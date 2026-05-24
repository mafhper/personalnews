/**
 * defaultConfig.ts
 *
 * Arquivo de configuração centralizado do Personal News.
 * Todas as configurações padrão do sistema estão definidas aqui.
 * Edite este arquivo para alterar os valores iniciais da aplicação.
 *
 * @author Matheus Pereira
 * @version 1.0.0
 */

import type {
    HeaderConfig,
    ContentConfig,
    FeedCategory,
    FeedSource,

} from '../types';
import { INITIAL_APP_CONFIG, DEFAULT_CATEGORIES as GEN_CATEGORIES, DEFAULT_FEEDS as GEN_FEEDS, CURATED_LISTS as GEN_CURATED_LISTS } from '../constants/curatedFeeds';

const initialConfig = INITIAL_APP_CONFIG as Record<string, unknown>;

const resolveHeaderPosition = (value?: string) => {
  const normalized = (value || '').toLowerCase();
  const allowed: HeaderConfig['position'][] = ['static', 'sticky', 'floating', 'hidden'];
  return allowed.includes(normalized as HeaderConfig['position'])
    ? (normalized as HeaderConfig['position'])
    : 'floating';
};

const defaultHeaderPosition = resolveHeaderPosition(initialConfig.header as string | undefined);
const resolveOneOf = <T extends string | number>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T => {
  const normalizedValue =
    typeof fallback === 'number' && typeof value === 'string'
      ? Number(value)
      : value;
  return allowed.includes(normalizedValue as T) ? (normalizedValue as T) : fallback;
};

const resolveNumber = (
  value: unknown,
  fallback: number,
  min = Number.NEGATIVE_INFINITY,
  max = Number.POSITIVE_INFINITY,
) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
};

const defaultHeaderOpacity = resolveNumber(initialConfig.headerOpacity, 0.6, 0, 1);
const defaultHeaderBlur = resolveNumber(initialConfig.headerBlur, 20, 0, 30);
const defaultTopStoriesCount = resolveOneOf(
  initialConfig.topStoriesCount,
  [0, 5, 10, 15, 20] as const,
  15,
);
const defaultFeedCacheTtl = resolveOneOf(
  initialConfig.feedCacheTtlMinutes,
  [0, 5, 10] as const,
  10,
);

// =============================================================================
// CONFIGURAÇÕES DE APARÊNCIA (Header, Content, Background)
// =============================================================================

/**
 * Configuração padrão do Header
 * Controla: Logo, título, posição, estilo visual do cabeçalho
 */
export const DEFAULT_HEADER_CONFIG: HeaderConfig = {
    style: 'default',           // 'default' | 'minimal' | 'centered' | 'transparent'
    position: defaultHeaderPosition,       // 'static' | 'sticky' | 'floating' | 'hidden'
    height: resolveOneOf(initialConfig.headerHeight, ['ultra-compact', 'tiny', 'compact', 'normal', 'spacious'] as const, 'normal'),
    favoriteToolbarVariant: resolveOneOf(initialConfig.favoriteToolbarVariant, ['inline', 'drawer'] as const, 'inline'),
    showTitle: true,           // Mostrar título no header
    showLogo: true,             // Mostrar logo no header
    customTitle: 'Personal News',
    logoUrl: null,
    logoSize: resolveOneOf(initialConfig.logoSize, ['sm', 'md', 'lg'] as const, 'md'),
    backgroundOpacity: Math.round(defaultHeaderOpacity * 100),
    blurIntensity: 'heavy',     // 'none' | 'light' | 'medium' | 'heavy'
    borderColor: '#ffffff',
    borderOpacity: 8,           // Opacidade da borda (0-100)
    categoryBackgroundColor: '#ffffff',
    categoryBackgroundOpacity: 3,
    bgColor: '#1F1F1F',
    bgOpacity: defaultHeaderOpacity,
    blur: defaultHeaderBlur,
};

/**
 * Configuração padrão do Conteúdo
 * Controla: Exibição de autor, data, layout de artigos
 */
export const DEFAULT_CONTENT_CONFIG: ContentConfig = {
    showAuthor: true,           // Mostrar nome do autor
    showDate: true,             // Mostrar data de publicação
    showTime: true,            // Mostrar hora de publicação
    showTags: true,             // Mostrar tags/categorias
    layoutMode: initialConfig.layout as ContentConfig['layoutMode'],       // Layout padrão dos artigos
    density: 'comfortable',     // 'compact' | 'comfortable' | 'spacious'
    paginationType: resolveOneOf(initialConfig.paginationType, ['numbered', 'loadMore', 'infinite'] as const, 'numbered'),
};
/**
 * Configurações de exibição de artigos
 */
export const DEFAULT_ARTICLE_LAYOUT = {
    topStoriesCount: defaultTopStoriesCount,
    showPublicationTime: true,   // Mostrar hora de publicação
    articlesPerPage: 1 + 5 + defaultTopStoriesCount,
    autoRefreshInterval: resolveNumber(initialConfig.autoRefreshInterval, 15, 0),
    feedCacheTtlMinutes: defaultFeedCacheTtl,
};

// =============================================================================
// CATEGORIAS PADRÃO DO SISTEMA
// =============================================================================

export const DEFAULT_CATEGORIES: FeedCategory[] = GEN_CATEGORIES;

// =============================================================================
// FEEDS PADRÃO (PRÉ-CONFIGURADOS)
// =============================================================================

/**
 * Feeds que vêm pré-configurados para novos usuários
 */
export const DEFAULT_FEEDS: FeedSource[] = GEN_FEEDS;

/**
 * Listas de feeds curados disponíveis para importação
 */
export const DEFAULT_CURATED_LISTS = GEN_CURATED_LISTS;

// =============================================================================
// OUTRAS CONFIGURAÇÕES
// =============================================================================

/**
 * Cidade padrão para previsão do tempo
 */
export const DEFAULT_WEATHER_CITY = initialConfig.weatherCity;

/**
 * Configurações de performance
 */
export const DEFAULT_PERFORMANCE_CONFIG = {
    enabled: true,              // Monitoramento de performance (apenas em dev)
    sampleRate: 1.0,             // Taxa de amostragem
    maxMetrics: 100,             // Máximo de métricas armazenadas
    backgroundCleanup: true,     // Limpeza automática em background
    monitoringInterval: 10000,   // Intervalo de monitoramento (ms)
};

/**
 * Configurações de carregamento de feeds
 */
export const DEFAULT_FEED_LOADING = {
    feedTimeoutMs: 6000,         // Timeout por feed (ms)
    batchSize: 8,                // Feeds por batch
    batchDelayMs: 500,           // Delay entre batches (ms)
};

// =============================================================================
// CHAVES DO LOCALSTORAGE
// =============================================================================

/**
 * Chaves usadas para armazenar dados no localStorage
 * Útil para reset seletivo ou backup
 */
export const STORAGE_KEYS = {
    feeds: 'feed-sources',
    categories: 'feed-categories',
    headerConfig: 'appearance-header',
    contentConfig: 'appearance-content',
    backgroundConfig: 'appearance-background',
    themeSettings: 'extended-theme-settings',
    articleLayout: 'article-layout-settings',
    readStatus: 'article-read-status',
    favorites: 'favorites-data',
    primaryView: 'personalnews-primary-view',
    weatherCity: 'personalnews_weather_city',
    searchHistory: 'searchHistory',
} as const;
