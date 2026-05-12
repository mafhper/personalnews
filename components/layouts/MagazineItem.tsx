import React, { memo } from "react";
import type { Article } from "../../types";
import { FavoriteButton } from "../FavoriteButton";

interface MagazineItemProps {
  article: Article;
  onClick: (article: Article) => void;
}

const formatTimeAgo = (dateInput: Date | string) => {
  const now = new Date();
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0 || isNaN(diffMs))
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });

  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "agora"; // Simplified literal, context handles translation usually
  if (diffMins < 60) return `${diffMins}min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
};

const MagazineItemComponent: React.FC<MagazineItemProps> = ({
  article,
  onClick,
}) => {
  const timeAgo = formatTimeAgo(article.pubDate);

  return (
    <div className="mx-auto w-full max-w-[980px] px-1 sm:px-3">
      <article
        className="group cursor-pointer rounded-xl feed-row px-3 py-4 sm:px-4 md:px-5 lg:py-4"
        onClick={() => onClick(article)}
      >
        <div className="grid min-w-0 gap-2 lg:grid-cols-[8.5rem_minmax(0,1fr)_auto] lg:items-start lg:gap-5">
          <div className="flex min-w-0 items-center gap-2 lg:block lg:pt-0.5">
            <span className="feed-meta min-w-0 truncate text-[10px] font-bold uppercase tracking-[0.2em] leading-relaxed sm:max-w-[18rem] lg:block lg:max-w-none lg:whitespace-normal lg:line-clamp-2">
              {article.sourceTitle}
            </span>
            <span className="h-px w-5 flex-shrink-0 bg-[rgb(var(--color-border))]/45 lg:hidden" />
            <span className="feed-meta flex-shrink-0 text-[11px] font-semibold lg:hidden">
              {timeAgo}
            </span>
          </div>

          <div className="min-w-0">
            <h4 className="feed-title text-base font-bold leading-snug transition-colors line-clamp-2 mb-1 sm:text-[1.05rem] lg:text-sm">
              {article.title}
            </h4>
            {article.description && (
              <p className="feed-desc text-sm line-clamp-2 leading-relaxed sm:text-[0.95rem] lg:text-xs">
                {article.description}
              </p>
            )}
          </div>

          <div className="hidden flex-shrink-0 items-start gap-2 pt-0.5 lg:flex">
            <span className="feed-meta text-xs font-semibold">{timeAgo}</span>
            <FavoriteButton
              article={article}
              size="small"
              position="inline"
              className="opacity-0 transition-opacity group-hover:opacity-100"
            />
          </div>
        </div>
      </article>
    </div>
  );
};

export const MagazineItem = memo(MagazineItemComponent);
