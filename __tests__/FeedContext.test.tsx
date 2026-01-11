import { render, renderHook, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { FeedProvider } from '../contexts/FeedContext';
import { useFeeds } from '../contexts/FeedContextState';
import { NotificationProvider } from '../contexts/NotificationContext';
import { ModalProvider } from '../contexts/ModalContext';
import { UIProvider } from '../contexts/UIContext';
import * as feedMigration from '../utils/feedMigration';
import * as useLocalStorage from '../hooks/useLocalStorage';
import * as useProgressiveFeedLoading from '../hooks/useProgressiveFeedLoading';

// Mock dependencies
vi.mock('../utils/feedMigration', () => ({
  getDefaultFeeds: vi.fn(() => []),
  migrateFeeds: vi.fn(() => ({ migrated: false, feeds: [] })),
}));

vi.mock('../services/logger', () => {
  const mockLogger = { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() };
  return {
    logger: mockLogger,
    getLogger: () => mockLogger,
    useLogger: () => mockLogger,
  };
});

// Mock NotificationProvider to avoid complex wrapping issues
vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => ({ showNotification: vi.fn() }),
  NotificationProvider: ({ children }: any) => <div>{children}</div>
}));

describe('FeedContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NotificationProvider>
      <FeedProvider>{children}</FeedProvider>
    </NotificationProvider>
  );

  it('provides feed state and actions', () => {
    const { result } = renderHook(() => useFeeds(), { wrapper });

    expect(result.current.feeds).toEqual([]);
    expect(result.current.loadingState).toBeDefined();
    expect(typeof result.current.loadFeeds).toBe('function');
    expect(typeof result.current.refreshFeeds).toBe('function');
  });

  it('runs migration on mount', () => {
    render(
      <NotificationProvider>
        <FeedProvider>
          <div>Test</div>
        </FeedProvider>
      </NotificationProvider>
    );

    expect(feedMigration.migrateFeeds).toHaveBeenCalled();
  });
});
