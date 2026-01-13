import React, { useState } from 'react';
import { Article } from '../../types';
import { MagazineReaderModal } from '../MagazineReaderModal';
import { useAppearance } from '../../hooks/useAppearance';
import { useLanguage } from '../../contexts/LanguageContext';
import { ArticleImage } from '../ArticleImage';
import { FavoriteButton } from '../FavoriteButton';

interface MagazineLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

export const MagazineLayout: React.FC<MagazineLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const { contentConfig } = useAppearance();
  const { t } = useLanguage();
  const now = new Date();

  // Pagination State for Load More
  const [displayLimit, setDisplayLimit] = useState(20);

  // Derive visible articles based on mode
  const paginationType = contentConfig.paginationType || 'numbered';

  let visibleArticles: Article[] = [];
  if (paginationType === 'loadMore') {
    visibleArticles = articles.slice(0, displayLimit);
  } else {
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
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0 || isNaN(diffMs)) return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return t('time.now') || 'agora';
    if (diffMins < 60) return `${diffMins}min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  // Layout Slices - Magazine style with clear sections
  const heroArticle = visibleArticles[0];
  const featuredArticles = visibleArticles.slice(1, 4); // 3 featured below hero
  const gridArticles = visibleArticles.slice(4, 10); // 6 in grid
  const listArticles = visibleArticles.slice(10); // Rest in list

  if (!heroArticle) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <p className="text-[rgb(var(--color-textSecondary))] text-lg">{t('feeds.empty') || 'Nenhuma notícia para exibir.'}</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-300 min-h-screen">

      {/* Hero Section - Full Width */}
      <section className="mb-12">
        <article
          className="relative group cursor-pointer overflow-hidden rounded-2xl bg-[rgb(var(--color-surface))]"
          onClick={() => handleOpenReader(heroArticle)}
        >
          <div className="grid md:grid-cols-2 gap-0">
            {/* Hero Image */}
            <div className="relative aspect-[4/3] md:aspect-auto md:h-[400px] overflow-hidden">
              <ArticleImage
                article={heroArticle}
                width={1200}
                height={800}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent md:hidden" />
              
              {/* Favorite Button */}
              <FavoriteButton 
                article={heroArticle} 
                size="medium" 
                position="overlay"
                className="top-4 right-4 z-10 bg-black/50 hover:bg-black/70 border border-white/20 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>

            {/* Hero Content */}
            <div className="flex flex-col justify-center p-6 md:p-10 bg-gradient-to-br from-[rgb(var(--color-surface))] to-[rgb(var(--color-background))]">
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[rgb(var(--color-accent))] text-white truncate max-w-[150px] md:max-w-[200px]">
                  {heroArticle.sourceTitle}
                </span>
                <span className="text-sm text-[rgb(var(--color-textSecondary))]">
                  {formatTimeAgo(heroArticle.pubDate)}
                </span>
              </div>

              <h1 className="text-2xl md:text-4xl font-bold text-[rgb(var(--color-text))] leading-tight mb-4 group-hover:text-[rgb(var(--color-accent))] transition-colors">
                {heroArticle.title}
              </h1>

              <p className="text-[rgb(var(--color-textSecondary))] text-base md:text-lg leading-relaxed line-clamp-3 mb-6">
                {heroArticle.description}
              </p>

              {heroArticle.author && (
                <p className="text-sm text-[rgb(var(--color-textSecondary))] italic">
                  {t('article.by') || 'Por'} {heroArticle.author}
                </p>
              )}

              <button className="mt-6 self-start px-6 py-2.5 bg-[rgb(var(--color-primary))] text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
                {t('action.read') || 'Ler artigo'}
              </button>
            </div>
          </div>
        </article>
      </section>

      {/* Featured Section - 3 Cards */}
      {featuredArticles.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[rgb(var(--color-border))] to-transparent" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-[rgb(var(--color-textSecondary))]">
              {t('layout.featured') || 'Destaques'}
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[rgb(var(--color-border))] to-transparent" />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {featuredArticles.map((article, i) => (
              <article
                key={i}
                className="group cursor-pointer"
                onClick={() => handleOpenReader(article)}
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-xl mb-4 bg-[rgb(var(--color-surface))]">
                  <ArticleImage
                    article={article}
                    width={600}
                    height={400}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Favorite Button */}
                  <FavoriteButton 
                    article={article} 
                    size="small" 
                    position="overlay"
                    className="top-3 right-3 z-10 bg-black/50 hover:bg-black/70 border border-white/20 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase text-[rgb(var(--color-accent))] truncate max-w-[120px]">
                    {article.sourceTitle}
                  </span>
                  <span className="text-xs text-[rgb(var(--color-textSecondary))]">•</span>
                  <span className="text-xs text-[rgb(var(--color-textSecondary))]">
                    {formatTimeAgo(article.pubDate)}
                  </span>
                </div>

                <h3 className="font-bold text-lg text-[rgb(var(--color-text))] leading-snug group-hover:text-[rgb(var(--color-accent))] transition-colors line-clamp-2">
                  {article.title}
                </h3>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Grid Section - 6 Cards */}
      {gridArticles.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[rgb(var(--color-textSecondary))]">
              {t('layout.more_news') || 'Mais Notícias'}
            </h2>
            <div className="h-px flex-1 bg-[rgb(var(--color-border))]" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gridArticles.map((article, i) => (
              <article
                key={i}
                className="group cursor-pointer flex gap-4 p-4 rounded-xl bg-[rgb(var(--color-surface))] hover:bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-accent))] transition-all relative"
                onClick={() => handleOpenReader(article)}
              >
                <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg bg-[rgb(var(--color-background))]">
                  <ArticleImage
                    article={article}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-bold uppercase text-[rgb(var(--color-accent))] truncate max-w-[100px]">
                        {article.sourceTitle}
                      </span>
                      <span className="text-[10px] text-[rgb(var(--color-textSecondary))] flex-shrink-0">
                        {formatTimeAgo(article.pubDate)}
                      </span>
                    </div>
                    <div className="relative">
                      <FavoriteButton 
                        article={article} 
                        size="small" 
                        position="inline"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-accent))] transition-colors line-clamp-2 leading-snug">
                    {article.title}
                  </h3>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* List Section - Compact */}
      {listArticles.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[rgb(var(--color-textSecondary))]">
              {t('layout.latest') || 'Últimas'}
            </h2>
            <div className="h-px flex-1 bg-[rgb(var(--color-border))]" />
          </div>

          <div className="space-y-3">
            {listArticles.map((article, i) => (
              <article
                key={i}
                className="group cursor-pointer flex items-center gap-4 p-3 rounded-lg hover:bg-[rgb(var(--color-surface))] transition-colors border-b border-[rgb(var(--color-border))] last:border-0"
                onClick={() => handleOpenReader(article)}
              >
                <span className="text-xs font-bold uppercase text-[rgb(var(--color-accent))] w-24 flex-shrink-0 truncate">
                  {article.sourceTitle}
                </span>
                <h4 className="flex-1 font-medium text-sm text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-accent))] transition-colors line-clamp-1">
                  {article.title}
                </h4>
                <span className="text-xs text-[rgb(var(--color-textSecondary))] flex-shrink-0">
                  {formatTimeAgo(article.pubDate)}
                </span>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Load More Button */}
      {paginationType === 'loadMore' && displayLimit < articles.length && (
        <div className="flex justify-center py-8">
          <button
            onClick={handleLoadMore}
            className="px-8 py-3 bg-[rgb(var(--color-primary))] text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
          >
            {t('action.load_more') || 'Carregar Mais'}
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