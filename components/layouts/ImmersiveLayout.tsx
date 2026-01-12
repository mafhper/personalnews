/**
 * ImmersiveLayout Component
 * 
 * Layout imersivo para visualização de artigos RSS com:
 * - Hero section destacado com imagem de fundo
 * - Grid responsivo de artigos
 * - Fallback gradiente elegante para imagens quebradas
 * - Modal de leitura com navegação entre artigos
 * - Deduplicação automática de artigos
 * 
 * @version 2.0
 * @author Sistema de RSS Reader
 */

import React, { useEffect, useMemo, useState } from 'react';

// Tipos
interface Article {
  title: string;
  link: string;
  pubDate: string;
  description?: string;
  content?: string;
  imageUrl?: string;
  sourceTitle: string;
}

interface ImmersiveLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

/**
 * Hook para validar carregamento de imagens
 * Retorna { loaded, error } para melhor controle de fallback
 */
function useImageStatus(src?: string) {
  const [status, setStatus] = useState<{ loaded: boolean; error: boolean }>({
    loaded: false,
    error: false
  });

  useEffect(() => {
    if (!src) {
      setStatus({ loaded: false, error: true });
      return;
    }

    setStatus({ loaded: false, error: false });
    
    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setStatus({ loaded: true, error: false });
    };
    
    img.onerror = () => {
      setStatus({ loaded: false, error: true });
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return status;
}

/**
 * Gera gradiente único baseado no título do artigo
 */
function getGradientFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const gradients = [
    'from-purple-900 via-indigo-800 to-blue-900',
    'from-blue-900 via-cyan-800 to-teal-900',
    'from-green-900 via-emerald-800 to-cyan-900',
    'from-orange-900 via-red-800 to-pink-900',
    'from-pink-900 via-purple-800 to-indigo-900',
    'from-slate-900 via-gray-800 to-zinc-900',
    'from-amber-900 via-orange-800 to-red-900',
    'from-violet-900 via-purple-800 to-fuchsia-900'
  ];
  
  return gradients[Math.abs(hash) % gradients.length];
}

/**
 * Componente Principal
 */
export const ImmersiveLayout: React.FC<ImmersiveLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);

  // Deduplicação defensiva por link
  const uniqueArticles = useMemo(() => {
    const seen = new Set<string>();
    return articles.filter(article => {
      if (!article.link || seen.has(article.link)) return false;
      seen.add(article.link);
      return true;
    });
  }, [articles]);

  const hero = uniqueArticles[0];
  const rest = hero
    ? uniqueArticles.filter(a => a.link !== hero.link)
    : uniqueArticles;

  const hasContent = (article: Article) =>
    !!article.content || !!article.description;

  return (
    <div className="flex flex-col gap-12 pb-20">

      {/* HERO SECTION */}
      {hero && (
        <HeroArticle 
          article={hero} 
          onRead={() => setReadingArticle(hero)}
          hasContent={hasContent(hero)}
        />
      )}

      {/* GRID DE ARTIGOS */}
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

      {/* MODAL DE LEITURA */}
      {readingArticle && (
        <ArticleReaderModal
          article={readingArticle}
          onClose={() => setReadingArticle(null)}
          onNext={() => {
            const index = uniqueArticles.findIndex(
              a => a.link === readingArticle.link
            );
            if (index < uniqueArticles.length - 1) {
              setReadingArticle(uniqueArticles[index + 1]);
            }
          }}
          onPrev={() => {
            const index = uniqueArticles.findIndex(
              a => a.link === readingArticle.link
            );
            if (index > 0) {
              setReadingArticle(uniqueArticles[index - 1]);
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

/**
 * Componente Hero Article
 */
const HeroArticle: React.FC<{
  article: Article;
  onRead: () => void;
  hasContent: boolean;
}> = ({ article, onRead, hasContent }) => {
  const { loaded, error } = useImageStatus(article.imageUrl);
  const gradientClass = getGradientFromString(article.title);

  return (
    <section className="relative w-full rounded-3xl overflow-hidden min-h-[50vh] md:min-h-[55vh] xl:min-h-[65vh] shadow-2xl group">
      
      {/* Fallback com gradiente único */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass}`} />

      {/* Imagem quando carrega com sucesso */}
      {loaded && !error && article.imageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url(${article.imageUrl})` }}
        />
      )}

      {/* Overlay escurecido */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20" />

      {/* Conteúdo */}
      <div className="relative z-10 h-full flex flex-col justify-end p-5 sm:p-6 md:p-8 lg:p-10 xl:p-12">
        <div className="space-y-3 sm:space-y-3.5 md:space-y-4 max-w-5xl">

          {/* Badge e Metadados na mesma linha */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[10px] sm:text-xs uppercase tracking-widest text-white/90 font-semibold">
                Destaque
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-widest text-white/60">
              <span className="font-medium">{article.sourceTitle}</span>
              <span>•</span>
              <time dateTime={article.pubDate}>
                {new Date(article.pubDate).toLocaleDateString('pt-BR')}
              </time>
            </div>
          </div>

          {/* Título - proporções balanceadas */}
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white leading-tight max-w-4xl">
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-400 transition-colors duration-300"
            >
              {article.title}
            </a>
          </h1>

          {/* Descrição */}
          {article.description && (
            <p className="text-xs sm:text-sm md:text-base text-gray-200 max-w-3xl line-clamp-2 leading-relaxed">
              {article.description}
            </p>
          )}

          {/* Ações */}
          {hasContent && (
            <div className="flex items-center gap-4 pt-1">
              <button
                onClick={onRead}
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white/10 hover:bg-blue-600 backdrop-blur-md border border-white/20 hover:border-blue-500 text-white font-medium uppercase tracking-wider text-[10px] sm:text-[11px] transition-all duration-300"
              >
                Visualizar →
              </button>
              
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] sm:text-xs uppercase text-white/70 hover:text-white transition-colors font-medium tracking-wider"
              >
                Ler original ↗
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

/**
 * Componente Card de Artigo
 */
const ArticleCard: React.FC<{
  article: Article;
  onRead: () => void;
  hasContent: boolean;
}> = ({ article, onRead, hasContent }) => {
  const { loaded, error } = useImageStatus(article.imageUrl);
  const gradientClass = getGradientFromString(article.title);

  return (
    <section className="relative w-full rounded-3xl overflow-hidden min-h-[38vh] sm:min-h-[42vh] md:min-h-[45vh] lg:min-h-[48vh] shadow-xl group">
      
      {/* Fallback gradiente */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass}`} />

      {/* Imagem */}
      {loaded && !error && article.imageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url(${article.imageUrl})` }}
        />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/30" />

      {/* Conteúdo */}
      <div className="relative z-10 h-full flex flex-col justify-end p-4 sm:p-5 md:p-6 lg:p-7">
        <div className="space-y-2 sm:space-y-2.5 max-w-xl">

          {/* Metadados */}
          <div className="flex items-center gap-2 text-[9px] sm:text-[10px] uppercase tracking-widest text-white/60">
            <span className="font-medium">{article.sourceTitle}</span>
            <span>•</span>
            <time dateTime={article.pubDate}>
              {new Date(article.pubDate).toLocaleDateString('pt-BR')}
            </time>
          </div>

          {/* Título - proporções ajustadas */}
          <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white leading-tight">
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-400 transition-colors duration-300"
            >
              {article.title}
            </a>
          </h2>

          {/* Descrição */}
          {article.description && (
            <p className="text-xs sm:text-sm text-gray-300 line-clamp-2 leading-relaxed">
              {article.description}
            </p>
          )}

          {/* Botão visualizar */}
          {hasContent && (
            <button
              onClick={onRead}
              className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs uppercase text-white/80 hover:text-white transition-all duration-300 group/btn pt-1"
            >
              <span className="font-semibold">Visualizar</span>
              <svg className="w-3 h-3 sm:w-4 sm:h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

/**
 * Modal de Leitura - Importado do componente original
 * (Placeholder - usar ArticleReaderModal do projeto)
 */
const ArticleReaderModal: React.FC<{
  article: Article;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}> = ({ article, onClose }) => {
  // Este é um placeholder - use o ArticleReaderModal original do seu projeto
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">{article.title}</h2>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
          Fechar
        </button>
      </div>
    </div>
  );
};
