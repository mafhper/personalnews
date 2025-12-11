/**
 * ProgressIndicator.test.tsx
 *
 * Tests for progress indicator components to ensure they display
 * progress correctly and handle various states.
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  ProgressBar,
  FeedLoadingProgress,
  CircularProgress,
  LoadingSpinner,
} from "../components/ProgressIndicator";

describe("ProgressIndicator Components", () => {
  describe("ProgressBar", () => {
    it("renders with correct progress value", () => {
      render(<ProgressBar progress={50} />);

      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute("aria-valuenow", "50");
      expect(progressBar).toHaveAttribute("aria-valuemin", "0");
      expect(progressBar).toHaveAttribute("aria-valuemax", "100");
    });

    it("clamps progress value between 0 and 100", () => {
      const { rerender } = render(<ProgressBar progress={150} />);

      let progressBar = screen.getByRole("progressbar");
      expect(progressBar).toHaveAttribute("aria-valuenow", "100");

      rerender(<ProgressBar progress={-10} />);
      progressBar = screen.getByRole("progressbar");
      expect(progressBar).toHaveAttribute("aria-valuenow", "0");
    });

    it("shows percentage when showPercentage is true", () => {
      render(<ProgressBar progress={75} showPercentage={true} />);

      expect(screen.getByText("75%")).toBeInTheDocument();
    });

    it("applies correct color classes", () => {
      const { container } = render(
        <ProgressBar progress={50} color="success" />
      );

      const progressFill = container.querySelector(".bg-green-500");
      expect(progressFill).toBeInTheDocument();
    });

    it("applies correct size classes", () => {
      const { container } = render(<ProgressBar progress={50} size="lg" />);

      const progressContainer = container.querySelector(".h-3");
      expect(progressContainer).toBeInTheDocument();
    });
  });

  describe("FeedLoadingProgress", () => {
    const defaultProps = {
      loadedFeeds: 3,
      totalFeeds: 5,
      progress: 60,
    };

    it("renders loading progress with correct information", () => {
      render(<FeedLoadingProgress {...defaultProps} />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();
      expect(screen.getByText("3/5")).toBeInTheDocument();
    });

    it("shows background refresh state", () => {
      render(
        <FeedLoadingProgress {...defaultProps} isBackgroundRefresh={true} />
      );

      expect(
        screen.getByText("Updating...")
      ).toBeInTheDocument();
    });

    it("displays errors when present", () => {
      const errors = [
        {
          url: "https://example.com/feed",
          error: "timeout",
          feedTitle: "Example Feed",
        },
        { url: "https://test.com/feed", error: "network error" },
      ];

      // Errors are only shown when loading is complete
      render(<FeedLoadingProgress loadedFeeds={5} totalFeeds={5} progress={100} errors={errors} />);

      expect(screen.getByText("2 feed(s) failed")).toBeInTheDocument();
    });

    it("calls onCancel when cancel button is clicked", () => {
      const onCancel = vi.fn();

      render(<FeedLoadingProgress {...defaultProps} onCancel={onCancel} />);

      // Cancel button is an icon button, query by role
      const cancelButton = screen.getByRole("button");
      fireEvent.click(cancelButton);

      expect(onCancel).toHaveBeenCalledOnce();
    });

    it("calls onRetryErrors when retry button is clicked", () => {
      const onRetryErrors = vi.fn();
      const errors = [{ url: "https://example.com/feed", error: "timeout" }];

      render(
        <FeedLoadingProgress
          loadedFeeds={5}
          totalFeeds={5}
          progress={100}
          errors={errors}
          onRetryErrors={onRetryErrors}
        />
      );

      const retryButton = screen.getByText("Retry");
      fireEvent.click(retryButton);

      expect(onRetryErrors).toHaveBeenCalledOnce();
    });

    it("shows completion state", () => {
      render(
        <FeedLoadingProgress loadedFeeds={5} totalFeeds={5} progress={100} />
      );

      // Completion is indicated by the green checkmark icon, not text
      // The component shows "Loading..." text but with a checkmark icon
      expect(screen.getByText("5/5")).toBeInTheDocument();
      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("shows completion with errors", () => {
      const errors = [{ url: "https://example.com/feed", error: "timeout" }];

      render(
        <FeedLoadingProgress
          loadedFeeds={5}
          totalFeeds={5}
          progress={100}
          errors={errors}
        />
      );

      expect(
        screen.getByText("1 feed(s) failed")
      ).toBeInTheDocument();
    });
  });

  describe("CircularProgress", () => {
    it("renders with correct progress value", () => {
      render(<CircularProgress progress={75} />);

      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute("aria-valuenow", "75");
    });

    it("shows percentage when showPercentage is true", () => {
      render(<CircularProgress progress={50} showPercentage={true} />);

      expect(screen.getByText("50%")).toBeInTheDocument();
    });

    it("clamps progress value", () => {
      render(<CircularProgress progress={150} />);

      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toHaveAttribute("aria-valuenow", "100");
    });

    it("applies custom size", () => {
      const { container } = render(
        <CircularProgress progress={50} size={60} />
      );

      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("width", "60");
      expect(svg).toHaveAttribute("height", "60");
    });
  });

  describe("LoadingSpinner", () => {
    it("renders with default size", () => {
      const { container } = render(<LoadingSpinner />);

      const spinner = container.querySelector(".h-6.w-6");
      expect(spinner).toBeInTheDocument();
    });

    it("renders with custom size", () => {
      const { container } = render(<LoadingSpinner size="lg" />);

      const spinner = container.querySelector(".h-8.w-8");
      expect(spinner).toBeInTheDocument();
    });

    it("has proper accessibility attributes", () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByRole("status");
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute("aria-label", "Loading");

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("applies animation classes", () => {
      const { container } = render(<LoadingSpinner />);

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(<LoadingSpinner className="custom-class" />);

      const spinner = container.querySelector(".custom-class");
      expect(spinner).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("progress components have proper ARIA attributes", () => {
      render(<ProgressBar progress={50} />);

      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toHaveAttribute(
        "aria-label",
        "Loading progress: 50%"
      );
    });

    it("loading spinner has screen reader text", () => {
      render(<LoadingSpinner />);

      const srText = screen.getByText("Loading...");
      expect(srText).toHaveClass("sr-only");
    });
  });
});
