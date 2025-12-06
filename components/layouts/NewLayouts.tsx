import React, { useState } from 'react';
import { Article } from '../../types';
import { LazyImage } from '../LazyImage';
import { ArticleReaderModal } from '../ArticleReaderModal';

interface NewLayoutProps {
  articles: Article[];
  timeFormat: '12h' | '24h';
}

/* 1. Newspaper Layout */
export const NewspaperLayout: React.FC<NewLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);

  return (
    <div className="bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] p-8 min-h-screen font-serif">
      <div className="border-b-4 border-[rgb(var(--color-text))] mb-6 pb-2 text-center">
        <h1 className="text-6xl font-black uppercase tracking-tighter">The Daily Feed</h1>
        <p className="text-sm font-bold mt-2 uppercase tracking-widest border-t border-[rgb(var(--color-text))] pt-1 inline-block">Vol. {new Date().getFullYear()} • No. {new Date().getMonth() + 1}</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Headline */}
        <div className="lg:col-span-4 border-b-2 border-[rgb(var(--color-border))] pb-8 mb-4">
          <h2 className="text-5xl font-bold leading-tight mb-4 hover:underline cursor-pointer" onClick={() => setReadingArticle(articles[0])}>
            {articles[0]?.title}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 cursor-pointer" onClick={() => setReadingArticle(articles[0])}>
               {articles[0]?.imageUrl && (
                 <img src={articles[0].imageUrl} className="w-full h-[400px] object-cover transition-all duration-500 rounded-lg" alt="" />
               )}
            </div>
            <div className="text-lg leading-relaxed text-justify">
              <p className="first-letter:text-5xl first-letter:font-bold first-letter:float-left first-letter:mr-2 first-letter:mt-[-5px]">
                {articles[0]?.description}
              </p>
              <div className="mt-4 text-sm font-bold uppercase text-[rgb(var(--color-textSecondary))]">By {articles[0]?.sourceTitle}</div>
            </div>
          </div>
        </div>
        {/* Columns */}
        {articles.slice(1).map((article, i) => (
          <article key={i} className="border-b border-[rgb(var(--color-border))] pb-4 mb-4 break-inside-avoid cursor-pointer" onClick={() => setReadingArticle(article)}>
            <span className="text-[10px] font-sans font-bold uppercase bg-[rgb(var(--color-accent))] text-white px-1 mb-2 inline-block rounded">{article.sourceTitle}</span>
            <h3 className="text-xl font-bold leading-tight mb-2 hover:underline hover:text-[rgb(var(--color-accent))] transition-colors">
              {article.title}
            </h3>
            <p className="text-sm leading-snug text-[rgb(var(--color-textSecondary))] line-clamp-4">{article.description}</p>
          </article>
        ))}
      </div>
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
    </div>
  );
};

/* 2. Focus Layout - Snap Scroll Single View */
export const FocusLayout: React.FC<NewLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  
  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-black text-white">
      {articles.map((article, i) => (
        <section key={i} className="h-screen w-full snap-start relative flex items-end pb-20 px-4 md:px-20">
          <div className="absolute inset-0 z-0">
            <LazyImage src={article.imageUrl || ''} className="w-full h-full object-cover opacity-40" alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          </div>
          <div className="relative z-10 max-w-4xl animate-in fade-in slide-in-from-bottom-10 duration-700">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full border border-white/30 text-xs uppercase tracking-widest">{article.sourceTitle}</span>
              <span className="text-xs text-gray-400">{new Date(article.pubDate).toLocaleDateString()}</span>
            </div>
            <h2 className="text-4xl md:text-7xl font-bold mb-6 leading-tight cursor-pointer hover:text-[rgb(var(--color-accent))] transition-colors" onClick={() => setReadingArticle(article)}>
              {article.title}
            </h2>
            <p className="text-lg md:text-2xl text-gray-300 line-clamp-3 max-w-2xl mb-8 leading-relaxed">
              {article.description}
            </p>
            <button 
              onClick={() => setReadingArticle(article)}
              className="inline-flex items-center text-lg font-medium hover:gap-4 gap-2 transition-all text-white"
            >
              Preview <span className="text-2xl">→</span>
            </button>
          </div>
        </section>
      ))}
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
    </div>
  );
};

/* 3. Gallery Layout - Image Centric */
export const GalleryLayout: React.FC<NewLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 p-1 bg-[rgb(var(--color-background))] min-h-screen">
      {articles.map((article, i) => (
        <div 
          key={i} 
          onClick={() => setReadingArticle(article)}
          className="group relative aspect-square overflow-hidden cursor-pointer"
        >
          {article.imageUrl ? (
             <div className="w-full h-full"> 
                <LazyImage 
                    src={article.imageUrl} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    alt={article.title}
                />
             </div>
          ) : (
            <div className="w-full h-full bg-[rgb(var(--color-surface))] flex items-center justify-center text-[rgb(var(--color-textSecondary))] font-bold text-4xl select-none">
              {article.sourceTitle.charAt(0)}
            </div>
          )}
          
          {/* Always visible gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />
          
          {/* Post info at bottom-left */}
          <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
            <span className="text-[rgb(var(--color-accent))] text-[10px] font-bold uppercase tracking-widest block mb-1">
              {article.sourceTitle}
            </span>
            <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 group-hover:text-[rgb(var(--color-accent))] transition-colors">
              {article.title}
            </h3>
            <span className="text-white/60 text-[10px] mt-1 block">
              {new Date(article.pubDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
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
    </div>
  );
};

/* 4. Compact Layout - Data Density (Hacker News style) */
export const CompactLayout: React.FC<NewLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);

  return (
    <div className="bg-[rgb(var(--color-background))] min-h-screen font-mono text-sm p-2 sm:p-4">
      <div className="max-w-5xl mx-auto bg-[rgb(var(--color-surface))] shadow-lg border border-[rgb(var(--color-border))] rounded-lg overflow-hidden">
        <div className="bg-[rgb(var(--color-accent))] p-2 px-4 flex items-center">
          <span className="font-bold text-white mr-4">FeedNews</span>
          <span className="text-white/80 text-xs">new | past | comments | ask | jobs</span>
        </div>
        <div className="p-2 sm:p-4">
          <ol className="list-decimal list-inside space-y-1 text-[rgb(var(--color-textSecondary))]">
            {articles.map((article, i) => (
              <li key={i} className="py-1.5 border-b border-[rgb(var(--color-border))]/30 last:border-b-0">
                <span onClick={() => setReadingArticle(article)} className="text-[rgb(var(--color-text))] font-medium hover:text-[rgb(var(--color-accent))] hover:underline cursor-pointer mr-2 transition-colors">
                  {article.title}
                </span>
                <span className="text-[10px] text-[rgb(var(--color-textSecondary))]">
                  ({new URL(article.link).hostname.replace('www.', '')})
                </span>
                <div className="text-[10px] text-[rgb(var(--color-textSecondary))] ml-6 leading-tight mt-0.5">
                  by {article.author || article.sourceTitle} <span className="mx-1 opacity-50">|</span> {new Date(article.pubDate).toLocaleDateString()} <span className="mx-1 opacity-50">|</span> 
                  <span onClick={() => setReadingArticle(article)} className="cursor-pointer hover:underline hover:text-[rgb(var(--color-accent))] mx-1 transition-colors">preview</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
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
    </div>
  );
};

/* 5. Split Layout - Zig Zag */
export const SplitLayout: React.FC<NewLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-[rgb(var(--color-background))]">
      {articles.map((article, i) => (
        <article key={i} className={`flex flex-col md:flex-row h-auto md:h-[50vh] group ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
          <div 
            className="w-full md:w-1/2 h-64 md:h-full relative overflow-hidden cursor-pointer"
            onClick={() => setReadingArticle(article)}
          >
            {article.imageUrl && (
              <LazyImage src={article.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="" />
            )}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
          </div>
          <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-[rgb(var(--color-surface))] border-b border-[rgb(var(--color-border))]">
            <span className="text-[rgb(var(--color-accent))] font-bold uppercase tracking-widest text-xs mb-4">{article.sourceTitle}</span>
            <h2 
                className="text-2xl md:text-4xl font-bold mb-6 text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-accent))] transition-colors cursor-pointer"
                onClick={() => setReadingArticle(article)}
            >
              {article.title}
            </h2>
            <p className="text-[rgb(var(--color-textSecondary))] leading-relaxed mb-6 line-clamp-4">{article.description}</p>
            <div className="flex items-center text-xs font-bold uppercase tracking-widest text-[rgb(var(--color-text))] opacity-60">
              {new Date(article.pubDate).toDateString()}
            </div>
            <button 
                onClick={() => setReadingArticle(article)}
                className="mt-6 text-xs font-bold uppercase tracking-widest text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-accent))] self-start"
            >
                Preview &rarr;
            </button>
          </div>
        </article>
      ))}
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
    </div>
  );
};

/* 6. Cyberpunk Layout - Neon */
export const CyberpunkLayout: React.FC<NewLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);

  return (
    <div className="min-h-screen bg-[#050505] p-4 font-mono bg-[linear-gradient(0deg,rgba(0,255,65,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,65,0.03)_1px,transparent_1px)] bg-[size:20px_20px]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article, i) => (
          <article key={i} className="relative border border-[#00ff41] bg-[#001100]/80 p-4 shadow-[0_0_10px_rgba(0,255,65,0.2)] hover:shadow-[0_0_20px_rgba(0,255,65,0.5)] hover:border-[#fff] transition-all group flex flex-col">
            <div className="absolute top-0 left-0 w-2 h-2 bg-[#00ff41]" />
            <div className="absolute top-0 right-0 w-2 h-2 bg-[#00ff41]" />
            <div className="absolute bottom-0 left-0 w-2 h-2 bg-[#00ff41]" />
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-[#00ff41]" />
            
            <div className="flex justify-between items-center border-b border-[#00ff41]/30 pb-2 mb-3 text-[#00ff41] text-xs">
              <span>SYS.FEED.{i.toString().padStart(3, '0')}</span>
              <span>[{article.sourceTitle}]</span>
            </div>

            {article.imageUrl && (
              <div 
                  className="mb-4 border border-[#00ff41]/50 relative overflow-hidden h-40 cursor-pointer group-hover:border-[#fff]/50 transition-colors"
                  onClick={() => setReadingArticle(article)}
              >
                  <LazyImage src={article.imageUrl} className="w-full h-full object-cover transition-all duration-500" alt="" />
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none" />
              </div>
            )}
            
            <h2 
                className="text-[#fff] text-lg font-bold mb-2 leading-snug group-hover:text-[#00ff41] transition-colors glitch-text cursor-pointer hover:underline"
                onClick={() => setReadingArticle(article)}
            >
              {article.title}
            </h2>
            
            <p className="text-[#00ff41]/80 text-xs leading-relaxed mb-4 border-l border-[#00ff41]/50 pl-2 flex-grow">
              {article.description?.slice(0, 150)}...
            </p>
            
            <div className="flex justify-end mt-auto">
              <button 
                  onClick={() => setReadingArticle(article)}
                  className="bg-[#00ff41] text-black text-xs font-bold px-4 py-1 hover:bg-white transition-colors uppercase"
              >
                Execute &gt;&gt;
              </button>
            </div>
          </article>
        ))}
      </div>
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
    </div>
  );
};

/* 7. Terminal Layout - CLI */
export const TerminalLayout: React.FC<NewLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);

  return (
    <div className="min-h-screen bg-black text-green-500 p-4 font-mono text-sm md:text-base">
      <div className="mb-6 text-white">
        <span className="text-blue-400">user@news-dashboard</span>:<span className="text-blue-200">~</span>$ ./fetch_feeds.sh --all
        <br/>
        <span className="text-gray-500">Fetching data... Done. {articles.length} packets received.</span>
      </div>
      
      <div className="space-y-6 max-w-4xl">
        {articles.map((article, i) => (
          <div key={i} className="group">
            <div className="flex items-start gap-2">
              <span className="text-gray-600 select-none min-w-[20px]">{`>`}</span>
              <div>
                <div className="flex flex-wrap gap-x-3 text-xs text-gray-500 mb-1">
                  <span className="text-yellow-500">[{new Date(article.pubDate).toISOString().split('T')[0]}]</span>
                  <span className="text-blue-400">@{article.sourceTitle.toLowerCase().replace(/\s/g, '_')}</span>
                  <span className="text-gray-600">id:{Math.random().toString(36).substr(2, 6)}</span>
                </div>
                <h2 
                    className="font-bold text-white hover:bg-white hover:text-black inline-block px-1 -ml-1 transition-colors cursor-pointer mb-1"
                    onClick={() => setReadingArticle(article)}
                >
                  {article.title}
                </h2>
                <p className="text-gray-400 pl-0 max-w-2xl border-l border-gray-800 ml-1 pl-2 mt-1">
                  {article.description}
                </p>
                <button 
                   onClick={() => setReadingArticle(article)}
                   className="mt-2 text-xs text-green-700 hover:text-green-400 hover:underline"
                >
                    [PREVIEW]
                </button>
              </div>
            </div>
          </div>
        ))}
        <div className="animate-pulse">
          <span className="text-blue-400">user@news-dashboard</span>:<span className="text-blue-200">~</span>$ <span className="w-2 h-4 bg-white inline-block align-middle"/>
        </div>
      </div>
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
    </div>
  );
};

/* 8. Polaroid Layout - Retro Cards */
export const PolaroidLayout: React.FC<NewLayoutProps> = ({ articles }) => {
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);

  return (
    <div className="min-h-screen bg-[rgb(var(--color-background))] p-8 overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10 items-start">
        {articles.map((article, i) => {
          return (
            <article 
              key={i} 
              className="bg-[rgb(var(--color-surface))] p-4 pb-12 shadow-lg border border-[rgb(var(--color-border))] transition-all duration-500 ease-out hover:scale-105 hover:z-20 hover:shadow-2xl flex flex-col group cursor-pointer"
              onClick={() => setReadingArticle(article)}
            >
              <div className="aspect-square bg-[rgb(var(--color-background))] mb-4 overflow-hidden border border-[rgb(var(--color-border))] filter sepia-[.3] group-hover:sepia-0 transition-all duration-500">
                {article.imageUrl ? (
                  <LazyImage src={article.imageUrl} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[rgb(var(--color-textSecondary))] font-serif italic text-xl">No Image</div>
                )}
              </div>
              
              <h2 className="font-handwriting font-serif text-[rgb(var(--color-text))] text-xl leading-tight text-center mb-4 flex-grow font-bold group-hover:text-[rgb(var(--color-accent))] transition-colors">
                {article.title}
              </h2>
              
              <div className="text-center text-xs text-[rgb(var(--color-textSecondary))] font-serif italic mb-4">
                {article.sourceTitle} • {new Date(article.pubDate).toLocaleDateString()}
              </div>

              <div className="flex justify-center mt-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button 
                      onClick={(e) => { e.stopPropagation(); setReadingArticle(article); }}
                      className="bg-[rgb(var(--color-text))] text-[rgb(var(--color-background))] px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[rgb(var(--color-accent))] hover:text-white transition-colors shadow-md"
                  >
                      Preview
                  </button>
              </div>
            </article>
          );
        })}
      </div>
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
    </div>
  );
};
