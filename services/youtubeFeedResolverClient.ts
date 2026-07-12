import { YouTubeFeedResolutionSchema } from "../shared/contracts/backend";
import {
  parseYouTubeUrl,
  resolutionFromDirectDescriptor,
  type YouTubeFeedResolution,
} from "../shared/youtubeFeedResolver";
import { desktopBackendClient } from "./desktopBackendClient";

const RESOLVER_PATH = "/api/v1/youtube/resolve";
const DEFAULT_HOSTED_RESOLVER_URL =
  "https://personalnews-youtube-resolver.personalnewsapp.workers.dev";

function shouldPreferLocalBackend(): boolean {
  const env = (
    import.meta as ImportMeta & { env?: Record<string, string | undefined> }
  ).env;
  const isTauri =
    typeof window !== "undefined" &&
    (window.location.protocol === "tauri:" ||
      window.location.hostname === "tauri.localhost" ||
      Boolean((window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__));
  return isTauri || env?.VITE_BACKEND_ENABLED === "true";
}

function getHostedResolverUrl(): string | null {
  const configured = (
    import.meta as ImportMeta & { env?: Record<string, string | undefined> }
  ).env?.VITE_YOUTUBE_RESOLVER_URL?.trim();
  const baseUrl = configured || DEFAULT_HOSTED_RESOLVER_URL;
  return baseUrl.endsWith(RESOLVER_PATH)
    ? baseUrl
    : `${baseUrl.replace(/\/$/, "")}${RESOLVER_PATH}`;
}

async function resolveWithHostedWorker(
  endpoint: string,
  url: string,
): Promise<YouTubeFeedResolution> {
  const target = new URL(endpoint);
  target.searchParams.set("url", url);
  target.searchParams.set("contract", "2");
  const response = await fetch(target, {
    signal: AbortSignal.timeout(15_000),
    headers: { Accept: "application/json" },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body
        ? String((body as { error?: unknown }).error)
        : `HTTP ${response.status}`;
    throw new Error(`Resolvedor web do YouTube falhou: ${message}`);
  }
  return YouTubeFeedResolutionSchema.parse(body);
}

export async function resolveYouTubeFeedUrl(
  url: string,
): Promise<YouTubeFeedResolution> {
  const descriptor = parseYouTubeUrl(url);
  if (!descriptor) throw new Error("URL do YouTube não reconhecida.");

  const direct = resolutionFromDirectDescriptor(descriptor);
  const errors: string[] = [];
  if (shouldPreferLocalBackend() && desktopBackendClient.isEnabled()) {
    try {
      return await desktopBackendClient.resolveYouTubeFeed(url);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  const hostedResolver = getHostedResolverUrl();
  if (hostedResolver) {
    try {
      return await resolveWithHostedWorker(hostedResolver, url);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (direct) return direct;

  const detail = errors.length > 0 ? ` Detalhes: ${errors.join(" | ")}` : "";
  throw new Error(
    `Não foi possível converter a página do YouTube em um feed RSS.${detail}`,
  );
}
