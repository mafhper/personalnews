/**
 * FeedContent.tsx
 *
 * Componente principal para exibição de artigos no Personal News Dashboard.
 * Organiza os artigos em seções: artigo em destaque, notícias recentes e top stories.
 * Suporta múltiplos layouts e paginação.
 *
 * @author Matheus Pereira
 * @version 2.0.0
 */

import React, { useMemo } from "react";
import type { Article } from "../types";
import { FeaturedArticle } from "./FeaturedArticle";
import { ArticleItem } from "./ArticleItem";
import { FavoriteButton } from "./FavoriteButton";
import { withPerformanceTracking } from "../services/performanceUtils";
import { useArticleLayout } from "../hooks/useArticleLayout";
import { SmallOptimizedImage } from "./SmallOptimizedImage";

interface FeedContentProps {
  articles: Article[];
  timeFormat: "12h" | "24h";
}

// Component for recent articles
const RecentArticleItem: React.FC<{
  article: Article;
  timeFormat: "12h" | "24h";
  showTime: boolean;
}> = ({ article, timeFormat, showTime }) => {
  return (
    <article className="relative w-full h-full min-h-0 overflow-hidden rounded-xl group cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      <a
        href={article.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full h-full"
        aria-label={`Read article: ${article.title}`}
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <SmallOptimizedImage
            src={article.imageUrl}
            alt={`Thumbnail for ${article.title}`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            fallbackText={article.sourceTitle}
            size={400}
          />
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent opacity-90 group-hover:opacity-80 transition-opacity duration-300 rounded-xl" />

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-2 z-10 flex flex-col justify-end h-full">
          {/* Meta Info */}
          <div className="flex items-center space-x-2 text-[10px] text-gray-300 mb-0.5">
            <span className="text-[rgb(var(--color-accent))] font-bold uppercase tracking-wider text-[9px]">
              {article.sourceTitle}
            </span>
            {showTime && (
              <>
                <span className="w-1 h-1 rounded-full bg-gray-500"></span>
                <time dateTime={article.pubDate.toISOString()} className="opacity-80">
                  {timeFormat === "12h"
                    ? article.pubDate.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : article.pubDate.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                </time>
              </>
            )}
          </div>

          {/* Title */}
          <h3 className="text-xs md:text-sm font-bold text-white leading-snug line-clamp-2 mb-0.5 group-hover:text-[rgb(var(--color-primary))] transition-colors">
            {article.title}
          </h3>

          {/* Author */}
          {article.author && article.author.trim() !== "" && (
            <div className="text-[9px] text-gray-400 font-medium truncate opacity-80">
              Por: {article.author}
            </div>
          )}
        </div>

        {/* Favorite Button */}
        <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <FavoriteButton
            article={article}
            size="small"
            position="overlay"
            className="bg-black/50 hover:bg-black/70 backdrop-blur-sm scale-75 origin-top-right"
            aria-label={`Toggle favorite for ${article.title}`}
          />
        </div>
      </a>
    </article>
  );
};

const FeedContentComponent: React.FC<FeedContentProps> = ({
  articles,
  timeFormat,
}) => {
  const [topStoriesLayout, setTopStoriesLayout] = React.useState<
    "grid" | "list"
  >("grid");

  // Get layout settings
  const { settings: layoutSettings } = useArticleLayout();

  // Memoize the featured article and other articles to prevent unnecessary re-renders
  const featuredArticle = useMemo(() => articles[0], [articles]);
  const otherArticles = useMemo(() => articles.slice(1), [articles]);

  // Dynamic article distribution based on user settings
  const recentArticles = useMemo(() => {
    // Show 6 recent articles as requested
    return otherArticles.slice(0, Math.min(6, otherArticles.length));
  }, [otherArticles]);

  const topStoriesArticles = useMemo(() => {
    // Show configured number of top stories articles
    const startIndex = recentArticles.length;
    const endIndex = startIndex + layoutSettings.topStoriesCount;
    return otherArticles.slice(startIndex, endIndex);
  }, [otherArticles, recentArticles.length, layoutSettings.topStoriesCount]);

  if (articles.length === 0) {
    return null;
  }

  return (
    <div
      className="space-y-8 lg:space-y-12"
      role="main"
      aria-label="News articles"
    >
      {/* Main content section - Featured article + Recent news summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8 xl:gap-12 lg:items-stretch">
        {/* Featured Article - Half width */}
        <section
          aria-labelledby="featured-article-heading"
          className="flex flex-col"
        >
          <h2 id="featured-article-heading" className="sr-only">
            Featured Article
          </h2>
          <div className="h-[50vh] md:h-[55vh] lg:h-[60vh] xl:h-[65vh] min-h-[400px] max-h-[600px] flex-1">
            <FeaturedArticle
              article={featuredArticle}
              timeFormat={timeFormat}
            />
          </div>
        </section>

        {/* Recent News Summary - Right side */}
        <aside
          className="flex flex-col h-[50vh] md:h-[55vh] lg:h-[60vh] xl:h-[65vh] min-h-[350px] max-h-[600px]"
          role="complementary"
          aria-labelledby="recent-news-heading"
        >
          <div className="flex items-center justify-between mb-4 lg:mb-6 recent-news-header">
            <h2
              id="recent-news-heading"
              className="text-xl lg:text-2xl font-bold text-[rgb(var(--color-accent))] uppercase tracking-wider"
            >
              Últimas Notícias
            </h2>
            <div className="text-sm text-gray-400">
              {recentArticles.length} artigos
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <div className="grid grid-cols-2 grid-rows-3 gap-2 h-full">
              {recentArticles.map((article, index) => (
                <RecentArticleItem
                  key={`${article.link}-${index}`}
                  article={article}
                  timeFormat={timeFormat}
                  showTime={layoutSettings.showPublicationTime}
                />
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Top Stories section - Below main content with layout options */}
      {layoutSettings.topStoriesCount > 0 && (
        <section aria-labelledby="top-stories-heading" className="w-full">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center justify-between sm:justify-start">
              <h2
                id="top-stories-heading"
                className="text-xl sm:text-2xl lg:text-3xl font-bold text-[rgb(var(--color-accent))] uppercase tracking-wider"
              >
                Top Stories
              </h2>
              <div className="text-sm text-gray-400 sm:hidden">
                {topStoriesArticles.length} artigos
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end space-x-4">
              <div className="hidden sm:block text-sm text-gray-400">
                {topStoriesArticles.length} artigos
              </div>
              {/* Layout toggle buttons */}
              <div className="flex bg-gray-800 rounded-md overflow-hidden">
                <button
                  onClick={() => setTopStoriesLayout("grid")}
                  className={`px-2 sm:px-3 py-2 text-xs font-medium transition-colors touch-target ${
                    topStoriesLayout === "grid"
                      ? "bg-[rgb(var(--color-accent))] text-white"
                      : "text-gray-300 hover:text-white hover:bg-gray-700"
                  }`}
                  style={{ minHeight: "44px", minWidth: "44px" }}
                  aria-label="Grid layout"
                  title="Exibição em grade"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setTopStoriesLayout("list")}
                  className={`px-2 sm:px-3 py-2 text-xs font-medium transition-colors touch-target ${
                    topStoriesLayout === "list"
                      ? "bg-[rgb(var(--color-accent))] text-white"
                      : "text-gray-300 hover:text-white hover:bg-gray-700"
                  }`}
                  style={{ minHeight: "44px", minWidth: "44px" }}
                  aria-label="List layout"
                  title="Exibição em lista"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Top Stories content with layout switching */}
          {topStoriesLayout === "grid" ? (
            /* Grid layout */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
              {topStoriesArticles.map((article, index) => (
                <div
                  key={article.link + index}
                  className="bg-gray-800/50 rounded-lg p-4 lg:p-6 border border-gray-700/50 hover:border-gray-600/50 grid-card group"
                >
                  <ArticleItem
                    article={article}
                    index={index + 2}
                    timeFormat={timeFormat}
                  />
                </div>
              ))}
            </div>
          ) : (
            /* List layout */
            <div className="space-y-4">
              {topStoriesArticles.map((article, index) => (
                <article
                  key={article.link + index}
                  className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30 hover:bg-gray-800/50 hover:border-gray-600/50 transition-all duration-200"
                >
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-4 group"
                    aria-label={`Read article: ${article.title}`}
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm font-bold text-gray-300 group-hover:bg-[rgb(var(--color-accent))] group-hover:text-white transition-colors">
                      {index + 2}
                    </div>
                    <SmallOptimizedImage
                      src={article.imageUrl}
                      alt={`Thumbnail for ${article.title}`}
                      className="rounded-md"
                      fallbackText={article.sourceTitle}
                      size={64} // w-16 h-16 = 64px
                    />
                    <div className="flex-1 min-w-0">
                      <div className="mb-1">
                        <span className="inline-block bg-[rgb(var(--color-accent))]/20 text-[rgb(var(--color-accent))] px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide">
                          {article.sourceTitle}
                        </span>
                      </div>
                      <h3 className="text-base lg:text-lg font-medium text-gray-200 group-hover:text-white line-clamp-2 leading-tight">
                        {article.title}
                      </h3>
                      <div className="mt-2 flex items-center space-x-3 text-xs text-gray-400">
                        <time dateTime={article.pubDate.toISOString()}>
                          {layoutSettings.showPublicationTime
                            ? timeFormat === "12h"
                              ? `${article.pubDate.toLocaleDateString()} às ${article.pubDate.toLocaleTimeString(
                                  "pt-BR",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  }
                                )}`
                              : `${article.pubDate.toLocaleDateString()} às ${article.pubDate.toLocaleTimeString(
                                  "pt-BR",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: false,
                                  }
                                )}`
                            : article.pubDate.toLocaleDateString()}
                        </time>
                        {article.author && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[120px]">
                              {article.author}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </a>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

// Export the component wrapped with performance monitoring
export const FeedContent = withPerformanceTracking(
  FeedContentComponent,
  "FeedContent"
);
