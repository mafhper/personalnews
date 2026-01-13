import React, { useState } from 'react';
import { Article } from '../../types';
import { OptimizedImage } from '../OptimizedImage';
import { ArticleReaderModal } from '../ArticleReaderModal';
import { FavoriteButton } from '../FavoriteButton';

interface GalleryLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

export const GalleryLayout: React.FC<GalleryLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);

  return (
    <div className="min-h-screen bg-[rgb(var(--color-background))]">
        <div className="max-w-[2400px] mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-1 p-1">
          {articles.map((article, i) => (
            <div
              key={i}
              onClick={() => setReadingArticle(article)}
              className="group relative aspect-square overflow-hidden cursor-pointer bg-[rgb(var(--color-surface))]"
            >
              {article.imageUrl ? (
                 <div className="w-full h-full">
                    <OptimizedImage
                        src={article.imageUrl}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        alt={article.title}
                        fallbackText={article.sourceTitle}
                        width={600}
                        height={600}
                    />
                 </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[rgb(var(--color-textSecondary))] font-bold text-4xl select-none">
                  {article.sourceTitle.charAt(0)}
                </div>
              )}

              {/* Always visible gradient overlay at bottom */}
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

              {/* Favorite Button - Fixed Positioning */}
              <FavoriteButton 
                article={article} 
                size="small" 
                position="overlay"
                className="top-2 right-2 z-20 bg-black/40 hover:bg-black/60 border border-white/10 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              />

              {/* Post info at bottom-left */}
              <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                <span className="text-[rgb(var(--color-accent))] text-[10px] font-bold uppercase tracking-widest block mb-1 truncate max-w-full">
                  {article.sourceTitle}
                </span>
                <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 group-hover:text-[rgb(var(--color-accent))] transition-colors">
                  {article.title}
                </h3>
                <span className="text-white/60 text-[10px] mt-1 block">
                  {new Date(article.pubDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
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
