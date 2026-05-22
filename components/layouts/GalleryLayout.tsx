import React, { useState } from 'react';
import { Article } from '../../types';
import { OptimizedImage } from '../OptimizedImage';
import { ArticleReaderModal } from '../ArticleReaderModal';
import { FavoriteButton } from '../FavoriteButton';
import { FeedInteractiveActions } from '../FeedInteractiveActions';
import { FeedResponsiveDate } from '../FeedResponsiveDate';
import { getVideoEmbed } from '../../utils/videoEmbed';

interface GalleryLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

export const GallerySkeleton: React.FC = () => {
  return (
    <div className="min-h-screen">
      <div className="feed-top-clearance feed-page-frame grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 px-1 pb-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
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
      <div className="feed-top-clearance feed-page-frame grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 px-1 pb-1">
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

            <div className="feed-image-story-top-rail feed-image-story-top-rail--compact !p-4">
              <div className="feed-image-story-meta feed-card-meta-stack text-[10px] uppercase tracking-[0.18em] text-white">
                <span className="inline-flex w-fit max-w-full truncate rounded-full bg-black/55 px-2.5 py-1 text-white shadow-sm backdrop-blur-md">
                  {article.sourceTitle}
                </span>
                <FeedResponsiveDate
                  date={article.pubDate}
                  className="text-white/82 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]"
                />
              </div>
              <div className="feed-card-action-rail">
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
                      compact
                      className="!mt-0"
                    />
                  );
                })()}
                <FavoriteButton
                  article={article}
                  size="small"
                  position="inline"
                  className="bg-black/40 hover:bg-black/60 border border-white/10 shadow-md"
                />
              </div>
            </div>

            {/* Post info at bottom-left */}
            <div className="feed-image-story-bottom-copy !p-4">
              <div className="feed-image-story-shell !px-0 !py-0">
                <h3 className="feed-title feed-title-card feed-image-story-title feed-card-title-clamp text-base leading-tight transition-colors">
                  {article.title}
                </h3>
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
