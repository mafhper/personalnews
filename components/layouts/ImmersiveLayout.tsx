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

      {/* Content Container - Split between top and bottom */}
      <div className="relative z-10 h-full flex flex-col justify-between p-6 sm:p-8 md:p-10 xl:p-14 min-h-[inherit]">
        
        {/* Top Part: Source and Actions */}
        <div className="flex justify-between items-start w-full">
          <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-white/90">
              {article.sourceTitle}
            </span>
          </div>

          <FavoriteButton 
            article={article} 
            size="large"
            position="inline"
            className="bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 shadow-lg"
          />
        </div>

        {/* Bottom Part: Main Content */}
        <div className="space-y-6 max-w-5xl">
          <div className="space-y-4">
            <time dateTime={article.pubDate.toISOString()} className="block text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-white/50 font-medium">
              {article.pubDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </time>

            <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-black text-white leading-[1.1] max-w-4xl tracking-tight">
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white/90 transition-colors"
              >
                {article.title}
              </a>
            </h1>

            {article.description && (
              <p className="text-base sm:text-lg text-gray-200/90 max-w-3xl line-clamp-2 font-medium leading-relaxed">
                {article.description}
              </p>
            )}
          </div>

          {hasContent && (
            <button
              onClick={onRead}
              className="group/btn inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white text-black font-bold text-xs uppercase tracking-widest transition-all hover:bg-gray-200 active:scale-95"
            >
              Ler Artigo
              <span className="transition-transform group-hover/btn:translate-x-1">→</span>
            </button>
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

      {/* Content Container */}
      <div className="relative z-10 h-full flex flex-col justify-between p-6 min-h-[inherit]">
        
        {/* Top Part */}
        <div className="flex justify-between items-start w-full">
          <div className="bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">
              {article.sourceTitle}
            </span>
          </div>

          <FavoriteButton 
            article={article} 
            size="medium"
            position="inline"
            className="bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10"
          />
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
