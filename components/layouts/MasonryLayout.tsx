import React, { useState } from 'react';
import { Article } from '../../types';
import { ArticleItem } from '../ArticleItem';
import { FeaturedArticle } from '../FeaturedArticle';
import { ArticleReaderModal } from '../ArticleReaderModal';
import { FeedInteractiveActions } from '../FeedInteractiveActions';
import { getVideoEmbed } from '../../utils/videoEmbed';

interface MasonryLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

export const MasonrySkeleton: React.FC = () => {
  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 space-y-8">
      {/* Featured Hero Skeleton */}
      <div className="h-[60vh] min-h-[400px] rounded-2xl feed-skeleton-block" />
      
      {/* Masonry Columns Skeleton */}
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="break-inside-avoid mb-6 feed-skeleton-block rounded-2xl h-[300px]" />
        ))}
      </div>
    </div>
  );
};

export const MasonryLayout: React.FC<MasonryLayoutProps> = ({ articles, timeFormat }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const featured = articles[0];
  const rest = articles.slice(1);

  const handleOpenReader = (article: Article) => {
    setReadingArticle(article);
  };

  const handleNextArticle = () => {
    if (!readingArticle) return;
    const currentIndex = articles.findIndex(a => a.link === readingArticle.link);
    if (currentIndex < articles.length - 1) {
      setReadingArticle(articles[currentIndex + 1]);
    }
  };

  const handlePrevArticle = () => {
    if (!readingArticle) return;
    const currentIndex = articles.findIndex(a => a.link === readingArticle.link);
    if (currentIndex > 0) {
      setReadingArticle(articles[currentIndex - 1]);
    }
  };

  return (
    <div className="feed-page-frame feed-page-frame--wide space-y-8 animate-in fade-in duration-500">
      {/* Featured Article - Full Width Hero */}
      <div className="h-[60vh] min-h-[400px] rounded-2xl overflow-hidden shadow-xl relative group">
        <FeaturedArticle article={featured} timeFormat={timeFormat} />
        {/* Preview Button for Featured */}
        <div className="absolute bottom-6 right-6 p-4 z-10">
          {(() => {
            const embedUrl = getVideoEmbed(featured.link);
            return (
              <FeedInteractiveActions
                variant="onDarkMedia"
                articleLink={featured.link}
                onRead={() => handleOpenReader(featured)}
                showRead={!embedUrl}
                showWatch={!!embedUrl}
                showVisit={true}
                onWatch={embedUrl ? () => window.open(featured.link, '_blank') : undefined}
              />
            );
          })()}
        </div>
      </div>

      {/* Masonry Grid */}
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
        {rest.map((article, index) => (
          <div key={`${article.link}-${index}`} className="break-inside-avoid mb-6">
            <ArticleItem article={article} index={index + 2} timeFormat={timeFormat} onClick={handleOpenReader} className="hover:-translate-y-1 transition-transform duration-300" />
          </div>
        ))}
      </div>

      {readingArticle && (
        <ArticleReaderModal
          article={readingArticle}
          onClose={() => setReadingArticle(null)}
          onNext={handleNextArticle}
          onPrev={handlePrevArticle}
          hasNext={articles.findIndex(a => a.link === readingArticle.link) < articles.length - 1}
          hasPrev={articles.findIndex(a => a.link === readingArticle.link) > 0}
        />
      )}
    </div>
  );
};
