import React, { useState } from 'react';
import { Article } from '../../types';
import { OptimizedImage } from '../OptimizedImage';
import { ArticleReaderModal } from '../ArticleReaderModal';
import { FavoriteButton } from '../FavoriteButton';

interface CyberpunkLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

export const CyberpunkSkeleton: React.FC = () => {
  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 sm:px-6 lg:px-10 py-6 font-mono cyber-accent">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-7">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="relative cyber-card p-4 flex flex-col space-y-4">
            <div className="flex justify-between border-b cyber-border pb-2">
              <div className="w-24 h-3 feed-skeleton-block" />
              <div className="w-16 h-3 feed-skeleton-block" />
            </div>
            <div className="h-40 border cyber-border bg-white/5 animate-pulse" />
            <div className="h-4 w-full feed-skeleton-block" />
            <div className="h-12 w-full border-l cyber-border pl-2 feed-skeleton-block" />
            <div className="flex justify-end pt-2">
              <div className="w-24 h-6 feed-skeleton-block" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CyberpunkLayout: React.FC<CyberpunkLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 sm:px-6 lg:px-10 py-6 font-mono cyber-accent">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-7">
        {articles.map((article, i) => (
          <article key={i} className="relative cyber-card p-4 hover:shadow-[0_0_18px_rgba(120,255,190,0.28)] hover:border-white/30 transition-all group flex flex-col">
            <div className="absolute top-0 left-0 w-2 h-2 cyber-surface" />
            <div className="absolute top-0 right-0 w-2 h-2 cyber-surface" />
            <div className="absolute bottom-0 left-0 w-2 h-2 cyber-surface" />
            <div className="absolute bottom-0 right-0 w-2 h-2 cyber-surface" />

            <div className="flex justify-between items-center border-b cyber-border pb-2 mb-3 text-xs cyber-accent-soft">
              <div className="flex items-center gap-2">
                <span>SYS.FEED.{i.toString().padStart(3, '0')}</span>
                <FavoriteButton
                  article={article}
                  size="small"
                  position="inline"
                  className="p-0 cyber-accent-soft hover:text-[rgba(var(--cyber-accent),0.85)] transition-colors opacity-0 group-hover:opacity-100"
                />
              </div>
              <span className="truncate max-w-[120px] sm:max-w-[150px]">[{article.sourceTitle}]</span>
            </div>

            {article.imageUrl && (
              <div
                className="mb-4 border cyber-border relative overflow-hidden aspect-[4/3] cursor-pointer group-hover:border-white/40 transition-colors"
                onClick={() => setReadingArticle(article)}
              >
                <div className="w-full h-full relative">
                  <OptimizedImage
                    src={article.imageUrl}
                    className="w-full h-full object-cover transition-all duration-500 opacity-80 group-hover:opacity-100"
                    alt=""
                    fallbackText="NO_DATA"
                    width={500}
                    height={375}
                  />
                </div>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none" />
              </div>
            )}

            <h2
              className="text-white text-lg font-bold mb-2 leading-snug group-hover:text-[rgba(var(--cyber-accent),0.85)] transition-colors glitch-text cursor-pointer hover:underline"
              onClick={() => setReadingArticle(article)}
            >
              {article.title}
            </h2>

            <p className="cyber-accent-soft text-xs leading-relaxed mb-4 border-l cyber-border pl-2 flex-grow">
              {article.description?.slice(0, 150)}...
            </p>

            <div className="flex justify-end mt-auto">
              <button
                onClick={() => setReadingArticle(article)}
                className="bg-[rgba(120,255,190,0.85)] text-black text-xs font-bold px-4 py-1 hover:bg-white transition-colors uppercase"
              >
                Execute &gt;&gt;
              </button>
            </div>
          </article>
        ))}
      </div>
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
