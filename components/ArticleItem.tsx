import React, { memo, useEffect, useCallback } from "react";
import type { Article } from "../types";
import { ArticleImage } from "./ArticleImage";
import { FavoriteButton } from "./FavoriteButton";
import { usePerformance } from "../hooks/usePerformance";
import { useFavorites } from "../hooks/useFavorites";
import { useArticleLayout } from "../hooks/useArticleLayout";
import { useAppearance } from "../hooks/useAppearance";

const ChatBubbleIcon: React.FC = memo(() => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-3 w-3"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H9.828a1 1 0 00-.707.293l-2.828 2.828a1 1 0 01-1.414 0l-2.828-2.828A1 1 0 002.172 17H4a2 2 0 01-2-2V5z" />
  </svg>
));

ChatBubbleIcon.displayName = "ChatBubbleIcon";

const HeartIcon: React.FC<{ filled?: boolean }> = memo(({ filled = false }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-3 w-3"
    fill={filled ? "currentColor" : "none"}
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
    />
  </svg>
));

HeartIcon.displayName = "HeartIcon";

interface ArticleItemProps {
  article: Article;
  index?: number;
  timeFormat?: "12h" | "24h";
  layoutMode?: string;
  density?: string;
  showImage?: boolean;
  onClick?: (article: Article) => void;
}

const ArticleItemComponent: React.FC<ArticleItemProps> = ({
  article,
  index = 0,
  timeFormat = "24h",
  onClick,
}) => {
  const { startRenderTiming, endRenderTiming } = usePerformance();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { settings: layoutSettings } = useArticleLayout();
  const { contentConfig } = useAppearance();
  
  // Start performance measurement
  useEffect(() => {
    startRenderTiming();
    return () => {
      endRenderTiming();
    };
  }, [startRenderTiming, endRenderTiming]);

  const isFavorited = isFavorite(article);

  const handleToggleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFavorite(article);
    },
    [toggleFavorite, article]
  );
  
  const timeSince = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };
  
  return (
    <article className="h-full flex flex-col">
      {/* Grid layout optimized for cards */}
      <div className="flex flex-col h-full group">
        {/* Article image - Always render container */}
        <div className="relative mb-4 bg-gray-800 rounded-lg overflow-hidden h-40 sm:h-32 lg:h-40">
            <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                    if (onClick) {
                        e.preventDefault();
                        onClick(article);
                    }
                }}
                className="block w-full h-full cursor-pointer"
                aria-hidden="true" 
                tabIndex={-1} 
            >
                <ArticleImage
                    article={article}
                    width={400}
                    height={200}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
            </a>

            {/* Article number overlay */}
            <div className="absolute top-2 left-2 bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold pointer-events-none z-10">
                {index}
            </div>

            {/* Favorite button overlay */}
            <FavoriteButton
                article={article}
                size="medium"
                position="overlay"
                className="top-2 right-2 z-10 opacity-0 group-hover:opacity-100"
            />
        </div>

        {/* Article content */}
        <div className="flex-1 flex flex-col">
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex flex-col group"
            onClick={(e) => {
              if (onClick) {
                e.preventDefault();
                onClick(article);
              }
            }}
            aria-label={`Article: ${article.title} from ${article.author || article.sourceTitle
              }`}
          >
            {/* Source badge */}
            {contentConfig.showTags && (
              <div className="mb-2">
                <span className="inline-block bg-[rgb(var(--color-accent))]/20 text-[rgb(var(--color-accent))] px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide truncate max-w-full">
                  {article.sourceTitle}
                </span>
              </div>
            )}

            {/* Title with better text wrapping */}
            <h4 className="font-bold text-base lg:text-lg leading-tight group-hover:underline text-gray-100 mb-3 line-clamp-3">
              {article.title}
            </h4>

            {/* Article metadata */}
            <div className="mt-auto space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-400">
                {contentConfig.showAuthor && article.author && (
                  <span
                    className="truncate max-w-[120px]"
                    aria-label={`Author: ${article.author}`}
                    title={article.author}
                  >
                    {article.author}
                  </span>
                )}
              </div>
              {(contentConfig.showDate || contentConfig.showTime) && (
                <time
                  className="text-gray-500 text-xs block"
                  dateTime={article.pubDate.toISOString()}
                  aria-label={`Published ${timeSince(article.pubDate)}`}
                >
                  {layoutSettings.showPublicationTime || contentConfig.showTime
                    ? (timeFormat === "12h"
                      ? `${article.pubDate.toLocaleDateString()} às ${article.pubDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: true })}`
                      : `${article.pubDate.toLocaleDateString()} às ${article.pubDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false })}`)
                    : timeSince(article.pubDate)
                  }
                </time>
              )}
            </div>
          </a>
        </div>
      </div>
    </article>
  );
};

// Custom comparison function for React.memo
const arePropsEqual = (
  prevProps: ArticleItemProps,
  nextProps: ArticleItemProps
): boolean => {
  // Compare index
  if (prevProps.index !== nextProps.index) {
    return false;
  }

  // Compare article properties that affect rendering
  const prevArticle = prevProps.article;
  const nextArticle = nextProps.article;

  return (
    prevArticle.title === nextArticle.title &&
    prevArticle.link === nextArticle.link &&
    prevArticle.pubDate.getTime() === nextArticle.pubDate.getTime() &&
    prevArticle.sourceTitle === nextArticle.sourceTitle &&
    prevArticle.imageUrl === nextArticle.imageUrl &&
    prevArticle.author === nextArticle.author
  );
};

// Export memoized component
export const ArticleItem = memo(ArticleItemComponent, arePropsEqual);