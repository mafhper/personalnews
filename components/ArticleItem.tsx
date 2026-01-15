import React, { memo, useEffect } from "react";
import type { Article } from "../types";
import { ArticleImage } from "./ArticleImage";
import { FavoriteButton } from "./FavoriteButton";
import { usePerformance } from "../hooks/usePerformance";
import { useArticleLayout } from "../hooks/useArticleLayout";
import { useAppearance } from "../hooks/useAppearance";
import { ArticleItemLight } from "./ArticleItemLight";

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
  className?: string; // Added className support
  onClick?: (article: Article) => void;
  renderMode?: "light" | "full";
}

const ArticleItemFull: React.FC<ArticleItemProps> = ({
  article,
  index = 0,
  timeFormat = "24h",
  layoutMode,
  className = "",
  onClick,
}) => {
  const { startRenderTiming, endRenderTiming } = usePerformance();
  const { settings: layoutSettings } = useArticleLayout();
  const { contentConfig } = useAppearance();

  // Start performance measurement
  useEffect(() => {
    startRenderTiming();
    return () => {
      endRenderTiming();
    };
  }, [startRenderTiming, endRenderTiming]);

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

  const isHorizontal = layoutMode === 'list' || layoutMode === 'minimal';

  return (
    <article className={`h-full flex flex-col transition-all duration-300 ${className}`}>
      {/* Grid layout optimized for cards */}
      <div className={`
        flex h-full group transition-all duration-300
        ${isHorizontal ? 'flex-row gap-6 p-5 bg-[rgb(var(--color-surface))]/80' : 'flex-col p-5 bg-[rgb(var(--color-surface))]/40'}
        backdrop-blur-xl
        rounded-2xl border border-white/20
        hover:bg-[rgb(var(--color-surface))] hover:border-[rgb(var(--color-accent))]/40
        hover:shadow-2xl hover:shadow-black/60
      `}>
        {/* Article image - Always render container */}
        <div className={`relative bg-gray-800/50 rounded-xl overflow-hidden ${isHorizontal ? 'w-28 sm:w-40 h-20 sm:h-28 shrink-0 mb-0' : 'h-40 sm:h-32 lg:h-44 mb-4'}`}>
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
              fill={true}
              className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
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
            className="top-2 right-2 z-10 opacity-0 group-hover:opacity-100 shadow-lg bg-black/20 hover:bg-black/40 transition-all"
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
                <span className="inline-block bg-[rgb(var(--color-accent))] text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-[0.1em] truncate max-w-full shadow-md shadow-black/40">
                  {article.sourceTitle}
                </span>
              </div>
            )}

            {/* Title with better text wrapping */}
            <h4 className="font-bold text-base lg:text-lg leading-snug group-hover:text-white text-gray-100 mb-2 line-clamp-3 transition-colors">
              {article.title}
            </h4>

            {article.description && (
              <p className="text-gray-300/90 group-hover:text-gray-100 text-sm mt-1 mb-3 line-clamp-2 leading-relaxed font-medium transition-colors">
                {article.description}
              </p>
            )}

            {/* Article metadata */}
            <div className={`space-y-2 ${isHorizontal ? '' : 'mt-auto'}`}>
              <div className="flex items-center justify-between text-xs font-bold text-white transition-colors">
                {contentConfig.showAuthor && article.author && (
                  <span
                    className="truncate max-w-[150px] bg-black/40 px-2 py-0.5 rounded shadow-sm"
                    aria-label={`Author: ${article.author}`}
                    title={article.author}
                  >
                    Por {article.author}
                  </span>
                )}
              </div>
              {(contentConfig.showDate || contentConfig.showTime) && (
                <time
                  className="text-white/80 font-bold text-[10px] block group-hover:text-white transition-colors bg-white/5 self-start px-2 py-0.5 rounded italic"
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

const ArticleItemWrapper: React.FC<ArticleItemProps> = (props) => {
  if (props.renderMode === "light") {
    return <ArticleItemLight {...props} />;
  }
  return <ArticleItemFull {...props} />;
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

  if (prevProps.renderMode !== nextProps.renderMode) {
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
export const ArticleItem = memo(ArticleItemWrapper, arePropsEqual);