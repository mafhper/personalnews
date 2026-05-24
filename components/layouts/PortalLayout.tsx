import React, { useState } from "react";
import { Article } from "../../types";
import { FeaturedArticle } from "../FeaturedArticle";
import { SmallOptimizedImage } from "../SmallOptimizedImage";
import { ArticleReaderModal } from "../ArticleReaderModal";
import { FavoriteButton } from "../FavoriteButton";
import { FeedInteractiveActions } from "../FeedInteractiveActions";
import { getVideoEmbed } from "../../utils/videoEmbed";
interface PortalLayoutProps {
  articles: Article[];
  timeFormat: "12h" | "24h";
}

export const PortalSkeleton: React.FC = () => {
  return (
    <div className="feed-top-clearance container mx-auto px-4 pb-8 space-y-8">
      {/* HERO SECTION SKELETON */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 h-[500px] feed-skeleton-block rounded-xl" />
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex-1 feed-skeleton-block rounded-xl" />
          <div className="flex-1 feed-skeleton-block rounded-xl" />
        </div>
      </div>

      {/* FEED SECTION SKELETON */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-t border-white/5 pt-8">
        <div className="lg:col-span-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex gap-4 p-5 feed-skeleton-block rounded-2xl h-40"
            />
          ))}
        </div>
        <div className="lg:col-span-4 space-y-4">
          <div className="feed-skeleton-block rounded-2xl p-6 h-64" />
        </div>
      </div>
    </div>
  );
};

export const PortalLayout: React.FC<PortalLayoutProps> = ({
  articles,
  timeFormat,
}) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);

  const mainFeatured = articles[0];
  const subFeatured = articles.slice(1, 3);
  const feed = articles.slice(3);

  return (
    <div className="feed-top-clearance container mx-auto px-4 sm:px-6 lg:px-8 pb-8 space-y-8 animate-in fade-in duration-500">
      {/* Top Section: Main Featured + 2 Sub Featured */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Featured (8 cols) */}
        <div className="lg:col-span-8 aspect-[16/9] lg:aspect-auto lg:h-[520px] rounded-xl overflow-hidden relative group">
          <FeaturedArticle
            article={mainFeatured}
            timeFormat={timeFormat}
            onClick={() => setReadingArticle(mainFeatured)}
          />
          {mainFeatured && (
            <div className="absolute bottom-5 right-5 z-20 feed-card-action-rail">
              {(() => {
                const embedUrl = getVideoEmbed(mainFeatured.link);
                return (
                  <FeedInteractiveActions
                    variant="onDarkMedia"
                    articleLink={mainFeatured.link}
                    onRead={() => setReadingArticle(mainFeatured)}
                    showRead={!embedUrl}
                    showWatch={!!embedUrl}
                    showVisit={true}
                    compact
                    className="!mt-0"
                  />
                );
              })()}
            </div>
          )}
        </div>

        {/* Sub Featured (4 cols) */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">
          {subFeatured.map((article, idx) => (
            <div
              key={idx}
              className="min-h-[170px] sm:min-h-[210px] lg:min-h-0 flex-1 relative rounded-xl overflow-hidden group cursor-pointer"
              onClick={() => setReadingArticle(article)}
            >
              <div className="block h-full w-full bg-transparent p-0 text-left">
                <div className="absolute inset-0">
                  <SmallOptimizedImage
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    fallbackText={article.sourceTitle}
                    size={400}
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                <div className="absolute left-3 top-3 z-20 feed-card-action-rail">
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
                </div>

                <FavoriteButton
                  article={article}
                  size="small"
                  position="overlay"
                  className="top-3 right-3 z-20 bg-black/40 hover:bg-black/60 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                />

                <div className="absolute bottom-0 p-4 w-full">
                  <div className="mb-2 flex items-center gap-2 min-w-0 text-[10px] uppercase tracking-[0.22em] text-white/70">
                    <span className="truncate">{article.sourceTitle}</span>
                    <span className="h-px w-4 flex-shrink-0 bg-white/20" />
                    <span className="flex-shrink-0">
                      {article.pubDate.toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </span>
                  </div>
                  <h3 className="text-white font-bold text-lg leading-tight group-hover:underline line-clamp-2">
                    {article.title}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      <div className="border-t border-white/10 pt-8">
        <div className="space-y-4">
          <h3 className="text-xl font-bold feed-accent-text uppercase tracking-wider mb-6 border-b border-[rgba(var(--color-accent),0.25)] pb-2 inline-block">
            Últimas Notícias
          </h3>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {feed.map((article, idx) => (
              <article
                key={idx}
                className="feed-card flex items-stretch gap-4 p-5 rounded-2xl hover:border-[rgba(var(--color-accent),0.25)] transition-all relative group shadow-sm"
              >
                <div className="flex flex-col gap-3 w-40 sm:w-52 flex-shrink-0">
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-inner bg-black/20 group/img">
                    <SmallOptimizedImage
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      fallbackText={article.sourceTitle}
                      size={260}
                    />
                  </div>
                </div>

                <div className="flex-1 flex flex-col p-1 relative">
                  <div className="mb-2 flex items-center gap-2 min-w-0 text-[10px] uppercase tracking-[0.22em]">
                    <span className="feed-meta truncate max-w-[220px]">
                      {article.sourceTitle}
                    </span>
                    <span className="h-px w-4 flex-shrink-0 bg-[rgb(var(--color-border))]/35" />
                    <span className="feed-meta flex-shrink-0">
                      {article.pubDate.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="group/title block bg-transparent p-0 text-left"
                    onClick={() => setReadingArticle(article)}
                  >
                    <h3 className="feed-title text-base sm:text-lg font-bold leading-tight mb-2 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                  </button>

                  {article.description && (
                    <p className="feed-desc text-sm line-clamp-3 mb-4">
                      {article.description}
                    </p>
                  )}

                  <div className="mt-auto flex items-end justify-between gap-3 pt-2">
                    {article.author && article.author !== article.sourceTitle ? (
                      <p className="feed-meta text-xs italic">{`Por ${article.author}`}</p>
                    ) : (
                      <span className="feed-meta text-xs italic">
                        {article.sourceTitle}
                      </span>
                    )}
                    <div className="feed-card-action-rail max-w-none justify-end">
                      {(() => {
                        const embedUrl = getVideoEmbed(article.link);
                        return (
                          <FeedInteractiveActions
                            articleLink={article.link}
                            onRead={() => setReadingArticle(article)}
                            showRead={!embedUrl}
                            showWatch={!!embedUrl}
                            showVisit={true}
                            compact
                            className="!mt-0 justify-end"
                          />
                        );
                      })()}
                      <FavoriteButton
                        article={article}
                        size="small"
                        position="inline"
                      />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {readingArticle && (
        <ArticleReaderModal
          article={readingArticle}
          onClose={() => setReadingArticle(null)}
          onNext={() => {
            const idx = articles.findIndex(
              (a) => a.link === readingArticle.link,
            );
            if (idx < articles.length - 1) setReadingArticle(articles[idx + 1]);
          }}
          onPrev={() => {
            const idx = articles.findIndex(
              (a) => a.link === readingArticle.link,
            );
            if (idx > 0) setReadingArticle(articles[idx - 1]);
          }}
          hasNext={
            articles.findIndex((a) => a.link === readingArticle.link) <
            articles.length - 1
          }
          hasPrev={
            articles.findIndex((a) => a.link === readingArticle.link) > 0
          }
        />
      )}
    </div>
  );
};
