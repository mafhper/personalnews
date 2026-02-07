import React, { useState } from 'react';
import { Article } from '../../types';
import { ArticleReaderModal } from '../ArticleReaderModal';
import { useLanguage } from '../../hooks/useLanguage';
import { ArticleImage } from '../ArticleImage';
import { FavoriteButton } from '../FavoriteButton';

interface BentoLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

export const BentoSkeleton: React.FC = () => {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10 xl:px-12 pt-4 pb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-auto gap-4 md:gap-5 grid-flow-dense">
        {/* Pattern positions consistent with actual layout */}
        <div className="sm:col-span-2 sm:row-span-2 md:col-span-2 md:row-span-2 min-h-[400px] md:min-h-[500px] feed-skeleton-block rounded-3xl" />
        <div className="sm:col-span-1 sm:row-span-2 md:col-span-1 md:row-span-2 min-h-[400px] md:min-h-[500px] feed-skeleton-block rounded-3xl" />
        <div className="sm:col-span-1 sm:row-span-1 md:col-span-1 md:row-span-1 min-h-[220px] feed-skeleton-block rounded-3xl" />
        <div className="sm:col-span-2 sm:row-span-1 md:col-span-2 md:row-span-1 min-h-[220px] feed-skeleton-block rounded-3xl" />
        <div className="sm:col-span-1 sm:row-span-1 md:col-span-1 md:row-span-1 min-h-[220px] feed-skeleton-block rounded-3xl" />
        <div className="sm:col-span-1 sm:row-span-1 md:col-span-1 md:row-span-1 min-h-[220px] feed-skeleton-block rounded-3xl" />
      </div>
    </div>
  );
};

export const BentoLayout: React.FC<BentoLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const { t } = useLanguage();
  const now = new Date();

  // Helper for time formatting
  const formatTimeAgo = (dateInput: Date | string) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
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
          span: 'sm:col-span-2 sm:row-span-2 md:col-span-2 md:row-span-2',
          size: 'hero',
          showDescription: true,
          containerClass: 'min-h-[400px] md:min-h-[500px]'
        };
      case 1: // Tall
      case 6:
        return {
          span: 'sm:col-span-1 sm:row-span-2 md:col-span-1 md:row-span-2',
          size: 'tall',
          showDescription: false,
          containerClass: 'min-h-[400px] md:min-h-[500px]'
        };
      case 3: // Wide
      case 10:
        return {
          span: 'sm:col-span-2 sm:row-span-1 md:col-span-2 md:row-span-1',
          size: 'wide',
          showDescription: true,
          containerClass: 'min-h-[220px]'
        };
      default: // Standard
        return {
          span: 'sm:col-span-1 sm:row-span-1 md:col-span-1 md:row-span-1',
          size: 'standard',
          showDescription: false,
          containerClass: 'min-h-[220px]'
        };
    }
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10 xl:px-12 pt-4 pb-6">
        {/* Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-auto gap-4 md:gap-5 grid-flow-dense">
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
                  rounded-3xl feed-card
                  hover:border-[rgba(var(--color-accent),0.25)]
                  transition-all duration-400
                `}
              >
                {/* Background Image Layer */}
                <div className="absolute inset-0">
                  <ArticleImage
                    article={article}
                    width={isHero ? 1200 : 800}
                    height={isTall ? 1200 : 800}
                    fill={true}
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                  />
                  {/* Gradient Overlay */}
                  <div className={`absolute inset-0 transition-opacity duration-500 ${isHero || isTall
                    ? 'bg-gradient-to-t from-black via-black/60 to-transparent'
                    : 'bg-gradient-to-t from-black/90 via-black/50 to-black/20'
                    }`} />
                </div>

                {/* Glassmorphism Overlay on Hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 feed-accent-bg backdrop-blur-[1px]" />

                {/* Content Layer */}
                <div className={`relative h-full flex flex-col justify-between p-5 md:p-6`}>

                  {/* Top Part: Source, Date and Favorite */}
                  <div className="flex justify-between items-start w-full gap-3">
                    <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                      <span className="feed-chip shadow-lg shadow-[rgb(var(--color-accent))]/20 truncate max-w-full">
                        {article.sourceTitle}
                      </span>
                      <span className="text-[10px] md:text-xs font-bold text-white/70 drop-shadow-md truncate">
                        {formatTimeAgo(article.pubDate)}
                      </span>
                    </div>

                    <div className="flex-shrink-0">
                      <FavoriteButton
                        article={article}
                        size="medium"
                        position="inline"
                        className="bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/10 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                  </div>

                  {/* Bottom Part: Content Block */}
                  <div className={`transform transition-all duration-500`}>
                    {/* Title */}
                    <h3 className={`font-bold text-white leading-tight mb-2 drop-shadow-xl ${isHero ? 'text-2xl md:text-4xl' :
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
                      <p className={`text-white/80 leading-relaxed drop-shadow-lg transition-all duration-500 ${isHero ? 'text-sm md:text-base line-clamp-3 opacity-90' : 'text-sm line-clamp-2 opacity-0 group-hover:opacity-90'
                        }`}>
                        {article.description}
                      </p>
                    )}

                    {/* Read indicator */}
                    <div className={`mt-4 flex items-center gap-2 text-xs font-medium text-white/70 ${isHero ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      } transition-opacity duration-300`}>
                      <span className="w-8 h-0.5 bg-[rgba(var(--color-accent),0.45)] rounded-full group-hover:w-12 transition-all duration-500" />
                      <span className="uppercase tracking-widest">
                        {t('action.read') || 'Ler'}
                      </span>
                    </div>
                  </div>
                </div>
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
          onNext={() => { }}
          onPrev={() => { }}
          hasNext={false}
          hasPrev={false}
        />
      )}
    </>
  );
};
