import React, { useState, useRef, useEffect } from "react";
import { FeedCategory, FeedSource } from "../types";
import { HeaderIcons } from "./icons";

interface FeedDropdownProps {
  category: FeedCategory;
  feeds: FeedSource[];
  onSelectFeed: (feedUrl: string) => void;
  onSelectCategory: () => void;
  selectedCategory: string;
}

const FeedDropdown: React.FC<FeedDropdownProps> = ({
  category,
  feeds,
  onSelectFeed,
  onSelectCategory,
  selectedCategory,
}) => {
  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch (e) {
      return '';
    }
  };

  const getSiteName = (url: string) => {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace(/^www\./, '');
    } catch (e) {
      return url;
    }
  };

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
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

  const isSelected = selectedCategory === category.id;

  return (
    <div
      className="relative group z-50"
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={onSelectCategory}
        className={`
          flex items-center space-x-2 px-5 py-2.5 rounded-full transition-all duration-300 ease-out
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

      {/* Dropdown Menu */}
      <div
        className={`
          absolute top-full left-0 mt-4 w-96
          bg-[#0a0a0c]/95 backdrop-blur-2xl border border-white/10
          rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden
          transition-all duration-200 origin-top-left
          ${isOpen ? "opacity-100 scale-100 translate-y-0 visible" : "opacity-0 scale-95 -translate-y-4 invisible"}
        `}
      >
        <div className="p-1.5">
          <div className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5 mb-1 flex items-center justify-between">
            <span>Feeds de {category.name}</span>
            <span className="bg-white/5 px-1.5 py-0.5 rounded text-gray-400">{feeds.length}</span>
          </div>

          <div className="max-h-[80vh] overflow-y-auto custom-scrollbar py-1">
            {feeds.map((feed) => (
              <button
                key={feed.url}
                onClick={() => {
                  onSelectFeed(feed.url);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center space-x-3 group"
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
                <div className="text-sm text-gray-500">Nenhum feed disponível</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedDropdown;
