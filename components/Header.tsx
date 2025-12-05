import React, { useState, useEffect } from "react";
import { SearchBar, SearchFilters } from "./SearchBar";
import { PaginationControls } from "./PaginationControls";
import { Article, FeedCategory, FeedSource } from "../types";
import Logo from "./Logo";
import { HeaderIcons } from "./icons";
import FeedDropdown from "./FeedDropdown";
import { useAppearance } from "../hooks/useAppearance";

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

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    static: "relative",
    sticky: "sticky top-0 z-50",
    floating: "fixed top-2 left-2 right-2 rounded-xl border-[rgba(255,255,255,0.08)] md:top-4 md:left-4 md:right-4 md:rounded-2xl md:max-w-7xl md:mx-auto z-50",
  };

  const headerStyleClasses = {
    default: "justify-between",
    centered: "justify-between lg:justify-center lg:relative",
    minimal: "justify-between",
  };

  const headerHeightClasses = {
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
  const blurMap = {
    none: 'backdrop-blur-none',
    light: 'backdrop-blur-sm',
    medium: 'backdrop-blur-md',
    heavy: 'backdrop-blur-xl',
  };
  
  const bgOpacity = headerConfig.backgroundOpacity ?? 95;
  const borderOpacity = headerConfig.borderOpacity ?? 8;
  const bgColor = headerConfig.backgroundColor ?? '#0a0a0c';
  const borderColor = headerConfig.borderColor ?? '#ffffff';
  const blurClass = blurMap[headerConfig.blurIntensity ?? 'medium'];

  // Convert hex to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const headerBgStyle = hexToRgba(bgColor, bgOpacity / 100);
  const headerBorderStyle = hexToRgba(borderColor, borderOpacity / 100);
  
  // Category area styles
  const catBgColor = headerConfig.categoryBackgroundColor ?? '#ffffff';
  const catBgOpacity = headerConfig.categoryBackgroundOpacity ?? 3;
  const categoryBgStyle = hexToRgba(catBgColor, catBgOpacity / 100);

  return (
    <>
      <header
        className={`${headerPositionClasses[headerConfig.position]} z-30 transition-all duration-300 border-b ${blurClass} ${
          isScrolled || isFloating ? 'shadow-lg' : ''
        }`}
        style={{
          backgroundColor: headerBgStyle,
          borderBottomColor: isScrolled || isFloating ? headerBorderStyle : 'transparent',
        }}
      >
        <div className={`container mx-auto px-4 sm:px-6 lg:px-8 ${isFloating ? 'rounded-xl md:rounded-2xl' : ''}`}>
          <div className={`flex items-center ${headerHeightClasses[headerConfig.height]} transition-all duration-300 ${headerStyleClasses[headerConfig.style]}`}>
            
            {/* Left Section: Logo & Title */}
            <div className={`flex items-center space-x-4 group flex-shrink-0 ${isCentered ? 'lg:absolute lg:left-4' : ''}`}>
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] rounded-full opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <Logo 
                    size={headerConfig.logoSize} 
                    isClickable={true} 
                    onClick={props.onGoHome}
                    customSrc={headerConfig.logoUrl}
                    useThemeColor={headerConfig.useThemeColor}
                  />
                </div>
              </div>
              {headerConfig.showTitle && (
                <button
                  onClick={props.onGoHome}
                  className="hidden sm:block text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 hover:to-white transition-all duration-300 whitespace-nowrap"
                >
                  {headerConfig.customTitle}
                </button>
              )}
            </div>

            {/* Center Section: Categories (Desktop) */}
            {!isCentered && (
              <div className="hidden lg:flex items-center space-x-1 flex-1 justify-center max-w-2xl mx-auto px-4">
                 <div 
                    className={`flex items-center space-x-1 p-1 rounded-full text-xs font-medium transition-all ${!isMinimal ? 'border backdrop-blur-sm' : ''}`}
                    style={!isMinimal ? { backgroundColor: categoryBgStyle, borderColor: hexToRgba('#ffffff', 0.05) } : {}}
                 >
                    {activeCategories.slice(0, 6).map((category) => (
                      <FeedDropdown
                        key={category.id}
                        category={category}
                        feeds={props.categorizedFeeds[category.id] || []}
                        onSelectFeed={(feedUrl) => props.onNavigation(category.id, feedUrl)}
                        onSelectCategory={() => props.onNavigation(category.id)}
                        selectedCategory={props.selectedCategory}
                      />
                    ))}
                    {activeCategories.length > 6 && (
                        <button className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors">
                            More...
                        </button>
                    )}
                 </div>
              </div>
            )}

            {/* Centered Navigation (if style is centered) */}
            {isCentered && (
               <div 
                 className={`hidden lg:flex items-center space-x-1 p-1 rounded-full transition-all mx-40 ${!isMinimal ? 'border backdrop-blur-sm' : ''}`} 
                 style={!isMinimal ? { backgroundColor: categoryBgStyle, borderColor: hexToRgba('#ffffff', 0.05) } : {}}
               >
               {activeCategories.map((category) => (
                 <FeedDropdown
                   key={category.id}
                   category={category}
                   feeds={props.categorizedFeeds[category.id] || []}
                   onSelectFeed={(feedUrl) => props.onNavigation(category.id, feedUrl)}
                   onSelectCategory={() => props.onNavigation(category.id)}
                   selectedCategory={props.selectedCategory}
                 />
               ))}
             </div>
            )}

            {/* Right Section: Actions */}
            <div className={`flex items-center justify-end space-x-2 flex-shrink-0 ${isCentered ? 'lg:absolute lg:right-4' : ''}`}>

              {/* Pagination - Hide on smaller screens */}
              {props.onPageChange && props.totalPages && props.totalPages > 1 && (
                <div className="hidden 2xl:block">
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
                  onClick={props.onManageFeedsClick}
                  className="p-2 text-gray-400 hover:text-[rgb(var(--color-primary))] hover:bg-[rgba(255,255,255,0.1)] rounded-full transition-all duration-200"
                  title="Gerenciar Feeds"
                >
                  <HeaderIcons.Feeds showBackground={false} size="md" />
                </button>

                <button
                  onClick={props.onRefreshClick}
                  className="p-2 text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.1)] rounded-full transition-all duration-200"
                  title="Atualizar feeds"
                >
                  <HeaderIcons.Refresh showBackground={false} size="md" />
                </button>

                <div className="relative">
                    <button
                        onClick={() => setShowMoreMenu(!showMoreMenu)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.1)] rounded-full transition-all duration-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                    </button>
                    
                    {/* More Menu Dropdown */}
                    {showMoreMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                            <button
                                onClick={() => { props.onOpenFavorites(); setShowMoreMenu(false); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center space-x-2"
                            >
                                <HeaderIcons.Favorites showBackground={false} size="sm" />
                                <span>Favoritos</span>
                            </button>
                            <button
                                onClick={() => { props.onOpenSettings(); setShowMoreMenu(false); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center space-x-2"
                            >
                                <HeaderIcons.Settings showBackground={false} size="sm" />
                                <span>Configurações</span>
                            </button>
                        </div>
                    )}
                </div>
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

      {/* Mobile Categories Strip - Sticky below header */}
      <div className={`lg:hidden fixed left-0 right-0 z-20 transition-all duration-300 ${blurClass} border-b ${isFloating ? 'top-[72px]' : 'top-16'}`} style={{ backgroundColor: headerBgStyle, borderBottomColor: headerBorderStyle }}>
        <div className="overflow-x-auto py-2 px-4 flex items-center space-x-3 no-scrollbar mask-linear-fade">
            {activeCategories.map((category) => (
            <button
                key={category.id}
                onClick={() => props.onNavigation(category.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
                props.selectedCategory === category.id
                    ? "bg-[rgb(var(--color-primary))] text-white border-[rgb(var(--color-primary))]"
                    : "bg-[rgba(255,255,255,0.05)] text-gray-300 border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.1)]"
                }`}
            >
                {category.name}
            </button>
            ))}
        </div>
      </div>

      {/* Spacing for fixed header + secondary bar + mobile strip */}
      {!isFloating && <div className="h-28 lg:h-24"></div>}
      {isFloating && <div className="h-32 lg:h-32"></div>}

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
                <h2 className="text-lg font-bold text-white">Menu</h2>
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
                    placeholder="Buscar artigos..."
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
                        <span className="mt-2 text-xs">Feeds</span>
                    </button>
                    <button
                        onClick={() => { props.onOpenFavorites(); setMobileMenuOpen(false); }}
                        className="flex flex-col items-center justify-center p-4 bg-[rgba(255,255,255,0.05)] text-gray-300 rounded-xl font-medium hover:bg-[rgba(255,255,255,0.1)]"
                    >
                        <HeaderIcons.Favorites showBackground={false} size="md" />
                        <span className="mt-2 text-xs">Favoritos</span>
                    </button>
                    <button
                        onClick={() => { props.onOpenSettings(); setMobileMenuOpen(false); }}
                        className="flex flex-col items-center justify-center p-4 bg-[rgba(255,255,255,0.05)] text-gray-300 rounded-xl font-medium hover:bg-[rgba(255,255,255,0.1)]"
                    >
                        <HeaderIcons.Settings showBackground={false} size="md" />
                        <span className="mt-2 text-xs">Configurações</span>
                    </button>
                    <button
                        onClick={() => { props.onRefreshClick(); setMobileMenuOpen(false); }}
                        className="flex flex-col items-center justify-center p-4 bg-[rgba(255,255,255,0.05)] text-gray-300 rounded-xl font-medium hover:bg-[rgba(255,255,255,0.1)]"
                    >
                        <HeaderIcons.Refresh showBackground={false} size="md" />
                        <span className="mt-2 text-xs">Atualizar</span>
                    </button>
                </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
