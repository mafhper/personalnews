import React, { useState, useEffect, useCallback } from 'react';
import { Article } from '../../types';
import { OptimizedImage } from '../OptimizedImage';
import { ArticleReaderModal } from '../ArticleReaderModal';
import { useLanguage } from '../../contexts/LanguageContext';
import { FavoriteButton } from '../FavoriteButton';

interface FocusLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

export const FocusLayout: React.FC<FocusLayoutProps> = ({ articles }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const { t } = useLanguage();

  // Focus Layout agora ocupa a tela inteira (z-index alto para sobrepor header/sidebar)
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 100, // Garante que fique sobre tudo
  };

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
        if (e.key === 'Escape') {
             // Optional: Add logic to exit focus mode?
        }
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
    <div ref={containerRef} className="overflow-hidden bg-black text-white isolate font-sans" style={containerStyle}>
      {/* Fixed Background with Transition */}
      <div className="absolute inset-0 z-0 transition-opacity duration-700 ease-in-out">
         <div key={currentIndex} className="w-full h-full animate-in fade-in zoom-in-105 duration-1000">
            <OptimizedImage
                src={currentArticle.imageUrl}
                className="w-full h-full object-cover opacity-40"
                alt=""
                fallbackText={currentArticle.sourceTitle}
                width={1920}
                height={1080}
                priority={true}
            />
         </div>
         <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80 pointer-events-none" />
      </div>

      {/* Progress Indicator */}
      <div className="absolute top-8 right-8 z-20 flex flex-col gap-2 items-end">
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
      <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-24 max-w-6xl mx-auto">
         <div key={currentIndex} className="animate-in slide-in-from-bottom-10 fade-in duration-500 flex flex-col justify-center h-full pb-12">
            <div className="flex items-center gap-4 mb-8 min-w-0">
                <span className="px-3 py-1 rounded border border-white/20 text-xs uppercase tracking-[0.2em] bg-black/40 backdrop-blur-md truncate max-w-[200px] md:max-w-[300px]">
                    {currentArticle.sourceTitle}
                </span>
                <span className="text-xs text-gray-400 font-mono tracking-widest">
                    {new Date(currentArticle.pubDate).toLocaleDateString().split('/').join('.')}
                </span>
                <FavoriteButton 
                  article={currentArticle} 
                  size="medium"
                  position="inline"
                  className="bg-white/5 hover:bg-white/10 border border-white/10"
                />
            </div>

            <h2
                onClick={() => setReadingArticle(currentArticle)}
                className={`font-bold leading-none mb-8 cursor-pointer hover:text-[rgb(var(--color-accent))] transition-colors tracking-tight break-words
                  ${currentArticle.title.length > 80 ? 'text-4xl md:text-6xl lg:text-7xl' : 'text-5xl md:text-7xl lg:text-8xl'}
                `}
            >
                {currentArticle.title}
            </h2>

            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl leading-relaxed mb-12 line-clamp-3 font-light">
                {currentArticle.description}
            </p>

            <button
              onClick={() => setReadingArticle(currentArticle)}
              className="group flex items-center gap-4 text-sm font-bold uppercase tracking-widest hover:text-[rgb(var(--color-accent))] transition-colors self-start"
            >
              <span>{t('article.read_full')}</span>
              <div className="w-12 h-[1px] bg-white/30 group-hover:bg-[rgb(var(--color-accent))] transition-colors relative overflow-hidden">
                 <div className="absolute inset-0 bg-white w-full -translate-x-full group-hover:translate-x-0 transition-transform duration-300"/>
              </div>
            </button>
         </div>
      </div>

      {/* Scroll Hint */}
       <div className="absolute bottom-8 right-8 z-20 flex gap-4 text-white/30 text-xs uppercase tracking-widest animate-pulse">
        <span>{t('article.scroll_hint')}</span>
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
