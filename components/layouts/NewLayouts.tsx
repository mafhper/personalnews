import React, { useState, useEffect, useCallback } from 'react';
import { Article } from '../../types';
import { LazyImage } from '../LazyImage';
import { ArticleReaderModal } from '../ArticleReaderModal';
import { useWeather } from '../../hooks/useWeather';
import { useAppearance } from '../../hooks/useAppearance';

interface NewLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

/* 1. Newspaper Layout */
export const NewspaperLayout: React.FC<NewLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const { data: weatherData, city, getWeatherIcon, isLoading: weatherLoading, changeCity } = useWeather();
  
  const handleCityChange = () => {
    const newCity = prompt('Digite o nome da cidade para a previsão do tempo:', city);
    if (newCity && newCity.trim() !== '') {
      changeCity(newCity);
    }
  };

  return (
    <div className="bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] p-8 min-h-screen font-serif">
      <div className="border-b-4 border-[rgb(var(--color-text))] mb-6 pb-2 flex flex-wrap justify-between items-center gap-2">
        <p className="text-sm font-bold uppercase tracking-widest">Vol. {new Date().getFullYear()} • No. {new Date().getMonth() + 1} • {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        {/* Weather Widget */}
        <div 
          onClick={handleCityChange}
          className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 cursor-pointer hover:text-[rgb(var(--color-accent))] transition-colors"
          title="Clique para alterar a cidade"
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
              <div className="mt-4 text-sm font-bold uppercase text-[rgb(var(--color-textSecondary))]">Por {articles[0]?.sourceTitle}</div>
              <button 
                onClick={() => setReadingArticle(articles[0])}
                className="mt-4 px-4 py-2 bg-[rgb(var(--color-accent))] text-white text-sm font-bold rounded hover:opacity-90 transition-opacity"
              >
                Preview
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
              Preview →
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

/* 2. Focus Layout - No-Scroll Slider */
export const FocusLayout: React.FC<NewLayoutProps> = ({ articles }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const { headerConfig } = useAppearance();

  // Calculate header offset based on config
  const getHeaderOffset = () => {
    if (headerConfig.position === 'hidden' || headerConfig.position === 'floating') return 0;
    switch (headerConfig.height) {
        case 'compact': return 64; // h-16
        case 'spacious': return 96; // h-24
        default: return 80; // h-20 (normal)
    }
  };

  const headerHeight = getHeaderOffset();
  const screenHeightStyle = { 
    height: headerConfig.position === 'sticky' || headerConfig.position === 'static' 
            ? `calc(100vh - ${headerHeight}px)` 
            : '100vh',
    marginTop: headerConfig.position === 'static' ? 0 : 0 // If static, it flows naturally, if sticky/fixed we might need adjustment depending on parent layout. Usually parent handles static.
  };
  
  // For 'sticky' header, the header is overlaying or taking space? 
  // In this app, sticky header usually sits at top. 
  // New logic: Use padding-top if fixed/sticky to clear it, but force full window height minus header for the container if we want "no scroll".
  
  const containerStyle = {
    height: '100vh',
    paddingTop: headerConfig.position === 'sticky' ? `${headerHeight}px` : '0px'
  };

  // If static, the header takes space in DOM above us. We just need to fit remaining space.
  // Actually, if static, the container should just be `h-[calc(100vh-headerHeight)]`.
  
  const finalStyle = headerConfig.position === 'static' 
     ? { height: `calc(100vh - ${headerHeight}px)` }
     : { height: '100vh', paddingTop: headerConfig.position !== 'hidden' && headerConfig.position !== 'floating' ? `${headerHeight}px` : 0 };


  // Handle navigation
  const navigate = useCallback((direction: 'next' | 'prev') => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    if (direction === 'next') {
      setCurrentIndex(prev => (prev + 1) % articles.length);
    } else {
      setCurrentIndex(prev => (prev - 1 + articles.length) % articles.length);
    }
    
    setTimeout(() => setIsAnimating(false), 500); // Match transition duration
  }, [articles.length, isAnimating]);

  useEffect(() => {
    // Disable slider navigation if reading an article (modal is open)
    if (readingArticle) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Threshold to prevent accidental rapid scrolling
      if (Math.abs(e.deltaY) > 50) {
        navigate(e.deltaY > 0 ? 'next' : 'prev');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') navigate('next');
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') navigate('prev');
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate, readingArticle]);

  const currentArticle = articles[currentIndex];
  if (!currentArticle) return null;

  return (
    <div ref={containerRef} className="overflow-hidden bg-black text-white relative isolate" style={finalStyle}>
      {/* Fixed Background with Transition */}
      <div className="absolute inset-0 z-0 transition-opacity duration-700 ease-in-out">
         <LazyImage 
            key={currentIndex} // Force re-render for animation
            src={currentArticle.imageUrl || ''} 
            className="w-full h-full object-cover opacity-50 animate-in fade-in zoom-in-105 duration-1000" 
            alt="" 
         />
         <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
         <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
      </div>

      {/* Progress Indicator - Adjusted for header */}
      <div className="absolute top-8 right-8 z-20 flex flex-col gap-2 items-end" style={{ top: headerConfig.position === 'hidden' ? '2rem' : '1rem' }}>
        <span className="text-4xl font-bold font-mono text-white/20">
            {String(currentIndex + 1).padStart(2, '0')}
        </span>
        <div className="h-32 w-1 bg-white/10 rounded-full relative overflow-hidden">
            <div 
                className="absolute top-0 left-0 w-full bg-white/50 transition-all duration-300"
                style={{ height: `${((currentIndex + 1) / articles.length) * 100}%` }}
            />
        </div>
        <span className="text-xs font-mono text-white/20">
            {String(articles.length).padStart(2, '0')}
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end pb-24 px-8 md:px-24 max-w-5xl">
         <div key={currentIndex} className="animate-in slide-in-from-bottom-10 fade-in duration-500">
            <div className="flex items-center gap-4 mb-6">
                <span className="px-3 py-1 rounded border border-white/20 text-xs uppercase tracking-[0.2em] bg-black/40 backdrop-blur-md">
                    {currentArticle.sourceTitle}
                </span>
                <span className="text-xs text-gray-400 font-mono tracking-widest">
                    {new Date(currentArticle.pubDate).toLocaleDateString().split('/').join('.')}
                </span>
            </div>
            
            <h2 
                onClick={() => setReadingArticle(currentArticle)}
                className={`font-bold leading-[0.9] mb-8 cursor-pointer hover:text-[rgb(var(--color-accent))] transition-colors tracking-tight break-words
                  ${currentArticle.title.length > 80 ? 'text-3xl md:text-5xl lg:text-6xl' : 'text-4xl md:text-6xl lg:text-7xl'}
                `}
            >
                {currentArticle.title}
            </h2>
            
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl leading-relaxed mb-10 line-clamp-3">
                {currentArticle.description}
            </p>

            <button 
              onClick={() => setReadingArticle(currentArticle)}
              className="group flex items-center gap-4 text-sm font-bold uppercase tracking-widest hover:text-[rgb(var(--color-accent))] transition-colors"
            >
              <span>Read Full Story</span>
              <div className="w-12 h-[1px] bg-white/30 group-hover:bg-[rgb(var(--color-accent))] transition-colors relative overflow-hidden">
                 <div className="absolute inset-0 bg-white w-full -translate-x-full group-hover:translate-x-0 transition-transform duration-300"/>
              </div>
            </button>
         </div>
      </div>
      
      {/* Scroll Hint */}
       <div className="absolute bottom-8 right-8 z-20 flex gap-4 text-white/30 text-xs uppercase tracking-widest animate-pulse">
        <span>Scroll / Arrows to Navigate</span>
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

/* 3. Gallery Layout - Image Centric */
export const GalleryLayout: React.FC<NewLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 p-1 bg-[rgb(var(--color-background))] min-h-screen">
      {articles.map((article, i) => (
        <div 
          key={i} 
          onClick={() => setReadingArticle(article)}
          className="group relative aspect-square overflow-hidden cursor-pointer"
        >
          {article.imageUrl ? (
             <div className="w-full h-full"> 
                <LazyImage 
                    src={article.imageUrl} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    alt={article.title}
                />
             </div>
          ) : (
            <div className="w-full h-full bg-[rgb(var(--color-surface))] flex items-center justify-center text-[rgb(var(--color-textSecondary))] font-bold text-4xl select-none">
              {article.sourceTitle.charAt(0)}
            </div>
          )}
          
          {/* Always visible gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />
          
          {/* Post info at bottom-left */}
          <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
            <span className="text-[rgb(var(--color-accent))] text-[10px] font-bold uppercase tracking-widest block mb-1">
              {article.sourceTitle}
            </span>
            <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 group-hover:text-[rgb(var(--color-accent))] transition-colors">
              {article.title}
            </h3>
            <span className="text-white/60 text-[10px] mt-1 block">
              {new Date(article.pubDate).toLocaleDateString()}
            </span>
          </div>
        </div>
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

/* 4. Compact Layout - Data Density (Hacker News style) */
export const CompactLayout: React.FC<NewLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);

  return (
    <div className="min-h-screen font-mono text-sm p-2 sm:p-4">
      <div className="max-w-5xl mx-auto bg-[rgb(var(--color-surface))] shadow-lg border border-[rgb(var(--color-border))] rounded-lg overflow-hidden">
        <div className="bg-[rgb(var(--color-accent))] p-2 px-4 flex items-center">
          <span className="font-bold text-white mr-4">FeedNews</span>
          <span className="text-white/80 text-xs">new | past | comments | ask | jobs</span>
        </div>
        <div className="p-2 sm:p-4">
          <ol className="list-decimal list-inside space-y-1 text-[rgb(var(--color-textSecondary))]">
            {articles.map((article, i) => (
              <li key={i} className="py-1.5 border-b border-[rgb(var(--color-border))]/30 last:border-b-0">
                <span onClick={() => setReadingArticle(article)} className="text-[rgb(var(--color-text))] font-medium hover:text-[rgb(var(--color-accent))] hover:underline cursor-pointer mr-2 transition-colors">
                  {article.title}
                </span>
                <span className="text-[10px] text-[rgb(var(--color-textSecondary))]">
                  ({new URL(article.link).hostname.replace('www.', '')})
                </span>
                <div className="text-[10px] text-[rgb(var(--color-textSecondary))] ml-6 leading-tight mt-0.5">
                  by {article.author || article.sourceTitle} <span className="mx-1 opacity-50">|</span> {new Date(article.pubDate).toLocaleDateString()} <span className="mx-1 opacity-50">|</span> 
                  <span onClick={() => setReadingArticle(article)} className="cursor-pointer hover:underline hover:text-[rgb(var(--color-accent))] mx-1 transition-colors">preview</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
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

/* 5. Split Layout - Zig Zag */
export const SplitLayout: React.FC<NewLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-[rgb(var(--color-background))]">
      {articles.map((article, i) => (
        <article key={i} className={`flex flex-col md:flex-row h-auto md:h-[50vh] group ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
          <div 
            className="w-full md:w-1/2 h-64 md:h-full relative overflow-hidden cursor-pointer"
            onClick={() => setReadingArticle(article)}
          >
            {article.imageUrl && (
              <LazyImage src={article.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="" />
            )}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
          </div>
          <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-[rgb(var(--color-surface))] border-b border-[rgb(var(--color-border))]">
            <span className="text-[rgb(var(--color-accent))] font-bold uppercase tracking-widest text-xs mb-4">{article.sourceTitle}</span>
            <h2 
                className="text-2xl md:text-4xl font-bold mb-6 text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-accent))] transition-colors cursor-pointer"
                onClick={() => setReadingArticle(article)}
            >
              {article.title}
            </h2>
            <p className="text-[rgb(var(--color-textSecondary))] leading-relaxed mb-6 line-clamp-4">{article.description}</p>
            <div className="flex items-center text-xs font-bold uppercase tracking-widest text-[rgb(var(--color-text))] opacity-60">
              {new Date(article.pubDate).toDateString()}
            </div>
            <button 
                onClick={() => setReadingArticle(article)}
                className="mt-6 text-xs font-bold uppercase tracking-widest text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-accent))] self-start"
            >
                Preview &rarr;
            </button>
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

/* 6. Cyberpunk Layout - Neon */
export const CyberpunkLayout: React.FC<NewLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);

  return (
    <div className="min-h-screen bg-[#050505] p-4 font-mono bg-[linear-gradient(0deg,rgba(0,255,65,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,65,0.03)_1px,transparent_1px)] bg-[size:20px_20px]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article, i) => (
          <article key={i} className="relative border border-[#00ff41] bg-[#001100]/80 p-4 shadow-[0_0_10px_rgba(0,255,65,0.2)] hover:shadow-[0_0_20px_rgba(0,255,65,0.5)] hover:border-[#fff] transition-all group flex flex-col">
            <div className="absolute top-0 left-0 w-2 h-2 bg-[#00ff41]" />
            <div className="absolute top-0 right-0 w-2 h-2 bg-[#00ff41]" />
            <div className="absolute bottom-0 left-0 w-2 h-2 bg-[#00ff41]" />
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-[#00ff41]" />
            
            <div className="flex justify-between items-center border-b border-[#00ff41]/30 pb-2 mb-3 text-[#00ff41] text-xs">
              <span>SYS.FEED.{i.toString().padStart(3, '0')}</span>
              <span>[{article.sourceTitle}]</span>
            </div>

            {article.imageUrl && (
              <div 
                  className="mb-4 border border-[#00ff41]/50 relative overflow-hidden h-40 cursor-pointer group-hover:border-[#fff]/50 transition-colors"
                  onClick={() => setReadingArticle(article)}
              >
                  <LazyImage src={article.imageUrl} className="w-full h-full object-cover transition-all duration-500" alt="" />
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none" />
              </div>
            )}
            
            <h2 
                className="text-[#fff] text-lg font-bold mb-2 leading-snug group-hover:text-[#00ff41] transition-colors glitch-text cursor-pointer hover:underline"
                onClick={() => setReadingArticle(article)}
            >
              {article.title}
            </h2>
            
            <p className="text-[#00ff41]/80 text-xs leading-relaxed mb-4 border-l border-[#00ff41]/50 pl-2 flex-grow">
              {article.description?.slice(0, 150)}...
            </p>
            
            <div className="flex justify-end mt-auto">
              <button 
                  onClick={() => setReadingArticle(article)}
                  className="bg-[#00ff41] text-black text-xs font-bold px-4 py-1 hover:bg-white transition-colors uppercase"
              >
                Execute &gt;&gt;
              </button>
            </div>
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

/* 7. Terminal Layout - CLI */
export const TerminalLayout: React.FC<NewLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);

  return (
    <div className="min-h-screen text-green-500 pt-20 pb-12 px-4 md:px-8 font-mono text-sm md:text-base">
      
      {/* Terminal Window Frame */}
      <div className="border border-white/10 rounded-lg bg-black/95 shadow-2xl overflow-hidden min-h-[70vh] flex flex-col relative max-w-6xl mx-auto backdrop-blur-sm">
        
        {/* Discrete Window Header */}
        <div className="bg-white/5 border-b border-white/5 p-2 flex items-center gap-2 sticky top-0 z-10 backdrop-blur-md">
            <div className="flex gap-1.5 ml-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50 hover:bg-red-500/80 transition-colors"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50 hover:bg-yellow-500/80 transition-colors"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50 hover:bg-green-500/80 transition-colors"></div>
            </div>
            <div className="flex-1 text-center text-gray-600 text-[10px] uppercase tracking-widest font-bold opacity-50 select-none">Create a new window instance</div>
        </div>

        {/* Content Area */}
        <div className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
            <div className="mb-8 text-white/90">
                <span className="text-blue-400 font-bold">user@news-dashboard</span>:<span className="text-blue-300">~</span>$ ./fetch_feeds.sh --silent
                <br/>
                <div className="text-gray-500/80 mt-1 flex items-center gap-2">
                    <span>&gt; Initializing connection...</span>
                    <span className="text-green-500">Done</span>
                </div>
                <div className="text-gray-500/80">
                    <span>&gt; {articles.length} packets received from aggregation layer.</span>
                </div>
            </div>
            
            <div className="space-y-8 max-w-4xl">
                {articles.map((article, i) => (
                <div key={i} className="group relative pl-4 border-l-2 border-transparent hover:border-green-500/50 transition-colors duration-300">
                    <div className="flex items-start gap-4">
                        <span className="text-gray-700 select-none font-bold opacity-50">{`>`}</span>
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-x-3 text-xs text-gray-500 mb-1 font-medium">
                                <span className="text-yellow-600/80">[{new Date(article.pubDate).toISOString().split('T')[0]}]</span>
                                <span className="text-blue-500/80 lowercase">@{article.sourceTitle.replace(/\s/g, '_')}</span>
                                <span className="text-gray-700">pid:{Math.floor(Math.random() * 9000) + 1000}</span>
                            </div>
                            <h2 
                                className="text-lg md:text-xl font-bold text-gray-200 hover:text-green-400 hover:underline decoration-green-500/50 underline-offset-4 transition-all cursor-pointer mb-2"
                                onClick={() => setReadingArticle(article)}
                            >
                                {article.title}
                            </h2>
                            <p className="text-gray-500/80 max-w-3xl leading-relaxed text-sm">
                                {article.description ? article.description.slice(0, 180) + (article.description.length > 180 ? '...' : '') : ''}
                            </p>
                            <button 
                                onClick={() => setReadingArticle(article)}
                                className="mt-3 text-[10px] uppercase tracking-widest text-[#00ff41]/60 hover:text-[#00ff41] border border-[#00ff41]/20 hover:border-[#00ff41]/60 px-2 py-1 rounded-sm transition-all"
                            >
                                Open_Preview
                            </button>
                        </div>
                    </div>
                </div>
                ))}
            </div>

            <div className="mt-12 pt-8 border-t border-white/5">
                <span className="text-blue-400 font-bold">user@news-dashboard</span>:<span className="text-blue-300">~</span>$ <span className="w-2.5 h-5 bg-gray-500/50 inline-block align-middle animate-pulse"/>
            </div>
        </div>
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

/* 8. Polaroid Layout - Retro Cards */
export const PolaroidLayout: React.FC<NewLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);

  return (
    <div className="min-h-screen bg-[rgb(var(--color-background))] p-8 overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10 items-start">
        {articles.map((article, i) => {
          return (
            <article 
              key={i} 
              className="bg-[rgb(var(--color-surface))] p-4 pb-12 shadow-lg border border-[rgb(var(--color-border))] transition-all duration-500 ease-out hover:scale-105 hover:z-20 hover:shadow-2xl flex flex-col group cursor-pointer"
              onClick={() => setReadingArticle(article)}
            >
              <div className="aspect-square bg-[rgb(var(--color-background))] mb-4 overflow-hidden border border-[rgb(var(--color-border))] filter sepia-[.3] group-hover:sepia-0 transition-all duration-500">
                {article.imageUrl ? (
                  <LazyImage src={article.imageUrl} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[rgb(var(--color-textSecondary))] font-serif italic text-xl">No Image</div>
                )}
              </div>
              
              <h2 className="font-handwriting font-serif text-[rgb(var(--color-text))] text-xl leading-tight text-center mb-4 flex-grow font-bold group-hover:text-[rgb(var(--color-accent))] transition-colors">
                {article.title}
              </h2>
              
              <div className="text-center text-xs text-[rgb(var(--color-textSecondary))] font-serif italic mb-4">
                {article.sourceTitle} • {new Date(article.pubDate).toLocaleDateString()}
              </div>

              <div className="flex justify-center mt-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button 
                      onClick={(e) => { e.stopPropagation(); setReadingArticle(article); }}
                      className="bg-[rgb(var(--color-text))] text-[rgb(var(--color-background))] px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[rgb(var(--color-accent))] hover:text-white transition-colors shadow-md"
                  >
                      Preview
                  </button>
              </div>
            </article>
          );
        })}
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
