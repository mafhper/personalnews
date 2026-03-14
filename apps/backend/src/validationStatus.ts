import type { FeedValidationStatus } from "../../../shared/contracts/backend";

export function classifyValidationStatus(message: string): FeedValidationStatus {
  const lower = message.toLowerCase();
  if (lower.includes("403")) return "forbidden";
  if (lower.includes("429")) return "rate_limited";
  if (lower.includes("timeout")) return "timeout";
  if (lower.includes("404") || lower.includes("not found")) return "not_found";
  if (lower.includes("500") || lower.includes("502") || lower.includes("503")) {
    return "server_error";
  }
  if (lower.includes("xml") || lower.includes("parse") || lower.includes("no feed entries")) {
    return "parse_error";
  }
  if (lower.includes("cors")) return "cors_error";
  if (lower.includes("fetch") || lower.includes("network")) return "network_error";
  return "invalid";
}
