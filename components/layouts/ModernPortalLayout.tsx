import React, { useState } from 'react';
import { Article } from '../../types';
import { ArticleItem } from '../ArticleItem';
import { ArticleReaderModal } from '../ArticleReaderModal';
import { FavoriteButton } from '../FavoriteButton';

interface ModernPortalLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

const Bone: React.FC<{ className?: string }> = ({ className = "" }) => <div className={`bg-white/5 animate-pulse rounded-xl ${className}`} />;

export const ModernPortalSkeleton: React.FC = () => {
  return (
    <div className="container mx-auto flex flex-col gap-8 pb-12">
      {/* HERO SECTION SKELETON */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 h-[500px] bg-white/5 rounded-2xl animate-pulse" />
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex-1 h-[240px] bg-white/5 rounded-2xl animate-pulse" />
          <div className="flex-1 h-[240px] bg-white/5 rounded-2xl animate-pulse" />
        </div>
      </section>

      {/* STRIP SKELETON */}
      <section className="py-12 border-y border-white/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-4">
            <Bone className="aspect-video" />
            <Bone className="h-4 w-3/4" />
            <Bone className="h-3 w-1/2" />
          </div>
        ))}
      </section>

      {/* MAIN FEED SKELETON */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="lg:col-span-8 space-y-8">
          <div className="h-[400px] bg-white/5 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-4">
                <Bone className="h-48" />
                <Bone className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-4 space-y-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </section>
    </div>
  );
};

export const ModernPortalLayout: React.FC<ModernPortalLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);

  if (articles.length === 0) return null;

  // Slicing the data for different sections
  const heroArticle = articles[0];
  const topStories = articles.slice(1, 3); // 2 articles next to hero
  const featuredStrip = articles.slice(3, 7); // 4 articles in a strip
  const mainFeed = articles.slice(7, 13); // Main grid articles
  const sidebarFeed = articles.slice(13); // Rest go to sidebar or bottom list

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

  return (
    <div className="container mx-auto flex flex-col gap-8 pb-12">

      {/* SECTION 1: HERO GRID (Desktop: 2/3 + 1/3 split) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">

        {/* Main Hero */}
        <div
          className="lg:col-span-8 group relative overflow-hidden rounded-2xl min-h-[300px] sm:min-h-[400px] lg:min-h-[500px] shadow-2xl cursor-pointer"
          onClick={() => handleOpenReader(heroArticle)}
        >
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${heroArticle.imageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2070'})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />

          <FavoriteButton
            article={heroArticle}
            size="large"
            position="overlay"
            className="top-4 right-4 z-20 bg-black/40 hover:bg-black/60 border border-white/20 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          />

          <div className="absolute bottom-0 left-0 p-6 lg:p-10 max-w-3xl">
            <span className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-widest text-white uppercase bg-[rgb(var(--color-primary))] rounded-full shadow-lg shadow-black/40">
              Top Story
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-white mb-4 leading-tight drop-shadow-xl">
              <a
                href={heroArticle.link}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline decoration-4 decoration-[rgb(var(--color-accent))] underline-offset-8"
                onClick={(e) => { e.preventDefault(); handleOpenReader(heroArticle); }}
              >
                {heroArticle.title}
              </a>
            </h1>
            <p className="hidden md:block text-lg text-gray-100 line-clamp-2 mb-4 max-w-2xl drop-shadow-sm">
              {heroArticle.description}
            </p>
            <div className="flex items-center text-sm font-bold min-w-0">
              <span className="bg-[rgb(var(--color-accent))] text-white px-2 py-0.5 rounded truncate max-w-[150px] sm:max-w-[250px] shadow-sm shadow-black/20">{heroArticle.sourceTitle}</span>
              <span className="mx-2 flex-shrink-0 text-white">•</span>
              <span className="truncate text-white font-black">{new Date(heroArticle.pubDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Top Stories */}
        <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:flex lg:flex-col gap-4 lg:gap-6">
          {topStories.map((article) => (
            <div
              key={article.link}
              className="relative flex-1 rounded-2xl overflow-hidden group min-h-[200px] shadow-lg cursor-pointer"
              onClick={() => handleOpenReader(article)}
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url(${article.imageUrl})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <FavoriteButton
                article={article}
                size="medium"
                position="overlay"
                className="top-4 right-4 z-20 bg-black/40 hover:bg-black/60 border border-white/10 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute bottom-0 left-0 p-5 w-full">
                <h2 className="text-lg font-bold text-white leading-snug mb-2 drop-shadow-lg">
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-yellow-400 transition-colors"
                    onClick={(e) => { e.preventDefault(); handleOpenReader(article); }}
                  >
                    {article.title}
                  </a>
                </h2>
                <div className="flex items-center text-xs font-bold min-w-0">
                  <span className="bg-[rgb(var(--color-accent))] text-white px-1.5 py-0.5 rounded truncate max-w-[120px] shadow-sm shadow-black/20">{article.sourceTitle}</span>
                  <span className="mx-2 flex-shrink-0 text-white">•</span>
                  <span className="text-gray-200">{new Date(article.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 2: VISUAL STRIP (4 cols) */}
      <section className="border-y border-white/5 py-12 bg-[rgb(var(--color-surface))]/10 backdrop-blur-sm rounded-3xl px-4 md:px-8 shadow-inner">
        <div className="flex items-center gap-4 mb-8">
          <span className="w-1.5 h-6 bg-[rgb(var(--color-accent))] rounded-full"></span>
          <h3 className="text-sm md:text-base font-black uppercase tracking-[0.2em] text-[rgb(var(--color-accent))]">
            Trending Analysis
          </h3>
          <div className="h-px flex-1 bg-gradient-to-r from-[rgb(var(--color-accent))]/30 to-transparent"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredStrip.map((article) => (
            <ArticleItem
              key={article.link}
              article={article}
              layoutMode="grid"
              density="compact"
              onClick={handleOpenReader}
              className="[&_.relative.mb-4]:!h-72"
            />
          ))}
        </div>
      </section>

      {/* SECTION 3: MAIN CONTENT + SIDEBAR */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

        {/* Main Feed (Left 8 cols) */}
        <div className="lg:col-span-8">
          <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-4">
            <span className="w-1.5 h-6 bg-[rgb(var(--color-primary))] rounded-full"></span>
            <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Latest News</h3>
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
          </div>

          <div className="space-y-8">
            {/* First item big */}
            {mainFeed.length > 0 && (
              <ArticleItem
                article={mainFeed[0]}
                layoutMode="newspaper"
                density="comfortable"
                onClick={handleOpenReader}
                className="[&_.relative.mb-4]:!h-96"
              />
            )}

            {/* Grid for the rest */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {mainFeed.slice(1).map(article => (
                <ArticleItem
                  key={article.link}
                  article={article}
                  layoutMode="grid"
                  density="comfortable"
                  onClick={handleOpenReader}
                  className="[&_.relative.mb-4]:!h-72"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar (Right 4 cols) */}
        <div className="lg:col-span-4 space-y-8">
          {/* Sidebar Widget 1: Most Recent List */}
          <div className="bg-[rgb(var(--color-surface))] rounded-xl p-6 border border-white/5 sticky top-24">
            <h4 className="text-lg font-bold text-[rgb(var(--color-text))] mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-[rgb(var(--color-accent))] rounded-sm"></span>
              In Case You Missed It
            </h4>
            <div className="space-y-4">
              {sidebarFeed.slice(0, 8).map((article, index) => (
                <div
                  key={article.link}
                  className="group cursor-pointer bg-[rgb(var(--color-surface))]/70 backdrop-blur-xl rounded-xl p-4 border border-white/10 hover:bg-[rgb(var(--color-surface))] hover:border-[rgb(var(--color-accent))]/50 transition-all duration-300 shadow-lg"
                  onClick={() => handleOpenReader(article)}
                >
                  <div className="flex gap-4 items-start">
                    <span className="text-2xl font-black text-[rgb(var(--color-accent))] opacity-40 font-serif group-hover:opacity-100 transition-opacity">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h5 className="font-bold text-[rgb(var(--color-text))] leading-tight group-hover:text-white group-hover:underline transition-all text-sm mb-2 line-clamp-2">
                          {article.title}
                        </h5>
                        <FavoriteButton
                          article={article}
                          size="small"
                          position="inline"
                          className="opacity-100 text-[rgb(var(--color-textSecondary))] hover:text-white"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[rgb(var(--color-accent))] bg-black/20 px-1.5 py-0.5 rounded truncate max-w-full">
                          {article.sourceTitle}
                        </span>
                        <span className="text-[10px] font-bold text-white/60 group-hover:text-white transition-colors">
                          {new Date(article.pubDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-3 text-sm font-medium text-[rgb(var(--color-textSecondary))] hover:text-[rgb(var(--color-text))] border-t border-white/10 transition-colors">
              View All Archives
            </button>
          </div>
        </div>

      </section>

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
