import React, { useState, useEffect, useRef } from "react";
import { SearchBar, SearchFilters } from "./SearchBar";
import { PaginationControls } from "./PaginationControls";
import { Article, FeedCategory, FeedSource } from "../types";
import Logo from "./Logo";
import { HeaderIcons } from "./icons";
import FeedDropdown from "./FeedDropdown";
import { useAppearance } from "../hooks/useAppearance";
import { useLanguage } from "../contexts/LanguageContext";

interface HeaderProps {
  onManageFeedsClick: () => void;
  onRefreshClick: () => void;
  selectedCategory: string;
  onNavigation: (category: string, feedUrl?: string) => void;
  categorizedFeeds: Record<string, FeedSource[]>;
  onOpenSettings: () => void;
  articles: Article[];
  onSearch: (query: string, filters: SearchFilters) => void;
  onSearchResultsChange?: (results: Article[]) => void;
  onOpenFavorites: () => void;
  categories: FeedCategory[];
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onGoHome?: () => void;
}

const Header: React.FC<HeaderProps> = (props) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { headerConfig } = useAppearance();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const { t } = useLanguage();
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollY = useRef(0);

  // Mobile: Header visibility (logo, icons) - hidden by default, shows on interaction
  // Categories stay always visible for easy navigation
  const [isMobileHeaderVisible, setIsMobileHeaderVisible] = useState(true);
  const mobileHeaderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleActivity = () => {
      setIsMobileHeaderVisible(true);
      if (mobileHeaderTimeoutRef.current) clearTimeout(mobileHeaderTimeoutRef.current);
      mobileHeaderTimeoutRef.current = setTimeout(() => {
        // Only hide if scrolled down
        if (window.scrollY > 100) {
          setIsMobileHeaderVisible(false);
        }
      }, 3000);
    };

    // Show header initially, then hide after delay if scrolled
    const initialTimeout = setTimeout(() => {
      if (window.scrollY > 100) {
        setIsMobileHeaderVisible(false);
      }
    }, 3000);

    window.addEventListener("scroll", handleActivity);
    window.addEventListener("touchmove", handleActivity);
    window.addEventListener("touchstart", handleActivity);
    return () => {
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("touchmove", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      if (mobileHeaderTimeoutRef.current) clearTimeout(mobileHeaderTimeoutRef.current);
      clearTimeout(initialTimeout);
    };
  }, []);


  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 10);
      
      // Hidden mode: show on scroll up, hide on scroll down after delay
      if (headerConfig.position === 'hidden') {
        if (currentScrollY < lastScrollY.current || currentScrollY < 50) {
          // Scrolling up or near top - show header
          setIsHeaderVisible(true);
          if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
          // Auto-hide after 3 seconds of no scrolling
          hideTimeoutRef.current = setTimeout(() => {
            if (window.scrollY > 50) setIsHeaderVisible(false);
          }, 3000);
        } else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
          // Scrolling down past threshold - hide header
          setIsHeaderVisible(false);
        }
        lastScrollY.current = currentScrollY;
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [headerConfig.position]);

  // Update document title and favicon based on headerConfig
  useEffect(() => {
    if (headerConfig.customTitle) {
      document.title = headerConfig.customTitle;
    }
    
    // Update favicon
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (link && headerConfig.logoUrl) {
      if (headerConfig.logoUrl.trim().startsWith('<svg')) {
        // Convert SVG string to data URI
        const svg = headerConfig.logoUrl;
        const encodedSvg = encodeURIComponent(svg);
        link.href = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
      } else {
        link.href = headerConfig.logoUrl;
      }
    }
  }, [headerConfig.customTitle, headerConfig.logoUrl]);

  const headerPositionClasses = {
    static: "relative w-full",
    sticky: "sticky top-0 z-50 w-full",
    floating: "fixed top-2 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl rounded-xl border-[rgba(255,255,255,0.08)] md:top-4 md:rounded-2xl z-50",
    hidden: `fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${isHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}`,
  };

  const headerStyleClasses = {
    default: "justify-between gap-4",
    centered: "justify-between lg:justify-center lg:relative gap-4",
    minimal: "justify-between gap-4",
  };

  const headerHeightClasses = {
    'ultra-compact': 'h-8 lg:h-10', // Minimal height
    tiny: 'h-10 lg:h-12',
    compact: 'h-12 lg:h-14',
    normal: 'h-14 lg:h-16',
    spacious: 'h-16 lg:h-20',
  };

  const isFloating = headerConfig.position === 'floating';
  const isCentered = headerConfig.style === 'centered';
  const isMinimal = headerConfig.style === 'minimal';

  const activeCategories = props.categories.filter(
    category => category.isPinned || (props.categorizedFeeds[category.id] || []).length > 0
  );

  // Dynamic appearance styles  
  const bgOpacity = headerConfig.bgOpacity ?? 0.9;
  const borderOpacity = headerConfig.borderOpacity ?? 8;
  const bgColor = headerConfig.bgColor || headerConfig.backgroundColor || '#0a0a0c';
  const borderColor = headerConfig.borderColor ?? '#ffffff';
  const blurValue = headerConfig.blur ?? 10;
  const blurClass = `backdrop-blur-[${blurValue}px]`;

  // Convert hex to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const headerBgStyle = hexToRgba(bgColor, bgOpacity);
  const headerBorderStyle = hexToRgba(borderColor, borderOpacity / 100);
  
  // Category area styles
  const catBgColor = headerConfig.categoryBackgroundColor ?? '#ffffff';
  const catBgOpacity = headerConfig.categoryBackgroundOpacity ?? 3;
  const categoryBgStyle = hexToRgba(catBgColor, catBgOpacity / 100);

  // Scroll Logic for Categories
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [activeCategories]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      const newScrollLeft = direction === 'left' 
        ? scrollContainerRef.current.scrollLeft - scrollAmount 
        : scrollContainerRef.current.scrollLeft + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const getLogoSizeClasses = (size: 'sm' | 'md' | 'lg' | undefined) => {
    switch (size) {
      case 'sm': return 'w-6 h-6';
      case 'lg': return 'w-12 h-12';
      case 'md':
      default: return 'w-8 h-8';
    }
  };


  // Spacer height for fixed position headers (matches actual header height)
  const spacerHeightClasses = {
    'ultra-compact': 'h-12 lg:h-14',
    tiny: 'h-14 lg:h-16',
    compact: 'h-16 lg:h-18',
    normal: 'h-18 lg:h-20',
    spacious: 'h-20 lg:h-24',
  };

  // Need spacer for fixed position modes (hidden, floating) - sticky doesn't need because it's in flow
  const needsSpacer = headerConfig.position === 'hidden' || headerConfig.position === 'floating';

  return (
    <>
      {/* Spacer for fixed position headers - reserves space for the fixed header */}
      {needsSpacer && (
        <div className={`${spacerHeightClasses[headerConfig.height]}`} />
      )}
      <header
        className={`${headerPositionClasses[headerConfig.position]} z-30 transition-all duration-300 ${blurClass} ${
          isScrolled || isFloating ? 'shadow-lg' : ''
        }
        ${isScrolled && !isFloating ? 'border-b' : ''} 
        `}
        style={{
          backgroundColor: headerBgStyle,
          borderBottomColor: isScrolled && !isFloating ? headerBorderStyle : 'transparent',
        }}
      >
        <div className={`mx-auto px-3 sm:px-4 ${!isFloating ? 'container' : ''} ${isFloating ? 'rounded-xl md:rounded-2xl' : ''} overflow-hidden`}>
          
          {/* MOBILE/TABLET: Categories FIRST - always visible, centered (hidden on md+ screens) */}
          <div className="md:hidden w-full py-2">
            <div className="overflow-x-auto no-scrollbar w-full" style={{ scrollbarWidth: 'none' }}>
              <div className="flex items-center justify-center min-w-full space-x-2">
                {activeCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => props.onNavigation(category.id)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
                      props.selectedCategory === category.id
                        ? "bg-[rgb(var(--color-primary))] text-white border-[rgb(var(--color-primary))] shadow-lg"
                        : "bg-[rgba(255,255,255,0.05)] text-gray-300 border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.1)]"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main header row - on mobile, hidden when scrolled. On desktop, always visible */}
          {/* Auto height when logo and title are both hidden */}
          <div className={`
            flex items-center transition-all duration-300 
            ${(headerConfig.showLogo !== false || headerConfig.showTitle) ? headerHeightClasses[headerConfig.height] : 'h-auto py-2'}
            ${headerStyleClasses[headerConfig.style]}
            ${!isMobileHeaderVisible ? 'hidden md:flex' : 'flex'}
          `}>
            
            {/* Left Section: Logo & Title */}
            <div className={`flex items-center space-x-4 group flex-shrink-0 ${isCentered ? 'lg:absolute lg:left-4' : ''}`}>
              {headerConfig.showLogo !== false && (
              <div 
                  className="relative cursor-pointer" 
                  onClick={props.onGoHome}
              >
                <div className="absolute -inset-2 bg-gradient-to-r from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] rounded-full opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-500"></div>
                <div className="relative z-10">
                  {headerConfig.customLogoSvg ? (
                    <div 
                        key={headerConfig.logoColorMode} // Force re-render on mode change to clear styles
                        className={`
                            ${getLogoSizeClasses(headerConfig.logoSize)}
                            ${headerConfig.logoColorMode === 'theme' ? 'text-[rgb(var(--color-accent))]' : ''}
                            [&>svg]:w-full [&>svg]:h-full
                            ${headerConfig.logoColorMode !== 'original' ? "[&_*:not([fill='none'])]:!fill-current [&_*:not([stroke='none'])]:!stroke-current" : ''}
                        `}
                        style={{ color: headerConfig.logoColorMode === 'custom' ? headerConfig.logoColor : undefined }}
                        dangerouslySetInnerHTML={{ __html: headerConfig.customLogoSvg }}
                    />
                  ) : (
                    <Logo 
                      size={headerConfig.logoSize} 
                      isClickable={true} 
                      onClick={props.onGoHome}
                      customSrc={headerConfig.logoUrl}
                      useThemeColor={headerConfig.useThemeColor}
                    />
                  )}
                </div>
              </div>
              )}
              {headerConfig.showTitle && (
                <h1 
                    className="font-bold tracking-tight cursor-pointer pb-1 text-xl truncate max-w-[150px] md:max-w-none"
                    onClick={props.onGoHome}
                    style={{ color: headerConfig.titleGradient?.enabled ? undefined : (headerConfig.titleColor || 'rgb(var(--color-text))') }}
                >
                  {headerConfig.titleGradient?.enabled ? (
                    <span 
                      className="bg-clip-text text-transparent"
                      style={{
                        backgroundImage: `linear-gradient(${headerConfig.titleGradient.direction || 'to right'}, ${headerConfig.titleGradient.from}, ${headerConfig.titleGradient.to})`,
                      }}
                    >
                      {headerConfig.customTitle || t('app.title')}
                    </span>
                  ) : (
                    <span>{headerConfig.customTitle || t('app.title')}</span>
                  )}
                </h1>
              )}
            </div>

            {/* Center Section: Categories (Desktop) - Centralized between logo and actions */}
            {!isCentered && (
              <div className="hidden md:flex flex-1 items-center justify-center relative group/scroll px-2 overflow-hidden">
                 
                 {/* Left Scroll Button */}
                 <div className={`absolute left-0 z-10 transition-all duration-300 ${canScrollLeft ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none'}`}>
                    <button 
                      onClick={() => scroll('left')}
                      className="p-1.5 rounded-full bg-gray-800/80 backdrop-blur-md text-white hover:bg-[rgb(var(--color-primary))] border border-white/10 shadow-lg transition-all"
                      aria-label="Scroll left"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                 </div>

                 {/* Scroll Container */}
                 <div 
                    ref={scrollContainerRef}
                    onScroll={checkScroll}
                    className={`flex items-center space-x-1 p-1 rounded-full text-xs font-medium transition-all overflow-x-auto no-scrollbar max-w-full scroll-smooth ${!isMinimal ? 'border backdrop-blur-sm' : ''}`}
                    style={{ ...(!isMinimal ? { backgroundColor: categoryBgStyle, borderColor: hexToRgba('#ffffff', 0.05) } : {}), scrollbarWidth: 'none' }}
                 >
                    {activeCategories.map((category) => (
                      <div key={category.id} className="flex-shrink-0">
                          <FeedDropdown
                            category={category}
                            feeds={props.categorizedFeeds[category.id] || []}
                            onSelectFeed={(feedUrl: string) => props.onNavigation(category.id, feedUrl)}
                            onSelectCategory={() => props.onNavigation(category.id)}
                            selectedCategory={props.selectedCategory}
                            onEditCategory={props.onManageFeedsClick}
                          />
                      </div>
                    ))}
                 </div>

                 {/* Right Scroll Button */}
                 <div className={`absolute right-0 z-10 transition-all duration-300 ${canScrollRight ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'}`}>
                    <button 
                      onClick={() => scroll('right')}
                      className="p-1.5 rounded-full bg-gray-800/80 backdrop-blur-md text-white hover:bg-[rgb(var(--color-primary))] border border-white/10 shadow-lg transition-all"
                      aria-label="Scroll right"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                 </div>

              </div>
            )}

            {/* Centered Navigation (if style is centered) */}
            {isCentered && (
               <div 
                 className={`hidden lg:flex items-center space-x-1 p-1 rounded-full transition-all flex-grow justify-center ${!isMinimal ? 'border backdrop-blur-sm' : ''}`} 
                 style={!isMinimal ? { backgroundColor: categoryBgStyle, borderColor: hexToRgba('#ffffff', 0.05) } : {}}
               >
               {activeCategories.map((category) => (
                 <FeedDropdown
                   key={category.id}
                   category={category}
                   feeds={props.categorizedFeeds[category.id] || []}
                   onSelectFeed={(feedUrl: string) => props.onNavigation(category.id, feedUrl)}
                   onSelectCategory={() => props.onNavigation(category.id)}
                   selectedCategory={props.selectedCategory}
                   onEditCategory={props.onManageFeedsClick}
                 />
               ))}
             </div>
            )}

            {/* Right Section: Actions */}
            <div className={`flex items-center justify-end space-x-2 flex-shrink-0 ${isCentered ? 'lg:absolute lg:right-4' : ''}`}>

              {/* Pagination - Always visible on md+ screens */}
              {props.onPageChange && props.totalPages && props.totalPages > 1 && (
                <div className="hidden md:block">
                  <PaginationControls
                    currentPage={props.currentPage || 0}
                    totalPages={props.totalPages}
                    onPageChange={props.onPageChange}
                    compact={true}
                  />
                </div>
              )}

              {/* Desktop Actions */}
              <div className="hidden md:flex items-center space-x-1">
                <button
                  onClick={props.onRefreshClick}
                  className="p-2 text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.1)] rounded-full transition-all duration-200"
                  title={t('header.refresh')}
                >
                  <HeaderIcons.Refresh showBackground={false} size="md" />
                </button>

                <button
                  onClick={props.onOpenFavorites}
                  className="p-2 text-gray-400 hover:text-[rgb(var(--color-accent))] hover:bg-[rgba(255,255,255,0.1)] rounded-full transition-all duration-200"
                  title={t('header.favorites')}
                >
                  <HeaderIcons.Favorites showBackground={false} size="md" />
                </button>

                <button
                  onClick={props.onOpenSettings}
                  className="p-2 text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.1)] rounded-full transition-all duration-200"
                  title="Configurações"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>

                <button
                  onClick={props.onManageFeedsClick}
                  className="p-2 text-gray-400 hover:text-[rgb(var(--color-primary))] hover:bg-[rgba(255,255,255,0.1)] rounded-full transition-all duration-200"
                  title={t('header.manage_feeds')}
                >
                  <HeaderIcons.Feeds showBackground={false} size="md" />
                </button>
              </div>

              {/* Mobile Menu Toggle */}
              <div className="lg:hidden ml-2">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className={`p-2 rounded-lg transition-colors ${mobileMenuOpen
                    ? "bg-[rgba(255,255,255,0.1)] text-white"
                    : "text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.05)]"
                    }`}
                  aria-label="Menu"
                >
                  <HeaderIcons.Menu
                    showBackground={false}
                    size="md"
                    isActive={mobileMenuOpen}
                  />
                </button>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        ></div>

        {/* Drawer Content */}
        <div
          className={`absolute top-0 right-0 bottom-0 w-[80%] max-w-sm bg-[rgb(var(--color-surface))] border-l border-[rgba(255,255,255,0.08)] shadow-2xl transform transition-transform duration-300 ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"
            }`}
        >
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">{t('header.menu')}</h2>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-gray-400 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <div className="p-4 space-y-6 overflow-y-auto flex-1">
                {/* Search */}
                <div className="relative">
                <SearchBar
                    articles={props.articles}
                    onSearch={props.onSearch}
                    onResultsChange={props.onSearchResultsChange}
                    placeholder={t('search.placeholder')}
                    className="w-full"
                />
                </div>

                {/* Actions Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => { props.onManageFeedsClick(); setMobileMenuOpen(false); }}
                        className="flex flex-col items-center justify-center p-4 bg-[rgba(139,92,246,0.1)] text-[rgb(var(--color-primary))] rounded-xl font-medium border border-[rgba(139,92,246,0.2)]"
                    >
                        <HeaderIcons.Feeds showBackground={false} size="md" />
                        <span className="mt-2 text-xs">{t('feeds.tab.feeds')}</span>
                    </button>
                    <button
                        onClick={() => { props.onOpenFavorites(); setMobileMenuOpen(false); }}
                        className="flex flex-col items-center justify-center p-4 bg-[rgba(255,255,255,0.05)] text-gray-300 rounded-xl font-medium hover:bg-[rgba(255,255,255,0.1)]"
                    >
                        <HeaderIcons.Favorites showBackground={false} size="md" />
                        <span className="mt-2 text-xs">{t('header.favorites')}</span>
                    </button>
                    <button
                        onClick={() => { props.onOpenSettings(); setMobileMenuOpen(false); }}
                        className="flex flex-col items-center justify-center p-4 bg-[rgba(255,255,255,0.05)] text-gray-300 rounded-xl font-medium hover:bg-[rgba(255,255,255,0.1)]"
                    >
                        <HeaderIcons.Settings showBackground={false} size="md" />
                        <span className="mt-2 text-xs">{t('settings.title')}</span>
                    </button>
                    <button
                        onClick={() => { props.onRefreshClick(); setMobileMenuOpen(false); }}
                        className="flex flex-col items-center justify-center p-4 bg-[rgba(255,255,255,0.05)] text-gray-300 rounded-xl font-medium hover:bg-[rgba(255,255,255,0.1)]"
                    >
                        <HeaderIcons.Refresh showBackground={false} size="md" />
                        <span className="mt-2 text-xs">{t('action.refresh')}</span>
                    </button>
                </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Helper to update favicon
const FaviconUpdater: React.FC<{ svg: string }> = ({ svg }) => {
  useEffect(() => {
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
    link.type = 'image/svg+xml';
    link.rel = 'icon';
    link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    document.getElementsByTagName('head')[0].appendChild(link);
    
    return () => {
       // Optional: restore default on unmount? Maybe not needed for this persistent setting
    };
  }, [svg]);
  return null;
};

export default Header;