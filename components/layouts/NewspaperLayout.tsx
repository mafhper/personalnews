import React, { useState } from 'react';
import type { Article } from '../../types';
import { ArticleReaderModal } from '../ArticleReaderModal';
import { useWeather } from '../../hooks/useWeather';
import { useLanguage } from '../../contexts/LanguageContext';
import { ArticleImage } from '../ArticleImage';
import { FavoriteButton } from '../FavoriteButton';

interface NewspaperLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

export const NewspaperLayout: React.FC<NewspaperLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const { data: weatherData, city, getWeatherIcon, isLoading, changeCity } = useWeather();
  const { t } = useLanguage();
  const now = new Date();

  const main = articles[0];
  const secondary = articles.slice(1, 3);
  const rest = articles.slice(3);

  const handleCityChange = () => {
    const next = prompt(t('weather.city_prompt'), city);
    if (next) changeCity(next);
  };

  const formatTimeAgo = (date: Date) => {
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('time.now') || 'agora';
    if (mins < 60) return `${mins}min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="min-h-screen">
      <div
        className="
          mx-auto px-6 md:px-10 py-8
          max-w-[1400px]
          2xl:max-w-[1680px]
          bg-[rgb(var(--color-surface))]/85
          backdrop-blur
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
              className="flex items-center gap-2 hover:text-[rgb(var(--color-accent))]"
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
            "
          >
            {/* Media */}
            <div
              className="
                relative overflow-hidden rounded-xl
                h-[260px]
                sm:h-[320px]
                md:h-[360px]
                lg:h-[420px]
                2xl:h-[480px]
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

              <FavoriteButton
                article={main}
                size="medium"
                position="overlay"
                className="top-4 right-4 z-20 bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/20 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>

            {/* Content */}
            <div
              className="
                lg:col-span-5
                2xl:col-span-4
                flex flex-col justify-center
                gap-4
                max-w-none
              "
            >
              <span className="text-xs font-bold uppercase tracking-widest text-[rgb(var(--color-accent))] truncate max-w-[200px]">
                {main.sourceTitle}
              </span>

              <h2
                className="
                  font-serif font-bold leading-tight
                  text-2xl
                  sm:text-3xl
                  md:text-4xl
                  lg:text-4xl
                  2xl:text-5xl
                "
              >
                {main.title}
              </h2>

              {main.description && (
                <p className="text-[rgb(var(--color-textSecondary))] leading-relaxed line-clamp-4">
                  {main.description}
                </p>
              )}

              <span className="text-xs text-[rgb(var(--color-textSecondary))]">
                {formatTimeAgo(main.pubDate)}
              </span>
            </div>
          </section>
        )}

        {/* SECONDARY */}
        {secondary.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {secondary.map(article => (
              <article
                key={article.link}
                onClick={() => setReadingArticle(article)}
                className="flex gap-5 cursor-pointer group"
              >
                <div className="relative w-40 h-28 rounded-lg overflow-hidden bg-[rgb(var(--color-background))] flex-shrink-0">
                  <ArticleImage
                    article={article}
                    fill={true}
                    className="absolute inset-0 w-full h-full object-cover object-center"
                    width={400}
                    height={300}
                  />
                </div>

                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-widest text-[rgb(var(--color-accent))] font-bold truncate max-w-[120px]">
                      {article.sourceTitle}
                    </span>
                    <div className="flex-shrink-0">
                      <FavoriteButton
                        article={article}
                        size="small"
                        position="inline"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                  </div>

                  <h3 className="font-serif text-lg font-bold leading-snug group-hover:text-[rgb(var(--color-accent))]">
                    {article.title}
                  </h3>

                  <span className="text-xs text-[rgb(var(--color-textSecondary))]">
                    {formatTimeAgo(article.pubDate)}
                  </span>
                </div>
              </article>
            ))}
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
              <div className="relative h-40 rounded-lg overflow-hidden bg-[rgb(var(--color-background))] mb-3">
                <ArticleImage
                  article={article}
                  fill={true}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  width={600}
                  height={400}
                />
              </div>

              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-block text-[10px] uppercase tracking-widest bg-[rgb(var(--color-accent))]/10 text-[rgb(var(--color-accent))] px-2 py-0.5 rounded font-bold truncate max-w-[150px]">
                  {article.sourceTitle}
                </span>
                <div className="flex-shrink-0">
                  <FavoriteButton
                    article={article}
                    size="small"
                    position="inline"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              </div>

              <h3 className="font-serif text-lg font-bold leading-snug mb-2 group-hover:text-[rgb(var(--color-accent))]">
                {article.title}
              </h3>

              {article.description && (
                <p className="text-sm text-[rgb(var(--color-textSecondary))] line-clamp-3 mb-2">
                  {article.description}
                </p>
              )}

              <span className="text-xs text-[rgb(var(--color-textSecondary))]">
                {formatTimeAgo(article.pubDate)}
              </span>
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