import React, { useEffect, useState, useRef } from 'react';
import { Article } from '../types';
import { getVideoEmbed } from '../utils/videoEmbed';
import { fetchFullContent } from '../services/articleFetcher';
import { useLanguage } from '../contexts/LanguageContext';
import { useModal } from '../contexts/ModalContext'; // Import useModal

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
  const [fullContent, setFullContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const { t } = useLanguage();
  const { setModalOpen } = useModal(); // Use the modal context
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setModalOpen(true); // Notify context that a modal is open
    // Reset state on article change
    setFullContent(null);
    setLoading(true);
    if (contentRef.current) contentRef.current.scrollTop = 0;

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
      if (e.key === 'f') setIsFocusMode(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      setModalOpen(false); // Notify context that the modal is closed
    };
  }, [article.link, onClose, onNext, onPrev, hasNext, hasPrev, setModalOpen]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-8 animate-in fade-in duration-300 bg-black md:bg-black/80">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-md hidden md:block"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className={`relative w-full h-full md:h-[90vh] md:max-w-5xl flex flex-col bg-[#0a0a0c] border-none md:border border-white/10 rounded-none md:rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ${isFocusMode ? 'md:max-w-3xl' : ''}`}>
        
        {/* Mobile Header - Always visible now to allow exit, semi-transparent in Focus Mode */}
        <div className={`md:hidden sticky top-0 left-0 right-0 h-14 z-50 flex items-center px-4 justify-between shrink-0 transition-colors duration-300 ${isFocusMode ? 'bg-black/60 backdrop-blur-sm border-none' : 'bg-black/95 backdrop-blur border-b border-white/10'}`}>
          <button onClick={onClose} className="flex items-center text-gray-200 hover:text-white transition-colors text-sm shadow-sm">
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">{t('action.back')}</span>
          </button>
          
          <button 
             onClick={() => setIsFocusMode(!isFocusMode)}
             className={`flex items-center gap-1 p-2 rounded-lg text-sm font-medium transition-colors ${isFocusMode ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'}`}
          >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
             <span>{t('action.focus_mode')}</span>
          </button>
        </div>

        {/* Desktop Controls (Close & Focus) */}
        <div className="hidden md:flex absolute top-4 right-4 z-50 gap-2">
            <button 
                onClick={() => setIsFocusMode(!isFocusMode)}
                className={`p-2 rounded-full transition-colors ${isFocusMode ? 'bg-white/20 text-white' : 'bg-black/50 text-gray-400 hover:text-white hover:bg-black/80'}`}
                title="Focus Mode (F)"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
            </button>
            <button 
                onClick={onClose}
                className="p-2 rounded-full bg-black/50 text-gray-400 hover:text-white hover:bg-black/80 transition-colors"
                title={t('action.close')}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        {/* Desktop Navigation Arrows */}
        {!isFocusMode && (
            <>
                <button 
                    onClick={onPrev} 
                    disabled={!hasPrev}
                    className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-black/40 hover:bg-black/70 text-white disabled:opacity-0 transition-all border border-white/5 backdrop-blur-sm"
                    title={t('action.prev')}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>

                <button 
                    onClick={onNext}
                    disabled={!hasNext}
                    className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-black/40 hover:bg-black/70 text-white disabled:opacity-0 transition-all border border-white/5 backdrop-blur-sm"
                    title={t('action.next')}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
            </>
        )}

        {/* Main Content Area */}
        <div ref={contentRef} className="flex-1 overflow-y-auto custom-scrollbar bg-[#0a0a0c] relative scroll-smooth">
          {videoEmbed ? (
            /* Cinema Mode (Video) */
            <div className="w-full min-h-full flex flex-col bg-black">
              <div className="aspect-video w-full bg-black shrink-0 md:max-h-[70vh] mx-auto">
                <iframe
                  src={videoEmbed}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-6 md:p-10 max-w-4xl mx-auto w-full">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">{article.title}</h1>
                <div className="prose prose-invert prose-lg max-w-none text-gray-300">
                     {fullContent ? (
                         <div dangerouslySetInnerHTML={{ __html: fullContent }} />
                     ) : (
                         <p>{article.description}</p>
                     )}
                </div>
              </div>
            </div>
          ) : (
            /* Standard Article Layout */
            <div className="flex flex-col min-h-full">
               {/* Hero Image - Hidden in Focus Mode */}
               {article.imageUrl && !isFocusMode && (
                 <div className="w-full h-[40vh] md:h-[50vh] relative shrink-0">
                    <img 
                        src={article.imageUrl} 
                        className="w-full h-full object-cover" 
                        alt={article.title} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/40 to-transparent" />
                 </div>
               )}

               {/* Article Body */}
               <div className={`relative px-6 py-8 md:px-12 md:py-12 max-w-3xl mx-auto w-full transition-all ${isFocusMode ? 'pt-20' : '-mt-20 md:-mt-32'}`}>
                  {/* Meta - Hidden in Focus Mode */}
                  {!isFocusMode && (
                      <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm tracking-widest uppercase text-[rgb(var(--color-accent))] mb-4 md:mb-6 animate-in slide-in-from-bottom-4 duration-700 delay-100">
                        <span className="font-bold bg-black/50 backdrop-blur px-2 py-1 rounded">{article.sourceTitle}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
                        <span className="text-gray-300 drop-shadow-md">{new Date(article.pubDate).toLocaleDateString()}</span>
                      </div>
                  )}

                  <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-8 leading-tight drop-shadow-lg animate-in slide-in-from-bottom-4 duration-700 delay-200">
                    {article.title}
                  </h1>

                  <div className={`prose prose-invert prose-lg max-w-none font-serif leading-loose text-gray-200 ${isFocusMode ? 'text-xl' : ''}`}>
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
                               <div className="py-12 flex flex-col items-center justify-center text-gray-500 animate-pulse">
                                   <div className="w-8 h-8 border-4 border-[rgb(var(--color-accent))] border-t-transparent rounded-full animate-spin mb-4"></div>
                                   <span className="uppercase tracking-widest text-xs">{t('loading')}</span>
                               </div>
                           )}
                       </>
                    )}
                  </div>

                  <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row gap-4 justify-between items-center opacity-70 hover:opacity-100 transition-opacity">
                    <a 
                      href={article.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[rgb(var(--color-accent))] hover:underline text-sm uppercase tracking-widest font-bold"
                    >
                      {t('read.more')} &rarr;
                    </a>
                  </div>
               </div>
            </div>
          )}
          
          {/* Spacer for bottom bar on mobile */}
          <div className="h-20 md:hidden"></div>
        </div>
        
        {/* Mobile Navigation Bar - Hidden in Focus Mode */}
        <div className={`md:hidden absolute bottom-0 left-0 right-0 bg-[#0a0a0c]/90 backdrop-blur border-t border-white/10 p-4 flex justify-between items-center z-40 transition-transform duration-300 ${isFocusMode ? 'translate-y-full' : ''}`}>
            <button 
                onClick={onPrev} 
                disabled={!hasPrev}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-white disabled:opacity-30 text-xs font-bold uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                {t('action.prev')}
            </button>
            <button 
                onClick={onNext} 
                disabled={!hasNext}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgb(var(--color-accent))] text-white disabled:opacity-30 disabled:bg-white/5 text-xs font-bold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg"
            >
                {t('action.next')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
        </div>
      </div>
    </div>
  );
};
