export type FeedErrorType = "timeout" | "network" | "parse" | "cors" | "unknown";

export const categorizeFeedError = (error: string): FeedErrorType => {
  const errorLower = error.toLowerCase();

  if (errorLower.includes("timeout") || errorLower.includes("abort")) {
    return "timeout";
  }

  if (
    errorLower.includes("network") ||
    errorLower.includes("fetch") ||
    errorLower.includes("connection")
  ) {
    return "network";
  }

  if (
    errorLower.includes("parse") ||
    errorLower.includes("xml") ||
    errorLower.includes("json") ||
    errorLower.includes("invalid")
  ) {
    return "parse";
  }

  if (
    errorLower.includes("cors") ||
    errorLower.includes("cross-origin") ||
    errorLower.includes("blocked")
  ) {
    return "cors";
  }

  return "unknown";
};
