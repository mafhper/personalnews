import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { FeedCategory, FeedSource } from "../types";
import { HeaderIcons } from "./icons";
import { useFeedCategories } from "../hooks/useFeedCategories";
import { useNotificationReplacements } from "../hooks/useNotificationReplacements";
import { useLanguage } from "../contexts/LanguageContext";
import { useAppearance } from "../hooks/useAppearance";

interface FeedDropdownProps {
  category: FeedCategory;
  feeds: FeedSource[];
  onSelectFeed: (feedUrl: string) => void;
  onSelectCategory: () => void;
  selectedCategory: string;
  onEditCategory?: (categoryId: string) => void; // Passed categoryId for specific editing
}

// Layout options for dropdown (duplicated from FeedCategoryManager for now)
const layoutOptions: { value: FeedCategory['layoutMode'] | '', labelKey: string }[] = [
    { value: '', labelKey: 'layout.default' },
    { value: 'bento', labelKey: 'layout.bento' },
    { value: 'brutalist', labelKey: 'layout.brutalist' },
    { value: 'compact', labelKey: 'layout.compact' },
    { value: 'cyberpunk', labelKey: 'layout.cyberpunk' },
    { value: 'focus', labelKey: 'layout.focus' },
    { value: 'gallery', labelKey: 'layout.gallery' },
    { value: 'immersive', labelKey: 'layout.immersive' },
    { value: 'list', labelKey: 'layout.list' },
    { value: 'grid', labelKey: 'layout.grid' },
    { value: 'masonry', labelKey: 'layout.masonry' },
    { value: 'minimal', labelKey: 'layout.minimal' },
    { value: 'modern', labelKey: 'layout.modern' },
    { value: 'newspaper', labelKey: 'layout.newspaper' },
    { value: 'pocketfeeds', labelKey: 'layout.pocketfeeds' },
    { value: 'split', labelKey: 'layout.split' },
    { value: 'terminal', labelKey: 'layout.terminal' },
    { value: 'timeline', labelKey: 'layout.timeline' },
];

const headerOptions: { value: FeedCategory['headerPosition'] | '', label: string }[] = [
    { value: '', label: 'Padrão (Global)' },
    { value: 'static', label: 'Estático' },
    { value: 'sticky', label: 'Fixo (Sticky)' },
    { value: 'floating', label: 'Flutuante' },
    { value: 'hidden', label: 'Oculto' },
];

const getFaviconUrl = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch (e) {
      return '';
    }
};

const getSiteName = (url: string): string => {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace(/^www\./, '');
    } catch (e) {
      return url;
    }
};

const FeedDropdown: React.FC<FeedDropdownProps> = ({
  category,
  feeds,
  onSelectFeed,
  onSelectCategory,
  selectedCategory,
  onEditCategory,
}) => {
  const { updateCategory, deleteCategory } = useFeedCategories();
  const { updateContentConfig } = useAppearance();
  const { confirmDanger, alertSuccess } = useNotificationReplacements();
  const { t } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 16,
        left: rect.left
      });
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handlePin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    updateCategory(category.id, { isPinned: !category.isPinned });
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (await confirmDanger(t('confirm.category_delete') + ` "${category.name}"?`)) {
        deleteCategory(category.id);
        alertSuccess(t('alert.category_deleted_success'));
    }
  };

  const handleLayoutChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateCategory(category.id, { layoutMode: e.target.value as any });
  };

  const handleHeaderPositionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      updateCategory(category.id, { headerPosition: val ? (val as any) : undefined });
  };

  const isSelected = selectedCategory === category.id;

  return (
    <div
      className="relative group"
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={onSelectCategory}
        aria-label={`Select category ${category.name}`}
        aria-expanded={isOpen}
        className={`
          flex items-center space-x-2 px-5 py-2.5 rounded-full transition-all duration-300 ease-out min-h-[44px]
          ${isSelected
            ? "bg-white/10 text-white shadow-[0_0_20px_rgba(var(--color-primary),0.4)] border border-white/20 backdrop-blur-md"
            : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
          }
        `}
      >
        <div
          className={`w-2 h-2 rounded-full transition-all duration-500 ${isSelected ? "shadow-[0_0_10px_currentColor] scale-125" : "opacity-70"}`}
          style={{ backgroundColor: category.color, color: category.color }}
        />
        <span className={`font-medium text-sm tracking-wide transition-all duration-300 ${isSelected ? "text-white" : "text-gray-300 group-hover:text-white"}`}>
          {category.name}
        </span>
        <HeaderIcons.ChevronDown
          size="xs"
          className={`transition-transform duration-500 ease-out ${isOpen ? "rotate-180 text-white" : "text-gray-500 group-hover:text-gray-300"}`}
        />
      </button>

      {isOpen && dropdownPos && createPortal(
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
          className={`
            fixed w-96 z-[9999]
            bg-[#0a0a0c]/95 backdrop-blur-2xl border border-white/10
            rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden
            transition-all duration-200 origin-top-left
            animate-in fade-in slide-in-from-top-2
          `}
        >
          <div className="p-1.5">
            <div className="px-4 py-3 border-b border-white/5 mb-1 flex items-center justify-between bg-white/5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('feeds.tab.feeds')} de {category.name}</span>
              
              <div className="flex items-center space-x-1">
                 {/* Layout Selector */}
                 <div className="relative group/layout">
                    <button onClick={(e) => e.stopPropagation()} className={`p-2 rounded hover:bg-white/10 min-w-[32px] min-h-[32px] ${category.layoutMode ? 'text-[rgb(var(--color-accent))]' : 'text-gray-400'}`} title="Alterar Layout da Categoria" aria-label="Alterar Layout da Categoria">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
                    </button>
                    <select 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        value={category.layoutMode || ''}
                        onChange={handleLayoutChange}
                        onClick={(e) => e.stopPropagation()}
                        title="Alterar Layout da Categoria"
                    >
                        {layoutOptions.map((option) => (
                          <option key={option.labelKey} value={option.value}>
                            {t(option.labelKey)} {(category.layoutMode || '') === option.value ? ' ✓' : ''}
                          </option>
                        ))}
                    </select>
                 </div>

                 {/* Header Position Selector */}
                 <div className="relative group/header">
                    <button onClick={(e) => e.stopPropagation()} className={`p-2 rounded hover:bg-white/10 min-w-[32px] min-h-[32px] ${category.headerPosition ? 'text-[rgb(var(--color-accent))]' : 'text-gray-400'}`} title="Posição do Cabeçalho" aria-label="Posição do Cabeçalho">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                    </button>
                    <select 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        value={category.headerPosition || ''}
                        onChange={handleHeaderPositionChange}
                        onClick={(e) => e.stopPropagation()}
                        title="Posição do Cabeçalho"
                    >
                        {headerOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                    </select>
                 </div>

                 <button onClick={handlePin} className={`p-2 rounded hover:bg-white/10 min-w-[32px] min-h-[32px] ${category.isPinned ? 'text-[rgb(var(--color-accent))]' : 'text-gray-400'}`} title={category.isPinned ? "Desafixar Categoria" : "Fixar Categoria"} aria-label={category.isPinned ? "Desafixar Categoria" : "Fixar Categoria"}>
                    <svg className="w-3.5 h-3.5" fill={category.isPinned ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                 </button>

                 {onEditCategory && (
                    <button onClick={(e) => { e.stopPropagation(); onEditCategory(category.id); setIsOpen(false); }} className="p-2 rounded hover:bg-white/10 text-gray-400 min-w-[32px] min-h-[32px]" title="Editar Categoria" aria-label="Editar Categoria">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                 )}

                 {!category.isDefault && (
                    <button onClick={handleDelete} className="p-2 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 min-w-[32px] min-h-[32px]" title="Excluir Categoria" aria-label="Excluir Categoria">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                 )}
              </div>
            </div>

            <div className="max-h-[80vh] overflow-y-auto custom-scrollbar py-1">
              {feeds.map((feed) => (
                <button
                  key={feed.url}
                  onClick={() => {
                    onSelectFeed(feed.url);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center space-x-3 group min-h-[44px]"
                  aria-label={`Select feed ${feed.customTitle || getSiteName(feed.url)}`}
                >
                  <img 
                    src={getFaviconUrl(feed.url)} 
                    alt="" 
                    className="w-4 h-4 rounded-sm opacity-70 group-hover:opacity-100 transition-opacity"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <span className="truncate flex-1">{feed.customTitle || getSiteName(feed.url)}</span>
                </button>
              ))}

              {feeds.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <div className="text-gray-600 mb-2">
                    <svg className="w-8 h-8 mx-auto opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div className="text-sm text-gray-500">{t('feeds.category.empty')}</div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default FeedDropdown;