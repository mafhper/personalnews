import React, { useState } from 'react';
import { Article } from '../../types';
import { OptimizedImage } from '../OptimizedImage';
import { ArticleReaderModal } from '../ArticleReaderModal';
import { useLanguage } from '../../hooks/useLanguage';
import { FavoriteButton } from '../FavoriteButton';

interface SplitLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

const Bone: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`feed-skeleton-block ${className}`} />
);

export const SplitSkeleton: React.FC = () => {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10 xl:px-12 flex flex-col min-h-screen">
      {[1, 2, 3].map((i) => (
        <div key={i} className={`flex flex-col lg:flex-row h-auto lg:min-h-[420px] lg:h-[50vh] min-h-[400px] ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
          <div className="w-full lg:w-1/2 h-64 lg:h-full feed-skeleton-block" />
          <div className="w-full lg:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center border-b border-white/5">
            <div className="max-w-2xl mx-auto md:mx-0 space-y-6">
              <Bone className="h-4 w-32" />
              <Bone className="h-10 w-full" />
              <Bone className="h-24 w-full" />
              <Bone className="h-4 w-48" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const SplitLayout: React.FC<SplitLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const { t } = useLanguage();

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10 xl:px-12 flex flex-col min-h-screen">
      {articles.map((article, i) => (
        <article key={i} className={`flex flex-col lg:flex-row h-auto lg:min-h-[420px] lg:h-[50vh] min-h-[400px] group ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
          <div
            className="w-full lg:w-1/2 aspect-[4/3] lg:aspect-auto lg:h-full relative overflow-hidden cursor-pointer"
            onClick={() => setReadingArticle(article)}
          >
            <div className="w-full h-full">
              <OptimizedImage
                src={article.imageUrl}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                alt=""
                fallbackText={article.sourceTitle}
                width={800}
                height={600}
              />
            </div>
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
          </div>
          <div className="w-full lg:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-[rgb(var(--color-surface))] border-b border-[rgb(var(--color-border))]">
            <div className="max-w-2xl mx-auto md:mx-0">
              <div className="flex justify-between items-start mb-4 gap-4">
                <span className="feed-chip font-bold uppercase tracking-widest text-xs truncate max-w-[200px] md:max-w-[300px]">{article.sourceTitle}</span>
                <FavoriteButton
                  article={article}
                  size="medium"
                  position="inline"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <h2
                className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 text-[rgb(var(--color-text))] hover:text-white transition-colors cursor-pointer leading-tight"
                onClick={() => setReadingArticle(article)}
              >
                {article.title}
              </h2>
              <p className="text-[rgb(var(--color-textSecondary))] leading-relaxed mb-6 line-clamp-4 max-w-[70ch]">{article.description}</p>
              <div className="flex items-center text-xs font-bold uppercase tracking-widest text-[rgb(var(--color-text))] opacity-60">
                {new Date(article.pubDate).toDateString()}
              </div>
              <button
                onClick={() => setReadingArticle(article)}
                className="mt-6 text-xs font-bold uppercase tracking-widest text-[rgb(var(--color-text))] hover:text-white self-start"
              >
                {t('action.preview')} &rarr;
              </button>
            </div>
          </div>
        </article>
      ))}
      {readingArticle && (
        <ArticleReaderModal
          article={readingArticle}
          onClose={() => setReadingArticle(null)}
          onNext={() => { }}
          onPrev={() => { }}
          hasNext={false}
          hasPrev={false}
        />
      )}
    </div>
  );
};
