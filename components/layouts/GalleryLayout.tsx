import React, { useState } from 'react';
import { Article } from '../../types';
import { OptimizedImage } from '../OptimizedImage';
import { ArticleReaderModal } from '../ArticleReaderModal';
import { FavoriteButton } from '../FavoriteButton';
import { FeedInteractiveActions } from '../FeedInteractiveActions';
import { getVideoEmbed } from '../../utils/videoEmbed';

interface GalleryLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

export const GallerySkeleton: React.FC = () => {
  return (
    <div className="min-h-screen">
      <div className="feed-top-clearance feed-page-frame grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 px-1 pb-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(i => (
          <div key={i} className="aspect-square feed-skeleton-block rounded-xl" />
        ))}
      </div>
    </div>
  );
};

export const GalleryLayout: React.FC<GalleryLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);

  return (
    <div className="min-h-screen">
      <div className="feed-top-clearance feed-page-frame grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 px-1 pb-1">
        {articles.map((article, i) => (
          <div
            key={i}
            onClick={() => setReadingArticle(article)}
            className="feed-image-card-frame group relative aspect-square cursor-pointer bg-[rgb(var(--color-surface))] shadow-lg ring-1 ring-white/5"
          >
            {article.imageUrl ? (
              <div className="w-full h-full overflow-hidden rounded-[inherit]">
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
            <div className="feed-image-story-overlay absolute inset-0 pointer-events-none" />

            {/* Favorite Button - Fixed Positioning */}
            <FavoriteButton
              article={article}
              size="small"
              position="overlay"
              className="top-2 right-2 z-20 bg-black/40 hover:bg-black/60 border border-white/10 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            />

            {/* Post info at bottom-left */}
            <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
              <div className="feed-image-story-shell">
              <div className="feed-image-story-meta mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] min-w-0">
                <span className="truncate">{article.sourceTitle}</span>
                <span className="h-px w-4 flex-shrink-0 bg-white/20" />
                <span className="flex-shrink-0">
                  {new Date(article.pubDate).toLocaleDateString()}
                </span>
              </div>
              <h3 className="feed-title feed-title-card feed-image-story-title text-sm leading-tight line-clamp-2 transition-colors">
                {article.title}
              </h3>
              
              {(() => {
                const embedUrl = getVideoEmbed(article.link);
                return (
                  <FeedInteractiveActions
                    variant="onDarkMedia"
                    articleLink={article.link}
                    onRead={() => setReadingArticle(article)}
                    showRead={!embedUrl}
                    showWatch={!!embedUrl}
                    showVisit={true}
                    className="!mt-3 justify-between"
                  />
                );
              })()}
              </div>
            </div>
          </div>
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
