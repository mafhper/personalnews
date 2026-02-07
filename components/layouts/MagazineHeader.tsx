import React from 'react';
import { Article } from '../../types';
import { useLanguage } from '../../hooks/useLanguage';
import { ArticleImage } from '../ArticleImage';
import { FavoriteButton } from '../FavoriteButton';

interface MagazineHeaderProps {
    articles: Article[];
    onArticleClick: (article: Article) => void;
}

export const MagazineHeader: React.FC<MagazineHeaderProps> = ({ articles, onArticleClick }) => {
    const { t } = useLanguage();
    const now = new Date();

    // Helper
    const formatTimeAgo = (dateInput: Date | string) => {
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
        const diffMs = now.getTime() - date.getTime();
        if (diffMs < 0 || isNaN(diffMs)) return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return t('time.now') || 'agora';
        if (diffMins < 60) return `${diffMins}min`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    // Layout Slices
    const heroArticle = articles[0];
    const heroAuthor =
        heroArticle?.author && heroArticle.author !== heroArticle.sourceTitle
            ? heroArticle.author
            : undefined;
    const featuredArticles = articles.slice(1, 4);
    const gridArticles = articles.slice(4, 10);

    if (!heroArticle) return null;

    return (
        <div className="mb-8 animate-in fade-in duration-300">
            <div className="mx-auto w-full max-w-[1040px] 2xl:max-w-[1120px]">
            {/* Hero Section */}
            <section className="mb-12">
                <article
                    className="feed-card relative group cursor-pointer overflow-hidden rounded-2xl"
                    onClick={() => onArticleClick(heroArticle)}
                >
                    <div className="grid lg:grid-cols-2 gap-0">
                        {/* Hero Image */}
                        <div className="feed-media relative aspect-[4/3] lg:aspect-auto lg:h-[400px]">
                            <ArticleImage
                                article={heroArticle}
                                width={1200}
                                height={800}
                                fill={true}
                                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent md:hidden" />

                            <FavoriteButton
                                article={heroArticle}
                                size="medium"
                                position="overlay"
                                className="top-4 right-4 z-10 bg-black/30 hover:bg-black/50 border border-white/15 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                        </div>

                        {/* Hero Content */}
                        <div className="flex flex-col justify-center p-6 md:p-10 bg-gradient-to-br from-[rgba(var(--color-surface),0.8)] to-[rgba(var(--color-background),0.6)]">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="feed-chip truncate max-w-[150px] md:max-w-[200px]">
                                    {heroArticle.sourceTitle}
                                </span>
                                <span className="feed-meta text-sm">
                                    {formatTimeAgo(heroArticle.pubDate)}
                                </span>
                            </div>

                            <h1 className="feed-title text-2xl md:text-4xl leading-tight mb-4 group-hover:text-white transition-colors">
                                {heroArticle.title}
                            </h1>

                            <p className="text-[rgb(var(--color-textSecondary))] text-base md:text-lg leading-relaxed line-clamp-3 mb-6">
                                {heroArticle.description}
                            </p>

                            {heroAuthor && (
                                <p className="text-sm text-[rgb(var(--color-textSecondary))] italic">
                                    {t('article.by') || 'Por'} {heroAuthor}
                                </p>
                            )}

                            <button className="mt-6 self-start px-6 py-2.5 bg-[rgba(var(--color-primary),0.8)] text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
                                {t('action.read') || 'Ler artigo'}
                            </button>
                        </div>
                    </div>
                </article>
            </section>

            {/* Featured Section */}
            {featuredArticles.length > 0 && (
                <section className="mb-12">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[rgb(var(--color-border))] to-transparent" />
                        <h2 className="text-sm font-bold uppercase tracking-widest text-[rgb(var(--color-textSecondary))]">
                            Featured Stories
                        </h2>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[rgb(var(--color-border))] to-transparent" />
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {featuredArticles.map((article, i) => (
                            <article
                                key={i}
                                className="group cursor-pointer"
                                onClick={() => onArticleClick(article)}
                            >
                                <div className="feed-media relative aspect-[16/10] mb-4">
                                    <ArticleImage
                                        article={article}
                                        width={600}
                                        height={400}
                                        fill={true}
                                        className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <FavoriteButton
                                        article={article}
                                        size="small"
                                        position="overlay"
                                        className="top-3 right-3 z-10 bg-black/30 hover:bg-black/50 border border-white/15 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                    />
                                </div>

                                <div className="flex items-center gap-2 mb-2">
                                    <span className="feed-chip truncate max-w-[120px]">
                                        {article.sourceTitle}
                                    </span>
                                    <span className="text-xs text-[rgb(var(--color-textSecondary))]">•</span>
                                    <span className="feed-meta text-xs">
                                        {formatTimeAgo(article.pubDate)}
                                    </span>
                                </div>

                                <h3 className="feed-title text-lg leading-snug group-hover:text-white transition-colors line-clamp-2">
                                    {article.title}
                                </h3>
                                {article.description && (
                                    <p className="feed-desc text-sm mt-2 line-clamp-2">
                                        {article.description}
                                    </p>
                                )}
                            </article>
                        ))}
                    </div>
                </section>
            )}

            {/* Grid Section */}
            {gridArticles.length > 0 && (
                <section className="mb-12">
                    <div className="flex items-center gap-4 mb-6">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-[rgb(var(--color-textSecondary))]">
                            More News
                        </h2>
                        <div className="h-px flex-1 bg-[rgb(var(--color-border))]" />
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {gridArticles.map((article, i) => (
                            <article
                                key={i}
                                className="feed-card group cursor-pointer flex gap-4 p-4 rounded-xl transition-all relative"
                                onClick={() => onArticleClick(article)}
                            >
                                <div className="feed-media w-24 h-24 flex-shrink-0">
                                    <ArticleImage
                                        article={article}
                                        width={200}
                                        height={200}
                                        fill={true}
                                        className="w-full h-full object-cover object-center"
                                    />
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="feed-chip truncate max-w-[100px]">
                                                {article.sourceTitle}
                                            </span>
                                            <span className="feed-meta text-[10px] flex-shrink-0">
                                                {formatTimeAgo(article.pubDate)}
                                            </span>
                                        </div>
                                        <div className="relative">
                                            <FavoriteButton
                                                article={article}
                                                size="small"
                                                position="inline"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            />
                                        </div>
                                    </div>
                                    <h3 className="font-semibold text-sm text-[rgb(var(--color-text))] group-hover:text-white transition-colors line-clamp-2 leading-snug">
                                        {article.title}
                                    </h3>
                                    {article.description && (
                                        <p className="text-xs text-[rgb(var(--color-textSecondary))] mt-1 line-clamp-2">
                                            {article.description}
                                        </p>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            )}

            {/* Divider for List */}
            <div className="flex items-center gap-4 mb-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-[rgb(var(--color-textSecondary))]">
                    Latest News
                </h2>
                <div className="h-px flex-1 bg-[rgb(var(--color-border))]" />
            </div>
            </div>
        </div>
    );
};
