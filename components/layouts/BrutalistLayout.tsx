import React, { useState } from 'react';
import { Article } from '../../types';
import { getVideoEmbed } from '../../utils/videoEmbed';
import { FavoriteButton } from '../FavoriteButton';
import { ArticleReaderModal } from '../ArticleReaderModal';
import { FeedInteractiveActions } from '../FeedInteractiveActions';

interface BrutalistLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

export const BrutalistSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-10 py-6 font-mono">
      <div className="mx-auto w-full max-w-[1500px]">
        <div className="mb-8 border-b-4 border-black dark:border-white pb-2 h-16 feed-skeleton-block" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-7">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="border-4 border-black dark:border-white h-[450px] feed-skeleton-block" />
          ))}
        </div>
      </div>
    </div>
  );
};

const BrutalistCard: React.FC<{ article: Article; onRead: (a: Article) => void }> = ({ article, onRead }) => {
  const embedUrl = getVideoEmbed(article.link);

  return (
    <article
      className="group relative flex flex-col border-4 border-[rgb(var(--color-text))] bg-[rgb(var(--color-surface))] transition-all duration-300 hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(var(--color-text),0.2)] dark:hover:shadow-[12px_12px_0px_0px_rgba(var(--color-text),0.1)]"
    >
      {/* Media Content */}
      <div className="relative overflow-hidden border-b-4 border-[rgb(var(--color-text))] transition-all duration-500 aspect-[4/3]">
        <ArticleImage
          article={article}
          width={800}
          height={600}
          fill={true}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {embedUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors pointer-events-none">
            <div className="w-16 h-16 bg-[rgb(var(--color-accent))] border-4 border-black rounded-full flex items-center justify-center translate-y-2 group-hover:translate-y-0 transition-transform">
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </div>
          </div>
        )}
      </div>

      {/* Content Block */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <h2 className="font-black tracking-tighter leading-[0.95] mb-4 uppercase group-hover:text-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-text))] hover:text-[rgb(var(--color-surface))] feed-title-hoverable transition-all text-xl md:text-2xl line-clamp-3">
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-1"
              onClick={(event) => {
                event.preventDefault();
                onRead(article);
              }}
            >
              {article.title}
            </a>
          </h2>

          <p className="text-xs font-medium opacity-70 mb-4 border-l-2 border-current pl-2 line-clamp-3">
            {article.description}
          </p>
        </div>

        <div className="pt-3 border-t-2 border-dashed border-[rgb(var(--color-text))]/20 flex justify-between items-center gap-2 text-xs font-bold flex-wrap">
          <div className="flex items-center gap-3">
            <span>{new Date(article.pubDate).toLocaleDateString()}</span>
            <FavoriteButton
              article={article}
              size="small"
              position="inline"
              className="text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-accent))] p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>

          <FeedInteractiveActions
            variant="brutalist"
            articleLink={article.link}
            onRead={() => onRead(article)}
            showRead={!embedUrl}
            showWatch={!!embedUrl}
            showVisit={true}
            className="z-20 !mt-2 flex-wrap gap-2"
          />
        </div>
      </div>
    </article>
  );
};

export const BrutalistLayout: React.FC<BrutalistLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);

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
    <div className="min-h-screen px-4 sm:px-6 lg:px-10 py-6 font-mono">
      <div className="mx-auto w-full max-w-[1500px]">
        {/* Header Decoration */}
        <div className="mb-8 border-b-4 border-[rgb(var(--color-text))] pb-2 flex justify-between items-end uppercase">
          <h1 className="text-4xl md:text-6xl font-black leading-none tracking-tighter">
            VIDEO_FEED
          </h1>
          <span className="hidden md:block font-bold text-xs tracking-widest">
            CNT: {articles.length} // MODE: RAW
          </span>
        </div>

        {/* Uniform Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-7 auto-dense">
          {articles.map((article, index) => (
            <BrutalistCard key={`${article.link}-${index}`} article={article} onRead={setReadingArticle} />
          ))}
        </div>
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

// Internal ArticleImage proxy for Brutalist consistency
const ArticleImage: React.FC<{
  article: Article;
  width: number;
  height: number;
  fill: boolean;
  className: string;
  priority?: boolean;
}> = (props) => {
  return (
    <div className={props.className}>
       <img 
         src={props.article.imageUrl} 
         alt="" 
         className="w-full h-full object-cover grayscale brightness-90 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-500"
         loading={props.priority ? "eager" : "lazy"}
       />
    </div>
  );
};
