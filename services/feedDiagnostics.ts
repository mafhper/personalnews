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
    "Verifique se o backend local do desktop esta ativo. Se continuar indisponivel, use as chaves de proxy para reforcar o fallback.",
  proxy_exhausted:
    "Os proxies em nuvem falharam ou ficaram indisponiveis. Aguarde alguns minutos ou configure chaves de API para RSS2JSON/CorsProxy.io.",
  rate_limited:
    "O provedor atingiu limite de requisicoes. Aguarde o reset da cota ou configure uma chave de API.",
  upstream_error:
    "O servidor do feed respondeu com erro. Tente novamente depois e confirme se a URL ainda publica RSS.",
  parse_error:
    "O endereco respondeu, mas o conteudo nao parece um feed valido. Revise a URL ou use descoberta automatica.",
  network_error:
    "Falha de rede ao buscar o feed. Confirme conectividade, VPN/firewall e disponibilidade do host.",
  not_found:
    "A URL nao foi encontrada. Revise o endereco do feed ou substitua por uma URL atualizada.",
  timeout:
    "A consulta excedeu o tempo limite. Tente novamente ou use um proxy/backend mais estavel.",
  cors_error:
    "A leitura direta foi bloqueada. Use o backend local ou um proxy em nuvem configurado.",
  invalid_feed:
    "O conteudo nao representa um feed RSS/Atom valido. Revise a origem ou remova o feed.",
  unknown:
    "Abra os diagnosticos para ver a ultima rota usada e tente novamente.",
};

const SUMMARIES: Record<FeedFailureCause, string> = {
  backend_unavailable: "Backend local indisponivel",
  proxy_exhausted: "Fallback em nuvem sem rota saudavel",
  rate_limited: "Limite de requisicoes atingido",
  upstream_error: "Servidor do feed respondeu com erro",
  parse_error: "Conteudo recebido nao pode ser interpretado como feed",
  network_error: "Falha de rede ao consultar o feed",
  not_found: "Feed nao encontrado",
  timeout: "Consulta expirou",
  cors_error: "Bloqueio de CORS na rota atual",
  invalid_feed: "Conteudo invalido para RSS/Atom",
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
