import React, { memo } from "react";
import type { Article } from "../types";
import { FavoriteButton } from "./FavoriteButton";


interface ArticleItemLightProps {
    article: Article;
    index?: number;
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
    index = 0,
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

                    {/* Article number overlay */}
                    <div className="absolute top-2 left-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-semibold pointer-events-none z-10">
                        {index}
                    </div>

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
                        {/* Source badge */}
                        <div className="mb-2">
                            <span className="feed-chip truncate max-w-full">
                                {article.sourceTitle}
                            </span>
                        </div>

                        {/* Title */}
                        <h4 className="feed-title text-base lg:text-lg leading-tight group-hover:text-white mb-3 line-clamp-3 transition-colors">
                            {article.title}
                        </h4>

                        {/* Metadata */}
                        <div className="mt-auto space-y-2">
                            <div className="flex items-center justify-between text-xs feed-meta">
                                {authorLabel && (
                                    <span className="truncate max-w-[120px]" title={authorLabel}>
                                        {authorLabel}
                                    </span>
                                )}
                            </div>
                            <time className="feed-meta text-xs block" dateTime={article.pubDate.toISOString()}>
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
