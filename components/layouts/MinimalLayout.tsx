import React, { useState } from 'react';
import { Article } from '../../types';
import { SmallOptimizedImage } from '../SmallOptimizedImage';
import { ArticleReaderModal } from '../ArticleReaderModal';
import { useLanguage } from '../../contexts/LanguageContext';

interface MinimalLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

export const MinimalLayout: React.FC<MinimalLayoutProps> = ({ articles }) => {
  const [readingIndex, setReadingIndex] = useState<number | null>(null);
  const { t } = useLanguage();

  // Helper for time formatting
  const formatTimeAgo = (dateInput: Date | string) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0 || isNaN(diffMs)) return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return t('time.now') || 'agora';
    if (diffMins < 60) return `${diffMins}min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <>
      <div className="max-w-5xl mx-auto px-6 py-12 animate-in fade-in duration-500">
        {/* Header */}
        <header className="mb-16 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[rgb(var(--color-textSecondary))] mb-2">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <div className="w-16 h-px mx-auto bg-[rgb(var(--color-border))]" />
        </header>

        {/* Articles Grid - Asymmetric */}
        <div className="space-y-16">
          {articles.map((article, index) => {
            // Alternate between full-width and two-column layouts
            const isFullWidth = index === 0 || index % 5 === 0;

            return (
              <article
                key={`${article.link}-${index}`}
                className={`group cursor-pointer ${isFullWidth ? '' : 'md:grid md:grid-cols-2 md:gap-12 md:items-center'}`}
                onClick={() => setReadingIndex(index)}
              >
                {/* Image */}
                {article.imageUrl && (
                  <div className={`relative overflow-hidden mb-6 ${isFullWidth ? 'aspect-[21/9] rounded-2xl' : 'aspect-[4/3] rounded-xl md:mb-0'} bg-[rgb(var(--color-surface))]`}>
                    <SmallOptimizedImage
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                      fallbackText={article.sourceTitle}
                      size={isFullWidth ? 1200 : 800}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                )}

                {/* Content */}
                <div className={isFullWidth ? 'max-w-2xl mx-auto text-center' : ''}>
                  {/* Meta */}
                  <div className={`flex items-center gap-3 text-xs tracking-widest uppercase text-[rgb(var(--color-textSecondary))] mb-4 ${isFullWidth ? 'justify-center' : ''}`}>
                    <span className="text-[rgb(var(--color-accent))] font-semibold">
                      {article.sourceTitle}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-[rgb(var(--color-border))]" />
                    <time dateTime={article.pubDate.toISOString()}>
                      {formatTimeAgo(article.pubDate)}
                    </time>
                  </div>

                  {/* Title */}
                  <h2 className={`font-serif font-bold text-[rgb(var(--color-text))] leading-tight mb-4 group-hover:text-[rgb(var(--color-accent))] transition-colors ${isFullWidth ? 'text-3xl md:text-5xl' : 'text-2xl md:text-3xl'}`}>
                    {article.title}
                  </h2>

                  {/* Author */}
                  {article.author && (
                    <p className={`text-sm text-[rgb(var(--color-textSecondary))] italic mb-4 ${isFullWidth ? '' : 'opacity-70'}`}>
                      {t('article.by') || 'por'} {article.author}
                    </p>
                  )}

                  {/* Description */}
                  <p className={`text-[rgb(var(--color-textSecondary))] leading-relaxed ${isFullWidth ? 'text-lg line-clamp-3' : 'text-base line-clamp-2'}`}>
                    {article.description}
                  </p>

                  {/* Read More Link */}
                  <div className={`mt-6 ${isFullWidth ? '' : 'flex items-center'}`}>
                    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-accent))] transition-colors">
                      {t('action.read_article') || 'Ler artigo'}
                      <svg className="w-4 h-4 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Footer Divider */}
        <div className="mt-20 flex items-center justify-center">
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-[rgb(var(--color-border))] to-transparent" />
        </div>
      </div>

      {/* Reader Modal */}
      {readingIndex !== null && (
        <ArticleReaderModal
          article={articles[readingIndex]}
          onClose={() => setReadingIndex(null)}
          onNext={() => setReadingIndex((prev) => (prev !== null && prev < articles.length - 1 ? prev + 1 : prev))}
          onPrev={() => setReadingIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev))}
          hasNext={readingIndex < articles.length - 1}
          hasPrev={readingIndex > 0}
        />
      )}
    </>
  );
};
