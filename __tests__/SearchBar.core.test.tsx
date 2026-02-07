/** @vitest-environment jsdom */
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { SearchBar } from '../components/SearchBar';
import { Article } from '../types';

// Estender expect com matchers do jest-dom
expect.extend(matchers);

// Mock sanitization to avoid DOMPurify issues in tests
vi.mock('../utils/sanitization', () => ({
  sanitizeHtmlContent: (html: string) => html
}));

const mockArticles: Article[] = [
  {
    title: 'Test Article',
    link: 'https://example.com/test',
    pubDate: new Date('2024-01-15'),
    sourceTitle: 'Test Source',
    description: 'Test description',
    categories: ['Test']
  },
  {
    title: 'Another Article',
    link: 'https://example.com/another',
    pubDate: new Date('2024-01-16'),
    sourceTitle: 'Another Source',
    description: 'Another description',
    categories: ['Tech']
  }
];

describe('SearchBar Component', () => {
  let mockOnSearch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockOnSearch = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('renders without crashing', async () => {
    await act(async () => {
      render(
        <SearchBar
          articles={mockArticles}
          onSearch={mockOnSearch}
        />
      );
    });
  });

  it('displays search input with correct placeholder', async () => {
    await act(async () => {
      render(
        <SearchBar
          articles={mockArticles}
          onSearch={mockOnSearch}
          placeholder="Custom placeholder"
        />
      );
    });

    const input = screen.getByRole('combobox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Custom placeholder');
  });

  it('calls onSearch when Enter is pressed', async () => {
    await act(async () => {
      render(
        <SearchBar
          articles={mockArticles}
          onSearch={mockOnSearch}
        />
      );
    });

    const input = screen.getByRole('combobox');
    
    act(() => {
      fireEvent.change(input, { target: { value: 'test query' } });
      // Executar todos os timers pendentes (debounce de 300ms)
      vi.runAllTimers();
    });
    
    act(() => {
      fireEvent.keyDown(input, { key: 'Enter' });
    });

    expect(mockOnSearch).toHaveBeenCalledWith('test query', expect.any(Object));
  });
});
