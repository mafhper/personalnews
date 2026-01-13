/**
 * ImmersiveLayout
 * Layout imersivo com hero + grid em duas colunas
 * Responsivo, deduplicado e com fallback visual para posts sem imagem
 */

import React, { useMemo, useState } from 'react';
import type { Article } from '../../types';
import { ArticleReaderModal } from '../ArticleReaderModal';
import { ArticleImage } from '../ArticleImage';
import { FavoriteButton } from '../FavoriteButton';

interface ImmersiveLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

/* =========================
   Utils
========================= */

function getGradientFromString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }

  const gradients = [
    'from-slate-900 via-gray-800 to-zinc-900',
    'from-indigo-900 via-blue-800 to-cyan-900',
    'from-emerald-900 via-teal-800 to-cyan-900',
    'from-rose-900 via-pink-800 to-fuchsia-900',
    'from-amber-900 via-orange-800 to-red-900',
    'from-violet-900 via-purple-800 to-indigo-900',
  ];

  return gradients[Math.abs(hash) % gradients.length];
}

/* =========================
   Layout
========================= */

export const ImmersiveLayout: React.FC<ImmersiveLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);

  const uniqueArticles = useMemo(() => {
    const seen = new Set<string>();
    return articles.filter(a => {
      if (!a.link || seen.has(a.link)) return false;
      seen.add(a.link);
      return true;
    });
  }, [articles]);

  if (uniqueArticles.length === 0) return null;

  const hero = uniqueArticles[0];
  const rest = uniqueArticles.slice(1);

  const hasContent = (a: Article) => !!a.content || !!a.description;

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-12 pb-20 px-4 sm:px-6 lg:px-8">

      <HeroArticle
        article={hero}
        onRead={() => setReadingArticle(hero)}
        hasContent={hasContent(hero)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
        {rest.map(article => (
          <ArticleCard
            key={article.link}
            article={article}
            onRead={() => setReadingArticle(article)}
            hasContent={hasContent(article)}
          />
        ))}
      </div>

      {readingArticle && (
        <ArticleReaderModal
          article={readingArticle}
          onClose={() => setReadingArticle(null)}
          onNext={() => {
            const i = uniqueArticles.findIndex(a => a.link === readingArticle.link);
            if (i < uniqueArticles.length - 1) {
              setReadingArticle(uniqueArticles[i + 1]);
            }
          }}
          onPrev={() => {
            const i = uniqueArticles.findIndex(a => a.link === readingArticle.link);
            if (i > 0) {
              setReadingArticle(uniqueArticles[i - 1]);
            }
          }}
          hasNext={
            uniqueArticles.findIndex(a => a.link === readingArticle.link) <
            uniqueArticles.length - 1
          }
          hasPrev={
            uniqueArticles.findIndex(a => a.link === readingArticle.link) > 0
          }
        />
      )}
    </div>
  );
};

/* =========================
   Hero
========================= */

const HeroArticle: React.FC<{
  article: Article;
  onRead: () => void;
  hasContent: boolean;
}> = ({ article, onRead, hasContent }) => {
  const gradient = getGradientFromString(article.title);

  return (
    <section className="relative w-full rounded-3xl overflow-hidden min-h-[60vh] md:min-h-[70vh] xl:min-h-[75vh] shadow-2xl group flex flex-col">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />

      <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105 opacity-80">
          <ArticleImage 
            article={article}
            width={1200}
            height={800}
            className="w-full h-full object-cover"
            priority={true}
          />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/10 pointer-events-none" />

      {/* Top Controls: Site name and FavoriteButton aligned */}
      <div className="absolute top-0 left-0 right-0 p-6 sm:p-8 md:p-10 flex justify-between items-start z-20">
        <div className="bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          <span className="text-xs font-bold uppercase tracking-widest text-white/90">
            {article.sourceTitle}
          </span>
        </div>
        <FavoriteButton 
          article={article} 
          size="large"
          position="overlay"
          className="!static bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
        />
      </div>

      {/* Content at the bottom */}
      <div className="relative z-10 mt-auto p-8 sm:p-12 md:p-16 w-full max-w-5xl">
        <div className="space-y-6">
          <time dateTime={article.pubDate.toISOString()} className="text-xs uppercase tracking-[0.3em] text-white/60 font-black">
            {article.pubDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </time>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight">
            <a href={article.link} target="_blank" rel="noopener noreferrer" className="hover:text-white/90 transition-colors">
              {article.title}
            </a>
          </h1>

          {article.description && (
            <p className="text-base sm:text-lg md:text-xl text-gray-300/90 line-clamp-3 leading-relaxed max-w-3xl">
              {article.description}
            </p>
          )}

          {hasContent && (
            <div className="pt-4">
              <button
                onClick={onRead}
                className="group/btn inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white text-black font-bold text-xs uppercase tracking-widest transition-all hover:bg-gray-200 active:scale-95"
              >
                Ler Artigo
                <span className="transition-transform group-hover/btn:translate-x-1">→</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

/* =========================
   Card
========================= */

const ArticleCard: React.FC<{
  article: Article;
  onRead: () => void;
  hasContent: boolean;
}> = ({ article, onRead, hasContent }) => {
  const gradient = getGradientFromString(article.title);

  return (
    <section className="relative w-full rounded-3xl overflow-hidden min-h-[45vh] shadow-xl group flex flex-col">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />

      <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105 opacity-80">
          <ArticleImage 
            article={article}
            width={800}
            height={600}
            className="w-full h-full object-cover"
          />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none" />

      <FavoriteButton 
        article={article} 
        size="medium"
        position="overlay"
        className="top-4 right-4 z-20 bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
      />

      {/* Content Container */}
      <div className="relative z-10 h-full flex flex-col justify-between p-6 min-h-[inherit]">
        
        {/* Top Part */}
        <div className="flex justify-start items-start w-full">
          <div className="bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 min-w-0 max-w-[150px] sm:max-w-[200px]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 truncate block">
              {article.sourceTitle}
            </span>
          </div>
        </div>

        {/* Bottom Part */}
        <div className="space-y-3">
          <time dateTime={article.pubDate.toISOString()} className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-bold">
            {article.pubDate.toLocaleDateString('pt-BR')}
          </time>

          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white/80 transition-colors"
              >
                {article.title}
              </a>
            </h2>

            {article.description && (
              <p className="text-xs sm:text-sm text-gray-300/90 line-clamp-2 leading-relaxed">
                {article.description}
              </p>
            )}
          </div>

          {hasContent && (
            <button
              onClick={onRead}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors pt-2"
            >
              Expandir →
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
