import { describe, expect, it } from "vitest";
import {
  buildFeedDiagnosticInfo,
  classifyFeedFailureCause,
  formatFeedRouteLabel,
} from "../services/feedDiagnostics";

describe("feedDiagnostics", () => {
  it("classifies backend availability failures", () => {
    expect(
      classifyFeedFailureCause("Backend unavailable: connect ECONNREFUSED"),
    ).toBe("backend_unavailable");
  });

  it("classifies rate limiting, parse failures and network failures", () => {
    expect(classifyFeedFailureCause("HTTP 429: rate limit exceeded", 429)).toBe(
      "rate_limited",
    );
    expect(classifyFeedFailureCause("Unable to parse RSS content")).toBe(
      "parse_error",
    );
    expect(
      classifyFeedFailureCause("Network error occurred while fetching"),
    ).toBe("network_error");
  });

  it("builds actionable diagnostics and readable route labels", () => {
    const diagnostics = buildFeedDiagnosticInfo("Feed not found", 404, {
      transport: "client",
      routeKind: "proxy",
      routeName: "CodeTabs",
      viaFallback: true,
      checkedAt: Date.now(),
    });

    expect(diagnostics.cause).toBe("not_found");
    expect(diagnostics.action).toContain("Revise");
    expect(formatFeedRouteLabel(diagnostics.route)).toContain("CodeTabs");
  });
});
