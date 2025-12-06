import React, { useState } from 'react';
import { Article } from '../../types';
import { MagazineReaderModal } from '../MagazineReaderModal';
import { LazyImage } from '../LazyImage';
import { useWeather } from '../../hooks/useWeather';

interface MagazineLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

export const MagazineLayout: React.FC<MagazineLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const { data: weatherData, city, changeCity, isLoading: weatherLoading, getWeatherIcon } = useWeather();
  const [showCityInput, setShowCityInput] = useState(false);
  const [cityInputValue, setCityInputValue] = useState('');

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

  const hasContent = () => {
    return true; 
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500 min-h-screen font-serif text-[rgb(var(--color-text))]">
      {/* Header Decoration */}
      <div className="w-full border-b-[3px] border-[rgb(var(--color-text))] mb-12 pb-2 flex flex-wrap justify-between items-end gap-2 opacity-80">
        <span className="text-xs font-sans font-bold uppercase tracking-widest text-[rgb(var(--color-textSecondary))]">Personal News Edition</span>
        
        {/* Weather Widget */}
        <div className="relative">
          <button 
            onClick={() => { setShowCityInput(!showCityInput); setCityInputValue(city); }}
            className="flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-widest text-[rgb(var(--color-textSecondary))] hover:text-[rgb(var(--color-accent))] transition-colors px-2 py-1 rounded border border-transparent hover:border-[rgb(var(--color-border))]"
            title="Click to change city"
          >
            {weatherLoading ? (
              <span className="animate-pulse">Loading...</span>
            ) : weatherData ? (
              <>
                <span>{getWeatherIcon()}</span>
                <span>{weatherData.temperature}°C</span>
                <span className="text-[rgb(var(--color-textSecondary))] opacity-70">• {city}</span>
              </>
            ) : (
              <span>Weather N/A</span>
            )}
          </button>
          
          {showCityInput && (
            <div className="absolute top-full right-0 mt-2 p-3 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-lg shadow-xl z-50 min-w-[200px]">
              <input 
                type="text" 
                value={cityInputValue} 
                onChange={(e) => setCityInputValue(e.target.value)}
                placeholder="Enter city name"
                className="w-full px-3 py-2 text-sm border border-[rgb(var(--color-border))] rounded bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] mb-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    changeCity(cityInputValue);
                    setShowCityInput(false);
                  }
                }}
                autoFocus
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => { changeCity(cityInputValue); setShowCityInput(false); }}
                  className="flex-1 px-3 py-1 text-xs font-bold bg-[rgb(var(--color-accent))] text-white rounded hover:opacity-90"
                >
                  Update
                </button>
                <button 
                  onClick={() => setShowCityInput(false)}
                  className="px-3 py-1 text-xs font-bold border border-[rgb(var(--color-border))] rounded hover:bg-[rgb(var(--color-surface))]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
        
        <span className="text-xs font-sans font-bold uppercase tracking-widest text-[rgb(var(--color-textSecondary))]">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-12">
        
        {/* Featured Article (Left Big - 7 cols) */}
        {articles.length > 0 && (
            <div className="lg:col-span-7 group cursor-pointer" onClick={() => handleOpenReader(articles[0])}>
              <div className="relative aspect-[4/3] overflow-hidden mb-6 rounded-lg bg-[rgb(var(--color-surface))]">
                <LazyImage 
                    src={articles[0].imageUrl || `https://picsum.photos/seed/${articles[0].link}/800/600`} 
                    alt={articles[0].title}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                      <span className="text-[10px] font-sans font-bold uppercase tracking-widest bg-[rgb(var(--color-accent))] text-white px-2 py-1">
                          {articles[0].sourceTitle}
                      </span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black leading-[1.1] text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-textSecondary))] transition-colors">
                      {articles[0].title}
                  </h2>
                  <p className="text-lg text-[rgb(var(--color-textSecondary))] leading-relaxed line-clamp-4 font-normal mt-2">
                      {articles[0].description}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-widest text-[rgb(var(--color-accent))] group-hover:underline">
                      Preview <span>&rarr;</span>
                  </div>
              </div>
            </div>
        )}

        {/* Right Column (Sidebar Lists - 5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-10 divide-y divide-[rgb(var(--color-border))]">
            {articles.slice(1, 4).map((article, i) => (
                <div key={i} className="pt-10 first:pt-0 group cursor-pointer" onClick={() => handleOpenReader(article)}>
                    <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-4">
                            <div className="aspect-square overflow-hidden bg-[rgb(var(--color-surface))] relative rounded-md">
                                <LazyImage 
                                    src={article.imageUrl || `https://picsum.photos/seed/${article.link}/400/400`} 
                                    alt={article.title}
                                    className="w-full h-full object-cover transition-all duration-500"
                                />
                            </div>
                        </div>
                        <div className="col-span-8 flex flex-col justify-center">
                            <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[rgb(var(--color-textSecondary))] mb-2 opacity-80">{article.sourceTitle}</span>
                            <h3 className="text-xl font-bold leading-tight mb-3 text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-accent))] transition-colors">
                                {article.title}
                            </h3>
                            <button className="text-left text-xs font-sans font-bold uppercase tracking-widest text-[rgb(var(--color-text))] mt-1 group-hover:underline">
                                Preview
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Grid Separator */}
      <div className="w-full h-px bg-[rgb(var(--color-border))] my-16 opacity-50"></div>

      {/* Bottom Grid (3 Cols) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12">
        {articles.slice(4).map((article, i) => (
            <div key={i} className="group cursor-pointer flex flex-col" onClick={() => handleOpenReader(article)}>
                <div className="aspect-[3/2] overflow-hidden mb-4 bg-[rgb(var(--color-surface))] transition-all duration-500 rounded-md">
                     {article.imageUrl && (
                        <LazyImage 
                            src={article.imageUrl} 
                            alt={article.title}
                            className="w-full h-full object-cover"
                        />
                     )}
                </div>
                
                <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[rgb(var(--color-textSecondary))] mb-2 block opacity-80">{article.sourceTitle}</span>
                
                <h3 className="text-lg font-bold leading-tight mb-2 text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-accent))] transition-colors">
                     {article.title}
                </h3>

                <p className="text-sm text-[rgb(var(--color-textSecondary))] line-clamp-3 leading-relaxed">
                    {article.description}
                </p>
            </div>
        ))}
      </div>

      {readingArticle && (
        <MagazineReaderModal 
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
