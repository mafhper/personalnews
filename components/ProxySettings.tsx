import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  KeyRound,
  RefreshCw,
  Route,
} from "lucide-react";
import { PROXY_CONFIGS } from "../config/proxyConfig";
import { useProxyConfig } from "../hooks/useProxyConfig";
import {
  useProxyDashboard,
  type ProxyDashboardRoute,
  type ProxyDashboardSnapshot,
} from "../hooks/useProxyDashboard";
import { ProxyManager, type ProxyTestResult } from "../services/proxyManager";

export interface ProxySettingsProps {
  detailed?: boolean;
  apiKeysOnly?: boolean;
  compact?: boolean;
  embedded?: boolean;
  snapshot?: ProxyDashboardSnapshot;
  onRefresh?: () => void | Promise<void>;
}

const PANEL_CLASS =
  "rounded-[24px] bg-[rgb(var(--theme-manager-surface,var(--theme-surface-readable,var(--color-surface))))] p-5 shadow-[0_24px_52px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.025)]";
const EMBEDDED_PANEL_CLASS =
  "rounded-[18px] border border-[rgb(var(--color-border))]/12 bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]";
const MANAGER_TEXT_CLASS =
  "text-[rgb(var(--theme-manager-text,var(--theme-text-on-surface,var(--color-text))))]";
const MANAGER_TEXT_SECONDARY_CLASS =
  "text-[rgb(var(--theme-manager-text-secondary,var(--theme-text-secondary-on-surface,var(--color-textSecondary))))]";
const MANAGER_CHIP_CLASS =
  "rounded-full border border-[rgb(var(--color-border))]/14 bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--theme-manager-text-secondary,var(--theme-text-secondary-on-surface,var(--color-textSecondary))))] shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]";
const MANAGER_CARD_CLASS =
  "rounded-[20px] border border-[rgb(var(--color-border))]/14 bg-[rgb(var(--theme-manager-elevated,var(--theme-surface-elevated,var(--color-surface))))] p-4 shadow-[0_16px_34px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.03)]";
const MANAGER_EXPANDABLE_CLASS =
  "rounded-[20px] border border-[rgb(var(--color-border))]/14 bg-[rgb(var(--theme-manager-elevated,var(--theme-surface-elevated,var(--color-surface))))] shadow-[0_18px_36px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.03)]";
const MANAGER_EXPANDABLE_DISABLED_CLASS =
  "rounded-[20px] border border-[rgb(var(--color-border))]/10 bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] opacity-60 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]";
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

const routeStatusLabel: Record<ProxyDashboardRoute["status"], string> = {
  healthy: "saudável",
  degraded: "atenção",
  offline: "fora do ar",
  idle: "sem uso",
  disabled: "desativado",
};

const routeLabels: Record<ProxyTestResult["route"], string> = {
  "backend-health": "health check",
  "backend-fetch": "backend local",
  "client-proxy": "proxy em nuvem",
};

const formatRuntimeNotice = (
  runtime: ReturnType<typeof useProxyDashboard>["snapshot"]["runtime"],
) => {
  if (runtime.warningDetails) {
    return (
      runtime.warningDetails.warning ||
      `${runtime.warningDetails.summary}. ${runtime.warningDetails.action}`
    );
  }

  if (!runtime.lastWarning) return undefined;

  try {
    const parsed = JSON.parse(runtime.lastWarning) as {
      summary?: string;
      action?: string;
      warning?: string;
    };
    return (
      parsed.warning ||
      [parsed.summary, parsed.action].filter(Boolean).join(". ")
    );
  } catch {
    return runtime.lastWarning;
  }
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

const formatMetric = (value: number | null | undefined, suffix = "") => {
  if (value === null || value === undefined || value <= 0) return "—";
  return `${Math.round(value)}${suffix}`;
};

export const ProxySettings: React.FC<ProxySettingsProps> = ({
  detailed = true,
  apiKeysOnly = false,
  compact = false,
  embedded = false,
  snapshot: providedSnapshot,
  onRefresh,
}) => {
  const {
    apiKeys,
    validationErrors,
    isLoading,
    setProxyEnabled,
    setApiKey,
    clearApiKey,
    getAllProxiesStatus,
    testProxy,
  } = useProxyConfig();
  const dashboard = useProxyDashboard({ enabled: !providedSnapshot });
  const snapshot = providedSnapshot ?? dashboard.snapshot;
  const refresh = onRefresh ?? dashboard.refresh;
  const [expandedProxy, setExpandedProxy] = useState<string | null>(
    "local-proxy",
  );
  const userSelectedProxyRef = useRef(false);
  const [testingProxy, setTestingProxy] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, ProxyTestResult>
  >({});

  const displayedProxies = useMemo(() => {
    const all = getAllProxiesStatus();
    const filtered = apiKeysOnly ? all.filter((proxy) => proxy.hasApiKey) : all;

    return filtered
      .map((proxy) => ({
        proxy,
        runtimeRoute: getRuntimeRouteForProxy(
          proxy.id,
          proxy.name,
          snapshot.routes,
        ),
      }))
      .sort((a, b) => {
        const disabledA = !a.proxy.enabled || a.runtimeRoute?.status === "disabled";
        const disabledB = !b.proxy.enabled || b.runtimeRoute?.status === "disabled";
        if (disabledA !== disabledB) return disabledA ? 1 : -1;

        const scoreA = a.runtimeRoute?.healthScore ?? a.proxy.health.score;
        const scoreB = b.runtimeRoute?.healthScore ?? b.proxy.health.score;
        if (scoreA !== scoreB) return scoreA - scoreB;

        if (a.proxy.id === "local-proxy") return -1;
        if (b.proxy.id === "local-proxy") return 1;
        return a.proxy.name.localeCompare(b.proxy.name);
      })
      .map((item) => item.proxy);
  }, [apiKeysOnly, getAllProxiesStatus, snapshot.routes]);

  const isLocalBackendRuntime = snapshot.backend.enabled;
  const isTauriRuntime =
    typeof window !== "undefined" &&
    (!!(window as Window & { __TAURI__?: unknown }).__TAURI__ ||
      !!(window as Window & { __TAURI_INTERNALS__?: unknown })
        .__TAURI_INTERNALS__);
  const localRuntimeLabel = isTauriRuntime ? "desktop" : "modo local";
  const panelClass = embedded ? EMBEDDED_PANEL_CLASS : PANEL_CLASS;

  useEffect(() => {
    if (!detailed) return;
    if (userSelectedProxyRef.current) {
      const stillDisplayed = displayedProxies.some(
        (proxy) => proxy.id === expandedProxy,
      );
      if (stillDisplayed || expandedProxy === null) return;
      userSelectedProxyRef.current = false;
    }

    const currentProxy = displayedProxies.find(
      (proxy) => proxy.id === expandedProxy,
    );
    if (currentProxy?.enabled) return;

    const firstActionable =
      displayedProxies.find((proxy) => {
        const route = getRuntimeRouteForProxy(proxy.id, proxy.name, snapshot.routes);
        return (
          proxy.enabled &&
          (route?.status === "offline" ||
            route?.status === "degraded" ||
            route?.consecutiveFailures)
        );
      }) || displayedProxies.find((proxy) => proxy.enabled);

    setExpandedProxy(firstActionable?.id || displayedProxies[0]?.id || null);
  }, [detailed, displayedProxies, expandedProxy, snapshot.routes]);

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
      <div className={panelClass}>
        <p className={`text-sm ${MANAGER_TEXT_SECONDARY_CLASS}`}>
          Carregando configuração e saúde dos proxies...
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={panelClass}>
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
    <div className={embedded ? "" : "space-y-5"}>
      {!embedded && (
        <section className={panelClass}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <h2 className={`text-xl font-semibold ${MANAGER_TEXT_CLASS}`}>
                Controle de rotas e proxies
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={MANAGER_CHIP_CLASS}>
                {snapshot.summary.totalRoutes} rotas monitoradas
              </span>
              <span className={MANAGER_CHIP_CLASS}>
                {snapshot.summary.successRate}% de sucesso
              </span>
              <button
                type="button"
                onClick={() => void refresh()}
                className="rounded-full border border-[rgba(var(--color-primary),0.22)] bg-[rgba(var(--color-primary),0.1)] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--color-primary))] transition hover:bg-[rgba(var(--color-primary),0.16)]"
              >
                Atualizar rotas
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 xl:grid-cols-2">
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
              {formatRuntimeNotice(snapshot.runtime) ||
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
        </div>
      </section>
      )}

      {detailed && (
        <section className={embedded ? "" : panelClass}>
          {!embedded && (
            <h3 className={`text-base font-semibold ${MANAGER_TEXT_CLASS}`}>
              Rotas
            </h3>
          )}
          <div className={embedded ? "space-y-3" : "mt-4 space-y-3"}>
            {displayedProxies.map((proxy) => {
              const isExpanded = expandedProxy === proxy.id;
              const result = testResults[proxy.id];
              const proxyConfig = PROXY_CONFIGS[proxy.id];
              const apiKeyStatus = proxy.apiKeyStatus;
              const runtimeRoute = getRuntimeRouteForProxy(
                proxy.id,
                proxy.name,
                snapshot.routes,
              );
              const canDisableProxy = ProxyManager.canDisableRuntimeProxy(
                proxy.name,
              );
              const isDisabled =
                !proxy.enabled || runtimeRoute?.status === "disabled";
              const healthScore =
                runtimeRoute?.healthScore ?? proxy.health.score;
              const statusLabel =
                routeStatusLabel[runtimeRoute?.status || "idle"] ||
                (isDisabled ? "desativado" : "sem uso");

              return (
                <div
                  key={proxy.id}
                  className={
                    isDisabled
                      ? MANAGER_EXPANDABLE_DISABLED_CLASS
                      : MANAGER_EXPANDABLE_CLASS
                  }
                >
                  <button
                    type="button"
                    onClick={() => {
                      userSelectedProxyRef.current = true;
                      setExpandedProxy((current) =>
                        current === proxy.id ? null : proxy.id,
                      );
                    }}
                    className="flex w-full flex-col gap-4 px-4 py-4 text-left md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0 flex-1">
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
                          {healthScore}%
                        </span>
                        {proxy.hasApiKey && (
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                              apiKeyStatus?.hasKey
                                ? "border-[rgba(var(--color-success),0.22)] bg-[rgba(var(--color-success),0.12)] text-[rgb(var(--color-success))]"
                                : "border-[rgb(var(--color-border))]/18 bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] text-[rgb(var(--theme-manager-text-secondary,var(--theme-text-secondary-on-surface,var(--color-textSecondary))))]"
                            }`}
                          >
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
                          proxyConfig.description}
                      </p>
                    </div>

                    <div className="grid w-full grid-cols-2 gap-3 text-left sm:grid-cols-4 md:w-[31rem]">
                      <RouteMetric label="Status" value={statusLabel} />
                      <RouteMetric
                        label="Sucesso"
                        value={
                          runtimeRoute?.successRate === null
                            ? "—"
                            : `${runtimeRoute?.successRate ?? 0}%`
                        }
                      />
                      <RouteMetric
                        label="Latência"
                        value={formatMetric(runtimeRoute?.avgResponseTime, "ms")}
                      />
                      <RouteMetric
                        label="Último uso"
                        value={formatDate(runtimeRoute?.lastUsedAt)}
                      />
                    </div>

                    <span className="shrink-0 self-end md:self-center">
                      {isExpanded ? (
                        <ChevronDown className={`h-4 w-4 ${MANAGER_TEXT_SECONDARY_CLASS}`} />
                      ) : (
                        <ChevronRight className={`h-4 w-4 ${MANAGER_TEXT_SECONDARY_CLASS}`} />
                      )}
                    </span>
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
                            Requisições
                          </p>
                          <p className={`mt-1 text-sm font-semibold ${MANAGER_TEXT_CLASS}`}>
                            {runtimeRoute?.totalRequests || 0}
                          </p>
                        </div>
                        <div>
                          <p className={`text-[11px] uppercase tracking-[0.14em] ${MANAGER_TEXT_SECONDARY_CLASS}`}>
                            Falhas seguidas
                          </p>
                          <p className={`mt-1 text-sm font-semibold ${MANAGER_TEXT_CLASS}`}>
                            {runtimeRoute?.consecutiveFailures || 0}
                          </p>
                        </div>
                        <div>
                          <p className={`text-[11px] uppercase tracking-[0.14em] ${MANAGER_TEXT_SECONDARY_CLASS}`}>
                            Transporte
                          </p>
                          <p className={`mt-1 text-sm font-semibold ${MANAGER_TEXT_CLASS}`}>
                            {runtimeRoute?.transport === "desktop-backend"
                              ? "desktop"
                              : "cloud"}
                          </p>
                        </div>
                      </div>

                      {proxy.hasApiKey && apiKeyStatus && (
                        <div className="mt-4 rounded-[16px] border border-[rgb(var(--color-border))]/14 bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] p-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-start gap-2">
                              <KeyRound className="mt-0.5 h-4 w-4 text-[rgb(var(--color-primary))]" />
                              <div>
                                <p className={`text-sm font-semibold ${MANAGER_TEXT_CLASS}`}>
                                  Chave de API
                                </p>
                                <p className={`mt-1 text-xs ${MANAGER_TEXT_SECONDARY_CLASS}`}>
                                  Origem:{" "}
                                  {originLabels[
                                    apiKeyStatus.origin || "not-configured"
                                  ] || apiKeyStatus.origin}
                                </p>
                              </div>
                            </div>
                            {apiKeyStatus.hasKey && (
                              <span className="rounded-full border border-[rgba(var(--color-success),0.22)] bg-[rgba(var(--color-success),0.12)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--color-success))]">
                                configurada
                              </span>
                            )}
                          </div>

                          <input
                            type="password"
                            value={apiKeys[apiKeyStatus.proxyId] || ""}
                            onChange={(event) => {
                              const value = event.target.value;
                              if (!value) {
                                clearApiKey(apiKeyStatus.proxyId);
                                return;
                              }
                              setApiKey(apiKeyStatus.proxyId, value);
                            }}
                            placeholder={`Cole a chave de ${apiKeyStatus.proxyName}`}
                            className="mt-3 w-full rounded-[14px] border border-[rgb(var(--color-border))]/18 bg-[rgb(var(--theme-manager-elevated,var(--theme-surface-elevated,var(--color-surface))))] px-3 py-2 text-sm text-[rgb(var(--theme-manager-text,var(--theme-text-on-surface,var(--color-text))))] outline-none transition-all placeholder:text-[rgb(var(--theme-manager-text-secondary,var(--theme-text-secondary-on-surface,var(--color-textSecondary))))] focus:border-[rgba(var(--color-primary),0.35)]"
                          />

                          {validationErrors[apiKeyStatus.proxyId] && (
                            <p className="mt-2 text-xs text-[rgb(var(--color-error))]">
                              {validationErrors[apiKeyStatus.proxyId]}
                            </p>
                          )}

                          <div className={`mt-3 flex flex-wrap items-center gap-3 text-xs ${MANAGER_TEXT_SECONDARY_CLASS}`}>
                            <a
                              href={proxyConfig.apiKeyUrl || proxyConfig.website}
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-[rgb(var(--color-primary))]"
                            >
                              Obter chave
                            </a>
                            {apiKeyStatus.hasKey && (
                              <button
                                type="button"
                                onClick={() => clearApiKey(apiKeyStatus.proxyId)}
                                className="font-semibold text-[rgb(var(--color-error))]"
                              >
                                Limpar chave
                              </button>
                            )}
                          </div>
                        </div>
                      )}

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

const RouteMetric: React.FC<{
  label: string;
  value: React.ReactNode;
}> = ({ label, value }) => (
  <div className="min-w-0 rounded-[14px] bg-[rgb(var(--theme-manager-control,var(--theme-control-bg,var(--color-surface))))] px-3 py-2">
    <p className="truncate text-[10px] font-black uppercase tracking-[0.14em] text-[rgb(var(--theme-manager-text-secondary,var(--theme-text-secondary-on-surface,var(--color-textSecondary))))] opacity-62">
      {label}
    </p>
    <p className="mt-1 truncate text-sm font-semibold text-[rgb(var(--theme-manager-text,var(--theme-text-on-surface,var(--color-text))))]">
      {value}
    </p>
  </div>
);
