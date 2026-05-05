import { invoke as tauriInvoke } from "@tauri-apps/api/core";
import { listen as tauriListen } from "@tauri-apps/api/event";
import {
  BACKEND_AUTH_TOKEN_HEADER,
  BACKEND_DEFAULT_URL,
  BACKEND_DEV_AUTH_TOKEN,
  BACKEND_RUNTIME_ENABLED,
  BackendHealthSchema,
  DesktopBackendStatusSchema,
  FeedFetchResponseSchema,
  FeedValidateResponseSchema,
  ProxyStatsResponseSchema,
  SettingsGetResponseSchema,
  SettingsPutSchema,
  type BackendHealth,
  type BackendMode,
  type DesktopBackendStatus,
  type FeedFetchResponse,
  type FeedValidateResponse,
  type ProxyStatsResponse,
} from "../shared/contracts/backend";
import {
  buildFeedDiagnosticInfo,
  type FeedDiagnosticInfo,
} from "./feedDiagnostics";

type HealthState = {
  available: boolean;
  checkedAt: number;
  health?: BackendHealth;
  error?: string;
  initializing?: boolean;
};

type RuntimeState = {
  activeMode: "desktop-local" | "cloud-fallback" | "web-client" | "unknown";
  lastWarning?: string;
  lastRoute?: string;
  lastCheckedAt?: number;
  backendAvailable?: boolean;
  backendInitializing?: boolean;
  lastError?: string;
};

type DesktopBackendBootstrapConfig = {
  status?: DesktopBackendStatus;
  baseUrl?: string;
  bootstrappedAt?: number;
};

declare global {
  interface Window {
    __PERSONALNEWS_BACKEND_CONFIG__?: DesktopBackendBootstrapConfig;
  }
}

const HEALTH_TTL_MS = 5_000;
const BACKEND_WARMUP_MS = 90_000;
const LOCAL_BACKEND_PORT_START = 3001;
const LOCAL_BACKEND_PORT_END = 3015;
const BACKEND_READY_POLL_MS = 750;
const BACKEND_READY_POLL_DEADLINE_MS = 20_000;

export class BackendRequestError extends Error {
  readonly statusCode: number;

  readonly body: unknown;

  constructor(message: string, statusCode: number, body: unknown) {
    super(message);
    this.name = "BackendRequestError";
    this.statusCode = statusCode;
    this.body = body;
  }
}

class BackendStillStartingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BackendStillStartingError";
  }
}

type TauriInvoke = (
  command: string,
  args?: Record<string, unknown>,
) => Promise<unknown>;
type TauriListen = (
  event: string,
  handler: (event: { payload: unknown }) => void,
) => Promise<() => void>;

const getConfiguredBackendUrl = () => {
  const meta = import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  };
  const processEnv =
    typeof process !== "undefined"
      ? (process.env as Record<string, string | undefined>)
      : undefined;
  const value = meta.env?.VITE_LOCAL_BACKEND_URL || processEnv?.VITE_LOCAL_BACKEND_URL;
  const normalized = value?.trim().replace(/\/$/, "");
  return normalized || null;
};

const isTauriRuntime = () =>
  typeof window !== "undefined" &&
  (Boolean((globalThis as typeof globalThis & { isTauri?: unknown }).isTauri) ||
    Boolean((window as Window & { __TAURI__?: unknown }).__TAURI__) ||
    Boolean(
      (window as Window & { __TAURI_INTERNALS__?: unknown })
        .__TAURI_INTERNALS__,
    ) ||
    window.location.protocol === "tauri:" ||
    window.location.hostname === "tauri.localhost");

const getTauriInvoke = (): TauriInvoke | null => {
  if (typeof window === "undefined") return null;
  const target = window as Window & {
    __TAURI_INTERNALS__?: { invoke?: TauriInvoke };
    __TAURI__?: {
      core?: { invoke?: TauriInvoke };
      invoke?: TauriInvoke;
    };
  };
  const globalInvoke =
    target.__TAURI_INTERNALS__?.invoke ||
    target.__TAURI__?.core?.invoke ||
    target.__TAURI__?.invoke;
  if (globalInvoke) return globalInvoke;

  return tauriInvoke as TauriInvoke;
};

const getTauriListen = (): TauriListen | null => {
  if (typeof window === "undefined") return null;
  const target = window as Window & {
    __TAURI_INTERNALS__?: { listen?: TauriListen };
    __TAURI__?: {
      event?: { listen?: TauriListen };
      listen?: TauriListen;
    };
  };
  const globalListen =
    target.__TAURI_INTERNALS__?.listen ||
    target.__TAURI__?.event?.listen ||
    target.__TAURI__?.listen;
  if (globalListen) return globalListen;

  return tauriListen as TauriListen;
};

const stringifyLogPayload = (payload: unknown): string => {
  try {
    return JSON.stringify(payload);
  } catch {
    return String(payload);
  }
};

const appendFrontendLog = (message: string, payload?: unknown): void => {
  const invoke = getTauriInvoke();
  if (!invoke) return;

  void invoke("append_frontend_log", {
    message,
    payload:
      typeof payload === "undefined" ? undefined : stringifyLogPayload(payload),
  }).catch(() => undefined);
};

const isLocalBrowserRuntime = () => {
  if (typeof window === "undefined") return false;
  const { hostname, port, protocol } = window.location;
  return (
    protocol.startsWith("http") &&
    (hostname === "localhost" || hostname === "127.0.0.1") &&
    port.length > 0
  );
};

const isAbortLikeError = (error: unknown): boolean => {
  const maybeError =
    error && typeof error === "object"
      ? (error as { name?: unknown; message?: unknown })
      : null;
  const name = typeof maybeError?.name === "string" ? maybeError.name : "";
  const message =
    typeof maybeError?.message === "string"
      ? maybeError.message.toLowerCase()
      : "";

  return (
    name === "AbortError" ||
    name === "TimeoutError" ||
    message.includes("aborted") ||
    message.includes("cancelled")
  );
};

const normalizeFetchError = (error: unknown): string => {
  if (isAbortLikeError(error)) {
    return "Backend local ainda respondendo";
  }
  if (error instanceof Error) return error.message;
  return String(error);
};

const getBootstrappedBackendConfig = (): DesktopBackendBootstrapConfig | null => {
  if (typeof window === "undefined") return null;
  return window.__PERSONALNEWS_BACKEND_CONFIG__ || null;
};

const parseDesktopBackendStatus = (
  raw: unknown,
  source: string,
): DesktopBackendStatus | null => {
  const parsed = DesktopBackendStatusSchema.safeParse(raw);
  if (parsed.success) {
    appendFrontendLog("backend_status_parse_ok", {
      source,
      health: parsed.data.health,
      diagnostic: parsed.data.diagnostic,
      baseUrl: parsed.data.baseUrl,
      pid: parsed.data.pid,
    });
    return parsed.data;
  }

  if (typeof console !== "undefined") {
    console.warn("[desktop-backend] invalid backend status payload", {
      source,
      raw,
      issues: parsed.error.issues,
    });
  }
  appendFrontendLog("backend_status_parse_failed", {
    source,
    raw,
    issues: parsed.error.issues,
  });

  return null;
};

const buildSyntheticHealth = (status: DesktopBackendStatus): BackendHealth => ({
  status: "ok",
  service: "personalnews-backend",
  version: "desktop-supervisor",
  uptimeMs: status.uptimeMs ?? 0,
  dbPath: status.dbPath,
  now: new Date().toISOString(),
});

class DesktopBackendClient {
  private healthState: HealthState = {
    available: false,
    checkedAt: 0,
  };

  private readonly createdAt = Date.now();

  private healthCheckPromise: Promise<HealthState> | null = null;

  private resolvedBaseUrl: string | null =
    getBootstrappedBackendConfig()?.baseUrl ||
    getBootstrappedBackendConfig()?.status?.baseUrl ||
    (isTauriRuntime() ? null : BACKEND_DEFAULT_URL);

  private runtimeState: RuntimeState = {
    activeMode: "unknown",
  };

  private authTokenPromise: Promise<string | null> | null = null;

  private desktopStatusPromise: Promise<DesktopBackendStatus | null> | null =
    null;

  private warmupMonitorStarted = false;

  private healthProbeAttempt = 0;

  private backendStatusListenerStarted = false;

  constructor() {
    this.startBackendStatusListener();
  }

  isEnabled(): boolean {
    return (
      isTauriRuntime() || BACKEND_RUNTIME_ENABLED || isLocalBrowserRuntime()
    );
  }

  getBaseUrl(): string {
    return this.resolvedBaseUrl || (isTauriRuntime() ? "" : BACKEND_DEFAULT_URL);
  }

  getRuntimeState(): RuntimeState {
    this.startBackendStatusListener();
    return { ...this.runtimeState };
  }

  isDesktopRuntime(): boolean {
    return isTauriRuntime();
  }

  async getDesktopStatus(): Promise<DesktopBackendStatus | null> {
    return this.getDesktopBackendStatus(true);
  }

  async bootstrapFromSupervisor(): Promise<DesktopBackendStatus | null> {
    const status = await this.getDesktopBackendStatus(true);
    if (!status) return null;

    this.applyDesktopStatus(status);
    window.__PERSONALNEWS_BACKEND_CONFIG__ = {
      ...window.__PERSONALNEWS_BACKEND_CONFIG__,
      status,
      baseUrl: status.baseUrl.replace(/\/$/, ""),
      bootstrappedAt: Date.now(),
    };
    if (status.health !== "ready") {
      this.startWarmupMonitor();
    }
    return status;
  }

  async waitUntilReady(timeoutMs = 10_000): Promise<boolean> {
    if (!this.isEnabled()) return false;

    const deadline = Date.now() + timeoutMs;
    let health = await this.checkHealth(true).catch(() => null);

    while (!health?.available && Date.now() < deadline) {
      await this.sleep(BACKEND_READY_POLL_MS);
      health = await this.checkHealth(true).catch(() => null);
    }

    appendFrontendLog("backend_wait_until_ready_completed", {
      ready: Boolean(health?.available),
      initializing: health?.initializing,
      timeoutMs,
      error: health?.error,
    });

    return Boolean(health?.available);
  }

  async restartBackend(): Promise<DesktopBackendStatus | null> {
    const invoke = getTauriInvoke();
    if (!invoke) return null;

    this.healthState = {
      available: false,
      checkedAt: Date.now(),
      initializing: true,
      error: "Backend local reiniciando",
    };
    this.authTokenPromise = null;
    this.warmupMonitorStarted = false;
    appendFrontendLog("restart_backend_sidecar_call");
    const raw = await invoke("restart_backend_sidecar").catch((error) => {
      appendFrontendLog("restart_backend_sidecar_failed", {
        error: normalizeFetchError(error),
      });
      return null;
    });
    const status = parseDesktopBackendStatus(raw, "restart_backend_sidecar");
    if (!status) return null;

    if (status.baseUrl) {
      this.resolvedBaseUrl = status.baseUrl.replace(/\/$/, "");
    }
    this.startWarmupMonitor();
    return status;
  }

  setRuntimeState(next: Partial<RuntimeState>) {
    this.runtimeState = {
      ...this.runtimeState,
      ...next,
      lastCheckedAt: Date.now(),
    };
  }

  private isInWarmupWindow(): boolean {
    return Date.now() - this.createdAt < BACKEND_WARMUP_MS;
  }

  private applyDesktopStatus(status: DesktopBackendStatus) {
    if (status.baseUrl) {
      this.resolvedBaseUrl = status.baseUrl.replace(/\/$/, "");
      if (typeof window !== "undefined") {
        window.__PERSONALNEWS_BACKEND_CONFIG__ = {
          ...window.__PERSONALNEWS_BACKEND_CONFIG__,
          status,
          baseUrl: this.resolvedBaseUrl,
          bootstrappedAt:
            window.__PERSONALNEWS_BACKEND_CONFIG__?.bootstrappedAt ||
            Date.now(),
        };
      }
    }

    if (status.health === "ready") {
      this.healthState = {
        available: true,
        checkedAt: Date.now(),
        health: buildSyntheticHealth(status),
        initializing: false,
      };
      this.setRuntimeState({
        activeMode: "desktop-local",
        backendAvailable: true,
        backendInitializing: false,
        lastError: undefined,
        lastRoute: this.resolvedBaseUrl || undefined,
      });
      return;
    }

    const initializing =
      status.health === "starting" || status.health === "restarting";
    const error =
      status.lastHealthError ||
      status.lastStartError ||
      (initializing ? "Backend local inicializando" : "Backend local indisponivel");

    this.healthState = {
      available: false,
      checkedAt: Date.now(),
      initializing,
      error,
    };
    this.setRuntimeState({
      backendAvailable: false,
      backendInitializing: initializing,
      lastError: initializing ? undefined : error,
      lastRoute: this.resolvedBaseUrl || undefined,
    });
  }

  private startBackendStatusListener(): void {
    if (this.backendStatusListenerStarted) return;
    const listen = getTauriListen();
    if (!listen) return;

    this.backendStatusListenerStarted = true;
    const applyEventStatus = (event: { payload: unknown }) => {
      appendFrontendLog("backend_status_event", event.payload);
      const status = parseDesktopBackendStatus(event.payload, "tauri-event");
      if (status) {
        this.applyDesktopStatus(status);
      }
    };

    appendFrontendLog("backend_status_listener_start", {
      isTauriRuntime: isTauriRuntime(),
      hasGlobalTauri:
        typeof window !== "undefined" &&
        Boolean((window as Window & { __TAURI__?: unknown }).__TAURI__),
      hasInternalTauri:
        typeof window !== "undefined" &&
        Boolean(
          (window as Window & { __TAURI_INTERNALS__?: unknown })
            .__TAURI_INTERNALS__,
        ),
      location:
        typeof window !== "undefined"
          ? `${window.location.protocol}//${window.location.host}`
          : undefined,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    });

    void listen("backend-status-changed", applyEventStatus).catch((error) => {
      appendFrontendLog("backend_status_listener_failed", {
        event: "backend-status-changed",
        error: normalizeFetchError(error),
      });
      this.backendStatusListenerStarted = false;
    });
    void listen("backend-ready", applyEventStatus).catch((error) => {
      appendFrontendLog("backend_ready_listener_failed", {
        error: normalizeFetchError(error),
      });
    });
  }

  private sleep(ms: number, signal?: AbortSignal) {
    return new Promise<void>((resolve, reject) => {
      if (signal?.aborted) {
        reject(new DOMException("Request was cancelled", "AbortError"));
        return;
      }

      const timeoutId = window.setTimeout(resolve, ms);
      signal?.addEventListener(
        "abort",
        () => {
          window.clearTimeout(timeoutId);
          reject(new DOMException("Request was cancelled", "AbortError"));
        },
        { once: true },
      );
    });
  }

  private async getDesktopBackendStatus(
    force = false,
  ): Promise<DesktopBackendStatus | null> {
    if (!force && this.desktopStatusPromise) return this.desktopStatusPromise;

    this.desktopStatusPromise = (async () => {
      const invoke = getTauriInvoke();
      if (!invoke) {
        appendFrontendLog("get_backend_status_no_invoke", {
          isTauriRuntime: isTauriRuntime(),
          hasGlobalTauri:
            typeof window !== "undefined" &&
            Boolean((window as Window & { __TAURI__?: unknown }).__TAURI__),
          hasInternalTauri:
            typeof window !== "undefined" &&
            Boolean(
              (window as Window & { __TAURI_INTERNALS__?: unknown })
                .__TAURI_INTERNALS__,
            ),
        });
        return null;
      }

      appendFrontendLog("get_backend_status_call", {
        isTauriRuntime: isTauriRuntime(),
      });
      const raw = await invoke("get_backend_status").catch((error) => {
        appendFrontendLog("get_backend_status_failed", {
          error: normalizeFetchError(error),
        });
        return null;
      });
      appendFrontendLog("get_backend_status_raw", raw);
      if (raw === null) return null;

      const status = parseDesktopBackendStatus(raw, "get_backend_status");
      if (!status) return null;

      if (status.baseUrl) {
        this.resolvedBaseUrl = status.baseUrl.replace(/\/$/, "");
      }
      return status;
    })().finally(() => {
      this.desktopStatusPromise = null;
    });

    return this.desktopStatusPromise;
  }

  private getCandidateBaseUrls(): string[] {
    const seen = new Set<string>();
    const candidates: string[] = [];
    const configuredBackendUrl = getConfiguredBackendUrl();

    const pushCandidate = (value?: string) => {
      if (!value) return;
      const normalized = value.replace(/\/$/, "");
      if (!seen.has(normalized)) {
        seen.add(normalized);
        candidates.push(normalized);
      }
    };

    pushCandidate(this.resolvedBaseUrl || undefined);

    if (isTauriRuntime()) {
      return candidates;
    }

    pushCandidate(BACKEND_DEFAULT_URL);

    if (configuredBackendUrl) {
      pushCandidate(configuredBackendUrl);
      return candidates;
    }

    if (isLocalBrowserRuntime()) {
      for (const host of ["127.0.0.1", "localhost"]) {
        for (
          let port = LOCAL_BACKEND_PORT_START;
          port <= LOCAL_BACKEND_PORT_END;
          port += 1
        ) {
          pushCandidate(`http://${host}:${port}`);
        }
      }
    }

    return candidates;
  }

  private async probeHealth(baseUrl: string): Promise<BackendHealth> {
    const controller = new AbortController();
    const timeoutMs = Math.min(2_500, 700 + this.healthProbeAttempt * 300);
    this.healthProbeAttempt += 1;
    const timeoutId = window.setTimeout(
      () =>
        controller.abort(
          new DOMException(
            `Health check timed out after ${timeoutMs}ms`,
            "TimeoutError",
          ),
        ),
      timeoutMs,
    );

    try {
      const response = await fetch(`${baseUrl}/health`, {
        method: "GET",
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Backend health HTTP ${response.status}`);
      }

      const health = BackendHealthSchema.parse(await response.json());
      this.healthProbeAttempt = 0;
      return health;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  private async resolveHealthyBaseUrl(): Promise<{
    baseUrl: string;
    health: BackendHealth;
  }> {
    const desktopStatus = await this.getDesktopBackendStatus(true);
    if (desktopStatus && isTauriRuntime()) {
      this.applyDesktopStatus(desktopStatus);
      if (
        desktopStatus.health === "starting" ||
        desktopStatus.health === "restarting" ||
        desktopStatus.health === "not_started"
      ) {
        throw new BackendStillStartingError("Backend local inicializando");
      }
      if (desktopStatus.health === "failed") {
        throw new Error(
          desktopStatus.lastHealthError ||
            desktopStatus.lastStartError ||
            "Backend local falhou ao iniciar",
        );
      }
      if (desktopStatus.health === "ready") {
        return {
          baseUrl: desktopStatus.baseUrl.replace(/\/$/, ""),
          health: buildSyntheticHealth(desktopStatus),
        };
      }
    }

    if (isTauriRuntime()) {
      throw new BackendStillStartingError("Backend local inicializando");
    }

    const failures: string[] = [];

    for (const baseUrl of this.getCandidateBaseUrls()) {
      try {
        const health = await this.probeHealth(baseUrl);
        this.resolvedBaseUrl = baseUrl;
        return { baseUrl, health };
      } catch (error) {
        failures.push(`${baseUrl}: ${normalizeFetchError(error)}`);
      }
    }

    throw new Error(
      failures.length > 0
        ? failures.join(" | ")
        : "No backend candidates responded",
    );
  }

  private async runHealthCheck(now: number): Promise<HealthState> {
    try {
      const { health, baseUrl } = await this.resolveHealthyBaseUrl();
      this.healthState = {
        available: true,
        checkedAt: now,
        health,
        initializing: false,
      };
      this.setRuntimeState({
        activeMode: "desktop-local",
        backendAvailable: true,
        backendInitializing: false,
        lastError: undefined,
        lastRoute: baseUrl,
      });
      return { ...this.healthState };
    } catch (error) {
      if (isAbortLikeError(error) && this.healthState.available) {
        this.healthState = {
          ...this.healthState,
          checkedAt: now,
          initializing: false,
        };
        return { ...this.healthState };
      }

      const inWarmup =
        error instanceof BackendStillStartingError || this.isInWarmupWindow();
      const message = inWarmup
        ? "Backend local inicializando"
        : normalizeFetchError(error);

      this.healthState = {
        available: false,
        checkedAt: now,
        error: message,
        initializing: inWarmup,
      };
      this.setRuntimeState({
        backendAvailable: false,
        backendInitializing: inWarmup,
        lastError: inWarmup ? undefined : message,
      });
      return { ...this.healthState };
    }
  }

  startWarmupMonitor(): void {
    if (!this.isEnabled() || this.warmupMonitorStarted) return;
    this.warmupMonitorStarted = true;

    const startedAt = Date.now();
    const tick = async () => {
      const health = await this.checkHealth(true).catch(() => null);
      if (
        health?.available ||
        Date.now() - startedAt > BACKEND_READY_POLL_DEADLINE_MS
      ) {
        return;
      }
      window.setTimeout(tick, BACKEND_READY_POLL_MS);
    };

    void tick();
  }

  async checkHealth(force = false, signal?: AbortSignal): Promise<HealthState> {
    if (!this.isEnabled()) {
      this.healthState = {
        available: false,
        checkedAt: Date.now(),
        error: "Desktop backend disabled in this runtime",
        initializing: false,
      };
      return { ...this.healthState };
    }

    const now = Date.now();
    if (signal?.aborted) {
      return {
        ...this.healthState,
        checkedAt: this.healthState.checkedAt || now,
        initializing:
          this.healthState.initializing ||
          (!this.healthState.available && this.isInWarmupWindow()),
      };
    }

    if (!force && now - this.healthState.checkedAt < HEALTH_TTL_MS) {
      if (isTauriRuntime() && !this.healthState.available) {
        const desktopStatus = await this.getDesktopBackendStatus(true);
        if (desktopStatus?.health === "ready") {
          this.applyDesktopStatus(desktopStatus);
          return { ...this.healthState };
        }
      }
      return { ...this.healthState };
    }

    if (this.healthCheckPromise) {
      return this.healthCheckPromise;
    }

    this.healthCheckPromise = this.runHealthCheck(now).finally(() => {
      this.healthCheckPromise = null;
    });

    return this.healthCheckPromise;
  }

  private async requestJson<T>(
    path: string,
    init: RequestInit,
    parse: (value: unknown) => T,
  ): Promise<T> {
    if (!this.healthState.available) {
      const health = await this.checkHealth(true, init.signal ?? undefined);
      if (!health.available) {
        throw new Error(health.error || "Backend local indisponivel");
      }
    }

    const token = await this.getAuthToken();
    const headers = new Headers(init.headers);
    if (token) {
      headers.set(BACKEND_AUTH_TOKEN_HEADER, token);
    }

    const response = await fetch(`${this.getBaseUrl()}${path}`, {
      ...init,
      headers,
    });
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        body && typeof body === "object" && "error" in body
          ? String(
              (body as { error?: unknown }).error || `HTTP ${response.status}`,
            )
          : `HTTP ${response.status}`;
      throw new BackendRequestError(message, response.status, body);
    }

    return parse(body);
  }

  private async getAuthToken(): Promise<string | null> {
    if (BACKEND_DEV_AUTH_TOKEN) return BACKEND_DEV_AUTH_TOKEN;
    if (!isTauriRuntime()) return null;

    if (!this.authTokenPromise) {
      this.authTokenPromise = (async () => {
        const invoke = getTauriInvoke();
        if (!invoke) return null;
        const token = await invoke("get_backend_auth_token").catch(() => null);
        return typeof token === "string" && token.length > 0 ? token : null;
      })();
    }

    return this.authTokenPromise;
  }

  async fetchFeed(
    url: string,
    options: { forceRefresh?: boolean; signal?: AbortSignal } = {},
  ): Promise<FeedFetchResponse> {
    const forceRefresh = options.forceRefresh ? "1" : "0";
    return this.requestJson(
      `/api/v1/feed?url=${encodeURIComponent(url)}&forceRefresh=${forceRefresh}`,
      {
        method: "GET",
        signal: options.signal,
        headers: {
          Accept: "application/json",
        },
      },
      (value) => FeedFetchResponseSchema.parse(value),
    );
  }

  async validateFeeds(
    urls: string[],
    options: { forceRefresh?: boolean; signal?: AbortSignal } = {},
  ): Promise<FeedValidateResponse> {
    return this.requestJson(
      "/api/v1/feeds/validate",
      {
        method: "POST",
        signal: options.signal,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          urls,
          forceRefresh: options.forceRefresh ?? true,
        }),
      },
      (value) => FeedValidateResponseSchema.parse(value),
    );
  }

  async getProxyStats(signal?: AbortSignal): Promise<ProxyStatsResponse> {
    return this.requestJson(
      "/api/v1/proxy/stats",
      {
        method: "GET",
        signal,
        headers: {
          Accept: "application/json",
        },
      },
      (value) => ProxyStatsResponseSchema.parse(value),
    );
  }

  async getSettings(signal?: AbortSignal): Promise<BackendMode> {
    const response = await this.requestJson(
      "/api/v1/settings",
      {
        method: "GET",
        signal,
        headers: {
          Accept: "application/json",
        },
      },
      (value) => SettingsGetResponseSchema.parse(value),
    );
    return response.settings.backendMode;
  }

  async setSettings(
    settings: Partial<{ backendMode: BackendMode; cacheTtlMinutes: number }>,
    signal?: AbortSignal,
  ): Promise<BackendMode> {
    const payload = SettingsPutSchema.parse(settings);
    const response = await this.requestJson(
      "/api/v1/settings",
      {
        method: "PUT",
        signal,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
      (value) => SettingsGetResponseSchema.parse(value),
    );
    return response.settings.backendMode;
  }

  buildFallbackDiagnostic(message: string): FeedDiagnosticInfo {
    return buildFeedDiagnosticInfo(message);
  }
}

export const desktopBackendClient = new DesktopBackendClient();
