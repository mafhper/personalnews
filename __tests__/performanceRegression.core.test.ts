/**
 * [CORE][PERF] Performance Regression Suite
 * 
 * Purpose:
 * - Detect if core logic becomes significantly slower.
 * - Enforce performance budgets for critical functions (Search, Indexing).
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildSearchIndex, searchArticles } from "../services/searchUtils";
import { Article } from "../types";

// Helper to generate large number of articles
function generateArticles(count: number): Article[] {
  return Array.from({ length: count }, (_, i) => ({
    title: `Article Title ${i} with some extra text to make it realistic`,
    link: `https://example.com/article-${i}`,
    pubDate: new Date(),
    sourceTitle: `Source ${i % 5}`,
    description: `Description for article ${i}. This contains keywords like tech, news, and personal to test search quality and speed.`,
    categories: ["Tech", "News"]
  }));
}

describe("[CORE][PERF] performance budgets", () => {
  const LARGE_DATASET = generateArticles(1000);

  beforeEach(() => {
    vi.useRealTimers(); // Medição de tempo real
  });

  it("should build search index for 1000 articles in less than 100ms", () => {
    const start = performance.now();
    
    buildSearchIndex(LARGE_DATASET);
    
    const duration = performance.now() - start;
    
    // Budget: 100ms (ajustável conforme ambiente de CI)
    expect(duration).toBeLessThan(100);
  });

  it("should perform search on 1000 articles in less than 100ms", () => {
    const index = buildSearchIndex(LARGE_DATASET);
    
    const start = performance.now();
    
    const results = searchArticles(index, "tech news", { includeTitle: true, includeContent: true });
    
    const duration = performance.now() - start;
    
    // Budget: 100ms
    expect(duration).toBeLessThan(100);
    expect(results.length).toBeGreaterThan(0);
  });
});
