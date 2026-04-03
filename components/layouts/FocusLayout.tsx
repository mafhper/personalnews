import React, { useState, useEffect, useCallback } from 'react';
import { Article } from '../../types';
import { OptimizedImage } from '../OptimizedImage';
import { ArticleReaderModal } from '../ArticleReaderModal';
import { useLanguage } from '../../hooks/useLanguage';
import { FavoriteButton } from '../FavoriteButton';
import { FeedInteractiveActions } from '../FeedInteractiveActions';
import { getVideoEmbed } from '../../utils/videoEmbed';

interface FocusLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

export const FocusSkeleton: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col justify-center px-8 md:px-24">
      <div className="max-w-6xl mx-auto w-full space-y-8">
        <div className="flex gap-4">
          <div className="w-32 h-6 feed-skeleton-block rounded" />
          <div className="w-24 h-6 feed-skeleton-block rounded" />
        </div>
        <div className="h-24 md:h-32 lg:h-40 w-full feed-skeleton-block rounded-2xl" />
        <div className="h-8 w-3/4 feed-skeleton-block rounded-xl" />
        <div className="h-8 w-1/2 feed-skeleton-block rounded-xl" />
        <div className="w-40 h-10 feed-skeleton-block rounded-lg mt-12" />
      </div>
    </div>
  );
};

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
    <div
      ref={containerRef}
      className="overflow-hidden isolate font-sans text-white"
      style={{
        ...containerStyle,
        backgroundColor: 'rgb(8 12 18)',
        color: 'rgb(255 255 255)',
      }}
    >
      {/* Fixed Background with Transition */}
      <div className="absolute inset-0 z-0 transition-opacity duration-700 ease-in-out">
         <div key={currentIndex} className="w-full h-full animate-in fade-in zoom-in-105 duration-1000">
            <OptimizedImage
                src={currentArticle.imageUrl}
                className="w-full h-full object-cover opacity-60"
                alt=""
                fallbackText={currentArticle.sourceTitle}
                width={1920}
                height={1080}
                priority={true}
            />
         </div>
         <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/58 to-black/36 pointer-events-none" />
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,0,0,0.04),transparent_26%),linear-gradient(90deg,rgba(0,0,0,0.3),transparent_22%,transparent_78%,rgba(0,0,0,0.3))] pointer-events-none" />
      </div>

      {/* Progress Indicator */}
      <div className="absolute top-8 right-8 z-20 flex flex-col gap-2 items-end">
        <div className="h-32 w-1 bg-white/12 rounded-full relative overflow-hidden">
            <div
                className="absolute top-0 left-0 w-full bg-white/60 transition-all duration-300"
                style={{ height: `${((currentIndex + 1) / articles.length) * 100}%` }}
            />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-24 max-w-6xl mx-auto">
         <div key={currentIndex} className="group animate-in slide-in-from-bottom-10 fade-in duration-500 flex flex-col justify-center h-full pb-12">
            <div className="flex items-center gap-4 mb-8 min-w-0">
                <span className="inline-flex max-w-[220px] md:max-w-[320px] truncate rounded-full border border-white/15 bg-black/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80 backdrop-blur-md">
                    {currentArticle.sourceTitle}
                </span>
                <span className="text-xs text-white/60 font-mono tracking-widest">
                    {new Date(currentArticle.pubDate).toLocaleDateString().split('/').join('.')}
                </span>
                <FavoriteButton 
                  article={currentArticle} 
                  size="medium"
                  position="inline"
                  className="bg-black/40 hover:bg-black/70 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                />
            </div>

            <h2
                onClick={() => setReadingArticle(currentArticle)}
                className={`font-bold leading-none mb-8 cursor-pointer transition-colors tracking-tight break-words
                  ${currentArticle.title.length > 80 ? 'text-4xl md:text-6xl lg:text-7xl' : 'text-5xl md:text-7xl lg:text-8xl'}
                `}
            >
                {currentArticle.title}
            </h2>

            <p className="text-xl md:text-2xl text-white/75 max-w-3xl leading-relaxed mb-12 line-clamp-3 font-light">
                {currentArticle.description}
            </p>

            {(() => {
              const embedUrl = getVideoEmbed(currentArticle.link);
              return (
                <FeedInteractiveActions
                  variant="onDarkMedia"
                  articleLink={currentArticle.link}
                  onRead={() => setReadingArticle(currentArticle)}
                  showRead={!embedUrl}
                  showWatch={!!embedUrl}
                  showVisit={true}
                  forceVisible={true}
                  className="!mt-0 !opacity-100 !pointer-events-auto !transform-none [&_.feed-btn-action]:text-sm [&_.feed-btn-action]:px-6 [&_.feed-btn-action]:py-3 [&_.feed-link-action]:text-sm"
                />
              );
            })()}
         </div>
      </div>

      {/* Scroll Hint */}
       <div className="absolute bottom-8 right-8 z-20 flex gap-4 text-white/35 text-xs uppercase tracking-widest animate-pulse">
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
