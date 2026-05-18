export type FeedFailureCause =
  | "backend_unavailable"
  | "proxy_exhausted"
  | "rate_limited"
  | "upstream_error"
  | "parse_error"
  | "network_error"
  | "not_found"
  | "timeout"
  | "cors_error"
  | "invalid_feed"
  | "unknown";

export type FeedRouteKind = "local-backend" | "proxy" | "direct" | "cache";
export type FeedTransport = "desktop-backend" | "client";

export interface FeedRouteInfo {
  transport: FeedTransport;
  routeKind: FeedRouteKind;
  routeName: string;
  viaFallback: boolean;
  checkedAt: number;
  detail?: string;
}

export interface FeedDiagnosticInfo {
  cause: FeedFailureCause;
  summary: string;
  action: string;
  route?: FeedRouteInfo;
  warning?: string;
}

const ACTIONS: Record<FeedFailureCause, string> = {
  backend_unavailable:
    "Verifique se o backend local do desktop está ativo. Se continuar indisponível, use as chaves de proxy para reforçar o fallback.",
  proxy_exhausted:
    "Os proxies em nuvem falharam ou ficaram indisponiveis. Aguarde alguns minutos ou configure chaves de API para RSS2JSON/CorsProxy.io.",
  rate_limited:
    "O provedor atingiu limite de requisições. Aguarde o reset da cota ou configure uma chave de API.",
  upstream_error:
    "O servidor do feed respondeu com erro. Tente novamente depois e confirme se a URL ainda publica RSS.",
  parse_error:
    "O endereço respondeu, mas o conteúdo não parece um feed válido. Revise a URL ou use descoberta automática.",
  network_error:
    "Falha de rede ao buscar o feed. Confirme conectividade, VPN/firewall e disponibilidade do host.",
  not_found:
    "A URL não foi encontrada. Revise o endereço do feed ou substitua por uma URL atualizada.",
  timeout:
    "A consulta excedeu o tempo limite. Tente novamente ou use um proxy/backend mais estavel.",
  cors_error:
    "A leitura direta foi bloqueada. Use o backend local ou um proxy em nuvem configurado.",
  invalid_feed:
    "O conteúdo não representa um feed RSS/Atom válido. Revise a origem ou remova o feed.",
  unknown:
    "Abra os diagnósticos para ver a última rota usada e tente novamente.",
};

const SUMMARIES: Record<FeedFailureCause, string> = {
  backend_unavailable: "Backend local indisponível",
  proxy_exhausted: "Fallback em nuvem sem rota saudavel",
  rate_limited: "Limite de requisições atingido",
  upstream_error: "Servidor do feed respondeu com erro",
  parse_error: "Conteúdo recebido não pode ser interpretado como feed",
  network_error: "Falha de rede ao consultar o feed",
  not_found: "Feed não encontrado",
  timeout: "Consulta expirou",
  cors_error: "Bloqueio de CORS na rota atual",
  invalid_feed: "Conteúdo inválido para RSS/Atom",
  unknown: "Falha sem classificacao especifica",
};

export const getFeedActionForCause = (cause: FeedFailureCause): string => {
  return ACTIONS[cause];
};

export const getFeedSummaryForCause = (cause: FeedFailureCause): string => {
  return SUMMARIES[cause];
};

export const classifyFeedFailureCause = (
  message: string,
  statusCode?: number,
): FeedFailureCause => {
  const lower = message.toLowerCase();

  if (
    statusCode === 404 ||
    lower.includes("404") ||
    lower.includes("not found")
  ) {
    return "not_found";
  }

  if (
    statusCode === 429 ||
    lower.includes("429") ||
    lower.includes("rate limit")
  ) {
    return "rate_limited";
  }

  if (
    lower.includes("backend") &&
    (lower.includes("unavailable") ||
      lower.includes("refused") ||
      lower.includes("failed to fetch"))
  ) {
    return "backend_unavailable";
  }

  if (
    lower.includes("no healthy proxies") ||
    lower.includes("all proxies failed")
  ) {
    return "proxy_exhausted";
  }

  if (
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("abort")
  ) {
    return "timeout";
  }

  if (lower.includes("cors") || lower.includes("cross-origin")) {
    return "cors_error";
  }

  if (
    lower.includes("parse") ||
    lower.includes("xml") ||
    lower.includes("rss") ||
    lower.includes("atom") ||
    lower.includes("unexpected close tag")
  ) {
    return lower.includes("valid rss") ? "invalid_feed" : "parse_error";
  }

  if (statusCode && statusCode >= 500) {
    return "upstream_error";
  }

  if (
    lower.includes("network") ||
    lower.includes("fetch") ||
    lower.includes("connection")
  ) {
    return "network_error";
  }

  if (statusCode && statusCode >= 400) {
    return "upstream_error";
  }

  return "unknown";
};

export const buildFeedDiagnosticInfo = (
  message: string,
  statusCode?: number,
  route?: FeedRouteInfo,
  warning?: string,
): FeedDiagnosticInfo => {
  const cause = classifyFeedFailureCause(message, statusCode);
  return {
    cause,
    summary: getFeedSummaryForCause(cause),
    action: getFeedActionForCause(cause),
    route,
    warning,
  };
};

export const formatFeedRouteLabel = (route?: FeedRouteInfo | null): string => {
  if (!route) return "Rota desconhecida";

  const prefix =
    route.transport === "desktop-backend" ? "Backend local" : "Cliente";
  const suffix = route.viaFallback ? "fallback" : "primaria";
  return `${prefix} • ${route.routeName} • ${suffix}`;
};
