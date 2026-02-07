/**
 * ProxyTypes.ts
 * Type definitions for proxy configuration and management
 */

/**
 * Tipos de confiabilidade de proxy
 */
export type ProxyReliability = 'excellent' | 'good' | 'fair' | 'unstable';

/**
 * Tipos de velocidade de resposta
 */
export type ProxyResponseTime = 'fast' | 'moderate' | 'slow';

/**
 * Tipos de conteúdo que um proxy pode processar
 */
export type SupportedContentType = 'RSS' | 'HTML' | 'JSON' | 'XML' | 'Text';

/**
 * Origem da chave API (de onde foi carregada)
 */
export type ApiKeyOrigin = 'env.local' | 'localStorage' | 'manual' | 'not-configured';

/**
 * ID do proxy (para type safety)
 */
export type ProxyId =
  | 'local-proxy'
  | 'rss2json'
  | 'codetabs'
  | 'allorigins'
  | 'corsproxy-io'
  | 'whateverorigin'
  | 'cors-anywhere'
  | 'textproxy'
  | 'jina-reader';

/**
 * Informações sobre limites de taxa
 */
export interface ProxyRateLimits {
  /** Requisições por minuto sem API key */
  freeRpm?: number;
  /** Requisições por minuto com API key */
  paidRpm?: number;
  /** Requisições por dia */
  rpd?: number;
  /** Notas adicionais sobre rate limiting */
  notes?: string;
}

/**
 * Informações sobre free tier
 */
export interface ProxyFreeTier {
  /** Se o proxy oferece free tier */
  available: boolean;
  /** Limitações do free tier */
  limitations?: string[];
  /** Notas adicionais */
  notes?: string;
}

/**
 * Resultado de validação de API key
 */
export interface ApiKeyValidationResult {
  /** Se a chave é válida */
  valid: boolean;
  /** Mensagem de erro se inválida */
  error?: string;
}

/**
 * Status de uma chave API
 */
export interface ProxyApiKeyStatus {
  /** ID do proxy */
  proxyId: ProxyId;
  /** Nome do proxy */
  proxyName: string;
  /** Se a chave está configurada */
  hasKey: boolean;
  /** Se a chave é válida */
  isValid: boolean;
  /** Mensagem de erro se houver */
  error?: string;
  /** Variável de ambiente */
  envVar?: string;
}

/**
 * Resultado de teste de proxy
 */
export interface ProxyTestResult {
  /** Se o teste passou */
  success: boolean;
  /** Tempo de resposta em ms */
  responseTime?: number;
  /** Mensagem de erro se houver */
  error?: string;
}

/**
 * Avaliação de saúde do proxy
 */
export interface ProxyHealthAssessment {
  /** Score de saúde (0-100) */
  score: number;
  /** Recomendação de uso */
  recommendation: string;
}

/**
 * Informações completas de um proxy
 */
export interface ProxyInformation {
  /** ID único do proxy */
  id: ProxyId;
  /** Nome de exibição */
  name: string;
  /** Website oficial */
  website: string;
  /** Descrição do serviço */
  description: string;
  /** Se oferece suporte a API key */
  hasApiKey: boolean;
  /** Variável de ambiente para API key */
  apiKeyEnvVar?: string;
  /** URL para obter API key */
  apiKeyUrl?: string;
  /** Limites de taxa */
  rateLimits: ProxyRateLimits;
  /** Confiabilidade */
  reliability: ProxyReliability;
  /** Tempo de resposta */
  responseTime: ProxyResponseTime;
  /** Informações de free tier */
  freeTier: ProxyFreeTier;
  /** Recomendações de uso */
  recommendations: string[];
  /** Tipos de conteúdo que processa bem */
  bestFor: SupportedContentType[];
  /** Tags para filtro */
  tags: string[];
  /** Prioridade no fallback (menor = maior prioridade) */
  priority: number;
  /** Incluir na cadeia de fallback padrão */
  includeInFallback: boolean;
  /** Informação de saúde atualizada */
  health?: ProxyHealthAssessment;
  /** Status da chave API */
  apiKeyStatus?: ProxyApiKeyStatus;
}

/**
 * Estado de configuração de proxies
 */
export interface ProxyConfigurationState {
  /** Chaves API configuradas */
  apiKeys: {
    rss2json: string;
    corsproxy: string;
  };
  /** Erros de validação */
  validationErrors: Record<ProxyId, string>;
  /** Se está carregando configurações */
  isLoading: boolean;
}

/**
 * Resultado de operação em um proxy
 */
export interface ProxyOperationResult {
  /** Se a operação foi bem-sucedida */
  success: boolean;
  /** Mensagem ou dados retornados */
  message?: string;
  /** Dados adicionais */
  data?: unknown;
  /** Erro se houver */
  error?: string;
}

/**
 * Resumo de uso de proxies
 */
export interface ProxyUsageSummary {
  /** Número total de proxies */
  total: number;
  /** Proxies com API key configurada */
  withApiKey: number;
  /** Proxies saudáveis */
  healthy: number;
  /** Proxies desabilitados */
  disabled: number;
  /** Taxa média de sucesso */
  averageSuccessRate: number;
  /** Tempo médio de resposta */
  averageResponseTime: number;
}

/**
 * Categoria de proxies
 */
export type ProxyCategoryKey = 'development' | 'recommended' | 'withApiKeys' | 'fallback' | 'all';
