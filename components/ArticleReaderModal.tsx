import React, { useEffect } from 'react';
import { Article } from '../types';
import { getVideoEmbed } from '../utils/videoEmbed';
import { HeaderIcons } from './icons';
import { sanitizeHtmlContent } from '../utils/sanitization';
import { fetchFullContent } from '../services/articleFetcher';

interface ArticleReaderModalProps {
  article: Article;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}

export const ArticleReaderModal: React.FC<ArticleReaderModalProps> = ({
  article,
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
}) => {
  const videoEmbed = getVideoEmbed(article.link);
  const [fullContent, setFullContent] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    // Reset state on article change
    setFullContent(null);
    setLoading(true);

    // If we already have substantial content from RSS, use it, but still try to fetch better content
    // actually, let's try to fetch if what we have looks short OR if user requests "full text".
    // User strategy: always try to fetch full text to ensure "completeness"
    const loadContent = async () => {
        const fetched = await fetchFullContent(article.link);
        if (fetched) {
            setFullContent(fetched);
        }
        setLoading(false);
    };

    loadContent();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && hasNext) onNext();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [article.link, onClose, onNext, onPrev, hasNext, hasPrev]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col md:flex-row bg-[#0a0a0c]/50 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Navigation Buttons (Desktop: Side / Mobile: Bottom fixed) */}
        <button 
          onClick={onPrev} 
          disabled={!hasPrev}
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/5 hover:bg-white/20 text-white disabled:opacity-0 transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>

        <button 
          onClick={onNext}
          disabled={!hasNext}
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/5 hover:bg-white/20 text-white disabled:opacity-0 transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/50 text-gray-400 hover:text-white hover:bg-black/80 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {videoEmbed ? (
            /* Cinema Mode */
            <div className="w-full h-full flex flex-col bg-black">
              <div className="aspect-video w-full bg-black">
                <iframe
                  src={videoEmbed}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-8 text-white">
                <h2 className="text-2xl font-bold mb-4">{article.title}</h2>
                <div className="text-gray-400 leading-relaxed">
                     {fullContent ? (
                         <div dangerouslySetInnerHTML={{ __html: fullContent }} />
                     ) : (
                         <p>{article.description}</p>
                     )}
                     {loading && !fullContent && <p className="text-sm text-gray-500 mt-2 animate-pulse">Loading full content...</p>}
                </div>
                <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center">
                    <span className="text-sm text-gray-500">{new Date(article.pubDate).toLocaleDateString()}</span>
                    <a href={article.link} target="_blank" rel="noopener" className="text-[rgb(var(--color-accent))] hover:underline">
                        Assistir no YouTube &rarr;
                    </a>
                </div>
              </div>
            </div>
          ) : (
            /* Reader Mode */
            <div className="w-full min-h-full bg-[#0a0a0c] text-gray-200 flex flex-col md:flex-row">
               {/* Image Sidebar (if available) */}
               {article.imageUrl && (
                 <div className="w-full md:w-1/3 h-64 md:h-auto relative flex-shrink-0">
                    <img src={article.imageUrl} className="w-full h-full object-cover opacity-80" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-transparent to-[#0a0a0c]" />
                 </div>
               )}
               
               <div className="p-8 md:p-12 flex-1">
                  <div className="flex items-center gap-3 text-xs tracking-widest uppercase text-[rgb(var(--color-accent))] mb-6">
                    <span className="font-bold">{article.sourceTitle}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-600" />
                    <span>{new Date(article.pubDate).toLocaleDateString()}</span>
                  </div>

                  <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-8 leading-tight">
                    {article.title}
                  </h1>

                  <div className="prose prose-invert prose-lg max-w-none opacity-90 font-serif leading-loose">
                    {fullContent ? (
                       <div dangerouslySetInnerHTML={{ __html: fullContent }} className="animate-in fade-in duration-500" />
                    ) : (
                       <>
                           {article.content ? (
                               <div dangerouslySetInnerHTML={{ __html: article.content }} />
                           ) : (
                               <div dangerouslySetInnerHTML={{ __html: article.description || '' }} />
                           )}
                           {loading && (
                               <div className="py-8 flex items-center justify-center text-gray-500 animate-pulse">
                                   <svg className="w-5 h-5 mr-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                   Loading full article content...
                               </div>
                           )}
                       </>
                    )}
                  </div>

                  <div className="mt-12 pt-8 border-t border-white/10">
                    <a 
                      href={article.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-6 py-3 bg-[rgb(var(--color-accent))] text-white rounded-lg hover:opacity-90 transition-all font-medium"
                    >
                      Ler artigo completo no site
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
