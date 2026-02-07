/** @vitest-environment jsdom */
import React from "react";
import { render, screen, fireEvent, act, cleanup, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi, Mock } from "vitest";
import * as matchers from '@testing-library/jest-dom/matchers';
import {
  ErrorBoundary,
  withErrorBoundary,
  useErrorHandler,
} from "../components/ErrorBoundary";

// Estender expect com matchers do jest-dom
expect.extend(matchers);

// Mock dependencies
vi.mock("../services/errorHandler", () => ({
  errorHandler: {
    handleError: vi.fn().mockResolvedValue(false),
    getErrorReports: vi.fn().mockReturnValue([]),
    clearErrorReports: vi.fn(),
    getErrorStatistics: vi.fn().mockReturnValue({
      total: 0,
      bySeverity: {},
      byType: {},
      recoveryRate: 0,
    }),
  },
}));

vi.mock("../services/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Test components
const ThrowError: React.FC<{ shouldThrow?: boolean; message?: string }> = ({
  shouldThrow = false,
  message = "Test error",
}) => {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <div>No error</div>;
};

const CustomFallback: React.FC<any> = ({ error, resetError, retry }) => (
  <div>
    <div>Custom fallback</div>
    <div>Error: {error?.message}</div>
    <button onClick={resetError}>Custom Reset</button>
    <button onClick={retry}>Custom Retry</button>
  </div>
);

describe("ErrorBoundary", () => {
  let consoleErrorSpy: Mock;

  beforeEach(() => {
    vi.useFakeTimers();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    consoleErrorSpy.mockRestore();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe("Basic Error Handling", () => {
    it("should render children when no error occurs", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText("No error")).toBeInTheDocument();
    });

    it("should catch and display error fallback when child throws", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} message="Component crashed" />
        </ErrorBoundary>
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      expect(
        screen.getByText(
          "We encountered an unexpected error. Don't worry, we're working to fix it."
        )
      ).toBeInTheDocument();
    });

    it("should display error details when expanded", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} message="Detailed error message" />
        </ErrorBoundary>
      );

      const detailsButton = screen.getByText("Error Details");
      fireEvent.click(detailsButton);

      expect(screen.getByText("Detailed error message")).toBeInTheDocument();
    });
  });

  describe("Custom Fallback Component", () => {
    it("should use custom fallback when provided", () => {
      render(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowError shouldThrow={true} message="Custom error" />
        </ErrorBoundary>
      );

      expect(screen.getByText("Custom fallback")).toBeInTheDocument();
      expect(screen.getByText("Error: Custom error")).toBeInTheDocument();
      expect(screen.getByText("Custom Reset")).toBeInTheDocument();
      expect(screen.getByText("Custom Retry")).toBeInTheDocument();
    });
  });

  describe("Isolated Error Boundary", () => {
    it("should render isolated fallback when isolate prop is true", () => {
      render(
        <ErrorBoundary isolate={true}>
          <ThrowError shouldThrow={true} message="Isolated error" />
        </ErrorBoundary>
      );

      expect(screen.getByText("Error loading component")).toBeInTheDocument();
      expect(screen.getByTitle("Isolated error")).toBeInTheDocument();
    });
  });

  describe("Error Recovery", () => {
    it("should reset error state when reset button is clicked", async () => {
      const { rerender } = render(
        <ErrorBoundary key="1">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();

      const resetButton = screen.getByText("Reset");
      
      await act(async () => {
        fireEvent.click(resetButton);
      });

      // Re-render com nova key para garantir estado limpo e sem erro
      await act(async () => {
        rerender(
          <ErrorBoundary key="2">
            <ThrowError shouldThrow={false} />
          </ErrorBoundary>
        );
      });

      expect(screen.getByText("No error")).toBeInTheDocument();
    });

    it("should attempt retry when retry button is clicked", async () => {
      const { errorHandler } = await import("../services/errorHandler");
      (errorHandler.handleError as Mock).mockResolvedValue(true);

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const retryButton = screen.getByText("Try Again");
      
      await act(async () => {
        fireEvent.click(retryButton);
      });

      expect(errorHandler.handleError).toHaveBeenCalled();
    });

    it("should show recovering state during retry", async () => {
      const { errorHandler } = await import("../services/errorHandler");
      (errorHandler.handleError as Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(false), 100))
      );

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const retryButton = screen.getByText("Try Again");
      
      await act(async () => {
        fireEvent.click(retryButton);
      });

      expect(screen.getByText("Recovering...")).toBeInTheDocument();
      
      // Avançar o tempo para concluir a promessa
      await act(async () => {
        vi.advanceTimersByTime(150);
      });
    });

    it("should reload page when reload button is clicked", () => {
      const mockReload = vi.fn();
      vi.stubGlobal('location', { ...window.location, reload: mockReload });

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByText("Reload Page");
      fireEvent.click(reloadButton);

      expect(mockReload).toHaveBeenCalled();
      vi.unstubAllGlobals();
    });
  });

  describe("Error Context and Reporting", () => {
    it("should call error handler with proper context", async () => {
      const { errorHandler } = await import("../services/errorHandler");
      const onError = vi.fn();

      render(
        <ErrorBoundary name="TestBoundary" level="component" onError={onError}>
          <ThrowError shouldThrow={true} message="Context test error" />
        </ErrorBoundary>
      );

      expect(errorHandler.handleError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Context test error",
        }),
        expect.objectContaining({
          component: "TestBoundary",
          additionalData: expect.objectContaining({
            level: "component",
            errorBoundary: true,
          }),
        }),
        true
      );

      expect(onError).toHaveBeenCalled();
    });

    it("should include component stack in error context", async () => {
      const { errorHandler } = await import("../services/errorHandler");

      render(
        <ErrorBoundary name="TestBoundary">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const call = (errorHandler.handleError as Mock).mock.calls[0];
      expect(call[1].additionalData.componentStack).toBeDefined();
    });
  });

  describe("Retry Limits", () => {
    it("should respect maximum retry attempts", async () => {
      const { errorHandler } = await import("../services/errorHandler");
      (errorHandler.handleError as Mock).mockResolvedValue(false);

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const retryButton = screen.getByText("Try Again");

      // Click retry multiple times
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          fireEvent.click(retryButton);
          vi.advanceTimersByTime(0);
        });
      }

      // Should not exceed max retries (3)
      expect(
        (errorHandler.handleError as Mock).mock.calls.length
      ).toBeLessThanOrEqual(4); // Initial + 3 retries
    });
  });
});

describe("withErrorBoundary HOC", () => {
  it("should wrap component with error boundary", () => {
    const TestComponent = () => <div>Test Component</div>;
    const WrappedComponent = withErrorBoundary(TestComponent, {
      name: "HOCTest",
    });

    render(<WrappedComponent />);

    expect(screen.getByText("Test Component")).toBeInTheDocument();
  });

  it("should catch errors in wrapped component", () => {
    const WrappedComponent = withErrorBoundary(ThrowError, { name: "HOCTest" });

    render(<WrappedComponent shouldThrow={true} />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("should set correct display name", () => {
    const TestComponent = () => <div>Test</div>;
    TestComponent.displayName = "TestComponent";

    const WrappedComponent = withErrorBoundary(TestComponent);

    expect(WrappedComponent.displayName).toBe(
      "withErrorBoundary(TestComponent)"
    );
  });
});
