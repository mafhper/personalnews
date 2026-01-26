/** @vitest-environment jsdom */
import React from "react";
import { render, screen, fireEvent, act, cleanup, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi, Mock } from "vitest";
import * as matchers from '@testing-library/jest-dom/matchers';
import { useErrorHandler } from "../components/ErrorBoundary";

expect.extend(matchers);

// Mock dependencies
vi.mock("../services/errorHandler", () => ({
  errorHandler: {
    handleError: vi.fn().mockResolvedValue(false),
    getErrorReports: vi.fn().mockReturnValue([]),
    clearErrorReports: vi.fn(),
    getErrorStatistics: vi.fn().mockReturnValue({ total: 0 }),
  },
}));

describe("useErrorHandler Hook", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  const TestComponent: React.FC<{ shouldError?: boolean }> = ({
    shouldError = false,
  }) => {
    const {
      handleError,
      reportError,
      getErrorReports,
      clearErrorReports,
      getErrorStatistics,
    } = useErrorHandler();

    React.useEffect(() => {
      if (shouldError) {
        handleError(new Error("Hook test error"), {
          component: "TestComponent",
        });
      }
    }, [shouldError, handleError]);

    return (
      <div>
        <button onClick={() => reportError(new Error("Manual error"))}>
          Report Error
        </button>
        <button onClick={() => clearErrorReports()}>Clear Reports</button>
        <div>Reports: {getErrorReports()?.length || 0}</div>
        <div>Stats: {JSON.stringify(getErrorStatistics())}</div>
      </div>
    );
  };

  it("should provide error handling functions", () => {
    render(<TestComponent />);
    expect(screen.getByText("Report Error")).toBeInTheDocument();
    expect(screen.getByText("Clear Reports")).toBeInTheDocument();
  });

  it("should handle errors when called", async () => {
    const { errorHandler } = await import("../services/errorHandler");
    render(<TestComponent shouldError={true} />);

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    expect(errorHandler.handleError).toHaveBeenCalled();
  });
});
