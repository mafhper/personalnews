import React, { memo } from "react";
import type { Article } from "../types";


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
    // Pure rendering - No Hooks, No Contexts, No Side Effects
    return (
        <article className={`h-full flex flex-col ${className}`}>
            <div className="flex flex-col h-full group">
                {/* Article image container */}
                <div className="relative mb-4 bg-gray-800 rounded-lg overflow-hidden h-40 sm:h-32 lg:h-40">
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
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                            <span className="text-gray-500 text-xs">No Image</span>
                        </div>
                    )}

                    {/* Article number overlay */}
                    <div className="absolute top-2 left-2 bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold pointer-events-none z-10">
                        {index}
                    </div>
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
                            <span className="inline-block bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide truncate max-w-full">
                                {article.sourceTitle}
                            </span>
                        </div>

                        {/* Title */}
                        <h4 className="font-bold text-base lg:text-lg leading-tight group-hover:underline text-gray-100 mb-3 line-clamp-3">
                            {article.title}
                        </h4>

                        {/* Metadata */}
                        <div className="mt-auto space-y-2">
                            <div className="flex items-center justify-between text-xs text-gray-400">
                                {article.author && (
                                    <span className="truncate max-w-[120px]" title={article.author}>
                                        {article.author}
                                    </span>
                                )}
                            </div>
                            <time className="text-gray-500 text-xs block" dateTime={article.pubDate.toISOString()}>
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
