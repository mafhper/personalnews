import React, { useState, useEffect } from "react";
import { SearchBar, SearchFilters } from "./SearchBar";
import { HeaderWeatherWidget } from "./HeaderWeatherWidget";
import { PaginationControls } from "./PaginationControls";
import { Article, FeedCategory, FeedSource } from "../types";
import Logo from "./Logo";
import { HeaderIcons } from "./icons";
import FeedDropdown from "./FeedDropdown";

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

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 border-b ${isScrolled
          ? "bg-[rgba(10,10,12,0.8)] backdrop-blur-md border-[rgba(255,255,255,0.08)] shadow-lg"
          : "bg-transparent border-transparent"
          }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20 transition-all duration-300">
            {/* Logo e título */}
            <div className="flex items-center space-x-4 group">
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] rounded-full opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <Logo 
                    size="md" 
                    isClickable={true} 
                    onClick={props.onGoHome}
                  />
                </div>
              </div>
              <button
                onClick={props.onGoHome}
                className="hidden sm:block text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 hover:to-white transition-all duration-300 whitespace-nowrap"
                title="Ir para a primeira página"
              >
                Personal News
              </button>
            </div>

            {/* Categorias - Desktop */}
            <div className="hidden lg:flex items-center space-x-1 bg-[rgba(255,255,255,0.03)] p-1 rounded-full border border-[rgba(255,255,255,0.05)] backdrop-blur-sm">
              {props.categories
                .filter(category => category.isPinned || (props.categorizedFeeds[category.id] || []).length > 0)
                .map((category) => (
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

            {/* Ações do header */}
            <div className="flex items-center space-x-3">
              <div className="hidden md:block">
                <HeaderWeatherWidget />
              </div>

              <div className="h-6 w-px bg-[rgba(255,255,255,0.1)] mx-2 hidden md:block"></div>



              {/* Paginação */}
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

              {/* Botões de Ação Rápida */}
              <div className="flex items-center space-x-1">
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

                <button
                  onClick={props.onOpenFavorites}
                  className="p-2 text-gray-400 hover:text-[rgb(var(--color-warning))] hover:bg-[rgba(255,255,255,0.1)] rounded-full transition-all duration-200"
                  title="Favoritos"
                >
                  <HeaderIcons.Favorites showBackground={false} size="md" />
                </button>

                <button
                  onClick={props.onOpenSettings}
                  className="p-2 text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.1)] rounded-full transition-all duration-200"
                  title="Configurações"
                >
                  <HeaderIcons.Settings showBackground={false} size="md" />
                </button>
              </div>

              {/* Menu mobile toggle */}
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

      {/* Espaçamento para o header fixo */}
      <div className="h-16 lg:h-20"></div>

      {/* Menu mobile (Drawer) */}
      <div
        className={`fixed inset-0 z-20 lg:hidden transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        ></div>

        {/* Drawer Content */}
        <div
          className={`absolute top-16 left-0 right-0 bg-[rgb(var(--color-surface))] border-b border-[rgba(255,255,255,0.08)] shadow-2xl transform transition-transform duration-300 ${mobileMenuOpen ? "translate-y-0" : "-translate-y-full"
            }`}
        >
          <div className="px-4 py-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Barra de busca */}
            <div className="relative">
              <SearchBar
                articles={props.articles}
                onSearch={props.onSearch}
                onResultsChange={props.onSearchResultsChange}
                placeholder="Buscar artigos..."
                className="w-full"
              />
            </div>

            {/* Categorias Grid */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">Navegação</h3>
              <div className="grid grid-cols-2 gap-3">
                {props.categories
                  .filter(category => category.isPinned || (props.categorizedFeeds[category.id] || []).length > 0)
                  .map((category) => (
                  <button
                    key={category.id}
                    onClick={() => { props.onNavigation(category.id); setMobileMenuOpen(false); }}
                    className={`p-3 rounded-xl flex items-center space-x-3 transition-all duration-200 border ${props.selectedCategory === category.id
                      ? "bg-[rgba(var(--color-primary),0.1)] border-[rgba(var(--color-primary),0.2)] text-[rgb(var(--color-primary))]"
                      : "bg-[rgba(255,255,255,0.03)] border-transparent text-gray-300 hover:bg-[rgba(255,255,255,0.08)] hover:text-white"
                      }`}
                  >
                    <div
                      className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
                      style={{ backgroundColor: category.color, color: category.color }}
                    />
                    <span className="font-medium">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[rgba(255,255,255,0.08)]">
              <button
                onClick={() => { props.onManageFeedsClick(); setMobileMenuOpen(false); }}
                className="flex items-center justify-center space-x-2 p-3 bg-[rgba(139,92,246,0.1)] text-[rgb(var(--color-primary))] rounded-xl font-medium border border-[rgba(139,92,246,0.2)]"
              >
                <HeaderIcons.Feeds showBackground={false} size="sm" />
                <span>Gerenciar Feeds</span>
              </button>

              <button
                onClick={() => { props.onRefreshClick(); setMobileMenuOpen(false); }}
                className="flex items-center justify-center space-x-2 p-3 bg-[rgba(255,255,255,0.05)] text-gray-300 rounded-xl font-medium hover:bg-[rgba(255,255,255,0.1)] hover:text-white transition-colors"
              >
                <HeaderIcons.Refresh showBackground={false} size="sm" />
                <span>Atualizar</span>
              </button>
            </div>

            {/* Paginação Mobile */}
            {props.onPageChange && props.totalPages && props.totalPages > 1 && (
              <div className="pt-2 border-t border-[rgba(255,255,255,0.08)]">
                <div className="flex justify-center">
                  <PaginationControls
                    currentPage={props.currentPage || 0}
                    totalPages={props.totalPages}
                    onPageChange={props.onPageChange}
                    compact={false}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
