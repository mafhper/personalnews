import React, { useState } from 'react';
import { Article } from '../../types';
import { SmallOptimizedImage } from '../SmallOptimizedImage';
import { ArticleReaderModal } from '../ArticleReaderModal';
import { useLanguage } from '../../contexts/LanguageContext';
import { FavoriteButton } from '../FavoriteButton';

interface MinimalLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

export const MinimalLayout: React.FC<MinimalLayoutProps> = ({ articles }) => {
  const [readingIndex, setReadingIndex] = useState<number | null>(null);
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

  const heroArticle = articles[0];
  const remainingArticles = articles.slice(1);

  return (
    <>
      <div className="max-w-[1400px] mx-auto px-6 py-12 md:py-20 animate-in fade-in duration-1000">

        {/* Integrated Hero Section */}
        {heroArticle && (
          <section
            className="mb-32 group cursor-pointer relative"
            onClick={() => setReadingIndex(0)}
          >
            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-0 items-stretch border border-[rgb(var(--color-border))]/30 rounded-sm overflow-hidden bg-[rgb(var(--color-surface))]/20">

              {/* Vertical Side Header */}
              <div className="lg:col-span-1 flex lg:flex-col items-center justify-between py-6 lg:py-10 border-b lg:border-b-0 lg:border-r border-[rgb(var(--color-border))]/30 px-4">
                <span className="text-[9px] font-black uppercase tracking-[0.5em] text-[rgb(var(--color-accent))] lg:[writing-mode:vertical-lr] lg:rotate-180">
                  {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </span>
                <span className="text-[9px] font-bold opacity-30 uppercase tracking-widest hidden lg:block">Vol. {new Date().getFullYear()}</span>
              </div>

              {/* Hero Image Side */}
              <div className="lg:col-span-6 relative aspect-video sm:aspect-[16/10] md:aspect-square lg:aspect-auto overflow-hidden order-first lg:order-last">
                {heroArticle.imageUrl ? (
                  <SmallOptimizedImage
                    src={heroArticle.imageUrl}
                    alt={heroArticle.title}
                    className="w-full h-full object-cover transition-all duration-[2s] ease-out scale-110 group-hover:scale-100 filter contrast-[1.1]"
                    fallbackText={heroArticle.sourceTitle}
                    size={1600}
                    priority={true}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                    <span className="text-xs font-serif italic text-white/20">aesthetic visual content</span>
                  </div>
                )}
                {/* Visual texture overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-transparent mix-blend-overlay" />
                <div className="absolute inset-0 ring-1 ring-inset ring-white/5" />
              </div>

              {/* Hero Content Side */}
              <div className="lg:col-span-5 flex flex-col justify-center p-8 md:p-12 lg:p-16 bg-white/5 backdrop-blur-sm order-last lg:order-none min-w-0">
                <div className="space-y-8 min-w-0">
                  <div className="flex items-center gap-4 text-[10px] tracking-[0.4em] uppercase text-[rgb(var(--color-textSecondary))] font-black min-w-0">
                    <span className="text-[rgb(var(--color-accent))] truncate max-w-[150px] md:max-w-[250px]">{heroArticle.sourceTitle}</span>
                    <span className="w-10 h-px bg-[rgb(var(--color-accent))]/30 flex-shrink-0" />
                    <time className="flex-shrink-0">{formatTimeAgo(heroArticle.pubDate)}</time>
                  </div>

                  <h1 className={`font-serif font-black text-[rgb(var(--color-text))] leading-[1.05] tracking-tighter group-hover:text-[rgb(var(--color-accent))] transition-colors duration-500 break-words line-clamp-4 ${heroArticle.title.length > 100
                      ? 'text-3xl md:text-5xl xl:text-6xl'
                      : heroArticle.title.length > 60
                        ? 'text-4xl md:text-6xl xl:text-7xl'
                        : 'text-5xl md:text-7xl xl:text-8xl'
                    }`}>
                    {heroArticle.title}
                  </h1>

                  <p className="text-lg md:text-xl text-[rgb(var(--color-textSecondary))] leading-relaxed font-light line-clamp-4 italic">
                    "{heroArticle.description}"
                  </p>

                  <div className="pt-4 flex items-center gap-8">
                    <button className="relative py-2 text-[10px] font-black uppercase tracking-[0.3em] text-[rgb(var(--color-text))] group/btn">
                      {t('action.read_article') || 'Ler artigo'}
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[rgb(var(--color-accent))] transform origin-left scale-x-50 group-hover/btn:scale-x-100 transition-transform duration-500" />
                    </button>

                    <FavoriteButton
                      article={heroArticle}
                      size="large"
                      position="inline"
                      className="bg-white/10 hover:bg-[rgb(var(--color-accent))]/10 border border-white/10 transition-all duration-500 opacity-0 group-hover:opacity-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Asymmetric Grid for rest */}
        <div className="space-y-16 md:space-y-24 max-w-6xl mx-auto">
          {remainingArticles.map((article, index) => {
            const isFullWidth = (index + 1) % 5 === 0;

            return (
              <article
                key={`${article.link}-${index}`}
                className="group cursor-pointer relative"
                onClick={() => setReadingIndex(index + 1)}
              >
                <div className={`flex flex-col ${isFullWidth ? '' : 'md:flex-row'} items-stretch border border-[rgb(var(--color-border))]/20 rounded-sm overflow-hidden bg-[rgb(var(--color-surface))]/10 hover:bg-[rgb(var(--color-surface))]/30 transition-colors duration-500`}>

                  {/* Small Vertical Indicator/Source */}
                  <div className={`flex ${isFullWidth ? 'flex-row' : 'md:flex-col'} items-center justify-between p-3 md:p-4 border-b ${isFullWidth ? '' : 'md:border-b-0 md:border-r'} border-[rgb(var(--color-border))]/20 bg-white/5 min-w-0 max-w-full overflow-hidden`}>
                    <span className={`text-[8px] font-black uppercase tracking-[0.3em] text-[rgb(var(--color-accent))] truncate ${isFullWidth ? 'max-w-[150px]' : 'md:max-h-[120px] md:[writing-mode:vertical-lr] md:rotate-180'}`}>
                      {article.sourceTitle}
                    </span>
                    <FavoriteButton
                      article={article}
                      size="small"
                      position="inline"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>

                  {/* Image Section */}
                  <div className={`${isFullWidth ? 'aspect-[21/9]' : 'md:w-2/5 aspect-[4/3]'} relative overflow-hidden bg-[rgb(var(--color-surface))]`}>
                    {article.imageUrl ? (
                      <SmallOptimizedImage
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        fallbackText={article.sourceTitle}
                        size={isFullWidth ? 1200 : 800}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-[10px] font-serif italic opacity-20">no visual</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Content Section */}
                  <div className={`flex-1 p-6 md:p-8 flex flex-col justify-center ${isFullWidth ? 'text-center items-center' : ''}`}>
                    <div className={`flex items-center gap-3 text-[9px] tracking-[0.2em] uppercase text-[rgb(var(--color-textSecondary))] mb-4 ${isFullWidth ? 'justify-center' : ''}`}>
                      <time>{formatTimeAgo(article.pubDate)}</time>
                    </div>

                    <h2 className={`font-serif font-bold text-[rgb(var(--color-text))] leading-tight mb-4 group-hover:text-[rgb(var(--color-accent))] transition-colors ${isFullWidth ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl'}`}>
                      {article.title}
                    </h2>

                    <p className={`text-[rgb(var(--color-textSecondary))] leading-relaxed font-light line-clamp-2 ${isFullWidth ? 'text-base max-w-2xl' : 'text-sm'}`}>
                      {article.description}
                    </p>

                    <div className={`mt-6 ${isFullWidth ? '' : 'flex'}`}>
                      <span className="inline-flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.2em] text-[rgb(var(--color-text))] group-hover:gap-5 transition-all">
                        {t('action.read_article') || 'Ler artigo'}
                        <div className="w-6 h-px bg-current" />
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Footer Divider */}
        <div className="mt-20 flex items-center justify-center">
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-[rgb(var(--color-border))] to-transparent" />
        </div>
      </div>

      {/* Reader Modal */}
      {readingIndex !== null && (
        <ArticleReaderModal
          article={articles[readingIndex]}
          onClose={() => setReadingIndex(null)}
          onNext={() => setReadingIndex((prev) => (prev !== null && prev < articles.length - 1 ? prev + 1 : prev))}
          onPrev={() => setReadingIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev))}
          hasNext={readingIndex < articles.length - 1}
          hasPrev={readingIndex > 0}
        />
      )}
    </>
  );
};
