import {
  BACKEND_DEFAULT_URL,
  BACKEND_AUTH_TOKEN_HEADER,
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

const HEALTH_TTL_MS = 5_000;
const BACKEND_WARMUP_MS = 30_000;
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

type TauriInvoke = (command: string) => Promise<unknown>;

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
  (!!(window as Window & { __TAURI__?: unknown }).__TAURI__ ||
    !!(window as Window & { __TAURI_INTERNALS__?: unknown })
      .__TAURI_INTERNALS__);

const getTauriInvoke = (): TauriInvoke | null => {
  if (typeof window === "undefined") return null;
  const target = window as Window & {
    __TAURI_INTERNALS__?: { invoke?: TauriInvoke };
    __TAURI__?: {
      core?: { invoke?: TauriInvoke };
      invoke?: TauriInvoke;
    };
  };
  return (
    target.__TAURI_INTERNALS__?.invoke ||
    target.__TAURI__?.core?.invoke ||
    target.__TAURI__?.invoke ||
    null
  );
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

const normalizeFetchError = (error: unknown): string => {
  if (error instanceof Error) {
    if (
      error.name === "AbortError" ||
      error.message.toLowerCase().includes("aborted")
    ) {
      return "health check cancelled";
    }
    return error.message;
  }
  return String(error);
};

class DesktopBackendClient {
  private healthState: HealthState = {
    available: false,
    checkedAt: 0,
  };

  private readonly createdAt = Date.now();

  private healthCheckPromise: Promise<HealthState> | null = null;

  private resolvedBaseUrl: string = BACKEND_DEFAULT_URL;

  private runtimeState: RuntimeState = {
    activeMode: "unknown",
  };

  private authTokenPromise: Promise<string | null> | null = null;

  private desktopStatusPromise: Promise<DesktopBackendStatus | null> | null =
    null;

  private warmupMonitorStarted = false;

  private healthProbeAttempt = 0;

  isEnabled(): boolean {
    return (
      isTauriRuntime() || BACKEND_RUNTIME_ENABLED || isLocalBrowserRuntime()
    );
  }

  getBaseUrl(): string {
    return this.resolvedBaseUrl || BACKEND_DEFAULT_URL;
  }

  getRuntimeState(): RuntimeState {
    return { ...this.runtimeState };
  }

  async getDesktopStatus(): Promise<DesktopBackendStatus | null> {
    return this.getDesktopBackendStatus(true);
  }

  async restartBackend(): Promise<DesktopBackendStatus | null> {
    if (!isTauriRuntime()) return null;
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
    const raw = await invoke("restart_backend_sidecar").catch(() => null);
    const parsed = DesktopBackendStatusSchema.safeParse(raw);
    if (!parsed.success) return null;

    const status = parsed.data;
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

  private async getDesktopBackendStatus(
    force = false,
  ): Promise<DesktopBackendStatus | null> {
    if (!isTauriRuntime()) return null;
    if (!force && this.desktopStatusPromise) return this.desktopStatusPromise;

    this.desktopStatusPromise = (async () => {
      const invoke = getTauriInvoke();
      if (!invoke) return null;

      const raw = await invoke("get_backend_status").catch(() => null);
      const parsed = DesktopBackendStatusSchema.safeParse(raw);
      if (!parsed.success) return null;

      const status = parsed.data;
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

    pushCandidate(this.resolvedBaseUrl);
    pushCandidate(BACKEND_DEFAULT_URL);

    if (configuredBackendUrl) {
      pushCandidate(configuredBackendUrl);
      return candidates;
    }

    if (isTauriRuntime()) {
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
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

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
      this.resolvedBaseUrl = desktopStatus.baseUrl.replace(/\/$/, "");
      if (desktopStatus.health === "starting" || !desktopStatus.sidecarSpawned) {
        throw new BackendStillStartingError("Backend local inicializando");
      }
      if (desktopStatus.health === "failed") {
        throw new Error(
          desktopStatus.lastHealthError ||
            desktopStatus.lastStartError ||
            "Backend local falhou ao iniciar",
        );
      }

      const health = await this.probeHealth(this.resolvedBaseUrl);
      return { baseUrl: this.resolvedBaseUrl, health };
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
      if (health?.available || Date.now() - startedAt > BACKEND_READY_POLL_DEADLINE_MS) {
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

    const response = await this.fetchWithAuthRetry(path, init);
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

  private async fetchWithAuthRetry(
    path: string,
    init: RequestInit,
  ): Promise<Response> {
    const buildHeaders = async () => {
      const token = await this.getAuthToken();
      const headers = new Headers(init.headers);
      if (token) {
        headers.set(BACKEND_AUTH_TOKEN_HEADER, token);
      }
      return headers;
    };

    const first = await fetch(`${this.getBaseUrl()}${path}`, {
      ...init,
      headers: await buildHeaders(),
    });

    if (first.status !== 401 || !isTauriRuntime()) {
      return first;
    }

    this.authTokenPromise = null;
    return fetch(`${this.getBaseUrl()}${path}`, {
      ...init,
      headers: await buildHeaders(),
    });
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
