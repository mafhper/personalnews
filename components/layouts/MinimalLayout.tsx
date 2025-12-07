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

  return (
    <>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 py-8 animate-in fade-in duration-500">
        {articles.map((article, index) => (
          <article key={`${article.link}-${index}`} className="group cursor-pointer h-full flex flex-col">
            <div 
              className="h-full bg-[rgb(var(--color-surface))] backdrop-blur-md border border-[rgb(var(--color-border))] rounded-xl p-6 hover:border-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-background))] transition-all duration-300 flex flex-col shadow-sm hover:shadow-md"
              onClick={() => setReadingIndex(index)}
            >
              {/* Meta */}
              <div className="flex items-center space-x-3 text-xs tracking-widest uppercase text-[rgb(var(--color-textSecondary))] mb-4 opacity-80">
                <span className="text-[rgb(var(--color-accent))] font-bold">{article.sourceTitle}</span>
                <span>•</span>
                <time dateTime={article.pubDate.toISOString()}>
                  {article.pubDate.toLocaleDateString()}
                </time>
              </div>

              {/* Title */}
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-accent))] transition-colors leading-tight mb-2">
                {article.title}
              </h2>

              {/* Author */}
              {article.author && (
                <p className="text-sm text-[rgb(var(--color-textSecondary))] italic mb-6 opacity-70">
                  by {article.author}
                </p>
              )}

              {/* Image */}
              {article.imageUrl && (
                <div className="rounded-lg overflow-hidden mb-6 bg-[rgb(var(--color-background))]">
                   <SmallOptimizedImage
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-56 object-cover transition-transform duration-700 group-hover:scale-105"
                      fallbackText={article.sourceTitle}
                      size={800}
                   />
                </div>
              )}

              {/* Description */}
                <p className="text-base text-[rgb(var(--color-textSecondary))] leading-relaxed flex-grow line-clamp-4 font-sans opacity-90 mb-6 font-normal">
                  {article.description}
                  {/* Simulate more text if description is short for visual balance */}
                  {(!article.description || article.description.length < 150) && (
                      <span className="opacity-50"> {article.description} {article.description}</span>
                  )}
                </p>
              
              <div className="mt-auto flex items-center justify-between pt-4 border-t border-[rgb(var(--color-border))] opacity-60 group-hover:opacity-100 transition-opacity">
                 <button 
                    className="text-xs font-bold tracking-widest uppercase text-[rgb(var(--color-textSecondary))] group-hover:text-[rgb(var(--color-text))] transition-colors hover:underline"
                    onClick={(e) => { e.stopPropagation(); setReadingIndex(index); }}
                 >
                    {t('action.preview')}
                 </button>
                 <div className="w-12 h-px bg-[rgb(var(--color-border))] group-hover:w-24 group-hover:bg-[rgb(var(--color-accent))] transition-all duration-500" />
              </div>
            </div>
          </article>
        ))}
      </div>

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
