import React, { memo } from 'react';
import type { Article } from '../../types';


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
        <article
            className="group cursor-pointer flex items-start gap-4 p-3 rounded-lg hover:bg-[rgb(var(--color-surface))] transition-colors border-b border-[rgb(var(--color-border))] last:border-0"
            onClick={() => onClick(article)}
        >
            <span className="text-xs font-bold uppercase text-[rgb(var(--color-accent))] w-24 flex-shrink-0 truncate pt-0.5">
                {article.sourceTitle}
            </span>
            <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-accent))] transition-colors line-clamp-2 mb-1">
                    {article.title}
                </h4>
                {article.description && (
                    <p className="text-xs text-[rgb(var(--color-textSecondary))] line-clamp-2 leading-relaxed">
                        {article.description}
                    </p>
                )}
            </div>
            <span className="text-xs text-[rgb(var(--color-textSecondary))] flex-shrink-0 pt-0.5">
                {formatTimeAgo(article.pubDate)}
            </span>
        </article>
    );
};

export const MagazineItem = memo(MagazineItemComponent);
