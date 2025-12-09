import React, { useState } from 'react';
import { Article } from '../../types';
import { ArticleReaderModal } from '../ArticleReaderModal';
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

  return (
    <div className="bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] p-8 min-h-screen font-serif">
      <div className="border-b-4 border-[rgb(var(--color-text))] mb-6 pb-2 flex flex-wrap justify-between items-center gap-2">
        <p className="text-sm font-bold uppercase tracking-widest">{t('article.vol')} {new Date().getFullYear()} • {t('article.no')} {new Date().getMonth() + 1} • {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        {/* Weather Widget */}
        <div
          onClick={handleCityChange}
          className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 cursor-pointer hover:text-[rgb(var(--color-accent))] transition-colors"
          title={t('action.edit')}
        >
          {weatherLoading ? (
            <span className="animate-pulse text-xs">...</span>
          ) : weatherData ? (
            <>
              <span>{getWeatherIcon()}</span>
              <span>{weatherData.temperature}°C</span>
              <span className="text-[rgb(var(--color-textSecondary))]">• {city}</span>
            </>
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Headline */}
        <div className="lg:col-span-4 border-b-2 border-[rgb(var(--color-border))] pb-8 mb-4">
          <h2 className="text-5xl font-bold leading-tight mb-4 hover:underline cursor-pointer" onClick={() => setReadingArticle(articles[0])}>
            {articles[0]?.title}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 cursor-pointer" onClick={() => setReadingArticle(articles[0])}>
               {articles[0]?.imageUrl && (
                 <img src={articles[0].imageUrl} className="w-full h-[400px] object-cover transition-all duration-500 rounded-lg" alt="" />
               )}
            </div>
            <div className="text-lg leading-relaxed text-justify">
              <p className="first-letter:text-5xl first-letter:font-bold first-letter:float-left first-letter:mr-2 first-letter:mt-[-5px]">
                {articles[0]?.description}
              </p>
              <div className="mt-4 text-sm font-bold uppercase text-[rgb(var(--color-textSecondary))]">{t('author')} {articles[0]?.sourceTitle}</div>
              <button
                onClick={() => setReadingArticle(articles[0])}
                className="mt-4 px-4 py-2 bg-[rgb(var(--color-accent))] text-white text-sm font-bold rounded hover:opacity-90 transition-opacity"
              >
                {t('action.preview')}
              </button>
            </div>
          </div>
        </div>
        {/* Columns */}
        {articles.slice(1).map((article, i) => (
          <article key={i} className="border-b border-[rgb(var(--color-border))] pb-4 mb-4 break-inside-avoid">
            <span className="text-[10px] font-sans font-bold uppercase bg-[rgb(var(--color-accent))] text-white px-1 mb-2 inline-block rounded">{article.sourceTitle}</span>
            <h3
              className="text-xl font-bold leading-tight mb-2 hover:underline hover:text-[rgb(var(--color-accent))] transition-colors cursor-pointer"
              onClick={() => setReadingArticle(article)}
            >
              {article.title}
            </h3>
            <p className="text-sm leading-snug text-[rgb(var(--color-textSecondary))] line-clamp-3 mb-3">{article.description}</p>
            <button
              onClick={() => setReadingArticle(article)}
              className="text-xs font-bold text-[rgb(var(--color-accent))] hover:underline"
            >
              {t('action.preview')} →
            </button>
          </article>
        ))}
      </div>
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
