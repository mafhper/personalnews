/** @vitest-environment jsdom */
import { render, screen, waitFor, fireEvent, act, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { LazyImage } from '../components/LazyImage';

// Estender expect com matchers do jest-dom
expect.extend(matchers);

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();

// Mock for testing intersection observer callback
let intersectionCallback: ((entries: IntersectionObserverEntry[]) => void) | undefined;

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin: string;
  readonly thresholds: ReadonlyArray<number>;
  readonly observe: ReturnType<typeof vi.fn>;
  readonly unobserve: ReturnType<typeof vi.fn>;
  readonly disconnect: ReturnType<typeof vi.fn>;
  readonly takeRecords: ReturnType<typeof vi.fn>;

  constructor(
    callback: IntersectionObserverCallback,
    options: IntersectionObserverInit = {}
  ) {
    intersectionCallback = callback;
    this.rootMargin = options.rootMargin ?? '';
    this.thresholds = Array.isArray(options.threshold)
      ? options.threshold
      : [options.threshold ?? 0];
    this.observe = vi.fn();
    this.unobserve = vi.fn();
    this.disconnect = vi.fn();
    this.takeRecords = vi.fn(() => []);
    mockIntersectionObserver(callback, options, this);
  }
}

Object.defineProperty(globalThis, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

// Helper function to create mock intersection observer entry
const createMockEntry = (target: Element, isIntersecting: boolean): IntersectionObserverEntry => ({
  isIntersecting,
  target,
  boundingClientRect: {} as DOMRectReadOnly,
  intersectionRatio: isIntersecting ? 1 : 0,
  intersectionRect: {} as DOMRectReadOnly,
  rootBounds: null,
  time: Date.now(),
});

beforeEach(() => {
  vi.useFakeTimers();
  mockIntersectionObserver.mockClear();
  intersectionCallback = undefined;
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('LazyImage', () => {
  const defaultProps = {
    src: 'https://example.com/image.jpg',
    alt: 'Test image',
  };

  it('renders with placeholder initially', () => {
    render(<LazyImage {...defaultProps} />);
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('alt', 'Test image');
    // Should show placeholder initially
    expect(img.getAttribute('src')).toContain('data:image/svg+xml');
  });

  it('loads image when in view', async () => {
    render(<LazyImage {...defaultProps} />);
    const img = screen.getByRole('img');

    // Simulate intersection observer triggering
    await act(async () => {
      intersectionCallback?.([createMockEntry(img, true)]);
    });

    // Avançar microtasks para que o estado isInView dispare a mudança de src
    await act(async () => {
      vi.runOnlyPendingTimers();
    });

    expect(img.getAttribute('src')).toBe(defaultProps.src);
  });

  it('calls onLoad callback when image loads successfully', async () => {
    const onLoad = vi.fn();
    render(<LazyImage {...defaultProps} onLoad={onLoad} />);
    const img = screen.getByRole('img');

    // Simulate intersection observer triggering
    await act(async () => {
      intersectionCallback?.([createMockEntry(img, true)]);
    });

    await act(async () => {
      vi.runOnlyPendingTimers();
    });

    // Simulate successful image load
    await act(async () => {
      fireEvent.load(img);
    });

    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it('handles image load errors with retry logic', async () => {
    const onError = vi.fn();
    render(<LazyImage {...defaultProps} onError={onError} retryAttempts={1} retryDelay={10} />);
    const img = screen.getByRole('img');

    // Simulate intersection observer triggering
    await act(async () => {
      intersectionCallback?.([createMockEntry(img, true)]);
    });

    await act(async () => {
      vi.runOnlyPendingTimers();
    });

    // Simulate first image load error
    await act(async () => {
      fireEvent.error(img);
    });

    // Avançar o tempo do retryDelay (10ms)
    await act(async () => {
      vi.advanceTimersByTime(15);
    });

    // Simulate second error (after retry)
    await act(async () => {
      fireEvent.error(img);
    });

    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('shows error placeholder after all retries fail', async () => {
    render(<LazyImage {...defaultProps} retryAttempts={0} retryDelay={10} />);
    const img = screen.getByRole('img');

    // Simulate intersection observer triggering
    await act(async () => {
      intersectionCallback?.([createMockEntry(img, true)]);
    });

    await act(async () => {
      vi.runOnlyPendingTimers();
    });

    // Simulate image load error (no retries, should fail immediately)
    await act(async () => {
      fireEvent.error(img);
    });

    // Check that error placeholder is shown
    const src = img.getAttribute('src');
    expect(src).toContain('data:image/svg+xml');
    // Decode base64 to check content
    if (src && src.includes('base64,')) {
      const base64Content = src.split('base64,')[1];
      const decodedContent = atob(base64Content);
      expect(decodedContent).toContain('gradError');
    }
  });

  it('uses custom placeholder when provided', () => {
    const customPlaceholder = 'https://example.com/placeholder.jpg';
    render(<LazyImage {...defaultProps} placeholder={customPlaceholder} />);
    const img = screen.getByRole('img');

    expect(img.getAttribute('src')).toBe(customPlaceholder);
  });

  it('applies custom className', () => {
    const customClass = 'custom-image-class';
    render(<LazyImage {...defaultProps} className={customClass} />);
    const img = screen.getByRole('img');

    expect(img).toHaveClass(customClass);
  });

  it('sets up intersection observer with correct options', () => {
    render(<LazyImage {...defaultProps} />);

    expect(mockIntersectionObserver).toHaveBeenCalledTimes(1);
    expect(mockIntersectionObserver.mock.calls[0]?.[0]).toEqual(expect.any(Function));
    expect(mockIntersectionObserver.mock.calls[0]?.[1]).toEqual({
      rootMargin: '200px',
      threshold: 0.01,
    });
  });

  it('disconnects intersection observer after image comes into view', () => {
    render(<LazyImage {...defaultProps} />);
    const img = screen.getByRole('img');

    // Simulate intersection observer triggering
    act(() => {
      intersectionCallback?.([createMockEntry(img, true)]);
    });

    const observerInstance = mockIntersectionObserver.mock.calls[0]?.[2] as MockIntersectionObserver | undefined;
    expect(observerInstance?.disconnect).toHaveBeenCalled();
  });
});
