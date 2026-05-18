import React, { useState } from 'react';
import { Article } from '../../types';
import { FeaturedArticle } from '../FeaturedArticle';
import { ArticleReaderModal } from '../ArticleReaderModal';
import { FeedInteractiveActions } from '../FeedInteractiveActions';
import { getVideoEmbed } from '../../utils/videoEmbed';
import { ArticleImage } from '../ArticleImage';
import { FavoriteButton } from '../FavoriteButton';
import { FeedResponsiveDate } from '../FeedResponsiveDate';

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
        <FeaturedArticle
          article={featured}
          timeFormat={timeFormat}
          onClick={handleOpenReader}
        />
        {/* Preview Button for Featured */}
        <div className="feed-card-action-rail absolute top-6 right-16 z-20">
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
                compact
                className="!mt-0"
              />
            );
          })()}
        </div>
      </div>

      {/* Masonry Grid */}
      <div
        className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6"
      >
        {rest.map((article, index) => (
          <MasonryCard
            key={`${article.link}-${index}`}
            article={article}
            index={index}
            onRead={handleOpenReader}
          />
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

const MASONRY_MEDIA_SHAPES = [
  "aspect-[4/3]",
  "aspect-[3/4]",
  "aspect-square",
  "aspect-[5/4]",
];

const MasonryCard: React.FC<{
  article: Article;
  index: number;
  onRead: (article: Article) => void;
}> = ({ article, index, onRead }) => {
  const embedUrl = getVideoEmbed(article.link);
  const mediaShape = MASONRY_MEDIA_SHAPES[index % MASONRY_MEDIA_SHAPES.length];

  return (
    <article className="feed-card group break-inside-avoid mb-6 overflow-hidden transition-transform duration-300 hover:-translate-y-1">
      <div className={`feed-media relative ${mediaShape}`}>
        <button
          type="button"
          className="block h-full w-full bg-transparent p-0 text-left"
          onClick={() => onRead(article)}
          aria-label={`Abrir ${article.title} no leitor`}
        >
          <ArticleImage
            article={article}
            width={700}
            height={900}
            fill={true}
            className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          />
        </button>
        <div className="feed-card-action-rail absolute left-3 top-3 z-20">
          <FeedInteractiveActions
            variant="onDarkMedia"
            articleLink={article.link}
            onRead={() => onRead(article)}
            showRead={!embedUrl}
            showWatch={!!embedUrl}
            showVisit={true}
            compact
            className="!mt-0"
          />
        </div>
        <FavoriteButton
          article={article}
          size="small"
          position="overlay"
          className="right-3 top-3 z-20"
        />
      </div>

      <div className="flex min-h-[8rem] flex-col gap-3 p-4">
        <div className="feed-card-top-rail min-h-0">
          <div className="feed-card-meta-stack">
            <span className="feed-meta truncate text-[10px] font-bold uppercase tracking-[0.18em]">
              {article.sourceTitle}
            </span>
            <FeedResponsiveDate
              date={article.pubDate}
              className="feed-meta text-[10px] uppercase tracking-[0.14em]"
            />
          </div>
        </div>

        <button
          type="button"
          className="feed-card-bottom-copy bg-transparent p-0 text-left"
          onClick={() => onRead(article)}
        >
          <h3 className="feed-title feed-title-card feed-title-hoverable feed-card-title-clamp text-base">
            {article.title}
          </h3>
        </button>
      </div>
    </article>
  );
};
