import React, { memo, useEffect, useRef } from "react";
import type { Article } from "../types";
import { ArticleImage } from "./ArticleImage";
import { FavoriteButton } from "./FavoriteButton";
import { usePerformance } from "../hooks/usePerformance";
import { useArticleLayout } from "../hooks/useArticleLayout";
import { useAppearance } from "../hooks/useAppearance";
import { ArticleItemLight } from "./ArticleItemLight";
import { FeedInteractiveActions } from "./FeedInteractiveActions";
import { FeedResponsiveDate } from "./FeedResponsiveDate";
import { getVideoEmbed } from "../utils/videoEmbed";
import {
  buildMediaOriginFromArticle,
  useMediaPlayback,
} from "../contexts/MediaPlaybackContext";
import { useMediaOriginScope } from "../contexts/MediaOriginScopeContext";

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
  timeFormat = "24h",
  layoutMode,
  className = "",
  onClick,
}) => {
  const { startRenderTiming, endRenderTiming } = usePerformance();
  const { registerMediaItem } = useMediaPlayback();
  const mediaCategoryId = useMediaOriginScope();
  const articleRef = useRef<HTMLElement | null>(null);
  const { settings: layoutSettings } = useArticleLayout();
  const { contentConfig } = useAppearance();
  const authorLabel =
    article.author && article.author !== article.sourceTitle
      ? article.author
      : undefined;
  const embedUrl = getVideoEmbed(article.link);

  // Start performance measurement
  useEffect(() => {
    startRenderTiming();
    return () => {
      endRenderTiming();
    };
  }, [startRenderTiming, endRenderTiming]);

  useEffect(
    () =>
      registerMediaItem(buildMediaOriginFromArticle(article, mediaCategoryId), () => {
        const element = articleRef.current;
        if (!element) return;
        element.scrollIntoView({ block: "center", behavior: "smooth" });
        element.focus({ preventScroll: true });
        element.classList.add("media-return-highlight");
        window.setTimeout(
          () => element.classList.remove("media-return-highlight"),
          1600,
        );
      }),
    [
      article.feedUrl,
      article.link,
      article.sourceTitle,
      mediaCategoryId,
      registerMediaItem,
    ],
  );

  const isHorizontal = layoutMode === "list" || layoutMode === "minimal";

  return (
    <article
      ref={articleRef}
      tabIndex={-1}
      data-media-article-link={article.link}
      className={`h-full flex flex-col transition-all duration-300 ${className}`}
    >
      <div
        className={`feed-card flex h-full group ${isHorizontal ? "flex-row gap-5 p-4 sm:p-5" : "flex-col p-4 sm:p-5"}`}
      >
        {/* Article image - Always render container */}
        <div
          className={`feed-media relative ${isHorizontal ? "w-28 sm:w-40 aspect-[4/3] shrink-0 mb-0" : "w-full aspect-[4/3] sm:aspect-[3/2] lg:aspect-[3/2] mb-4"}`}
        >
          <button
            type="button"
            onClick={() => onClick?.(article)}
            className="block w-full h-full cursor-pointer bg-transparent p-0 text-left"
            aria-label={`Abrir ${article.title} no leitor`}
          >
            <ArticleImage
              article={article}
              width={400}
              height={200}
              fill={true}
              className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            />
          </button>
        </div>

        {/* Article content */}
        <div className="flex-1 flex min-h-0 flex-col gap-3">
          <div className="feed-card-top-rail">
            <div className="feed-card-meta-stack">
              {contentConfig.showTags && (
                <span className="feed-meta text-[10px] font-bold uppercase tracking-[0.18em] truncate max-w-[220px]">
                  {article.sourceTitle}
                </span>
              )}
              <div className="flex min-w-0 flex-col gap-1">
                {contentConfig.showAuthor && authorLabel && (
                  <span
                    className="feed-meta text-[11px] truncate"
                    aria-label={`Autor: ${authorLabel}`}
                    title={authorLabel}
                  >
                    Por {authorLabel}
                  </span>
                )}
                {(contentConfig.showDate || contentConfig.showTime) && (
                  <FeedResponsiveDate
                    date={article.pubDate}
                    hour12={timeFormat === "12h"}
                    includeTime={
                      layoutSettings.showPublicationTime ||
                      contentConfig.showTime
                    }
                    className="feed-meta feed-meta-hoverable text-[10px] uppercase tracking-[0.14em]"
                  />
                )}
              </div>
            </div>
            <div className="feed-card-action-rail">
              <FeedInteractiveActions
                articleLink={article.link}
                onRead={() => onClick?.(article)}
                showRead={!embedUrl && !!onClick}
                showWatch={!!embedUrl}
                showVisit={true}
                compact
                className="!mt-0"
              />
              <FavoriteButton
                article={article}
                size="small"
                position="inline"
                className="bg-[rgb(var(--color-surfaceElevated))]/80 hover:bg-[rgb(var(--color-surfaceElevated))]"
              />
            </div>
          </div>

          <button
            type="button"
            className="feed-card-bottom-copy flex flex-col bg-transparent p-0 text-left"
            onClick={() => onClick?.(article)}
            aria-label={`Artigo: ${article.title} de ${
              authorLabel || article.sourceTitle
            }`}
          >
            <h4 className="feed-title feed-title-card feed-title-hoverable feed-card-title-clamp text-base lg:text-lg mb-2 group-hover:underline decoration-current underline-offset-[0.18em]">
              {article.title}
            </h4>

            {article.description && !isHorizontal && (
              <p className="feed-desc feed-desc-hoverable feed-card-desc-clamp text-sm leading-relaxed font-medium">
                {article.description}
              </p>
            )}
          </button>
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
  nextProps: ArticleItemProps,
): boolean => {
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
