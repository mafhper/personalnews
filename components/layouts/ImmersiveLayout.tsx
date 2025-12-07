import React, { useState, useRef } from 'react';
import { Article } from '../../types';
import { ArticleItem } from '../ArticleItem';
import { ArticleReaderModal } from '../ArticleReaderModal';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImmersiveLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

export const ImmersiveLayout: React.FC<ImmersiveLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const featuredArticle = articles[0];
  const otherArticles = articles.slice(1);

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

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = direction === 'left' ? -current.clientWidth / 2 : current.clientWidth / 2;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  
  const hasContent = (article: Article) => {
      // Show preview if we have full content OR text description or image (visual dominance)
      return !!article.content || !!article.description || !!article.imageUrl;
  };

  return (
    <div className="space-y-6 md:space-y-8 flex flex-col h-full">
      {/* Hero Section */}
      {featuredArticle && (
        <div className="relative min-h-[50vh] md:h-[60vh] rounded-3xl overflow-hidden group shadow-2xl shrink-0">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
            style={{ 
              backgroundImage: `url(${featuredArticle.imageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2070&auto=format&fit=crop'})` 
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 max-w-5xl">
            <div className="inline-block px-3 py-1 bg-[rgb(var(--color-accent))] text-white text-xs font-bold uppercase tracking-wider rounded-full mb-3 shadow-lg">
              Featured
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 leading-tight drop-shadow-lg">
              <a href={featuredArticle.link} target="_blank" rel="noopener noreferrer" className="hover:underline decoration-4 decoration-[rgb(var(--color-accent))] underline-offset-8">
                {featuredArticle.title}
              </a>
            </h1>
            <p className="text-base md:text-lg text-gray-200 line-clamp-2 mb-4 max-w-2xl drop-shadow-md">
              {featuredArticle.description}
            </p>
            <div className="flex items-center space-x-6">
                 <div className="flex items-center space-x-3 text-sm text-gray-300 font-medium">
                    <span className="text-white">{featuredArticle.sourceTitle}</span>
                    <span>•</span>
                    <span>{new Date(featuredArticle.pubDate).toLocaleDateString()}</span>
                 </div>
                 
                 {hasContent(featuredArticle) && (
                    <button 
                        onClick={() => handleOpenReader(featuredArticle)}
                        className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-5 py-2 rounded-full font-bold uppercase tracking-widest text-xs transition-all flex items-center gap-2 group/btn shadow-lg"
                    >
                        <span>Cinema Mode</span>
                        <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </button>
                 )}
            </div>
          </div>
        </div>
      )}

      {/* Horizontal Strips - Trending */}
      <div className="space-y-4 shrink-0">
        <h2 className="text-lg md:text-xl font-bold text-[rgb(var(--color-text))] px-4 border-l-4 border-[rgb(var(--color-accent))] flex items-center gap-2">
          Trending Now
        </h2>
        
        <div className="relative group/scroll-container">
            <button 
                onClick={() => scroll('left')}
                className="absolute left-0 top-0 bottom-4 z-20 bg-black/50 hover:bg-black/70 text-white w-12 flex items-center justify-center opacity-0 group-hover/scroll-container:opacity-100 transition-opacity duration-300 backdrop-blur-sm hidden md:flex rounded-r-lg"
                aria-label="Scroll left"
            >
                <ChevronLeft size={32} />
            </button>

            <div 
                ref={scrollContainerRef}
                className="flex overflow-x-auto space-x-4 pb-4 px-4 snap-x snap-mandatory no-scrollbar"
            >
              {otherArticles.map((article) => (
                <div key={article.link} className="flex-shrink-0 w-72 md:w-80 snap-center relative group">
                  <ArticleItem 
                    article={article} 
                    layoutMode="grid" 
                    density="compact"
                    showImage={true}
                  />
                   {/* Immersive Overlay Check */}
                   {hasContent(article) && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                           <button
                              onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleOpenReader(article);
                              }}
                              className="bg-black/70 hover:bg-[rgb(var(--color-accent))] text-white p-2 rounded-full backdrop-blur transition-all transform hover:scale-110 shadow-lg border border-white/10"
                              title="Open Cinema Mode"
                           >
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                           </button>
                      </div>
                   )}
                </div>
              ))}
            </div>

            <button 
                onClick={() => scroll('right')}
                className="absolute right-0 top-0 bottom-4 z-20 bg-black/50 hover:bg-black/70 text-white w-12 flex items-center justify-center opacity-0 group-hover/scroll-container:opacity-100 transition-opacity duration-300 backdrop-blur-sm hidden md:flex rounded-l-lg"
                aria-label="Scroll right"
            >
                <ChevronRight size={32} />
            </button>
        </div>
      </div>

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
