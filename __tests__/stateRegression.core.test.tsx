/** @vitest-environment jsdom */
/**
 * [CORE][STATE] State Regression Suite
 * 
 * Purpose:
 * - Ensure global state transitions (categories, loading, etc.) are clean.
 * - Detect state leakage between context switches.
 */

import React from "react";
import { renderHook, act, cleanup } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { FeedProvider } from "../contexts/FeedContext";
import { useFeeds } from "../contexts/FeedContextState";
import { NotificationProvider } from "../contexts/NotificationContext";

// Mocking dependencies to isolate state logic
vi.mock("../services/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debugTag: vi.fn(),
  },
  useLogger: () => ({
    debugTag: vi.fn(),
  })
}));

// Mock progressive loading to control article returns
const mockLoadFeeds = vi.fn();
vi.mock("../hooks/useProgressiveFeedLoading", () => ({
  useProgressiveFeedLoading: (feeds: any) => ({
    articles: feeds.length > 0 ? [{ title: "Mock Article", categories: ["Tech"] }] : [],
    loadingState: { status: "success", progress: 100, isResolved: true },
    loadFeeds: mockLoadFeeds,
    retryFailedFeeds: vi.fn(),
    cancelLoading: vi.fn(),
  }),
}));

describe("[CORE][STATE] regression when switching contexts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NotificationProvider>
      <FeedProvider>{children}</FeedProvider>
    </NotificationProvider>
  );

  it("should trigger a clean load when switching categories", async () => {
    const { result } = renderHook(() => useFeeds(), { wrapper });

    // 1. Initial Load (should happen on mount)
    expect(mockLoadFeeds).toHaveBeenCalled();
    mockLoadFeeds.mockClear();

    // 2. Switch to 'Business'
    await act(async () => {
      result.current.refreshFeeds("Business");
    });

    // 3. Assert that refresh was called with the specific category
    expect(mockLoadFeeds).toHaveBeenCalledWith(true, "Business");
  });

  it("should maintain data isolation between contexts (A -> B -> A)", async () => {
    // Note: This is a simplified version. In a real integration, we would 
    // check if the articles array actually changed content.
    const { result } = renderHook(() => useFeeds(), { wrapper });

    await act(async () => {
      result.current.refreshFeeds("Tech");
    });
    expect(mockLoadFeeds).toHaveBeenLastCalledWith(true, "Tech");

    await act(async () => {
      result.current.refreshFeeds("Science");
    });
    expect(mockLoadFeeds).toHaveBeenLastCalledWith(true, "Science");

    await act(async () => {
      result.current.refreshFeeds("Tech");
    });
    expect(mockLoadFeeds).toHaveBeenLastCalledWith(true, "Tech");
  });
});
