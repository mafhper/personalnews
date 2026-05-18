import React, { useState } from 'react';
import type { Article } from '../../types';
import { ArticleReaderModal } from '../ArticleReaderModal';
import { useWeather } from '../../hooks/useWeather';
import { useLanguage } from '../../hooks/useLanguage';
import { ArticleImage } from '../ArticleImage';
import { FavoriteButton } from '../FavoriteButton';
import { FeedInteractiveActions } from '../FeedInteractiveActions';
import { FeedResponsiveDate } from '../FeedResponsiveDate';
import { getVideoEmbed } from '../../utils/videoEmbed';

interface NewspaperLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

const Bone: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`feed-skeleton-block ${className}`} />
);

export const NewspaperSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen px-6 md:px-10 py-8 max-w-[1400px] 2xl:max-w-[1680px] mx-auto border border-white/5 rounded-2xl">
      {/* Masthead Skeleton */}
      <div className="border-b border-white/5 pb-6 mb-10 flex justify-between">
        <Bone className="h-4 w-24" />
        <Bone className="h-4 w-32" />
        <Bone className="h-4 w-24" />
      </div>

      {/* Hero Skeleton */}
      <div className="grid lg:grid-cols-12 gap-8 mb-16 h-[450px]">
        <div className="lg:col-span-7 2xl:col-span-8 feed-skeleton-block rounded-xl" />
        <div className="lg:col-span-5 2xl:col-span-4 flex flex-col justify-center space-y-6">
          <Bone className="h-4 w-32" />
          <Bone className="h-12 w-full" />
          <Bone className="h-24 w-full" />
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-10">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-4 border-t border-white/5 pt-4">
            <Bone className="h-40 w-full" />
            <Bone className="h-4 w-3/4" />
            <Bone className="h-6 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const NewspaperLayout: React.FC<NewspaperLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const { data: weatherData, city, getWeatherIcon, isLoading, changeCity } = useWeather();
  const { t } = useLanguage();

  const main = articles[0];
  const rest = articles.slice(1);
  const mainExcerpt = [main?.description, main?.content]
    .filter(Boolean)
    .join(" ")
    .trim();

  const handleCityChange = () => {
    const next = prompt(t('weather.city_prompt'), city);
    if (next) changeCity(next);
  };

  return (
    <div className="min-h-screen">
      <div
            className="
              mx-auto px-6 md:px-10 py-8
              max-w-[1400px]
              2xl:max-w-[1680px]
              feed-surface
              rounded-2xl
              border border-[rgb(var(--color-border))]/20
            "
      >

        {/* Masthead */}
        <header className="border-b border-[rgb(var(--color-border))] pb-6 mb-10">
          <div className="flex justify-between items-center text-xs uppercase tracking-widest text-[rgb(var(--color-textSecondary))]">
            <span>{t('article.vol')} {new Date().getFullYear()}</span>

            <button
              onClick={handleCityChange}
              className="flex items-center gap-2 hover:text-white"
            >
              {isLoading ? '...' : weatherData && (
                <>
                  <span>{getWeatherIcon()}</span>
                  <span>{weatherData.temperature}°</span>
                  <span className="hidden sm:inline">{city}</span>
                </>
              )}
            </button>

            <span>
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short'
              })}
            </span>
          </div>
        </header>

        {/* HERO — ESTÁVEL EM TODOS OS BREAKPOINTS */}
        {main && (
          <section
            onClick={() => setReadingArticle(main)}
            className="
              relative mb-16 cursor-pointer group
              grid grid-cols-1
              lg:grid-cols-12
              gap-8
              items-stretch
              lg:min-h-[420px]
              2xl:min-h-[480px]
            "
          >
            {/* Media */}
            <div
              className="
                relative overflow-hidden rounded-xl
                h-[260px]
                sm:h-[320px]
                md:h-[360px]
                lg:h-full
                lg:min-h-[420px]
                2xl:min-h-[480px]
                lg:col-span-7
                2xl:col-span-8
                bg-[rgb(var(--color-background))]
              "
            >
              <ArticleImage
                article={main}
                fill={true}
                className="absolute inset-0 w-full h-full object-cover object-center"
                width={1600}
                height={900}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--color-background))]/90 via-[rgb(var(--color-background))]/20 to-transparent" />
              <div className="feed-card-action-rail absolute left-4 top-4 z-20">
                {(() => {
                  const embedUrl = getVideoEmbed(main.link);
                  return (
                    <FeedInteractiveActions
                      variant="onDarkMedia"
                      articleLink={main.link}
                      onRead={() => setReadingArticle(main)}
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
                article={main}
                size="small"
                position="overlay"
                className="right-4 top-4 z-20"
              />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                <h2
                  className="
                    feed-card-title-clamp
                    font-serif font-bold leading-tight
                    text-xl
                    sm:text-2xl
                    md:text-3xl
                    lg:text-3xl
                    2xl:text-4xl
                    text-[rgb(var(--color-text))]
                    drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]
                  "
                  style={{ "--feed-title-lines": 5 } as React.CSSProperties}
                >
                  {main.title}
                </h2>
              </div>
            </div>

            {/* Content */}
            <div
              className="
                lg:col-span-5
                2xl:col-span-4
                flex flex-col justify-between
                gap-4
                h-full
                max-w-none
              "
            >
              <div className="feed-card-top-rail">
                <div className="feed-card-meta-stack">
                  <span className="feed-chip inline-flex w-fit max-w-full text-xs font-bold uppercase tracking-widest">
                    {main.sourceTitle}
                  </span>
                  <FeedResponsiveDate
                    date={main.pubDate}
                    className="text-xs text-[rgb(var(--color-textSecondary))]"
                  />
                </div>
              </div>

              <div className="feed-card-bottom-copy">
                <p
                  className="feed-desc font-serif text-base leading-8 text-[rgb(var(--color-text))]/82 first-letter:float-left first-letter:mr-2 first-letter:text-5xl first-letter:font-bold first-letter:leading-none"
                  style={{ columnCount: 1 }}
                >
                  {mainExcerpt || main.title}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* EDITORIAL GRID */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-10">
          {rest.map(article => (
            <article
              key={article.link}
              onClick={() => setReadingArticle(article)}
              className="cursor-pointer group border-t border-[rgb(var(--color-border))] pt-4"
            >
              <h3
                className="feed-card-title-clamp font-serif text-base font-bold leading-snug mb-3 group-hover:text-[rgb(var(--color-accent))]"
                style={{ "--feed-title-lines": 5 } as React.CSSProperties}
              >
                {article.title}
              </h3>
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-[rgb(var(--color-background))] mb-3">
                <ArticleImage
                  article={article}
                  fill={true}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  width={600}
                  height={400}
                />
                <div className="feed-card-action-rail absolute left-3 top-3 z-20">
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
                  className="right-3 top-3 z-20"
                />
              </div>

              <div className="feed-card-bottom-copy flex flex-col gap-3">
                <div className="feed-card-top-rail">
                  <div className="feed-card-meta-stack">
                    <span className="feed-chip inline-flex w-fit max-w-full text-[10px] uppercase tracking-widest px-2 py-0.5 rounded font-bold truncate">
                      {article.sourceTitle}
                    </span>
                    <FeedResponsiveDate
                      date={article.pubDate}
                      className="text-xs text-[rgb(var(--color-textSecondary))]"
                    />
                  </div>
                </div>
                {article.description && (
                  <p
                    className="feed-desc feed-card-desc-clamp text-sm"
                    style={{ "--feed-desc-lines": 3 } as React.CSSProperties}
                  >
                    {article.description}
                  </p>
                )}
              </div>
            </article>
          ))}
        </section>

        <footer className="mt-16 pt-6 border-t border-[rgb(var(--color-border))] text-center">
          <p className="text-xs uppercase tracking-widest text-[rgb(var(--color-textSecondary))]">
            {t('article.end') || 'Fim da edição'}
          </p>
        </footer>
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
