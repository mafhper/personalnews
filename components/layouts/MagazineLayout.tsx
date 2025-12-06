import React, { useState } from 'react';
import { Article } from '../../types';
import { MagazineReaderModal } from '../MagazineReaderModal';
import { LazyImage } from '../LazyImage';
import { useAppearance } from '../../hooks/useAppearance';

interface MagazineLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

export const MagazineLayout: React.FC<MagazineLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const { contentConfig } = useAppearance();

  // Pagination State for Load More
  const [displayLimit, setDisplayLimit] = useState(20);

  // Derive visible articles based on mode
  const paginationType = contentConfig.paginationType || 'numbered';

  let visibleArticles: Article[] = [];
  if (paginationType === 'loadMore') {
      visibleArticles = articles.slice(0, displayLimit);
  } else {
      // Numbered: Parent (App.tsx) handles slicing. We just render what we receive.
      visibleArticles = articles;
  }
  
  const handleLoadMore = () => {
      setDisplayLimit(prev => Math.min(prev + 20, articles.length));
  }

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

  // Helper
  const formatTimeAgo = (dateInput: Date | string) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0 || isNaN(diffMs)) return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `há ${diffMins}min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `há ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `há ${diffDays}d`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  // Layout Slices
  const heroArticle = visibleArticles[0];
  const secondaryArticles = visibleArticles.slice(1, 4);
  const gridArticles = visibleArticles.slice(4, 12); // Next 8
  const listArticles = visibleArticles.slice(12); // The rest of the page/limit

  if (!heroArticle) return <div className="p-10 text-center opacity-50">Nenhuma notícia para exibir.</div>;

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-300 min-h-screen font-sans pb-12">

      {/* Main Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 bg-[rgb(var(--color-surface))]">
        
        {/* Featured Article - Large */}
        {heroArticle && (
          <div 
            className="lg:col-span-8 relative group cursor-pointer overflow-hidden" 
            onClick={() => handleOpenReader(heroArticle)}
          >
            <div className="relative aspect-[16/9] lg:aspect-[16/10]">
              <LazyImage 
                src={heroArticle.imageUrl || `https://picsum.photos/seed/${heroArticle.link}/1200/800`} 
                alt={heroArticle.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-[#cc0000] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1">
                    {heroArticle.sourceTitle}
                  </span>
                  <span className="text-white/70 text-xs">
                    {formatTimeAgo(heroArticle.pubDate)}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight mb-3 group-hover:text-[rgb(var(--color-accent))] transition-colors">
                  {heroArticle.title}
                </h1>
                <p className="text-white/80 text-sm md:text-base line-clamp-2 max-w-3xl">
                  {heroArticle.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Secondary Articles - Sidebar Stack */}
        <div className="lg:col-span-4 flex flex-col divide-y divide-[rgb(var(--color-border))]">
          {secondaryArticles.map((article, i) => (
            <div 
              key={i} 
              className="p-4 group cursor-pointer hover:bg-[rgb(var(--color-background))] transition-colors flex gap-4"
              onClick={() => handleOpenReader(article)}
            >
              <div className="w-24 h-20 flex-shrink-0 overflow-hidden rounded bg-[rgb(var(--color-background))]">
                <LazyImage 
                  src={article.imageUrl || `https://picsum.photos/seed/${article.link}/200/150`} 
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase text-[#cc0000]">
                    {article.sourceTitle}
                  </span>
                  <span className="text-[10px] text-[rgb(var(--color-textSecondary))]">
                    {formatTimeAgo(article.pubDate)}
                  </span>
                </div>
                <h3 className="font-bold text-sm leading-tight text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-accent))] transition-colors line-clamp-3">
                  {article.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section Divider */}
      {gridArticles.length > 0 && (
          <div className="bg-[rgb(var(--color-background))] px-4 py-3 border-b border-[rgb(var(--color-border))]">
            <h2 className="text-lg font-black uppercase text-[rgb(var(--color-text))] tracking-tight flex items-center gap-3">
              <span className="w-1 h-5 bg-[#cc0000]"></span>
              Mais Notícias
            </h2>
          </div>
      )}

      {/* Grid of Articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 bg-[rgb(var(--color-surface))]">
        {gridArticles.map((article, i) => (
          <div 
            key={i} 
            className="border-b border-r border-[rgb(var(--color-border))] p-4 group cursor-pointer hover:bg-[rgb(var(--color-background))] transition-colors"
            onClick={() => handleOpenReader(article)}
          >
            {article.imageUrl && (
              <div className="aspect-video overflow-hidden rounded mb-3 bg-[rgb(var(--color-background))]">
                <LazyImage 
                  src={article.imageUrl} 
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            )}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase text-[#cc0000]">
                {article.sourceTitle}
              </span>
              <span className="text-[10px] text-[rgb(var(--color-textSecondary))]">
                {formatTimeAgo(article.pubDate)}
              </span>
            </div>
            <h3 className="font-bold text-sm leading-tight text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-accent))] transition-colors mb-2 line-clamp-3">
              {article.title}
            </h3>
            <p className="text-xs text-[rgb(var(--color-textSecondary))] line-clamp-2">
              {article.description}
            </p>
          </div>
        ))}
      </div>

      {/* Additional Articles - Compact List */}
      {listArticles.length > 0 && (
        <>
          <div className="bg-[rgb(var(--color-background))] px-4 py-3 border-b border-[rgb(var(--color-border))]">
            <h2 className="text-lg font-black uppercase text-[rgb(var(--color-text))] tracking-tight flex items-center gap-3">
              <span className="w-1 h-5 bg-[rgb(var(--color-accent))]"></span>
              Últimas
            </h2>
          </div>
          <div className="bg-[rgb(var(--color-surface))] divide-y divide-[rgb(var(--color-border))]">
            {listArticles.map((article, i) => (
              <div 
                key={i} 
                className="px-4 py-3 flex items-center gap-4 group cursor-pointer hover:bg-[rgb(var(--color-background))] transition-colors"
                onClick={() => handleOpenReader(article)}
              >
                <span className="text-[10px] font-bold uppercase text-[#cc0000] w-20 flex-shrink-0">
                  {article.sourceTitle}
                </span>
                <h4 className="flex-1 font-semibold text-sm text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-accent))] transition-colors line-clamp-1">
                  {article.title}
                </h4>
                <span className="text-[10px] text-[rgb(var(--color-textSecondary))] flex-shrink-0">
                  {formatTimeAgo(article.pubDate)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination Controls - Only show Load More here. Numbered is handled by App shell. */}
      {paginationType === 'loadMore' && displayLimit < articles.length && (
         <div className="mt-8 flex justify-center p-4">
             <button 
                onClick={handleLoadMore}
                className="px-6 py-3 bg-[rgb(var(--color-accent))] text-white text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all rounded shadow-lg"
             >
                Carregar Mais Notícias
             </button>
         </div>
      )}

      {/* Reader Modal */}
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
