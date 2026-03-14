import React, { useState } from 'react';
import { Article } from '../../types';
import { ArticleItem } from '../ArticleItem';
import { ArticleReaderModal } from '../ArticleReaderModal';
import { FavoriteButton } from '../FavoriteButton';

interface ModernPortalLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

const Bone: React.FC<{ className?: string }> = ({ className = "" }) => <div className={`feed-skeleton-block rounded-xl ${className}`} />;

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
      <section className="py-10 border-y border-white/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {[1, 2, 3, 4].map(i => (
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
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.18fr)_minmax(18rem,0.82fr)]">
          <div className="h-[320px] md:h-[360px] feed-skeleton-block rounded-2xl" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 feed-skeleton-block rounded-xl" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
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

export const ModernPortalLayout: React.FC<ModernPortalLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);

  if (articles.length === 0) return null;

  // Slicing the data for different sections
  const heroArticle = articles[0];
  const topStories = articles.slice(1, 3); // 2 articles next to hero
  const featuredStrip = articles.slice(3, 7);
  const latestArticles = articles.slice(7);
  const leadStory = latestArticles[0];
  const sidebarFeed = latestArticles.slice(1, 5);
  const continuationFeed = latestArticles.slice(5);

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
          className="group relative overflow-hidden rounded-2xl min-h-[280px] sm:min-h-[340px] md:min-h-[390px] lg:min-h-[450px] xl:min-h-[500px] shadow-xl cursor-pointer"
          onClick={() => handleOpenReader(heroArticle)}
        >
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${heroArticle.imageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2070'})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-85" />

          <FavoriteButton
            article={heroArticle}
            size="large"
            position="overlay"
            className="top-4 right-4 z-20 bg-black/30 hover:bg-black/50 border border-white/15 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          />

          <div className="absolute bottom-0 left-0 p-6 lg:p-8 xl:p-10 max-w-[38rem]">
            <span className="feed-chip mb-4 shadow-sm shadow-black/30">
              Matéria principal
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight drop-shadow-xl tracking-tight">
              <a
                href={heroArticle.link}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline decoration-4 decoration-[rgba(var(--color-accent),0.45)] underline-offset-8"
                onClick={(e) => { e.preventDefault(); handleOpenReader(heroArticle); }}
              >
                {heroArticle.title}
              </a>
            </h1>
            <p className="hidden md:block text-lg text-white/84 line-clamp-2 mb-4 max-w-2xl drop-shadow-sm">
              {heroArticle.description}
            </p>
            <div className="flex items-center text-sm font-bold min-w-0 text-white">
              <span className="feed-chip truncate max-w-[150px] sm:max-w-[250px] shadow-sm shadow-black/10">{heroArticle.sourceTitle}</span>
              <span className="mx-2 flex-shrink-0 text-white">•</span>
              <span className="truncate text-white font-black">{new Date(heroArticle.pubDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Top Stories */}
        <div className="grid grid-cols-1 gap-[var(--feed-page-gap)] sm:grid-cols-2 lg:grid-cols-1 lg:auto-rows-fr">
          {topStories.map((article) => (
            <div
              key={article.link}
              className="relative h-full rounded-2xl overflow-hidden group min-h-[180px] sm:min-h-[200px] md:min-h-[220px] lg:min-h-[200px] aspect-[4/3] md:aspect-auto shadow-md cursor-pointer"
              onClick={() => handleOpenReader(article)}
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url(${article.imageUrl})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <FavoriteButton
                article={article}
                size="medium"
                position="overlay"
                className="top-4 right-4 z-20 bg-black/30 hover:bg-black/50 border border-white/10 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute bottom-0 left-0 p-5 w-full">
                <h2 className="text-lg font-bold text-white leading-snug mb-2 drop-shadow-lg tracking-tight">
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-white/90"
                    onClick={(e) => { e.preventDefault(); handleOpenReader(article); }}
                  >
                    {article.title}
                  </a>
                </h2>
                <div className="flex items-center text-xs font-bold min-w-0 text-white">
                  <span className="feed-chip truncate max-w-[120px] shadow-sm shadow-black/10">{article.sourceTitle}</span>
                  <span className="mx-2 flex-shrink-0 text-white">•</span>
                  <span className="text-white/80">{new Date(article.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 2: VISUAL STRIP (4 cols) */}
      <section className="feed-surface rounded-[calc(var(--feed-card-radius)*1.1)] px-4 py-8 md:px-8 md:py-10">
        <div className="feed-section-heading">
            <h3 className="text-sm md:text-base font-black uppercase tracking-[0.2em] feed-accent-text">
              Leituras em destaque
            </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {featuredStrip.map((article) => (
            <ArticleItem
              key={article.link}
              article={article}
              layoutMode="modern"
              density="compact"
              onClick={handleOpenReader}
              className="[&_.relative.mb-4]:!aspect-[4/3] [&_.relative.mb-4]:!h-auto"
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
            <div
              className={`grid grid-cols-1 gap-[var(--feed-page-gap)] items-start ${
                sidebarFeed.length > 0
                  ? "lg:grid-cols-[minmax(0,1.18fr)_minmax(18rem,0.82fr)]"
                  : ""
              }`}
            >
              <div className="min-w-0">
                <ArticleItem
                  article={leadStory}
                  layoutMode="modern"
                  density="compact"
                  onClick={handleOpenReader}
                  className="[&_.relative.mb-4]:!aspect-[16/10] [&_.relative.mb-4]:!h-auto [&_.relative.mb-4]:max-h-[18rem]"
                />
              </div>

              {sidebarFeed.length > 0 && (
                <div className="feed-surface-strong rounded-[var(--feed-card-radius)] p-6">
                  <h4 className="feed-section-heading text-lg font-bold mb-4">
                    Para não perder
                  </h4>
                  <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4 lg:block lg:space-y-4">
                    {sidebarFeed.map((article, index) => (
                      <div
                        key={article.link}
                        className="group cursor-pointer feed-card feed-card--flat rounded-[calc(var(--feed-card-radius)*0.9)] p-4 transition-all duration-300"
                        onClick={() => handleOpenReader(article)}
                      >
                        <div className="flex gap-4 items-start">
                          <span className="text-2xl font-black feed-accent-text opacity-40 font-serif group-hover:opacity-100 transition-opacity">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <h5 className="feed-title feed-title-hoverable font-bold leading-tight transition-all text-sm mb-2 line-clamp-2">
                                {article.title}
                              </h5>
                              <FavoriteButton
                                article={article}
                                size="small"
                                position="inline"
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-[rgb(var(--color-textSecondary))]"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="feed-chip text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded truncate max-w-full">
                                {article.sourceTitle}
                              </span>
                              <span className="feed-meta feed-meta-hoverable text-[10px] font-bold transition-colors">
                                {new Date(article.pubDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-6 py-3 text-sm font-medium text-[rgb(var(--color-textSecondary))] hover:text-[rgb(var(--color-text))] border-t border-[rgb(var(--color-border))]/45 transition-colors">
                    Ver arquivo completo
                  </button>
                </div>
              )}
            </div>
          )}

          {continuationFeed.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {continuationFeed.map((article) => (
                <ArticleItem
                  key={article.link}
                  article={article}
                  layoutMode="modern"
                  density="comfortable"
                  onClick={handleOpenReader}
                  className="[&_.relative.mb-4]:!aspect-[4/3] [&_.relative.mb-4]:!h-auto"
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
          hasNext={articles.findIndex(a => a.link === readingArticle.link) < articles.length - 1}
          hasPrev={articles.findIndex(a => a.link === readingArticle.link) > 0}
        />
      )}
    </div>
  );
};
