/**
 * ImmersiveLayout
 * Layout imersivo com hero + grid em duas colunas
 * Responsivo, deduplicado e com fallback visual para posts sem imagem
 */

import React, { useEffect, useMemo, useState } from 'react';
import type { Article } from '../../types';
import { ArticleReaderModal } from '../ArticleReaderModal';

interface ImmersiveLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

/* =========================
   Utils
========================= */

function useImageStatus(src?: string) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!src) {
      setLoaded(false);
      return;
    }

    const img = new Image();
    img.src = src;
    img.onload = () => setLoaded(true);
    img.onerror = () => setLoaded(false);

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return loaded;
}

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
    <div className="flex flex-col gap-12 pb-20">

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
  const imageLoaded = useImageStatus(article.imageUrl);
  const gradient = getGradientFromString(article.title);

  return (
    <section className="relative w-full rounded-3xl overflow-hidden min-h-[55vh] md:min-h-[60vh] xl:min-h-[65vh] shadow-2xl group">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />

      {imageLoaded && article.imageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url(${article.imageUrl})` }}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20" />

      <div className="relative z-10 h-full flex flex-col justify-end p-6 sm:p-8 md:p-10 xl:p-14">
        <div className="space-y-4 max-w-5xl">

          <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-widest text-white/70">
            <span>{article.sourceTitle}</span>
            <span>•</span>
            <time dateTime={article.pubDate.toISOString()}>
              {article.pubDate.toLocaleDateString('pt-BR')}
            </time>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl xl:text-5xl font-bold text-white leading-tight max-w-4xl">
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline underline-offset-8"
            >
              {article.title}
            </a>
          </h1>

          {article.description && (
            <p className="text-sm sm:text-base text-gray-200 max-w-3xl line-clamp-2">
              {article.description}
            </p>
          )}

          {hasContent && (
            <button
              onClick={onRead}
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-white text-[11px] uppercase tracking-wider transition"
            >
              Visualizar →
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
  const imageLoaded = useImageStatus(article.imageUrl);
  const gradient = getGradientFromString(article.title);

  return (
    <section className="relative w-full rounded-3xl overflow-hidden min-h-[42vh] shadow-xl group">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />

      {imageLoaded && article.imageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url(${article.imageUrl})` }}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/30" />

      <div className="relative z-10 h-full flex flex-col justify-end p-5 sm:p-6">
        <div className="space-y-3">

          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/60">
            <span>{article.sourceTitle}</span>
            <span>•</span>
            <time dateTime={article.pubDate.toISOString()}>
              {article.pubDate.toLocaleDateString('pt-BR')}
            </time>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline underline-offset-4"
            >
              {article.title}
            </a>
          </h2>

          {article.description && (
            <p className="text-sm text-gray-300 line-clamp-2">
              {article.description}
            </p>
          )}

          {hasContent && (
            <button
              onClick={onRead}
              className="pt-1 text-[11px] uppercase tracking-wider text-white/80 hover:text-white transition"
            >
              Visualizar →
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
