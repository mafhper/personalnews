import React from "react";
import type { Article } from "../types";
import { useArticleLayout } from "../hooks/useArticleLayout";
import { OptimizedImage } from "./OptimizedImage";
import { FavoriteButton } from "./FavoriteButton";
import { sanitizeArticleDescription } from "../utils/sanitization";

// ChatBubbleIcon removed as it's no longer used

export const FeaturedArticle: React.FC<{
  article: Article;
  timeFormat?: "12h" | "24h";
  onClick?: (article: Article) => void;
}> = ({ article, timeFormat = "24h", onClick }) => {
  const { settings: layoutSettings } = useArticleLayout();
  const authorLabel =
    article.author && article.author !== article.sourceTitle
      ? article.author
      : undefined;

  if (!article) return null;

  return (
    <article
      className="h-full"
      role="article"
      aria-labelledby="featured-article-title"
    >
      <div className="relative group h-full overflow-hidden rounded-2xl">
        <button
          type="button"
          className="block relative h-full w-full overflow-hidden bg-transparent p-0 text-left"
          aria-label={`Read featured article: ${article.title} from ${
            authorLabel || article.sourceTitle
          }`}
          onClick={() => onClick?.(article)}
        >
          <OptimizedImage
            src={article.imageUrl}
            alt={`Featured image for article: ${article.title}`}
            className="w-full h-full object-cover object-center"
            fallbackText={article.sourceTitle}
            width={1200}
            height={800}
            priority={true}
          />
          <div
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,6,10,0.14)_0%,rgba(4,6,10,0.28)_24%,rgba(4,6,10,0.72)_62%,rgba(4,6,10,0.96)_100%)]"
            aria-hidden="true"
          ></div>
          <div
            className="absolute inset-y-0 left-0 w-full sm:w-[85%] bg-[linear-gradient(90deg,rgba(3,5,8,0.92)_0%,rgba(3,5,8,0.7)_45%,rgba(3,5,8,0)_100%)] pointer-events-none"
            aria-hidden="true"
          ></div>

          {/* Source badge */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 feed-overlay-chip truncate max-w-[150px] sm:max-w-[200px]">
            {article.sourceTitle}
          </div>

          {/* Favorite button - positioned with adequate spacing inside image bounds */}
          <FavoriteButton
            article={article}
            size="large"
            position="overlay"
            className="top-3 right-3 z-20 hover:scale-110 active:scale-95 transition-all duration-200 ease-in-out opacity-0 group-hover:opacity-100"
          />

          <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 lg:p-8 xl:p-10 text-white">
            <div className="max-w-4xl px-1 py-1 sm:px-2 sm:py-2 md:px-3">
              <h3
                id="featured-article-title"
                className="feed-overlay-title feed-title feed-title-hero text-xl text-white transition-all duration-300 sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl"
                style={{
                  textShadow: "0 6px 18px rgba(0,0,0,0.88)",
                  maxWidth: "100%",
                  overflowWrap: "break-word",
                }}
              >
                <span className="feed-link-affordance">{article.title}</span>
              </h3>
              <div className="mt-3 max-w-4xl md:mt-5 lg:mt-6">
                <p
                  className="feed-overlay-desc block text-sm leading-relaxed text-white/94 line-clamp-2 md:line-clamp-none md:text-base lg:text-lg xl:text-xl"
                  style={{ textShadow: "0 4px 14px rgba(0,0,0,0.82)" }}
                >
                  <span className="feed-image-subtitle-band">
                    {sanitizeArticleDescription(article.description || "")}
                  </span>
                </p>
              </div>
              <footer
                className="feed-overlay-meta mt-4 flex min-w-0 flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-white/90 lg:mt-8 lg:gap-4 lg:text-xs"
                style={{ textShadow: "0 3px 10px rgba(0,0,0,0.78)" }}
              >
                {authorLabel && (
                  <span
                    className="max-w-[200px] truncate sm:max-w-[300px]"
                    aria-label={`Author: ${authorLabel}`}
                  >
                    {authorLabel}
                  </span>
                )}
                {authorLabel && (
                  <span
                    className="font-normal text-white/50"
                    aria-hidden="true"
                  >
                    •
                  </span>
                )}
                <time
                  className="drop-shadow-md"
                  dateTime={article.pubDate.toISOString()}
                  aria-label={`Published on ${article.pubDate.toLocaleDateString()}`}
                >
                  {layoutSettings.showPublicationTime
                    ? timeFormat === "12h"
                      ? `${article.pubDate.toLocaleDateString()} às ${article.pubDate.toLocaleTimeString(
                          "pt-BR",
                          { hour: "2-digit", minute: "2-digit", hour12: true },
                        )}`
                      : `${article.pubDate.toLocaleDateString()} às ${article.pubDate.toLocaleTimeString(
                          "pt-BR",
                          { hour: "2-digit", minute: "2-digit", hour12: false },
                        )}`
                    : article.pubDate.toLocaleDateString()}
                </time>
              </footer>
            </div>
          </div>
        </button>
      </div>
    </article>
  );
};
