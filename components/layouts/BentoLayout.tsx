import React, { useState } from 'react';
import { Article } from '../../types';
import { ArticleReaderModal } from '../ArticleReaderModal';
import { SmallOptimizedImage } from '../SmallOptimizedImage';
import { useLanguage } from '../../contexts/LanguageContext';

interface BentoLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

export const BentoLayout: React.FC<BentoLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const { t } = useLanguage();

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

  // Determine card style based on pattern position
  // Creates a visually interesting 12-item repeating pattern
  const getCardStyle = (index: number) => {
    const patternIndex = index % 12;

    switch (patternIndex) {
      case 0: // Hero - Large featured
        return {
          span: 'md:col-span-2 md:row-span-2',
          size: 'hero',
          showDescription: true,
          containerClass: 'min-h-[400px] md:min-h-[500px]'
        };
      case 1: // Tall
      case 6:
        return {
          span: 'md:col-span-1 md:row-span-2',
          size: 'tall',
          showDescription: false,
          containerClass: 'min-h-[400px] md:min-h-[500px]'
        };
      case 3: // Wide
      case 10:
        return {
          span: 'md:col-span-2 md:row-span-1',
          size: 'wide',
          showDescription: true,
          containerClass: 'min-h-[220px]'
        };
      default: // Standard
        return {
          span: 'md:col-span-1 md:row-span-1',
          size: 'standard',
          showDescription: false,
          containerClass: 'min-h-[220px]'
        };
    }
  };

  return (
    <>
      <div className="w-full p-4 md:p-6">
        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-auto gap-4 md:gap-5 grid-flow-dense">
          {articles.map((article, index) => {
            const style = getCardStyle(index);
            const isHero = style.size === 'hero';
            const isTall = style.size === 'tall';
            const isWide = style.size === 'wide';

            return (
              <article
                key={article.link}
                onClick={() => setReadingArticle(article)}
                className={`
                  ${style.span}
                  ${style.containerClass}
                  group relative overflow-hidden cursor-pointer
                  rounded-3xl
                  bg-[rgb(var(--color-surface))]/60 backdrop-blur-xl
                  border border-white/10
                  shadow-xl shadow-black/10
                  hover:shadow-2xl hover:shadow-[rgb(var(--color-accent))]/10
                  hover:border-[rgb(var(--color-accent))]/30
                  transition-all duration-500
                `}
              >
                {/* Background Image Layer */}
                {article.imageUrl ? (
                  <div className="absolute inset-0">
                    <SmallOptimizedImage
                      src={article.imageUrl}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      fallbackText={article.sourceTitle}
                      size={isHero ? 1200 : 600}
                    />
                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 transition-opacity duration-500 ${
                      isHero || isTall
                        ? 'bg-gradient-to-t from-black via-black/60 to-transparent'
                        : 'bg-gradient-to-t from-black/90 via-black/50 to-black/20'
                    }`} />
                  </div>
                ) : (
                  /* Fallback gradient for articles without images */
                  <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--color-primary))]/20 to-[rgb(var(--color-accent))]/20" />
                )}

                {/* Glassmorphism Overlay on Hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[rgb(var(--color-accent))]/5 backdrop-blur-[1px]" />

                {/* Content Layer */}
                <div className={`relative h-full flex flex-col ${
                  isWide ? 'flex-row items-end' : 'justify-end'
                } p-5 md:p-6`}>

                  {/* Content Block */}
                  <div className={`transform transition-all duration-500 ${
                    isWide ? 'flex-1' : ''
                  }`}>
                    {/* Meta Row */}
                    <div className={`flex items-center gap-2 mb-3 ${
                      isHero ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0'
                    } transition-all duration-300`}>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[rgb(var(--color-accent))] text-white shadow-lg shadow-[rgb(var(--color-accent))]/30">
                        {article.sourceTitle}
                      </span>
                      <span className="text-xs text-white/70 drop-shadow-lg">
                        {formatTimeAgo(article.pubDate)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className={`font-bold text-white leading-tight mb-2 drop-shadow-xl ${
                      isHero ? 'text-2xl md:text-4xl' :
                      isTall ? 'text-xl md:text-2xl' :
                      isWide ? 'text-xl md:text-2xl' :
                      'text-lg'
                    }`}>
                      <span className="group-hover:underline decoration-[rgb(var(--color-accent))] decoration-2 underline-offset-4">
                        {article.title}
                      </span>
                    </h3>

                    {/* Description (only on larger cards) */}
                    {style.showDescription && article.description && (
                      <p className={`text-white/80 leading-relaxed drop-shadow-lg transition-all duration-500 ${
                        isHero ? 'text-sm md:text-base line-clamp-3 opacity-90' : 'text-sm line-clamp-2 opacity-0 group-hover:opacity-90'
                      }`}>
                        {article.description}
                      </p>
                    )}

                    {/* Read indicator */}
                    <div className={`mt-4 flex items-center gap-2 text-xs font-medium text-white/70 ${
                      isHero ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    } transition-opacity duration-300`}>
                      <span className="w-8 h-0.5 bg-[rgb(var(--color-accent))] rounded-full group-hover:w-12 transition-all duration-500" />
                      <span className="uppercase tracking-widest">
                        {t('action.read') || 'Ler'}
                      </span>
                    </div>
                  </div>

                  {/* Category Icon for wide cards */}
                  {isWide && (
                    <div className="w-20 h-20 flex-shrink-0 ml-4 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg">
                      <svg className="w-8 h-8 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Corner Accent */}
                <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-[rgb(var(--color-accent))] opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg shadow-[rgb(var(--color-accent))]/50" />
              </article>
            );
          })}
        </div>
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
    </>
  );
};