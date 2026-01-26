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

const Bone: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`bg-white/5 animate-pulse rounded-xl ${className}`} />
);

export const MagazineSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      {/* HERO SKELETON */}
      <div className="grid md:grid-cols-2 gap-0 bg-white/5 rounded-2xl overflow-hidden h-[450px]">
        <div className="bg-white/10 animate-pulse h-full" />
        <div className="p-10 flex flex-col justify-center space-y-6">
          <Bone className="h-4 w-32" />
          <Bone className="h-10 w-full" />
          <Bone className="h-20 w-full" />
        </div>
      </div>

      {/* FEATURED SKELETON */}
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-4">
            <Bone className="aspect-video" />
            <Bone className="h-4 w-1/2" />
            <Bone className="h-6 w-full" />
          </div>
        ))}
      </div>

      {/* GRID SKELETON */}
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="flex gap-4 items-center">
            <Bone className="w-24 h-24 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Bone className="h-3 w-1/2" />
              <Bone className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

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
            <div className="relative aspect-[4/3] md:aspect-auto md:h-auto md:min-h-[450px] overflow-hidden flex-1">
              <ArticleImage
                article={heroArticle}
                width={1200}
                height={800}
                fill={true}
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
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
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-[rgb(var(--color-accent))] text-white shadow-sm shadow-black/20">
                  {heroArticle.sourceTitle}
                </span>
                <span className="text-sm font-bold text-[rgb(var(--color-textSecondary))] bg-black/10 px-2 py-0.5 rounded">
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
                className="group cursor-pointer bg-[rgb(var(--color-surface))]/30 backdrop-blur-md rounded-2xl p-5 border border-white/5 hover:bg-[rgb(var(--color-surface))]/50 hover:border-[rgb(var(--color-accent))]/30 transition-all duration-300 shadow-sm"
                onClick={() => handleOpenReader(article)}
              >
                <div className="relative aspect-video sm:aspect-[4/3] overflow-hidden rounded-xl mb-5 bg-[rgb(var(--color-background))]">
                  <ArticleImage
                    article={article}
                    width={600}
                    height={400}
                    fill={true}
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-40 group-hover:opacity-60 transition-opacity" />

                  {/* Favorite Button */}
                  <FavoriteButton
                    article={article}
                    size="medium"
                    position="overlay"
                    className="top-3 right-3 z-10 bg-black/40 hover:bg-black/60 border border-white/10 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.1em] bg-[rgb(var(--color-accent))] text-white px-2 py-0.5 rounded shadow-sm shadow-black/20">
                    {article.sourceTitle}
                  </span>
                  <span className="text-[10px] font-bold text-white/80 group-hover:text-white transition-colors bg-black/20 px-1.5 py-0.5 rounded">
                    {formatTimeAgo(article.pubDate)}
                  </span>
                </div>

                <h3 className="font-serif font-bold text-lg lg:text-xl text-white leading-tight group-hover:text-white group-hover:underline transition-all line-clamp-2 drop-shadow-sm">
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
                    fill={true}
                    className="w-full h-full object-cover object-center"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {listArticles.map((article, i) => (
              <article
                key={i}
                className="group cursor-pointer flex items-center gap-4 p-5 rounded-2xl bg-[rgb(var(--color-surface))]/80 backdrop-blur-xl border border-white/20 hover:bg-[rgb(var(--color-surface))] hover:border-[rgb(var(--color-accent))] transition-all duration-300 shadow-lg"
                onClick={() => handleOpenReader(article)}
              >
                <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-xl bg-[rgb(var(--color-background))] shadow-inner border border-white/10">
                  <ArticleImage
                    article={article}
                    width={150}
                    height={150}
                    fill={true}
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.1em] bg-[rgb(var(--color-accent))] text-white px-2 py-0.5 rounded shadow-sm shadow-black/20">
                      {article.sourceTitle}
                    </span>
                    <span className="text-[10px] font-bold text-[rgb(var(--color-textSecondary))] bg-black/5 px-2 py-0.5 rounded">
                      {formatTimeAgo(article.pubDate)}
                    </span>
                  </div>
                  <h4 className="font-bold text-base text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-text))] group-hover:underline transition-all line-clamp-2 leading-tight">
                    {article.title}
                  </h4>
                </div>
                <div className="flex-shrink-0">
                  <FavoriteButton
                    article={article}
                    size="medium"
                    position="inline"
                    className="text-[rgb(var(--color-accent))] opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
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