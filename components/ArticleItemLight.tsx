import React, { memo } from "react";
import type { Article } from "../types";
import { FavoriteButton } from "./FavoriteButton";


interface ArticleItemLightProps {
    article: Article;
    showImage?: boolean;
    className?: string;
    onClick?: (article: Article) => void;
}

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

const ArticleItemLightComponent: React.FC<ArticleItemLightProps> = ({
    article,
    className = "",
    onClick,
}) => {
    const authorLabel =
        article.author && article.author !== article.sourceTitle
            ? article.author
            : undefined;
    // Pure rendering - No Hooks, No Contexts, No Side Effects
    return (
        <article className={`h-full flex flex-col ${className}`}>
            <div className="feed-card feed-card--flat flex flex-col h-full group p-4 sm:p-5">
                {/* Article image container */}
                <div className="feed-media relative mb-4 w-full aspect-[4/3] sm:aspect-[3/2]">
                    {article.imageUrl ? (
                        <img
                            src={article.imageUrl}
                            alt={article.title}
                            loading="lazy"
                            width={400}
                            height={200}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full bg-black/40 flex items-center justify-center">
                            <span className="text-white/30 text-xs">No Image</span>
                        </div>
                    )}

                    <FavoriteButton
                        article={article}
                        size="small"
                        position="overlay"
                        className="top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 hover:bg-black/40"
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
                    >
                        {/* Source line */}
                        <div className="mb-2 flex items-center gap-2 min-w-0">
                            <span className="feed-meta text-[10px] font-bold uppercase tracking-[0.22em] truncate max-w-full">
                                {article.sourceTitle}
                            </span>
                            <span className="h-px w-5 flex-shrink-0 bg-[rgb(var(--color-border))]/35" />
                        </div>

                        {/* Title */}
                        <h4 className="feed-title feed-title-card feed-title-hoverable text-base lg:text-lg mb-3 line-clamp-3 group-hover:underline decoration-current underline-offset-[0.18em]">
                            {article.title}
                        </h4>

                        {/* Metadata */}
                        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1">
                            {authorLabel && (
                                <span className="feed-meta text-[11px] truncate max-w-[180px]" title={authorLabel}>
                                    {authorLabel}
                                </span>
                            )}
                            <time className="feed-meta feed-meta-hoverable text-[10px] uppercase tracking-[0.18em] block w-fit" dateTime={article.pubDate.toISOString()}>
                                {timeSince(article.pubDate)}
                            </time>
                        </div>
                    </a>
                </div>
            </div>
        </article>
    );
};

export const ArticleItemLight = memo(ArticleItemLightComponent);
