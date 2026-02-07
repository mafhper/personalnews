import { useState, useEffect, useCallback, useMemo } from 'react';
import { Article } from '../types';
import {
  buildSearchIndex,
  searchArticles,
  SearchIndex,
  SearchOptions,
  SearchResult
} from '../services/searchUtils';

export interface UseSearchOptions extends SearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
}

export interface UseSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: SearchResult[];
  isSearching: boolean;
  hasResults: boolean;
  searchIndex: SearchIndex | null;
}

/**
 * Custom hook for debounced search functionality
 */
export function useSearch(
  articles: Article[],
  options: UseSearchOptions = {}
): UseSearchReturn {
  const {
    debounceMs = 300,
    minQueryLength = 2,
    ...searchOptions
  } = options;

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  
  // Derived state
  const isSearching = query !== debouncedQuery;

  // Build search index when articles change
  const searchIndex = useMemo(() => {
    if (articles.length === 0) return null;
    return buildSearchIndex(articles);
  }, [articles]);

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [query, debounceMs]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (!searchIndex || !debouncedQuery.trim() || debouncedQuery.length < minQueryLength) {
      // Use setTimeout instead of requestAnimationFrame for background tab compatibility
      // requestAnimationFrame is paused in inactive tabs, causing delays
      const timeoutId = setTimeout(() => setResults([]), 0);
      return () => clearTimeout(timeoutId);
    }

    // Reconstruct options to avoid dependency on the unstable searchOptions object
    const effectiveOptions: SearchOptions = {
      includeTitle: searchOptions.includeTitle,
      includeContent: searchOptions.includeContent,
      includeCategories: searchOptions.includeCategories,
      includeSource: searchOptions.includeSource,
      fuzzyThreshold: searchOptions.fuzzyThreshold
    };

    const searchResults = searchArticles(searchIndex, debouncedQuery, effectiveOptions);
    // Use setTimeout instead of requestAnimationFrame for background tab compatibility
    const timeoutId = setTimeout(() => setResults(searchResults), 0);
    return () => clearTimeout(timeoutId);
  }, [
    searchIndex,
    debouncedQuery,
    minQueryLength,
    searchOptions.includeTitle,
    searchOptions.includeContent,
    searchOptions.includeCategories,
    searchOptions.includeSource,
    searchOptions.fuzzyThreshold
  ]);

  const hasResults = results.length > 0;

  return {
    query,
    setQuery,
    results,
    isSearching,
    hasResults,
    searchIndex
  };
}

/**
 * Hook for search history management
 */
export function useSearchHistory(maxHistory: number = 10) {
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('searchHistory');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addToHistory = useCallback((query: string) => {
    if (!query.trim()) return;

    setSearchHistory(prev => {
      const filtered = prev.filter(item => item !== query);
      const newHistory = [query, ...filtered].slice(0, maxHistory);

      try {
        localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      } catch {
        // Handle localStorage errors silently
      }

      return newHistory;
    });
  }, [maxHistory]);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    try {
      localStorage.removeItem('searchHistory');
    } catch {
      // Handle localStorage errors silently
    }
  }, []);

  return {
    searchHistory,
    addToHistory,
    clearHistory
  };
}

/**
 * Hook for search suggestions based on article content
 */
export function useSearchSuggestions(
  searchIndex: SearchIndex | null,
  query: string,
  maxSuggestions: number = 5
): string[] {
  const suggestions = useMemo(() => {
    if (!searchIndex || !query.trim() || query.length < 2) {
      return [];
    }

    const queryLower = query.toLowerCase();
    const suggestionSet = new Set<string>();

    // Get suggestions from title index
    searchIndex.titleIndex.forEach((_, word) => {
      if (word.startsWith(queryLower) && word !== queryLower) {
        suggestionSet.add(word);
      }
    });

    // Get suggestions from category index
    searchIndex.categoryIndex.forEach((_, word) => {
      if (word.startsWith(queryLower) && word !== queryLower) {
        suggestionSet.add(word);
      }
    });

    const sortedSuggestions = Array.from(suggestionSet)
      .sort((a, b) => a.length - b.length)
      .slice(0, maxSuggestions);

    return sortedSuggestions;
  }, [searchIndex, query, maxSuggestions]);

  return suggestions;
}
