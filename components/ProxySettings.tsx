/**
 * ProxySettings.tsx
 *
 * Component for displaying and configuring proxy settings
 * Shows available proxies, API key validation, health status, and recommendations
 */

import React, { useState, useMemo } from 'react';
import { useProxyConfig, useProxyStats } from '../hooks/useProxyConfig';
import { PROXY_CONFIGS, getRecommendedProxyOrder } from '../config/proxyConfig';
import styles from '../styles/ProxySettings.module.css';

export interface ProxySettingsProps {
  /** Show detailed information */
  detailed?: boolean;
  /** Show only proxies with API keys */
  apiKeysOnly?: boolean;
  /** Compact view (minimal details) */
  compact?: boolean;
}

/**
 * Proxy Settings Panel Component
 */
export const ProxySettings: React.FC<ProxySettingsProps> = ({
  detailed = true,
  apiKeysOnly = false,
  compact = false,
}) => {
  const {
    apiKeys,
    validationErrors,
    isLoading,
    setApiKey,
    clearApiKey,
    getApiKeyStatus,
    getAllProxiesStatus,
    testProxy,
  } = useProxyConfig();

  const { stats: overallStats, proxyStats } = useProxyStats();
  const [testingProxy, setTestingProxy] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [expandedProxy, setExpandedProxy] = useState<string | null>(null);

  // Filter proxies based on settings
  const displayedProxies = useMemo(() => {
    const statuses = getAllProxiesStatus();
    return apiKeysOnly
      ? statuses.filter((p) => p.hasApiKey)
      : statuses;
  }, [getAllProxiesStatus, apiKeysOnly]);

  const handleTestProxy = async (proxyId: string) => {
    setTestingProxy(proxyId);
    try {
      const result = await testProxy(proxyId);
      setTestResults((prev) => ({
        ...prev,
        [proxyId]: result.success,
      }));
    } finally {
      setTestingProxy(null);
    }
  };

  const handleApiKeyChange = (proxyId: string, value: string) => {
    if (value === '') {
      clearApiKey(proxyId);
    } else {
      setApiKey(proxyId, value);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <p>Carregando configurações de proxy...</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={styles.compactContainer}>
        <h3>Status dos Proxies</h3>
        <div className={styles.stats}>
          <div>
            <strong>Total:</strong> {overallStats.totalProxies}
          </div>
          <div>
            <strong>Saudáveis:</strong> {overallStats.healthyProxies}
          </div>
          <div>
            <strong>Requisições:</strong> {overallStats.totalRequests}
          </div>
          <div>
            <strong>Taxa de sucesso:</strong>{' '}
            {overallStats.totalRequests > 0
              ? Math.round(
                  (overallStats.totalSuccesses / overallStats.totalRequests) *
                    100
                )
              : 0}
            %
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${detailed ? styles.detailed : ''}`}>
      <div className={styles.header}>
        <h2>Configuração de Proxies CORS</h2>
        <p>
          A aplicação usa múltiplos proxies em um chain de fallback para máxima
          confiabilidade e desempenho.
        </p>
      </div>

      {/* Overall Statistics */}
      <section className={styles.section}>
        <h3>Estatísticas Gerais</h3>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{overallStats.totalProxies}</div>
            <div className={styles.statLabel}>Proxies Disponíveis</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{overallStats.healthyProxies}</div>
            <div className={styles.statLabel}>Saudáveis</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{overallStats.totalRequests}</div>
            <div className={styles.statLabel}>Requisições Totais</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {overallStats.totalRequests > 0
                ? Math.round(
                    (overallStats.totalSuccesses / overallStats.totalRequests) *
                      100
                  )
                : 0}
              %
            </div>
            <div className={styles.statLabel}>Taxa de Sucesso</div>
          </div>
        </div>
      </section>

      {/* Recommended Proxy Order */}
      {detailed && (
        <section className={styles.section}>
          <h3>Ordem Recomendada de Fallback</h3>
          <p className={styles.sectionDescription}>
            Os proxies são tentados nesta ordem até que um funcione corretamente.
          </p>
          <ol className={styles.proxyOrder}>
            {getRecommendedProxyOrder({
              rss2json: !!apiKeys.rss2json,
              corsproxy: !!apiKeys.corsproxy,
            }).map((proxyId) => {
              const config = PROXY_CONFIGS[proxyId];
              return (
                <li key={proxyId}>
                  <span className={styles.proxyName}>{config.name}</span>
                  {apiKeys[proxyId as keyof typeof apiKeys] && (
                    <span className={styles.badge}>API Key ✓</span>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* Proxies with API Keys */}
      {!apiKeysOnly && (
        <section className={styles.section}>
          <h3>Proxies com Chaves API</h3>
          <p className={styles.sectionDescription}>
            Configure chaves API para aumentar limites de taxa e melhorar
            confiabilidade.
          </p>
          <div className={styles.apiKeysGrid}>
            {getApiKeyStatus().map((status) => {
              const config = PROXY_CONFIGS[status.proxyId];
              return (
                <div key={status.proxyId} className={styles.apiKeyCard}>
                  <div className={styles.apiKeyHeader}>
                    <div>
                      <h4>{status.proxyName}</h4>
                      <p className={styles.website}>
                        <a
                          href={config.apiKeyUrl || config.website}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Obter chave
                        </a>
                      </p>
                    </div>
                    <div
                      className={`${styles.badge} ${
                        status.isValid
                          ? styles.badgeSuccess
                          : styles.badgeNeutral
                      }`}
                    >
                      {status.hasKey ? '✓ Configurada' : 'Não configurada'}
                    </div>
                  </div>

                  <input
                    type="password"
                    value={apiKeys[status.proxyId as keyof typeof apiKeys] || ''}
                    onChange={(e) =>
                      handleApiKeyChange(status.proxyId, e.target.value)
                    }
                    placeholder="Cole sua chave API aqui"
                    className={`${styles.apiKeyInput} ${
                      validationErrors[status.proxyId]
                        ? styles.inputError
                        : ''
                    }`}
                  />

                  {validationErrors[status.proxyId] && (
                    <div className={styles.errorMessage}>
                      {validationErrors[status.proxyId]}
                    </div>
                  )}

                  {status.hasKey && (
                    <button
                      onClick={() => clearApiKey(status.proxyId)}
                      className={styles.clearButton}
                    >
                      Limpar Chave
                    </button>
                  )}

                  {detailed && config.rateLimits && (
                    <div className={styles.rateLimits}>
                      <strong>Limites:</strong>
                      <ul>
                        {config.rateLimits.freeRpm && (
                          <li>Sem chave: {config.rateLimits.freeRpm} req/min</li>
                        )}
                        {config.rateLimits.paidRpm && (
                          <li>
                            Com chave: {config.rateLimits.paidRpm} req/min
                          </li>
                        )}
                        {config.rateLimits.notes && (
                          <li>{config.rateLimits.notes}</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* All Proxies Status */}
      {detailed && (
        <section className={styles.section}>
          <h3>Status de Todos os Proxies</h3>
          <div className={styles.proxiesTable}>
            {displayedProxies.map((proxy) => {
              const stats = proxyStats[proxy.name];
              const isExpanded = expandedProxy === proxy.id;

              return (
                <div
                  key={proxy.id}
                  className={`${styles.proxyItem} ${
                    proxy.apiKeyStatus?.isValid
                      ? styles.proxyWithKey
                      : ''
                  }`}
                >
                  <div
                    className={styles.proxyItemHeader}
                    onClick={() =>
                      setExpandedProxy(
                        isExpanded ? null : proxy.id
                      )
                    }
                  >
                    <div className={styles.proxyNameSection}>
                      <span className={styles.proxyName}>{proxy.name}</span>
                      <span
                        className={`${styles.healthBadge} ${
                          proxy.health.score >= 80
                            ? styles.badgeSuccess
                            : proxy.health.score >= 60
                              ? styles.badgeWarning
                              : styles.badgeDanger
                        }`}
                      >
                        Saúde: {proxy.health.score}%
                      </span>
                      {proxy.apiKeyStatus?.isValid && (
                        <span className={styles.badge}>API Key ✓</span>
                      )}
                    </div>
                    <div className={styles.expandIcon}>
                      {isExpanded ? '▼' : '▶'}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className={styles.proxyDetails}>
                      <p>{PROXY_CONFIGS[proxy.id].description}</p>

                      {stats && (
                        <div className={styles.statsDetail}>
                          <div className={styles.statLine}>
                            <span>Taxa de sucesso:</span>
                            <strong>
                              {stats.totalRequests > 0
                                ? Math.round(
                                    (stats.success /
                                      stats.totalRequests) *
                                      100
                                  )
                                : 0}
                              %
                            </strong>
                          </div>
                          <div className={styles.statLine}>
                            <span>Requisições:</span>
                            <strong>{stats.totalRequests}</strong>
                          </div>
                          <div className={styles.statLine}>
                            <span>Tempo médio:</span>
                            <strong>
                              {Math.round(stats.avgResponseTime)}ms
                            </strong>
                          </div>
                          <div className={styles.statLine}>
                            <span>Falhas consecutivas:</span>
                            <strong>{stats.consecutiveFailures}</strong>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => handleTestProxy(proxy.id)}
                        disabled={testingProxy === proxy.id}
                        className={styles.testButton}
                      >
                        {testingProxy === proxy.id
                          ? 'Testando...'
                          : 'Testar Proxy'}
                      </button>

                      {testResults[proxy.id] !== undefined && (
                        <div
                          className={`${styles.testResult} ${
                            testResults[proxy.id]
                              ? styles.testSuccess
                              : styles.testFailure
                          }`}
                        >
                          {testResults[proxy.id]
                            ? '✓ Proxy está funcionando'
                            : '✗ Proxy não respondeu'}
                        </div>
                      )}

                      <div className={styles.tags}>
                        {PROXY_CONFIGS[proxy.id].tags.map((tag) => (
                          <span key={tag} className={styles.tag}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Help Section */}
      {detailed && (
        <section className={styles.section}>
          <h3>Como Usar</h3>
          <div className={styles.helpContent}>
            <ol>
              <li>
                <strong>Obtenha uma chave API gratuita para RSS2JSON:</strong>
                <br />
                Visite{' '}
                <a
                  href="https://rss2json.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  rss2json.com
                </a>{' '}
                e registre-se para obter uma chave gratuita que oferece 1000
                requisições por dia (vs. 30 sem chave).
              </li>
              <li>
                <strong>Configure sua chave API:</strong>
                <br />
                Cole sua chave no campo acima. A chave é salva localmente em
                seu navegador.
              </li>
              <li>
                <strong>Cole no arquivo .env.local:</strong>
                <br />
                Para ambiente de produção, copie sua chave para{' '}
                <code>.env.local</code>:
                <br />
                <code>VITE_RSS2JSON_API_KEY=sua-chave-aqui</code>
              </li>
              <li>
                <strong>Aproveite melhor desempenho:</strong>
                <br />
                Com a chave API, seus feeds serão atualizados mais rapidamente
                e com maior confiabilidade.
              </li>
            </ol>
          </div>
        </section>
      )}
    </div>
  );
};

export default ProxySettings;
