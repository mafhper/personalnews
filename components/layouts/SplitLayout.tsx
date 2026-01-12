import React, { useState } from 'react';
import { Article } from '../../types';
import { OptimizedImage } from '../OptimizedImage';
import { ArticleReaderModal } from '../ArticleReaderModal';
import { useLanguage } from '../../contexts/LanguageContext';

interface SplitLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

export const SplitLayout: React.FC<SplitLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen bg-[rgb(var(--color-background))]">
      {articles.map((article, i) => (
        <article key={i} className={`flex flex-col md:flex-row h-auto md:h-[50vh] min-h-[400px] group ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
          <div
            className="w-full md:w-1/2 h-64 md:h-full relative overflow-hidden cursor-pointer"
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
          <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-[rgb(var(--color-surface))] border-b border-[rgb(var(--color-border))]">
            <div className="max-w-xl mx-auto md:mx-0">
                <span className="text-[rgb(var(--color-accent))] font-bold uppercase tracking-widest text-xs mb-4 block">{article.sourceTitle}</span>
                <h2
                    className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-accent))] transition-colors cursor-pointer leading-tight"
                    onClick={() => setReadingArticle(article)}
                >
                {article.title}
                </h2>
                <p className="text-[rgb(var(--color-textSecondary))] leading-relaxed mb-6 line-clamp-4">{article.description}</p>
                <div className="flex items-center text-xs font-bold uppercase tracking-widest text-[rgb(var(--color-text))] opacity-60">
                {new Date(article.pubDate).toDateString()}
                </div>
                <button
                    onClick={() => setReadingArticle(article)}
                    className="mt-6 text-xs font-bold uppercase tracking-widest text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-accent))] self-start"
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
          onNext={() => {}}
          onPrev={() => {}}
          hasNext={false}
          hasPrev={false}
        />
      )}
    </div>
  );
};
