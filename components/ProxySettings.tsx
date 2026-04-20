import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  KeyRound,
  RefreshCw,
  Route,
} from "lucide-react";
import { PROXY_CONFIGS, getRecommendedProxyOrder } from "../config/proxyConfig";
import { useProxyConfig } from "../hooks/useProxyConfig";
import { useProxyDashboard } from "../hooks/useProxyDashboard";
import { ProxyManager, type ProxyTestResult } from "../services/proxyManager";

export interface ProxySettingsProps {
  detailed?: boolean;
  apiKeysOnly?: boolean;
  compact?: boolean;
}

const PANEL_CLASS =
  "rounded-[24px] bg-[rgb(var(--theme-manager-surface,var(--theme-surface-readable,var(--color-surface))))] p-5 shadow-[0_24px_52px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.025)]";
const MANAGER_TEXT_CLASS =
  "text-[rgb(var(--theme-manager-text,var(--theme-text-on-surface,var(--color-text))))]";
const MANAGER_TEXT_SECONDARY_CLASS =
  "text-[rgb(var(--theme-manager-text-secondary,var(--theme-text-secondary-on-surface,var(--color-textSecondary))))]";
const MANAGER_CHIP_CLASS =
  "rounded-full border border-[rgb(var(--color-border))]/14 bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--theme-manager-text-secondary,var(--theme-text-secondary-on-surface,var(--color-textSecondary))))] shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]";
const MANAGER_CARD_CLASS =
  "rounded-[20px] border border-[rgb(var(--color-border))]/14 bg-[rgb(var(--theme-manager-elevated,var(--theme-surface-elevated,var(--color-surface))))] p-4 shadow-[0_16px_34px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.03)]";
const MANAGER_LIST_CARD_CLASS =
  "rounded-[18px] border border-[rgb(var(--color-border))]/14 bg-[rgb(var(--theme-manager-elevated,var(--theme-surface-elevated,var(--color-surface))))] px-4 py-3 text-sm text-[rgb(var(--theme-manager-text,var(--theme-text-on-surface,var(--color-text))))] shadow-[0_14px_30px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.03)]";
const MANAGER_EXPANDABLE_CLASS =
  "rounded-[20px] border border-[rgb(var(--color-border))]/14 bg-[rgb(var(--theme-manager-elevated,var(--theme-surface-elevated,var(--color-surface))))] shadow-[0_18px_36px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.03)]";
const MANAGER_RESULT_CLASS =
  "mt-3 rounded-[16px] border border-[rgb(var(--color-border))]/12 bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] p-4 text-sm text-[rgb(var(--theme-manager-text,var(--theme-text-on-surface,var(--color-text))))] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]";

const originLabels: Record<string, string> = {
  "env.local": ".env.local",
  localStorage: "armazenada localmente",
  "migrated-localStorage": "migrada da chave legada",
  manual: "configurada manualmente",
  "not-configured": "não configurada",
};

const statusBadgeClass = (score: number) => {
  if (score >= 80) {
    return "border-[rgba(var(--color-success),0.22)] bg-[rgba(var(--color-success),0.12)] text-[rgb(var(--color-success))]";
  }
  if (score >= 45) {
    return "border-[rgba(var(--color-warning),0.24)] bg-[rgba(var(--color-warning),0.12)] text-[rgb(var(--color-warning))]";
  }
  return "border-[rgba(var(--color-error),0.22)] bg-[rgba(var(--color-error),0.12)] text-[rgb(var(--color-error))]";
};

const routeLabels: Record<ProxyTestResult["route"], string> = {
  "backend-health": "health check",
  "backend-fetch": "backend local",
  "client-proxy": "proxy em nuvem",
};

const formatDate = (value?: number) => {
  if (!value) return "Nunca";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

const getRuntimeRouteForProxy = (
  proxyId: string,
  proxyName: string,
  routes: ReturnType<typeof useProxyDashboard>["snapshot"]["routes"],
) => {
  if (proxyId === "local-proxy") {
    return routes.find((route) => route.routeKind === "local-backend");
  }

  return routes.find(
    (route) => route.routeKind === "proxy" && route.name === proxyName,
  );
};

export const ProxySettings: React.FC<ProxySettingsProps> = ({
  detailed = true,
  apiKeysOnly = false,
  compact = false,
}) => {
  const {
    apiKeys,
    validationErrors,
    isLoading,
    preferLocalProxy,
    setPreferLocalProxy,
    setProxyEnabled,
    setApiKey,
    clearApiKey,
    getApiKeyStatus,
    getAllProxiesStatus,
    testProxy,
  } = useProxyConfig();
  const { snapshot, refresh } = useProxyDashboard();
  const [expandedProxy, setExpandedProxy] = useState<string | null>(null);
  const [testingProxy, setTestingProxy] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, ProxyTestResult>
  >({});

  const displayedProxies = useMemo(() => {
    const all = getAllProxiesStatus();
    return apiKeysOnly ? all.filter((proxy) => proxy.hasApiKey) : all;
  }, [apiKeysOnly, getAllProxiesStatus]);

  const apiKeyStatuses = getApiKeyStatus();
  const missingApiKeys = snapshot.summary.missingApiKeys;
  const isLocalBackendRuntime = snapshot.backend.enabled;
  const isTauriRuntime =
    typeof window !== "undefined" &&
    (!!(window as Window & { __TAURI__?: unknown }).__TAURI__ ||
      !!(window as Window & { __TAURI_INTERNALS__?: unknown })
        .__TAURI_INTERNALS__);
  const localRuntimeLabel = isTauriRuntime ? "desktop" : "modo local";
  const displayedProxyIds = displayedProxies.map((proxy) => proxy.id);

  const handleTestProxy = async (proxyId: string) => {
    setTestingProxy(proxyId);
    try {
      const result = await testProxy(proxyId);
      setTestResults((prev) => ({
        ...prev,
        [proxyId]: result,
      }));
      await refresh();
    } finally {
      setTestingProxy(null);
    }
  };

  if (isLoading && !snapshot.routes.length) {
    return (
      <div className={PANEL_CLASS}>
        <p className={`text-sm ${MANAGER_TEXT_SECONDARY_CLASS}`}>
          Carregando configuração e saúde dos proxies...
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={PANEL_CLASS}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className={`text-base font-semibold ${MANAGER_TEXT_CLASS}`}>
              Rotas de fetch
            </h3>
            <p className={`mt-1 text-sm ${MANAGER_TEXT_SECONDARY_CLASS}`}>
              {snapshot.summary.healthyRoutes}/
              {Math.max(1, snapshot.summary.totalRoutes)} saudáveis,{" "}
              {snapshot.summary.successRate}% de sucesso na sessão.
            </p>
          </div>
          <div className={MANAGER_CHIP_CLASS}>
            {snapshot.summary.fallbackActive
              ? "fallback ativo"
              : isLocalBackendRuntime
                ? "backend local ativo"
                : "modo web"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className={PANEL_CLASS}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <h2 className={`text-xl font-semibold ${MANAGER_TEXT_CLASS}`}>
              Configuração de rotas e proxies
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={MANAGER_CHIP_CLASS}>
              {snapshot.summary.totalRoutes} rotas monitoradas
            </span>
            <span className={MANAGER_CHIP_CLASS}>
              {snapshot.summary.successRate}% de sucesso
            </span>
          </div>
        </div>

        <div className="mt-5 grid gap-3 xl:grid-cols-3">
          <div className={MANAGER_CARD_CLASS}>
            <p className={`text-[11px] uppercase tracking-[0.18em] ${MANAGER_TEXT_SECONDARY_CLASS}`}>
              Rota ativa
            </p>
            <p className={`mt-2 text-base font-semibold ${MANAGER_TEXT_CLASS}`}>
              {snapshot.summary.fallbackActive
                ? "Fallback em nuvem"
                : isLocalBackendRuntime
                  ? "Backend local"
                  : "Cliente / proxies"}
            </p>
            <p className={`mt-2 text-sm ${MANAGER_TEXT_SECONDARY_CLASS}`}>
              {snapshot.runtime.lastWarning ||
                (isLocalBackendRuntime && snapshot.backend.available
                  ? "Backend local disponível."
                  : "Sem alertas no momento.")}
            </p>
          </div>

          <div className={MANAGER_CARD_CLASS}>
            <p className={`text-[11px] uppercase tracking-[0.18em] ${MANAGER_TEXT_SECONDARY_CLASS}`}>
              Backend local
            </p>
            <p className={`mt-2 text-base font-semibold ${MANAGER_TEXT_CLASS}`}>
              {isLocalBackendRuntime
                ? snapshot.backend.available
                  ? "Ativo"
                  : "Indisponível"
                : "Não aplicável ao modo web"}
            </p>
            <p className={`mt-2 text-sm ${MANAGER_TEXT_SECONDARY_CLASS}`}>
              {snapshot.backend.error ||
                (isLocalBackendRuntime
                  ? `Requisições do ${localRuntimeLabel} passam pelo backend local.`
                  : "Modo cliente/proxy.")}
            </p>
          </div>

          <div className={MANAGER_CARD_CLASS}>
            <p className={`text-[11px] uppercase tracking-[0.18em] ${MANAGER_TEXT_SECONDARY_CLASS}`}>
              Chaves recomendadas
            </p>
            <p className={`mt-2 text-base font-semibold ${MANAGER_TEXT_CLASS}`}>
              {missingApiKeys.length > 0
                ? `${missingApiKeys.length} pendentes`
                : "Todas configuradas"}
            </p>
            <p className={`mt-2 text-sm ${MANAGER_TEXT_SECONDARY_CLASS}`}>
              {missingApiKeys.length > 0
                ? missingApiKeys.join(" • ")
                : "Todas disponíveis"}
            </p>
          </div>
        </div>
      </section>

      {isLocalBackendRuntime && missingApiKeys.length > 0 && (
        <section className="rounded-[22px] bg-[rgba(var(--color-warning),0.1)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-[rgb(var(--color-warning))]" />
            <div>
              <h3 className={`text-base font-semibold ${MANAGER_TEXT_CLASS}`}>
                Chaves pendentes
              </h3>
              <p className={`mt-2 text-sm ${MANAGER_TEXT_CLASS}`}>
                {missingApiKeys.join(" • ")}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className={PANEL_CLASS}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className={`text-base font-semibold ${MANAGER_TEXT_CLASS}`}>
              Preferência de rota local
            </h3>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-3 rounded-full border border-[rgb(var(--color-border))]/14 bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] px-4 py-2 text-sm font-medium text-[rgb(var(--theme-manager-text,var(--theme-text-on-surface,var(--color-text))))] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
            <input
              type="checkbox"
              checked={preferLocalProxy}
              onChange={(event) => setPreferLocalProxy(event.target.checked)}
              className="h-4 w-4 rounded border-[rgb(var(--color-border))]/18"
            />
            Preferir rota local
          </label>
        </div>
      </section>

      {!apiKeysOnly && (
        <section className={PANEL_CLASS}>
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-[rgb(var(--color-primary))]" />
            <h3 className={`text-base font-semibold ${MANAGER_TEXT_CLASS}`}>
              Chaves de API
            </h3>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {apiKeyStatuses.map((status) => {
              const config = PROXY_CONFIGS[status.proxyId];
              return (
                <div
                  key={status.proxyId}
                  className={MANAGER_CARD_CLASS}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className={`text-sm font-semibold ${MANAGER_TEXT_CLASS}`}>
                        {status.proxyName}
                      </h4>
                      <p className={`mt-1 text-xs ${MANAGER_TEXT_SECONDARY_CLASS}`}>
                        Origem:{" "}
                        {originLabels[status.origin || "not-configured"] ||
                          status.origin}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                        status.isValid
                          ? "border-[rgba(var(--color-success),0.22)] bg-[rgba(var(--color-success),0.12)] text-[rgb(var(--color-success))]"
                          : "border-[rgb(var(--color-border))]/18 bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] text-[rgb(var(--theme-manager-text-secondary,var(--theme-text-secondary-on-surface,var(--color-textSecondary))))]"
                      }`}
                    >
                      {status.hasKey ? "configurada" : "ausente"}
                    </span>
                  </div>

                  <input
                    type="password"
                    value={apiKeys[status.proxyId] || ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (!value) {
                        clearApiKey(status.proxyId);
                        return;
                      }
                      setApiKey(status.proxyId, value);
                    }}
                    placeholder={`Cole a chave de ${status.proxyName}`}
                    className="mt-4 w-full rounded-[14px] border border-[rgb(var(--color-border))]/18 bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] px-3 py-2 text-sm text-[rgb(var(--theme-manager-text,var(--theme-text-on-surface,var(--color-text))))] outline-none transition-all placeholder:text-[rgb(var(--theme-manager-text-secondary,var(--theme-text-secondary-on-surface,var(--color-textSecondary))))] focus:border-[rgba(var(--color-primary),0.35)]"
                  />

                  {validationErrors[status.proxyId] && (
                    <p className="mt-2 text-xs text-[rgb(var(--color-error))]">
                      {validationErrors[status.proxyId]}
                    </p>
                  )}

                  <div className={`mt-3 flex flex-wrap items-center gap-3 text-xs ${MANAGER_TEXT_SECONDARY_CLASS}`}>
                    <a
                      href={config.apiKeyUrl || config.website}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-[rgb(var(--color-primary))]"
                    >
                      Obter chave
                    </a>
                    {status.hasKey && (
                      <button
                        type="button"
                        onClick={() => clearApiKey(status.proxyId)}
                        className="font-semibold text-[rgb(var(--color-error))]"
                      >
                        Limpar chave
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {detailed && (
        <section className={PANEL_CLASS}>
          <div className="flex items-center gap-2">
            <Route className="h-5 w-5 text-[rgb(var(--color-primary))]" />
            <h3 className={`text-base font-semibold ${MANAGER_TEXT_CLASS}`}>
              Ordem de fallback recomendada
            </h3>
          </div>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {getRecommendedProxyOrder({
              rss2json: !!apiKeys.rss2json,
              corsproxy: !!apiKeys["corsproxy-io"],
            })
              .filter((proxyId) => displayedProxyIds.includes(proxyId))
              .map((proxyId, index) => (
                <li
                  key={proxyId}
                  className={MANAGER_LIST_CARD_CLASS}
                >
                  <span className={`mr-2 ${MANAGER_TEXT_SECONDARY_CLASS}`}>
                    {index + 1}.
                  </span>
                  {PROXY_CONFIGS[proxyId].name}
                </li>
              ))}
          </ol>
        </section>
      )}

      {detailed && (
        <section className={PANEL_CLASS}>
          <h3 className={`text-base font-semibold ${MANAGER_TEXT_CLASS}`}>
            Testes reais e saúde por rota
          </h3>
          <div className="mt-4 space-y-3">
            {displayedProxies.map((proxy) => {
              const isExpanded = expandedProxy === proxy.id;
              const result = testResults[proxy.id];
              const runtimeRoute = getRuntimeRouteForProxy(
                proxy.id,
                proxy.name,
                snapshot.routes,
              );
              const canDisableProxy = ProxyManager.canDisableRuntimeProxy(
                proxy.name,
              );

              return (
                <div
                  key={proxy.id}
                  className={MANAGER_EXPANDABLE_CLASS}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedProxy((current) =>
                        current === proxy.id ? null : proxy.id,
                      )
                    }
                    className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-sm font-semibold ${MANAGER_TEXT_CLASS}`}>
                          {proxy.name}
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${statusBadgeClass(
                            runtimeRoute?.healthScore ?? proxy.health.score,
                          )}`}
                        >
                          saúde{" "}
                          {runtimeRoute?.healthScore ?? proxy.health.score}%
                        </span>
                        {proxy.apiKeyStatus?.hasKey && (
                          <span className="rounded-full border border-[rgba(var(--color-success),0.22)] bg-[rgba(var(--color-success),0.12)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--color-success))]">
                            api key
                          </span>
                        )}
                        {!proxy.enabled && (
                          <span className="rounded-full border border-[rgba(var(--color-warning),0.24)] bg-[rgba(var(--color-warning),0.12)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--color-warning))]">
                            desativado
                          </span>
                        )}
                      </div>
                      <p className={`mt-1 text-xs ${MANAGER_TEXT_SECONDARY_CLASS}`}>
                        {runtimeRoute?.detail ||
                          PROXY_CONFIGS[proxy.id].description}
                      </p>
                    </div>
                    {isExpanded ? (
                        <ChevronDown className={`h-4 w-4 ${MANAGER_TEXT_SECONDARY_CLASS}`} />
                      ) : (
                        <ChevronRight className={`h-4 w-4 ${MANAGER_TEXT_SECONDARY_CLASS}`} />
                      )}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1">
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div>
                          <p className={`text-[11px] uppercase tracking-[0.14em] ${MANAGER_TEXT_SECONDARY_CLASS}`}>
                            Configuração
                          </p>
                          <p className={`mt-1 text-sm font-semibold ${MANAGER_TEXT_CLASS}`}>
                            {proxy.isConfigured ? "pronta" : "incompleta"}
                          </p>
                        </div>
                        <div>
                          <p className={`text-[11px] uppercase tracking-[0.14em] ${MANAGER_TEXT_SECONDARY_CLASS}`}>
                            Último uso
                          </p>
                          <p className={`mt-1 text-sm font-semibold ${MANAGER_TEXT_CLASS}`}>
                            {formatDate(runtimeRoute?.lastUsedAt)}
                          </p>
                        </div>
                        <div>
                          <p className={`text-[11px] uppercase tracking-[0.14em] ${MANAGER_TEXT_SECONDARY_CLASS}`}>
                            Sessão
                          </p>
                          <p className={`mt-1 text-sm font-semibold ${MANAGER_TEXT_CLASS}`}>
                            {runtimeRoute?.totalRequests || 0} requisições
                          </p>
                        </div>
                        <div>
                          <p className={`text-[11px] uppercase tracking-[0.14em] ${MANAGER_TEXT_SECONDARY_CLASS}`}>
                            Latência média
                          </p>
                          <p className={`mt-1 text-sm font-semibold ${MANAGER_TEXT_CLASS}`}>
                            {runtimeRoute?.avgResponseTime
                              ? `${Math.round(runtimeRoute.avgResponseTime)}ms`
                              : "—"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setProxyEnabled(proxy.id, !proxy.enabled)}
                          disabled={!canDisableProxy}
                          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                            !canDisableProxy
                              ? "cursor-not-allowed border-[rgb(var(--color-border))]/18 bg-[rgba(var(--color-text),0.06)] text-[rgb(var(--theme-manager-text-secondary,var(--theme-text-secondary-on-surface,var(--color-textSecondary))))]"
                              : proxy.enabled
                              ? "border-[rgba(var(--color-warning),0.24)] bg-[rgba(var(--color-warning),0.12)] text-[rgb(var(--color-warning))] hover:bg-[rgba(var(--color-warning),0.18)]"
                              : "border-[rgba(var(--color-success),0.24)] bg-[rgba(var(--color-success),0.12)] text-[rgb(var(--color-success))] hover:bg-[rgba(var(--color-success),0.18)]"
                          }`}
                        >
                          <Route className="h-4 w-4" />
                          {!canDisableProxy
                            ? "Sempre ativo no modo web"
                            : proxy.enabled
                              ? "Desativar rota"
                              : "Reativar rota"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleTestProxy(proxy.id)}
                          disabled={testingProxy === proxy.id || !proxy.enabled}
                          className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--color-primary),0.28)] bg-[rgba(var(--color-primary),0.12)] px-4 py-2 text-sm font-semibold text-[rgb(var(--color-primary))] transition-all hover:bg-[rgba(var(--color-primary),0.18)] disabled:cursor-wait disabled:opacity-70"
                        >
                          <RefreshCw
                            className={`h-4 w-4 ${
                              testingProxy === proxy.id ? "animate-spin" : ""
                            }`}
                          />
                          {testingProxy === proxy.id
                            ? "Testando..."
                            : "Executar teste real"}
                        </button>
                        {result && (
                          <span
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                              result.success
                                ? "border-[rgba(var(--color-success),0.22)] bg-[rgba(var(--color-success),0.12)] text-[rgb(var(--color-success))]"
                                : "border-[rgba(var(--color-error),0.22)] bg-[rgba(var(--color-error),0.12)] text-[rgb(var(--color-error))]"
                            }`}
                          >
                            {result.success
                              ? "teste concluído"
                              : "teste falhou"}{" "}
                            • {routeLabels[result.route]}
                          </span>
                        )}
                      </div>

                      {result && (
                        <div className={MANAGER_RESULT_CLASS}>
                          <div className="flex items-start gap-3">
                            {result.success ? (
                              <CheckCircle2 className="mt-0.5 h-5 w-5 text-[rgb(var(--color-success))]" />
                            ) : (
                              <AlertCircle className="mt-0.5 h-5 w-5 text-[rgb(var(--color-error))]" />
                            )}
                            <div className="space-y-1">
                              <p>{result.detail}</p>
                              <p className={`text-xs ${MANAGER_TEXT_SECONDARY_CLASS}`}>
                                Latência medida:{" "}
                                {Math.round(result.responseTime)}ms
                                {result.error ? ` • erro: ${result.error}` : ""}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProxySettings;
