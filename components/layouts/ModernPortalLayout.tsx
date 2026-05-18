import React, { useState } from "react";
import { Article } from "../../types";
import { ArticleReaderModal } from "../ArticleReaderModal";
import { FavoriteButton } from "../FavoriteButton";
import { FeedInteractiveActions } from "../FeedInteractiveActions";
import { FeedResponsiveDate } from "../FeedResponsiveDate";
import { getVideoEmbed } from "../../utils/videoEmbed";
interface ModernPortalLayoutProps {
  articles: Article[];
  timeFormat: "12h" | "24h";
}

const Bone: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`feed-skeleton-block rounded-xl ${className}`} />
);

const ModernFeedCard: React.FC<{
  article: Article;
  onRead: (article: Article) => void;
  large?: boolean;
}> = ({ article, onRead, large = false }) => {
  const embedUrl = getVideoEmbed(article.link);
  const authorLabel =
    article.author && article.author !== article.sourceTitle
      ? article.author
      : undefined;

  return (
    <article className="feed-card group flex h-full flex-col p-4 sm:p-5">
      <div
        className={`feed-media relative mb-4 overflow-hidden rounded-[calc(var(--feed-card-radius)*0.8)] ${
          large ? "aspect-[16/10] max-h-[18rem]" : "aspect-[4/3]"
        }`}
      >
        <button
          type="button"
          onClick={() => onRead(article)}
          className="block h-full w-full bg-transparent p-0 text-left"
          aria-label={`Abrir ${article.title} no leitor`}
        >
          <div
            className="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{
              backgroundImage: `url(${article.imageUrl || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2070"})`,
            }}
          />
        </button>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/65 to-transparent" />
        <div className="absolute left-3 top-3 z-20 feed-card-action-rail">
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
          className="right-3 top-3 z-20 bg-black/40 hover:bg-black/60 border border-white/10 shadow-sm"
        />
      </div>

      <div className="flex min-h-0 flex-col items-start justify-start gap-2 px-1 text-left">
        <button
          type="button"
          onClick={() => onRead(article)}
          className="bg-transparent p-0 text-left"
        >
          <h4 className="feed-title feed-title-card feed-card-title-clamp text-base font-bold leading-tight sm:text-lg">
            {article.title}
          </h4>
        </button>
        <div className="flex w-full min-w-0 flex-col items-start gap-1">
          <div className="flex w-full min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <span className="feed-chip inline-flex w-fit max-w-[14rem] shrink-0 truncate px-2.5 py-1">
              {article.sourceTitle}
            </span>
            <FeedResponsiveDate
              date={article.pubDate}
              className="feed-meta shrink-0 whitespace-nowrap text-[11px]"
            />
          </div>
          {authorLabel && (
            <span className="feed-meta w-full truncate text-[11px]">
              Por {authorLabel}
            </span>
          )}
        </div>
        {article.description && (
          <p
            className="feed-desc feed-card-desc-clamp mt-2 text-left text-sm leading-relaxed"
            style={{ "--feed-desc-lines": 4 } as React.CSSProperties}
          >
            {article.description}
          </p>
        )}
      </div>
    </article>
  );
};

export const ModernPortalSkeleton: React.FC = () => {
  return (
    <div className="feed-page-frame flex flex-col gap-8 pb-12">
      {/* HERO SECTION SKELETON */}
      <section className="grid grid-cols-1 gap-5 md:gap-6 lg:grid-cols-[minmax(0,1.18fr)_minmax(18rem,0.82fr)]">
        <div className="h-[340px] md:h-[400px] lg:h-[470px] feed-skeleton-block rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 md:gap-5">
          <div className="h-[180px] md:h-[200px] lg:h-[210px] feed-skeleton-block rounded-2xl" />
          <div className="h-[180px] md:h-[200px] lg:h-[210px] feed-skeleton-block rounded-2xl" />
        </div>
      </section>

      {/* STRIP SKELETON */}
      <section className="py-10 border-y border-white/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-4">
            <Bone className="aspect-video" />
            <Bone className="h-4 w-3/4" />
            <Bone className="h-3 w-1/2" />
          </div>
        ))}
      </section>

      {/* MAIN FEED SKELETON */}
      <section className="space-y-6">
        <Bone className="h-6 w-48" />
        <div className="grid grid-cols-1 gap-8">
          <div className="h-[320px] md:h-[360px] feed-skeleton-block rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-4">
              <Bone className="h-48" />
              <Bone className="h-4 w-full" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export const ModernPortalLayout: React.FC<ModernPortalLayoutProps> = ({
  articles,
}) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);

  if (articles.length === 0) return null;

  // Slicing the data for different sections
  const heroArticle = articles[0];
  const topStories = articles.slice(1, 3); // 2 articles next to hero
  const featuredStrip = articles.slice(3, 6);
  const latestArticles = articles.slice(6);
  const leadStory = latestArticles[0];
  const continuationFeed = latestArticles.slice(1);

  const handleOpenReader = (article: Article) => {
    setReadingArticle(article);
  };

  const handleNextArticle = () => {
    if (!readingArticle) return;
    const currentIndex = articles.findIndex(
      (a) => a.link === readingArticle.link,
    );
    if (currentIndex < articles.length - 1) {
      setReadingArticle(articles[currentIndex + 1]);
    }
  };

  const handlePrevArticle = () => {
    if (!readingArticle) return;
    const currentIndex = articles.findIndex(
      (a) => a.link === readingArticle.link,
    );
    if (currentIndex > 0) {
      setReadingArticle(articles[currentIndex - 1]);
    }
  };

  return (
    <div className="feed-page-frame flex flex-col gap-[var(--feed-section-gap)] pb-12">
      {/* SECTION 1: HERO GRID */}
      <section
        className={`grid grid-cols-1 gap-[var(--feed-page-gap)] items-stretch ${
          topStories.length > 0
            ? "lg:grid-cols-[minmax(0,1.18fr)_minmax(18rem,0.82fr)]"
            : ""
        }`}
      >
        {/* Main Hero */}
        <div
          className="feed-hero-frame group relative min-h-[280px] sm:min-h-[340px] md:min-h-[390px] lg:min-h-[450px] xl:min-h-[500px] shadow-xl cursor-pointer"
          onClick={() => handleOpenReader(heroArticle)}
        >
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{
              backgroundImage: `url(${heroArticle.imageUrl || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2070"})`,
            }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,5,9,0.18)_0%,rgba(3,5,9,0.28)_20%,rgba(3,5,9,0.74)_64%,rgba(3,5,9,0.97)_100%)]" />

          <div className="feed-image-story-top-rail">
            <div className="feed-card-meta-stack max-w-[18rem] text-xs font-semibold text-white/86">
              <span className="inline-flex w-fit max-w-full truncate rounded-full bg-black/34 px-3 py-1 text-white/88 backdrop-blur-md">
                {heroArticle.sourceTitle}
              </span>
              <FeedResponsiveDate
                date={heroArticle.pubDate}
                className="text-[11px] font-semibold text-white/72 drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)]"
              />
            </div>
            <div className="feed-card-action-rail">
              {(() => {
                const embedUrl = getVideoEmbed(heroArticle.link);
                return (
                  <FeedInteractiveActions
                    variant="onDarkMedia"
                    articleLink={heroArticle.link}
                    onRead={() => handleOpenReader(heroArticle)}
                    showRead={!embedUrl}
                    showWatch={!!embedUrl}
                    showVisit={true}
                    compact
                    className="!mt-0"
                  />
                );
              })()}
              <FavoriteButton
                article={heroArticle}
                size="large"
                position="inline"
                className="bg-black/30 hover:bg-black/50 border border-white/15 shadow-md"
              />
            </div>
          </div>

          <div className="feed-image-story-bottom-copy max-w-[42rem]">
            <div className="px-1 py-1 sm:px-2 sm:py-2 md:px-3">
              <h1 className="feed-title feed-title-hero text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-white mb-4 drop-shadow-xl">
                <button
                  type="button"
                  className="feed-link-affordance feed-card-title-clamp bg-transparent p-0 text-left"
                  onClick={() => handleOpenReader(heroArticle)}
                  style={{ "--feed-title-lines": 4 } as React.CSSProperties}
                >
                  {heroArticle.title}
                </button>
              </h1>
              <div className="mb-4 hidden max-w-2xl md:block">
                <p className="text-lg text-white/92 line-clamp-2 drop-shadow-sm">
                  <span className="feed-image-subtitle-band">
                    {heroArticle.description}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Top Stories */}
        <div className="grid grid-cols-1 gap-[var(--feed-page-gap)] sm:grid-cols-2 lg:grid-cols-1 lg:auto-rows-fr">
          {topStories.map((article) => (
            <div
              key={article.link}
              className="relative h-full rounded-[calc(var(--feed-card-radius)*1.35)] overflow-hidden group min-h-[180px] sm:min-h-[200px] md:min-h-[220px] lg:min-h-[200px] aspect-[4/3] md:aspect-auto shadow-md cursor-pointer"
              onClick={() => handleOpenReader(article)}
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url(${article.imageUrl})` }}
              />
              <div className="feed-image-story-overlay absolute inset-0" />
              <div className="feed-image-story-top-rail">
                <div className="feed-image-story-meta feed-card-meta-stack max-w-[70%] text-[10px] font-semibold text-white/82 sm:text-xs">
                  <span className="inline-flex w-fit max-w-full truncate rounded-full bg-black/40 px-2.5 py-1 text-white/88 backdrop-blur-md">
                    {article.sourceTitle}
                  </span>
                  <FeedResponsiveDate
                    date={article.pubDate}
                    className="text-white/72 drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)]"
                  />
                </div>
                <div className="feed-card-action-rail">
                  {(() => {
                    const embedUrl = getVideoEmbed(article.link);
                    return (
                      <FeedInteractiveActions
                        variant="onDarkMedia"
                        articleLink={article.link}
                        onRead={() => handleOpenReader(article)}
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
                    size="medium"
                    position="inline"
                    className="bg-black/30 hover:bg-black/50 border border-white/10 shadow-sm"
                  />
                </div>
              </div>
              <div className="feed-image-story-bottom-copy">
                <div className="feed-image-story-shell">
                  <h2 className="feed-title feed-title-feature feed-image-story-title text-base lg:text-lg mb-2 line-clamp-2">
                    <button
                      type="button"
                      className="feed-link-affordance bg-transparent p-0 text-left transition-colors hover:text-white/92"
                      onClick={() => handleOpenReader(article)}
                    >
                      {article.title}
                    </button>
                  </h2>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 2: VISUAL STRIP (3 cols) */}
      <section className="feed-surface rounded-[calc(var(--feed-card-radius)*1.1)] px-4 py-8 text-left md:px-8 md:py-10">
        <div className="feed-section-heading mb-6">
          <h3 className="text-sm md:text-base font-black uppercase tracking-[0.2em] feed-accent-text">
            Leituras em destaque
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {featuredStrip.map((article) => (
            <ModernFeedCard
              key={article.link}
              article={article}
              onRead={handleOpenReader}
            />
          ))}
        </div>
      </section>

      {/* SECTION 3: MAIN CONTENT + CONTINUATION */}
      {latestArticles.length > 0 && (
        <section className="space-y-6">
          <div className="feed-section-heading">
            <h3 className="feed-title text-xl md:text-2xl font-bold tracking-tight">
              Últimas leituras
            </h3>
          </div>

          {leadStory && (
            <div className="grid grid-cols-1 gap-[var(--feed-page-gap)] items-start">
              <div className="min-w-0">
                <ModernFeedCard
                  article={leadStory}
                  onRead={handleOpenReader}
                  large
                />
              </div>
            </div>
          )}

          {continuationFeed.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {continuationFeed.map((article) => (
                <ModernFeedCard
                  key={article.link}
                  article={article}
                  onRead={handleOpenReader}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {readingArticle && (
        <ArticleReaderModal
          article={readingArticle}
          onClose={() => setReadingArticle(null)}
          onNext={handleNextArticle}
          onPrev={handlePrevArticle}
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
