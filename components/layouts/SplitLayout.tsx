import React, { useState } from "react";
import { Article } from "../../types";
import { OptimizedImage } from "../OptimizedImage";
import { ArticleReaderModal } from "../ArticleReaderModal";
import { FavoriteButton } from "../FavoriteButton";
import { FeedInteractiveActions } from "../FeedInteractiveActions";
import { getVideoEmbed } from "../../utils/videoEmbed";

interface SplitLayoutProps {
  articles: Article[];
  timeFormat: "12h" | "24h";
}

const Bone: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`feed-skeleton-block ${className}`} />
);

export const SplitSkeleton: React.FC = () => {
  return (
    <div className="feed-page-frame feed-page-frame--wide flex flex-col min-h-screen">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`flex flex-col lg:flex-row h-auto lg:min-h-[420px] lg:h-[50vh] min-h-[400px] ${i % 2 === 1 ? "lg:flex-row-reverse" : ""}`}
        >
          <div className="w-full lg:w-1/2 h-64 lg:h-full feed-skeleton-block" />
          <div className="w-full lg:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center border-b border-white/5">
            <div className="max-w-2xl mx-auto md:mx-0 space-y-6">
              <Bone className="h-4 w-32" />
              <Bone className="h-10 w-full" />
              <Bone className="h-24 w-full" />
              <Bone className="h-4 w-48" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const SplitLayout: React.FC<SplitLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);

  return (
    <div className="feed-page-frame feed-page-frame--wide flex flex-col gap-0">
      {articles.map((article, i) => (
        <article
          key={i}
          className={`feed-surface-strong overflow-hidden border-b border-[rgb(var(--color-border))]/28 flex flex-col items-stretch lg:flex-row min-h-[26rem] lg:min-h-[34rem] xl:min-h-[38rem] group ${i % 2 === 1 ? "lg:flex-row-reverse" : ""}`}
        >
          <div
            className="w-full lg:w-1/2 aspect-[4/3] lg:aspect-auto min-h-[18rem] lg:min-h-[34rem] xl:min-h-[38rem] relative overflow-hidden self-stretch cursor-pointer"
            onClick={() => setReadingArticle(article)}
          >
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#13233d_0%,#0d121a_100%)]">
              <OptimizedImage
                src={article.imageUrl}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                alt=""
                fallbackText={article.sourceTitle}
                width={800}
                height={600}
              />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,10,18,0.08)_0%,rgba(6,10,18,0.24)_100%)] group-hover:bg-transparent transition-colors" />
          </div>
          <div className="w-full lg:w-1/2 p-7 md:p-10 lg:p-14 xl:p-16 flex flex-col justify-center bg-[rgb(var(--theme-surface-elevated))]">
            <div className="max-w-[38rem] mx-auto md:mx-0">
              <div className="flex justify-between items-start mb-5 gap-4">
                <span className="feed-chip font-bold uppercase tracking-widest text-xs truncate max-w-[150px] md:max-w-[320px]">
                  {article.sourceTitle}
                </span>
                <FavoriteButton
                  article={article}
                  size="medium"
                  position="inline"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <h2
                className="text-[clamp(2rem,2vw+1.2rem,4.25rem)] font-bold mb-5 text-[rgb(var(--theme-text-on-surface))] transition-colors cursor-pointer leading-[1.02] tracking-[-0.04em] max-w-[14ch]"
                onClick={() => setReadingArticle(article)}
              >
                {article.title}
              </h2>
              <p className="text-[rgb(var(--theme-text-secondary-on-surface))] text-[clamp(1rem,0.3vw+0.96rem,1.2rem)] leading-relaxed mb-7 line-clamp-4 max-w-[64ch]">
                {article.description}
              </p>
              <div className="flex items-center text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[rgb(var(--theme-text-secondary-on-surface))]">
                {new Date(article.pubDate).toDateString()}
              </div>
              {(() => {
                const embedUrl = getVideoEmbed(article.link);
                return (
                  <FeedInteractiveActions
                    articleLink={article.link}
                    onRead={() => setReadingArticle(article)}
                    showRead={!embedUrl}
                    showWatch={!!embedUrl}
                    showVisit={true}
                    className="!mt-7 self-start"
                  />
                );
              })()}
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
