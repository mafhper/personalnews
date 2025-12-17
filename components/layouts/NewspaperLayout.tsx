import React, { useState } from 'react';
import { Article } from '../../types';
import { ArticleReaderModal } from '../ArticleReaderModal';
import { SmallOptimizedImage } from '../SmallOptimizedImage';
import { useWeather } from '../../hooks/useWeather';
import { useLanguage } from '../../contexts/LanguageContext';

interface NewspaperLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

export const NewspaperLayout: React.FC<NewspaperLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const { data: weatherData, city, getWeatherIcon, isLoading: weatherLoading, changeCity } = useWeather();
  const { t } = useLanguage();

  const handleCityChange = () => {
    const newCity = prompt(t('weather.city_prompt'), city);
    if (newCity && newCity.trim() !== '') {
      changeCity(newCity);
    }
  };

  // Helper for time formatting
  const formatTimeAgo = (dateInput: Date | string) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0 || isNaN(diffMs)) return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return t('time.now') || 'agora';
    if (diffMins < 60) return `${diffMins}min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  // Layout slices
  const mainArticle = articles[0];
  const secondaryArticles = articles.slice(1, 3);
  const columnArticles = articles.slice(3);

  return (
    <div className="min-h-screen">
      {/* Newspaper Container with subtle transparency */}
      <div className="max-w-6xl mx-auto p-6 md:p-10 bg-[rgb(var(--color-surface))]/80 backdrop-blur-md rounded-2xl border border-[rgb(var(--color-border))]/20">

        {/* Masthead */}
        <header className="text-center border-b-2 border-[rgb(var(--color-text))] pb-4 mb-8">
          <div className="flex items-center justify-between text-xs uppercase tracking-widest text-[rgb(var(--color-textSecondary))] mb-2">
            <span>{t('article.vol')} {new Date().getFullYear()}</span>
            {/* Weather Widget */}
            <button
              onClick={handleCityChange}
              className="flex items-center gap-1.5 hover:text-[rgb(var(--color-accent))] transition-colors"
              title={t('action.edit')}
            >
              {weatherLoading ? (
                <span className="animate-pulse">...</span>
              ) : weatherData ? (
                <>
                  <span>{getWeatherIcon()}</span>
                  <span>{weatherData.temperature}°</span>
                  <span className="hidden sm:inline text-[rgb(var(--color-textSecondary))]">{city}</span>
                </>
              ) : null}
            </button>
            <span>{new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
          </div>

          <h1 className="font-serif text-4xl md:text-6xl font-black tracking-tight text-[rgb(var(--color-text))]">
            THE DAILY NEWS
          </h1>

          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-[rgb(var(--color-textSecondary))]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {t('feeds.live') || 'LIVE'}
            </span>
            <span className="h-3 w-px bg-[rgb(var(--color-border))]" />
            <span>{articles.length} {t('feeds.articles') || 'artigos'}</span>
          </div>
        </header>

        {/* Main Story */}
        {mainArticle && (
          <section className="mb-8 pb-8 border-b border-[rgb(var(--color-border))]">
            <article
              className="group cursor-pointer"
              onClick={() => setReadingArticle(mainArticle)}
            >
              <div className="grid md:grid-cols-5 gap-6">
                {/* Main Image - 3 columns */}
                <div className="md:col-span-3 relative aspect-[16/10] overflow-hidden rounded-xl bg-[rgb(var(--color-background))]">
                  {mainArticle.imageUrl && (
                    <SmallOptimizedImage
                      src={mainArticle.imageUrl}
                      alt={mainArticle.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      fallbackText={mainArticle.sourceTitle}
                      size={1000}
                    />
                  )}
                </div>

                {/* Main Content - 2 columns */}
                <div className="md:col-span-2 flex flex-col justify-center">
                  <span className="text-xs font-bold uppercase tracking-widest text-[rgb(var(--color-accent))] mb-2">
                    {mainArticle.sourceTitle}
                  </span>

                  <h2 className="font-serif text-2xl md:text-4xl font-bold leading-tight text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-accent))] transition-colors mb-4">
                    {mainArticle.title}
                  </h2>

                  <p className="text-[rgb(var(--color-textSecondary))] leading-relaxed mb-4 line-clamp-4 first-letter:text-4xl first-letter:font-bold first-letter:float-left first-letter:mr-2 first-letter:mt-0.5">
                    {mainArticle.description}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-[rgb(var(--color-textSecondary))]">
                    {mainArticle.author && (
                      <>
                        <span className="font-medium">{mainArticle.author}</span>
                        <span className="h-3 w-px bg-[rgb(var(--color-border))]" />
                      </>
                    )}
                    <span>{formatTimeAgo(mainArticle.pubDate)}</span>
                  </div>
                </div>
              </div>
            </article>
          </section>
        )}

        {/* Secondary Stories Row */}
        {secondaryArticles.length > 0 && (
          <section className="mb-8 pb-8 border-b border-[rgb(var(--color-border))]">
            <div className="grid md:grid-cols-2 gap-6">
              {secondaryArticles.map((article, i) => (
                <article
                  key={i}
                  className="group cursor-pointer flex gap-4"
                  onClick={() => setReadingArticle(article)}
                >
                  {article.imageUrl && (
                    <div className="w-32 h-24 flex-shrink-0 overflow-hidden rounded-lg bg-[rgb(var(--color-background))]">
                      <SmallOptimizedImage
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover"
                        fallbackText={article.sourceTitle}
                        size={300}
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--color-accent))]">
                      {article.sourceTitle}
                    </span>
                    <h3 className="font-serif text-lg font-bold leading-tight text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-accent))] transition-colors line-clamp-2 mt-1">
                      {article.title}
                    </h3>
                    <p className="text-sm text-[rgb(var(--color-textSecondary))] line-clamp-2 mt-1">
                      {article.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Columns Section */}
        {columnArticles.length > 0 && (
          <section className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-4">
            {columnArticles.map((article, i) => (
              <article
                key={i}
                className="break-inside-avoid group cursor-pointer pb-4 border-b border-[rgb(var(--color-border))]"
                onClick={() => setReadingArticle(article)}
              >
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-[rgb(var(--color-accent))]/10 text-[rgb(var(--color-accent))] px-2 py-0.5 rounded mb-2">
                  {article.sourceTitle}
                </span>

                <h3 className="font-serif text-lg font-bold leading-snug text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-accent))] transition-colors mb-2">
                  {article.title}
                </h3>

                <p className="text-sm text-[rgb(var(--color-textSecondary))] leading-relaxed line-clamp-3 mb-2">
                  {article.description}
                </p>

                <div className="flex items-center gap-2 text-xs text-[rgb(var(--color-textSecondary))]">
                  <span>{formatTimeAgo(article.pubDate)}</span>
                  <span className="text-[rgb(var(--color-accent))] font-medium group-hover:underline">
                    {t('action.read') || 'Ler'} →
                  </span>
                </div>
              </article>
            ))}
          </section>
        )}

        {/* Footer */}
        <footer className="mt-10 pt-6 border-t border-[rgb(var(--color-border))] text-center">
          <p className="text-xs uppercase tracking-widest text-[rgb(var(--color-textSecondary))]">
            {t('article.end') || 'Fim da edição'}
          </p>
        </footer>
      </div>

      {/* Reader Modal */}
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
