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
    <div className="container mx-auto p-4 font-mono">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="relative border border-[#00ff41]/30 bg-[#001100]/40 p-4 shadow-[0_0_10px_rgba(0,255,65,0.1)] flex flex-col space-y-4">
            <div className="flex justify-between border-b border-[#00ff41]/20 pb-2">
              <div className="w-24 h-3 bg-[#00ff41]/10 animate-pulse" />
              <div className="w-16 h-3 bg-[#00ff41]/10 animate-pulse" />
            </div>
            <div className="h-40 border border-[#00ff41]/20 bg-white/5 animate-pulse" />
            <div className="h-4 w-full bg-[#00ff41]/10 animate-pulse" />
            <div className="h-12 w-full border-l border-[#00ff41]/20 pl-2 bg-[#00ff41]/5 animate-pulse" />
            <div className="flex justify-end pt-2">
              <div className="w-24 h-6 bg-[#00ff41]/20 animate-pulse" />
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
    <div className="container mx-auto p-4 font-mono">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {articles.map((article, i) => (
          <article key={i} className="relative border border-[#00ff41] bg-[#001100]/80 p-4 shadow-[0_0_10px_rgba(0,255,65,0.2)] hover:shadow-[0_0_20px_rgba(0,255,65,0.5)] hover:border-[#fff] transition-all group flex flex-col">
            <div className="absolute top-0 left-0 w-2 h-2 bg-[#00ff41]" />
            <div className="absolute top-0 right-0 w-2 h-2 bg-[#00ff41]" />
            <div className="absolute bottom-0 left-0 w-2 h-2 bg-[#00ff41]" />
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-[#00ff41]" />

            <div className="flex justify-between items-center border-b border-[#00ff41]/30 pb-2 mb-3 text-[#00ff41] text-xs">
              <div className="flex items-center gap-2">
                <span>SYS.FEED.{i.toString().padStart(3, '0')}</span>
                <FavoriteButton
                  article={article}
                  size="small"
                  position="inline"
                  className="p-0 text-[#00ff41]/60 hover:text-[#00ff41] transition-colors"
                />
              </div>
              <span className="truncate max-w-[120px] sm:max-w-[150px]">[{article.sourceTitle}]</span>
            </div>

            {article.imageUrl && (
              <div
                className="mb-4 border border-[#00ff41]/50 relative overflow-hidden h-40 cursor-pointer group-hover:border-[#fff]/50 transition-colors"
                onClick={() => setReadingArticle(article)}
              >
                <div className="w-full h-full relative">
                  <OptimizedImage
                    src={article.imageUrl}
                    className="w-full h-full object-cover transition-all duration-500 opacity-80 group-hover:opacity-100"
                    alt=""
                    fallbackText="NO_DATA"
                    width={400}
                    height={200}
                  />
                </div>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none" />
              </div>
            )}

            <h2
              className="text-[#fff] text-lg font-bold mb-2 leading-snug group-hover:text-[#00ff41] transition-colors glitch-text cursor-pointer hover:underline"
              onClick={() => setReadingArticle(article)}
            >
              {article.title}
            </h2>

            <p className="text-[#00ff41]/80 text-xs leading-relaxed mb-4 border-l border-[#00ff41]/50 pl-2 flex-grow">
              {article.description?.slice(0, 150)}...
            </p>

            <div className="flex justify-end mt-auto">
              <button
                onClick={() => setReadingArticle(article)}
                className="bg-[#00ff41] text-black text-xs font-bold px-4 py-1 hover:bg-white transition-colors uppercase"
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
