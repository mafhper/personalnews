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
    BackgroundConfig,
    FeedCategory,
    FeedSource,

} from '../types';
import { INITIAL_APP_CONFIG, DEFAULT_CATEGORIES as GEN_CATEGORIES, DEFAULT_FEEDS as GEN_FEEDS, CURATED_LISTS as GEN_CURATED_LISTS } from '../constants/curatedFeeds';

// =============================================================================
// CONFIGURAÇÕES DE APARÊNCIA (Header, Content, Background)
// =============================================================================

/**
 * Configuração padrão do Header
 * Controla: Logo, título, posição, estilo visual do cabeçalho
 */
export const DEFAULT_HEADER_CONFIG: HeaderConfig = {
    style: 'default',           // 'default' | 'minimal' | 'centered' | 'transparent'
    position: 'floating',       // 'floating' | 'fixed' | 'sticky' | 'relative'
    height: 'compact',          // 'compact' | 'medium' | 'large'
    showTitle: false,           // Mostrar título no header
    showLogo: true,             // Mostrar logo no header
    customTitle: 'Personal News',
    logoUrl: null,              // URL do logo customizado
    logoSize: 'md',             // 'sm' | 'md' | 'lg' | 'xl'
    logoColorMode: 'original',  // 'original' | 'monochrome' | 'inverted'
    syncFavicon: true,          // Sincronizar favicon com logo
    backgroundOpacity: 60,      // Opacidade do fundo (0-100)
    blurIntensity: 'heavy',     // 'none' | 'light' | 'medium' | 'heavy'
    borderColor: '#ffffff',
    borderOpacity: 8,           // Opacidade da borda (0-100)
    categoryBackgroundColor: '#ffffff',
    categoryBackgroundOpacity: 3,
    bgColor: '#1F1F1F',
    bgOpacity: 0.6,
    blur: 20,
};

/**
 * Configuração padrão do Conteúdo
 * Controla: Exibição de autor, data, layout de artigos
 */
export const DEFAULT_CONTENT_CONFIG: ContentConfig = {
    showAuthor: true,           // Mostrar nome do autor
    showDate: true,             // Mostrar data de publicação
    showTime: false,            // Mostrar hora de publicação
    showTags: true,             // Mostrar tags/categorias
    layoutMode: INITIAL_APP_CONFIG.layout as ContentConfig['layoutMode'],       // Layout padrão dos artigos
    density: 'comfortable',     // 'compact' | 'comfortable' | 'spacious'
    paginationType: 'numbered', // 'numbered' | 'infinite' | 'load-more'
};
/**
 * Configurações de exibição de artigos
 */
export const DEFAULT_ARTICLE_LAYOUT = {
    topStoriesCount: 15 as 0 | 5 | 10 | 15 | 20,  // Quantidade de top stories
    showPublicationTime: true,   // Mostrar hora de publicação
    articlesPerPage: 21,         // Artigos por página (1 featured + 5 recent + 15 top)
    autoRefreshInterval: 15,     // Intervalo de atualização automática (minutos, 0 = desabilitado)
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
export const DEFAULT_WEATHER_CITY = INITIAL_APP_CONFIG.weatherCity;

/**
 * Configurações de performance
 */
export const DEFAULT_PERFORMANCE_CONFIG = {
    enabled: false,              // Monitoramento de performance (apenas em dev)
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
    weatherCity: 'personalnews_weather_city',
    searchHistory: 'searchHistory',
} as const;
