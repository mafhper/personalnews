import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Article } from '../types';
import { getVideoEmbed } from '../utils/videoEmbed';
import { fetchFullContent } from '../services/articleFetcher';
import { useLanguage } from '../contexts/LanguageContext';
import { useModal } from '../contexts/ModalContext';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface ArticleReaderModalProps {
  article: Article;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ReaderPreferences {
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  lineHeight: 'compact' | 'normal' | 'relaxed';
  contentWidth: 'narrow' | 'medium' | 'wide';
  fontFamily: 'serif' | 'sans' | 'mono';
}

const defaultPreferences: ReaderPreferences = {
  fontSize: 'medium',
  lineHeight: 'relaxed',
  contentWidth: 'medium',
  fontFamily: 'serif',
};

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
  const [showPreferences, setShowPreferences] = useState(false);
  const { t } = useLanguage();
  const { setModalOpen } = useModal();
  const contentRef = useRef<HTMLDivElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);
  
  // Persistent reader preferences
  const [preferences, setPreferences] = useLocalStorage<ReaderPreferences>(
    'reader-preferences',
    defaultPreferences
  );

  // Font size classes
  const fontSizeClasses = {
    small: 'text-base leading-relaxed',
    medium: 'text-lg leading-relaxed',
    large: 'text-xl leading-relaxed',
    xlarge: 'text-2xl leading-relaxed',
  };

  // Line height classes
  const lineHeightClasses = {
    compact: 'leading-normal',
    normal: 'leading-relaxed',
    relaxed: 'leading-loose',
  };

  // Content width classes
  const contentWidthClasses = {
    narrow: 'max-w-xl',
    medium: 'max-w-2xl',
    wide: 'max-w-4xl',
  };

  // Font family classes
  const fontFamilyClasses = {
    serif: 'font-serif',
    sans: 'font-sans',
    mono: 'font-mono',
  };

  const updatePreference = useCallback(<K extends keyof ReaderPreferences>(
    key: K,
    value: ReaderPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  }, [setPreferences]);

  useEffect(() => {
    setModalOpen(true);
    
    // Focus management for accessibility
    if (modalContainerRef.current) {
      modalContainerRef.current.focus();
    }

    if (contentRef.current) contentRef.current.scrollTop = 0;

    const loadContent = async () => {
      setFullContent(null); // Clear previous content
      setLoading(true);
      const fetched = await fetchFullContent(article.link);
      if (fetched) {
        setFullContent(fetched);
      }
      setLoading(false);
    };

    loadContent();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showPreferences) {
          setShowPreferences(false);
        } else {
          onClose();
        }
      }
      if (e.key === 'ArrowRight' && hasNext) onNext();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
      if (e.key === 'f') setIsFocusMode(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      setModalOpen(false);
    };
  }, [article.link, onClose, onNext, onPrev, hasNext, hasPrev, setModalOpen, showPreferences]);

  // Process content to improve formatting and handle plain text
  const processContent = (html: string | null | undefined): string => {
    if (!html) return '';
    
    // Check if it's HTML
    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(html);
    
    if (!hasHtmlTags) {
      // Convert plain text to HTML paragraphs
      return html
        .split(/\n\n+/)
        .map(p => `<p class="mb-4">${p.trim()}</p>`)
        .join('')
        .replace(/\n/g, '<br />');
    }
    
    return html;
  };

  const contentHtml = fullContent 
    ? processContent(fullContent)
    : processContent(article.content || article.description);

  return (
    <div 
      ref={modalContainerRef}
      tabIndex={-1}
      className={`fixed inset-0 z-[200] flex items-center justify-center animate-in fade-in duration-300 outline-none ${
        isFocusMode 
          ? 'bg-[rgb(var(--color-background))]' 
          : 'p-0 md:p-8 bg-black md:bg-black/80'
      }`}
    >
      <style>{`
        .article-content {
          font-family: inherit;
          line-height: inherit;
          color: inherit;
        }
        .article-content p { margin-bottom: 1.5em; }
        .article-content h1 { font-size: 2em; font-weight: 700; margin-top: 1.5em; margin-bottom: 0.5em; color: rgb(var(--color-text)); }
        .article-content h2 { font-size: 1.5em; font-weight: 700; margin-top: 1.5em; margin-bottom: 0.5em; color: rgb(var(--color-text)); }
        .article-content h3 { font-size: 1.25em; font-weight: 600; margin-top: 1.25em; margin-bottom: 0.5em; color: rgb(var(--color-text)); }
        .article-content ul, .article-content ol { margin-bottom: 1.5em; padding-left: 1.5em; }
        .article-content ul { list-style-type: disc; }
        .article-content ol { list-style-type: decimal; }
        .article-content li { margin-bottom: 0.5em; }
        .article-content blockquote { 
          border-left: 4px solid rgb(var(--color-accent)); 
          padding-left: 1em; 
          margin-left: 0; 
          margin-right: 0; 
          margin-bottom: 1.5em; 
          font-style: italic;
          background: rgba(var(--color-surface), 0.5);
          padding: 1rem;
          border-radius: 0 0.5rem 0.5rem 0;
        }
        .article-content a { color: rgb(var(--color-accent)); text-decoration: underline; text-underline-offset: 2px; }
        .article-content img { max-width: 100%; height: auto; border-radius: 0.5rem; margin: 1.5em 0; display: block; }
        .article-content pre { background: rgb(var(--color-background)); padding: 1em; border-radius: 0.5rem; overflow-x: auto; margin-bottom: 1.5em; border: 1px solid rgba(var(--color-border), 0.2); }
        .article-content code { background: rgba(var(--color-accent), 0.1); color: rgb(var(--color-accent)); padding: 0.2em 0.4em; border-radius: 0.25em; font-family: monospace; }
        .article-content pre code { background: transparent; color: inherit; padding: 0; }
        .article-content figure { margin: 1.5em 0; }
        .article-content figcaption { text-align: center; font-size: 0.875em; color: rgb(var(--color-textSecondary)); margin-top: 0.5em; }
        .article-content iframe { max-width: 100%; margin: 1.5em 0; }
      `}</style>

      {/* Backdrop - Hidden in focus mode */}
      {!isFocusMode && (
        <div 
          className="absolute inset-0 bg-black/90 backdrop-blur-md hidden md:block"
          onClick={onClose}
        />
      )}

      {/* Modal Content */}
      <div 
        className={`relative flex flex-col overflow-hidden transition-all duration-500 ${
          isFocusMode 
            ? 'w-full h-full bg-[rgb(var(--color-background))]' 
            : 'w-full h-full md:h-[90vh] md:max-w-5xl bg-[rgb(var(--color-surface))] border-none md:border border-[rgb(var(--color-border))]/20 rounded-none md:rounded-2xl shadow-2xl'
        }`}
      >
        
        {/* Top Bar */}
        <div className={`sticky top-0 z-50 flex items-center justify-between px-4 py-3 transition-all duration-300 ${
          isFocusMode 
            ? 'bg-transparent' 
            : 'bg-[rgb(var(--color-surface))]/95 backdrop-blur-xl border-b border-[rgb(var(--color-border))]/20'
        }`}>
          {/* Back Button */}
          <button 
            onClick={onClose} 
            className="flex items-center gap-2 text-[rgb(var(--color-textSecondary))] hover:text-[rgb(var(--color-text))] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium text-sm hidden sm:inline">{t('action.back')}</span>
          </button>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Reading Preferences Button */}
            <button 
              onClick={() => setShowPreferences(!showPreferences)}
              className={`p-2 rounded-lg transition-colors ${
                showPreferences 
                  ? 'bg-[rgb(var(--color-accent))] text-white' 
                  : 'text-[rgb(var(--color-textSecondary))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-surface))]'
              }`}
              title="Preferências de leitura"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </button>

            {/* Focus Mode Button */}
            <button 
              onClick={() => setIsFocusMode(!isFocusMode)}
              className={`p-2 rounded-lg transition-colors ${
                isFocusMode 
                  ? 'bg-[rgb(var(--color-accent))] text-white' 
                  : 'text-[rgb(var(--color-textSecondary))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-surface))]'
              }`}
              title={`${t('action.focus_mode')} (F)`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Reading Preferences Panel */}
        {showPreferences && (
          <div className="absolute top-14 right-4 z-50 w-72 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))]/30 rounded-xl shadow-2xl p-4 animate-in slide-in-from-top-2 duration-200">
            <h3 className="text-sm font-bold text-[rgb(var(--color-text))] mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Preferências de Leitura
            </h3>

            {/* Font Size */}
            <div className="mb-4">
              <label className="text-xs text-[rgb(var(--color-textSecondary))] uppercase tracking-wider mb-2 block">Tamanho da fonte</label>
              <div className="flex gap-1">
                {(['small', 'medium', 'large', 'xlarge'] as const).map(size => (
                  <button
                    key={size}
                    onClick={() => updatePreference('fontSize', size)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      preferences.fontSize === size
                        ? 'bg-[rgb(var(--color-accent))] text-white'
                        : 'bg-[rgb(var(--color-background))] text-[rgb(var(--color-textSecondary))] hover:text-[rgb(var(--color-text))]'
                    }`}
                  >
                    {size === 'small' ? 'P' : size === 'medium' ? 'M' : size === 'large' ? 'G' : 'XG'}
                  </button>
                ))}
              </div>
            </div>

            {/* Line Height */}
            <div className="mb-4">
              <label className="text-xs text-[rgb(var(--color-textSecondary))] uppercase tracking-wider mb-2 block">Espaçamento</label>
              <div className="flex gap-1">
                {(['compact', 'normal', 'relaxed'] as const).map(height => (
                  <button
                    key={height}
                    onClick={() => updatePreference('lineHeight', height)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      preferences.lineHeight === height
                        ? 'bg-[rgb(var(--color-accent))] text-white'
                        : 'bg-[rgb(var(--color-background))] text-[rgb(var(--color-textSecondary))] hover:text-[rgb(var(--color-text))]'
                    }`}
                  >
                    {height === 'compact' ? 'Compacto' : height === 'normal' ? 'Normal' : 'Amplo'}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Width */}
            <div className="mb-4">
              <label className="text-xs text-[rgb(var(--color-textSecondary))] uppercase tracking-wider mb-2 block">Largura do texto</label>
              <div className="flex gap-1">
                {(['narrow', 'medium', 'wide'] as const).map(width => (
                  <button
                    key={width}
                    onClick={() => updatePreference('contentWidth', width)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      preferences.contentWidth === width
                        ? 'bg-[rgb(var(--color-accent))] text-white'
                        : 'bg-[rgb(var(--color-background))] text-[rgb(var(--color-textSecondary))] hover:text-[rgb(var(--color-text))]'
                    }`}
                  >
                    {width === 'narrow' ? 'Estreito' : width === 'medium' ? 'Médio' : 'Largo'}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Family */}
            <div>
              <label className="text-xs text-[rgb(var(--color-textSecondary))] uppercase tracking-wider mb-2 block">Fonte</label>
              <div className="flex gap-1">
                {(['serif', 'sans', 'mono'] as const).map(font => (
                  <button
                    key={font}
                    onClick={() => updatePreference('fontFamily', font)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      font === 'serif' ? 'font-serif' : font === 'sans' ? 'font-sans' : 'font-mono'
                    } ${
                      preferences.fontFamily === font
                        ? 'bg-[rgb(var(--color-accent))] text-white'
                        : 'bg-[rgb(var(--color-background))] text-[rgb(var(--color-textSecondary))] hover:text-[rgb(var(--color-text))]'
                    }`}
                  >
                    {font === 'serif' ? 'Serifa' : font === 'sans' ? 'Sem Serifa' : 'Mono'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Arrows (Desktop, non-focus mode) */}
        {!isFocusMode && (
          <>
            <button 
              onClick={onPrev} 
              disabled={!hasPrev}
              className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-[rgb(var(--color-surface))]/80 hover:bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text))] disabled:opacity-0 transition-all border border-[rgb(var(--color-border))]/20 backdrop-blur-sm shadow-lg"
              title={t('action.prev')}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button 
              onClick={onNext}
              disabled={!hasNext}
              className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-[rgb(var(--color-surface))]/80 hover:bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text))] disabled:opacity-0 transition-all border border-[rgb(var(--color-border))]/20 backdrop-blur-sm shadow-lg"
              title={t('action.next')}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Main Content Area */}
        <div 
          ref={contentRef} 
          className={`flex-1 overflow-y-auto custom-scrollbar scroll-smooth ${
            isFocusMode ? 'bg-[rgb(var(--color-background))]' : 'bg-[rgb(var(--color-surface))]'
          }`}
        >
          {videoEmbed ? (
            /* Cinema Mode (Video) */
            <div className="w-full min-h-full flex flex-col">
              <div className="aspect-video w-full bg-black shrink-0 md:max-h-[70vh] mx-auto">
                <iframe
                  src={videoEmbed}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className={`p-6 md:p-10 ${contentWidthClasses[preferences.contentWidth]} mx-auto w-full`}>
                <h1 className={`text-2xl md:text-3xl font-bold text-[rgb(var(--color-text))] mb-6 ${fontFamilyClasses[preferences.fontFamily]}`}>
                  {article.title}
                </h1>
                <div 
                  className={`
                    prose prose-invert max-w-none text-[rgb(var(--color-textSecondary))]
                    ${fontSizeClasses[preferences.fontSize]}
                    ${lineHeightClasses[preferences.lineHeight]}
                    ${fontFamilyClasses[preferences.fontFamily]}
                    prose-headings:text-[rgb(var(--color-text))]
                    prose-p:mb-6
                    prose-a:text-[rgb(var(--color-accent))]
                    prose-strong:text-[rgb(var(--color-text))]
                    prose-blockquote:border-[rgb(var(--color-accent))]
                    prose-blockquote:bg-[rgb(var(--color-background))]/50
                    prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-lg
                    prose-code:text-[rgb(var(--color-accent))]
                    prose-pre:bg-[rgb(var(--color-background))]
                    prose-img:rounded-xl prose-img:shadow-lg
                  `}
                  dangerouslySetInnerHTML={{ __html: contentHtml }}
                />
              </div>
            </div>
          ) : (
            /* Standard Article Layout */
            <div className="flex flex-col min-h-full">
              {/* Hero Image - Hidden in Focus Mode */}
              {article.imageUrl && !isFocusMode && (
                <div className="w-full h-[35vh] md:h-[45vh] relative shrink-0">
                  <img 
                    src={article.imageUrl} 
                    className="w-full h-full object-cover" 
                    alt={article.title} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--color-surface))] via-[rgb(var(--color-surface))]/30 to-transparent" />
                </div>
              )}

              {/* Article Body */}
              <div className={`
                relative px-6 py-8 md:px-12 md:py-12 
                ${contentWidthClasses[preferences.contentWidth]} 
                mx-auto w-full transition-all 
                ${isFocusMode ? 'pt-8' : article.imageUrl ? '-mt-24 md:-mt-32' : ''}
              `}>
                {/* Meta - Hidden in Focus Mode */}
                {!isFocusMode && (
                  <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm tracking-wider uppercase text-[rgb(var(--color-accent))] mb-4 md:mb-6 animate-in slide-in-from-bottom-4 duration-500 min-w-0">
                    <span className="font-bold bg-[rgb(var(--color-background))]/80 backdrop-blur px-3 py-1.5 rounded-lg border border-[rgb(var(--color-border))]/20 truncate max-w-[200px] sm:max-w-[300px]">
                      {article.sourceTitle}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--color-textSecondary))]" />
                    <span className="text-[rgb(var(--color-textSecondary))]">
                      {new Date(article.pubDate).toLocaleDateString('pt-BR', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                )}

                {/* Title */}
                <h1 className={`
                  text-2xl md:text-4xl lg:text-5xl font-bold text-[rgb(var(--color-text))] mb-8 
                  leading-tight animate-in slide-in-from-bottom-4 duration-500 delay-100
                  ${fontFamilyClasses[preferences.fontFamily]}
                `}>
                  {article.title}
                </h1>

                {/* Content */}
                <article 
                  className={`
                    prose prose-invert max-w-none
                    ${fontSizeClasses[preferences.fontSize]}
                    ${lineHeightClasses[preferences.lineHeight]}
                    ${fontFamilyClasses[preferences.fontFamily]}
                    text-[rgb(var(--color-textSecondary))]
                    
                    /* Headings */
                    prose-headings:text-[rgb(var(--color-text))]
                    prose-headings:font-bold
                    prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                    prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                    
                    /* Paragraphs */
                    prose-p:mb-6
                    prose-p:text-[rgb(var(--color-textSecondary))]
                    
                    /* Links */
                    prose-a:text-[rgb(var(--color-accent))]
                    prose-a:no-underline
                    prose-a:border-b prose-a:border-[rgb(var(--color-accent))]/30
                    hover:prose-a:border-[rgb(var(--color-accent))]
                    
                    /* Strong/Bold */
                    prose-strong:text-[rgb(var(--color-text))]
                    prose-strong:font-semibold
                    
                    /* Blockquotes */
                    prose-blockquote:border-l-4
                    prose-blockquote:border-[rgb(var(--color-accent))]
                    prose-blockquote:bg-[rgb(var(--color-background))]/50
                    prose-blockquote:py-4 prose-blockquote:px-6
                    prose-blockquote:rounded-r-xl
                    prose-blockquote:italic
                    prose-blockquote:my-8
                    prose-blockquote:not-italic
                    prose-blockquote:text-[rgb(var(--color-text))]
                    
                    /* Code */
                    prose-code:text-[rgb(var(--color-accent))]
                    prose-code:bg-[rgb(var(--color-background))]
                    prose-code:px-2 prose-code:py-0.5
                    prose-code:rounded
                    prose-code:before:content-none prose-code:after:content-none
                    
                    /* Pre/Code blocks */
                    prose-pre:bg-[rgb(var(--color-background))]
                    prose-pre:border prose-pre:border-[rgb(var(--color-border))]/20
                    prose-pre:rounded-xl
                    prose-pre:my-8
                    
                    /* Images */
                    prose-img:rounded-xl 
                    prose-img:shadow-xl
                    prose-img:my-8
                    
                    /* Lists */
                    prose-ul:my-6
                    prose-ol:my-6
                    prose-li:my-2
                    prose-li:text-[rgb(var(--color-textSecondary))]
                    marker:prose-ul:text-[rgb(var(--color-accent))]
                    marker:prose-ol:text-[rgb(var(--color-accent))]
                    
                    /* Horizontal Rule */
                    prose-hr:border-[rgb(var(--color-border))]
                    prose-hr:my-10
                    
                    /* Figure */
                    prose-figure:my-8
                    prose-figcaption:text-center
                    prose-figcaption:text-[rgb(var(--color-textSecondary))]
                    prose-figcaption:text-sm
                  `}
                >
                  {loading ? (
                    <div className="py-16 flex flex-col items-center justify-center text-[rgb(var(--color-textSecondary))] animate-pulse">
                      <div className="w-10 h-10 border-4 border-[rgb(var(--color-accent))] border-t-transparent rounded-full animate-spin mb-4" />
                      <span className="uppercase tracking-widest text-xs">{t('loading')}</span>
                    </div>
                  ) : (
                    <div 
                      dangerouslySetInnerHTML={{ __html: contentHtml }} 
                      className="article-content animate-in fade-in duration-500" 
                    />
                  )}
                </article>

                {/* Footer */}
                <div className="mt-12 pt-8 border-t border-[rgb(var(--color-border))]/20 flex flex-col sm:flex-row gap-4 justify-between items-center">
                  <a 
                    href={article.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[rgb(var(--color-accent))] hover:underline text-sm uppercase tracking-widest font-bold transition-colors"
                  >
                    {t('read.more')}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          )}
          
          {/* Bottom spacer for mobile nav */}
          <div className="h-20 md:hidden" />
        </div>
        
        {/* Mobile Navigation Bar - Hidden in Focus Mode */}
        <div className={`
          md:hidden fixed bottom-0 left-0 right-0 
          bg-[rgb(var(--color-surface))]/95 backdrop-blur-xl 
          border-t border-[rgb(var(--color-border))]/20 
          p-4 flex justify-between items-center z-40 
          transition-transform duration-300 
          ${isFocusMode ? 'translate-y-full' : ''}
        `}>
          <button 
            onClick={onPrev} 
            disabled={!hasPrev}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] disabled:opacity-30 text-xs font-bold uppercase tracking-widest hover:bg-[rgb(var(--color-background))]/80 active:scale-95 transition-all border border-[rgb(var(--color-border))]/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('action.prev')}
          </button>
          <button 
            onClick={onNext} 
            disabled={!hasNext}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgb(var(--color-accent))] text-white disabled:opacity-30 disabled:bg-[rgb(var(--color-background))] text-xs font-bold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg"
          >
            {t('action.next')}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
