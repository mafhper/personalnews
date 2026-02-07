import { Article } from '../types';

export interface SearchIndex {
  articles: Map<string, Article>;
  titleIndex: Map<string, string[]>;
  contentIndex: Map<string, string[]>;
  categoryIndex: Map<string, string[]>;
  sourceIndex: Map<string, string[]>;
  lastUpdated: number;
}

export interface SearchOptions {
  includeTitle?: boolean;
  includeContent?: boolean;
  includeCategories?: boolean;
  includeSource?: boolean;
  fuzzyThreshold?: number;
}

export interface SearchResult {
  article: Article;
  score: number;
  matchedFields: string[];
}

/**
 * Creates a search index from an array of articles
 */
export function buildSearchIndex(articles: Article[]): SearchIndex {
  const searchIndex: SearchIndex = {
    articles: new Map(),
    titleIndex: new Map(),
    contentIndex: new Map(),
    categoryIndex: new Map(),
    sourceIndex: new Map(),
    lastUpdated: Date.now()
  };

  articles.forEach((article, index) => {
    const articleId = `${article.link}-${index}`;
    searchIndex.articles.set(articleId, article);

    // Index title words
    const titleWords = tokenize(article.title);
    titleWords.forEach(word => {
      if (!searchIndex.titleIndex.has(word)) {
        searchIndex.titleIndex.set(word, []);
      }
      searchIndex.titleIndex.get(word)!.push(articleId);
    });

    // Index content words (description)
    if (article.description) {
      const contentWords = tokenize(article.description);
      contentWords.forEach(word => {
        if (!searchIndex.contentIndex.has(word)) {
          searchIndex.contentIndex.set(word, []);
        }
        searchIndex.contentIndex.get(word)!.push(articleId);
      });
    }

    // Index categories
    if (article.categories) {
      article.categories.forEach(category => {
        const categoryWords = tokenize(category);
        categoryWords.forEach(word => {
          if (!searchIndex.categoryIndex.has(word)) {
            searchIndex.categoryIndex.set(word, []);
          }
          searchIndex.categoryIndex.get(word)!.push(articleId);
        });
      });
    }

    // Index source
    const sourceWords = tokenize(article.sourceTitle);
    sourceWords.forEach(word => {
      if (!searchIndex.sourceIndex.has(word)) {
        searchIndex.sourceIndex.set(word, []);
      }
      searchIndex.sourceIndex.get(word)!.push(articleId);
    });
  });

  return searchIndex;
}

/**
 * Tokenizes text into searchable words
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
}

/**
 * Performs fuzzy search on the search index
 */
export function searchArticles(
  searchIndex: SearchIndex,
  query: string,
  options: SearchOptions = {}
): SearchResult[] {
  const {
    includeTitle = true,
    includeContent = true,
    includeCategories = true,
    includeSource = true,
    fuzzyThreshold = 0.6
  } = options;

  if (!query.trim()) {
    return [];
  }

  const queryWords = tokenize(query);
  const articleScores = new Map<string, { score: number; matchedFields: Set<string> }>();

  queryWords.forEach(queryWord => {
    // Search in titles
    if (includeTitle) {
      searchInIndex(searchIndex.titleIndex, queryWord, fuzzyThreshold, articleScores, 'title', 3);
    }

    // Search in content
    if (includeContent) {
      searchInIndex(searchIndex.contentIndex, queryWord, fuzzyThreshold, articleScores, 'content', 1);
    }

    // Search in categories
    if (includeCategories) {
      searchInIndex(searchIndex.categoryIndex, queryWord, fuzzyThreshold, articleScores, 'category', 2);
    }

    // Search in source
    if (includeSource) {
      searchInIndex(searchIndex.sourceIndex, queryWord, fuzzyThreshold, articleScores, 'source', 1.5);
    }
  });

  // Convert to results and sort by score
  const results: SearchResult[] = [];
  articleScores.forEach((scoreData, articleId) => {
    const article = searchIndex.articles.get(articleId);
    if (article) {
      results.push({
        article,
        score: scoreData.score,
        matchedFields: Array.from(scoreData.matchedFields)
      });
    }
  });

  return results.sort((a, b) => b.score - a.score);
}

/**
 * Searches within a specific index (title, content, etc.)
 * Optimized for performance
 */
function searchInIndex(
  index: Map<string, string[]>,
  queryWord: string,
  fuzzyThreshold: number,
  articleScores: Map<string, { score: number; matchedFields: Set<string> }>,
  fieldName: string,
  weight: number
): void {
  // Optimization: Check for exact match first
  if (index.has(queryWord)) {
    const articleIds = index.get(queryWord)!;
    articleIds.forEach(articleId => {
      if (!articleScores.has(articleId)) {
        articleScores.set(articleId, { score: 0, matchedFields: new Set() });
      }
      const current = articleScores.get(articleId)!;
      current.score += 1 * weight; // Exact match = similarity 1
      current.matchedFields.add(fieldName);
    });
    return;
  }

  // Optimization: For fuzzy search, only check similar-length words
  // This dramatically reduces the search space
  const maxLen = Math.ceil(queryWord.length * 1.3);
  const minLen = Math.floor(queryWord.length * 0.7);
  let fuzzyCandidates = 0;
  const MAX_FUZZY_CANDIDATES = 50; // Limit fuzzy candidates

  index.forEach((articleIds, indexWord) => {
    // Skip if we've already processed too many fuzzy candidates
    if (fuzzyCandidates > MAX_FUZZY_CANDIDATES) return;

    // Optimization: Skip words with significantly different length
    const wordLen = indexWord.length;
    if (wordLen > maxLen || wordLen < minLen) return;

    // Optimization: Check if word shares first letter (prefix heuristic)
    if (indexWord[0] !== queryWord[0]) return;

    fuzzyCandidates++;
    const similarity = calculateSimilarity(queryWord, indexWord);

    if (similarity >= fuzzyThreshold) {
      const score = similarity * weight;

      articleIds.forEach(articleId => {
        if (!articleScores.has(articleId)) {
          articleScores.set(articleId, { score: 0, matchedFields: new Set() });
        }

        const current = articleScores.get(articleId)!;
        current.score += score;
        current.matchedFields.add(fieldName);
      });
    }
  });
}

/**
 * Calculates similarity between two strings using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.includes(str2) || str2.includes(str1)) return 0.9;

  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;

  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLength;
}

/**
 * Calculates Levenshtein distance between two strings
 * Optimized version using less memory allocation
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  // Use two arrays instead of a full matrix to save memory
  let prev = new Array(len2 + 1);
  let curr = new Array(len2 + 1);

  for (let j = 0; j <= len2; j++) prev[j] = j;

  for (let i = 1; i <= len1; i++) {
    curr[0] = i;

    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,      // insertion
        prev[j] + 1,          // deletion
        prev[j - 1] + cost    // substitution
      );
    }

    // Swap arrays
    [prev, curr] = [curr, prev];
  }

  return prev[len2];
}

/**
 * Highlights search terms in text
 */
export function highlightSearchTerms(text: string, query: string): string {
  if (!query.trim()) return text;

  // Split query by spaces but preserve the original terms
  const queryTerms = query.trim().split(/\s+/);
  let highlightedText = text;

  queryTerms.forEach(term => {
    const escapedTerm = escapeRegExp(term);
    const regex = new RegExp(`(${escapedTerm})`, 'gi');
    highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
  });

  return highlightedText;
}

/**
 * Escapes special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
