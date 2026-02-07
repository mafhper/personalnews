import React, { memo } from 'react';
import type { Article } from '../../types';
import { FavoriteButton } from '../FavoriteButton';


interface MagazineItemProps {
    article: Article;
    onClick: (article: Article) => void;
}

const formatTimeAgo = (dateInput: Date | string) => {
    const now = new Date();
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0 || isNaN(diffMs)) return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'agora'; // Simplified literal, context handles translation usually
    if (diffMins < 60) return `${diffMins}min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

const MagazineItemComponent: React.FC<MagazineItemProps> = ({ article, onClick }) => {
    return (
        <div className="mx-auto w-full max-w-[900px] xl:max-w-[980px] px-2 sm:px-3">
            <article
                className="group cursor-pointer flex items-start gap-4 p-3 rounded-lg feed-row"
                onClick={() => onClick(article)}
            >
                <span className="feed-chip w-24 flex-shrink-0 truncate pt-0.5">
                    {article.sourceTitle}
                </span>
                <div className="flex-1 min-w-0">
                    <h4 className="feed-title text-sm group-hover:text-white transition-colors line-clamp-2 mb-1">
                        {article.title}
                    </h4>
                    {article.description && (
                        <p className="feed-desc text-xs line-clamp-2 leading-relaxed">
                            {article.description}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
                    <span className="feed-meta text-xs">
                        {formatTimeAgo(article.pubDate)}
                    </span>
                    <FavoriteButton
                        article={article}
                        size="small"
                        position="inline"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                </div>
            </article>
        </div>
    );
};

export const MagazineItem = memo(MagazineItemComponent);
