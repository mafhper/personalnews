import {
  BACKEND_DEFAULT_URL,
  BACKEND_RUNTIME_ENABLED,
  BackendHealthSchema,
  FeedFetchResponseSchema,
  FeedValidateResponseSchema,
  ProxyStatsResponseSchema,
  SettingsGetResponseSchema,
  SettingsPutSchema,
  type BackendHealth,
  type BackendMode,
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

const isTauriRuntime = () =>
  typeof window !== "undefined" &&
  (!!(window as Window & { __TAURI__?: unknown }).__TAURI__ ||
    !!(window as Window & { __TAURI_INTERNALS__?: unknown })
      .__TAURI_INTERNALS__);

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

  private getCandidateBaseUrls(): string[] {
    const seen = new Set<string>();
    const candidates: string[] = [];

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

    if (isLocalBrowserRuntime() || isTauriRuntime()) {
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
    const timeoutId = window.setTimeout(() => controller.abort(), 1500);

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

      return BackendHealthSchema.parse(await response.json());
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  private async resolveHealthyBaseUrl(): Promise<{
    baseUrl: string;
    health: BackendHealth;
  }> {
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
      const inWarmup = this.isInWarmupWindow();
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

    const response = await fetch(`${this.getBaseUrl()}${path}`, init);
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        body && typeof body === "object" && "error" in body
          ? String(
              (body as { error?: unknown }).error || `HTTP ${response.status}`,
            )
          : `HTTP ${response.status}`;
      throw new Error(message);
    }

    return parse(body);
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
