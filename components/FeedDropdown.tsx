import React, { useState } from 'react';
import { FeedCategory, FeedSource } from '../types';

interface FeedDropdownProps {
  category: FeedCategory;
  feeds: FeedSource[];
  onSelectFeed: (feedUrl: string) => void;
  onSelectCategory: (categoryId: string) => void;
  selectedCategory: string;
}

const FeedDropdown: React.FC<FeedDropdownProps> = ({ category, feeds, onSelectFeed, onSelectCategory, selectedCategory }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleCategoryClick = () => {
    onSelectCategory(category.id);
  };

  const handleMouseEnter = () => {
    if (feeds.length > 0) {
      const timeout = setTimeout(() => {
        setIsOpen(true);
      }, 300);
      setHoverTimeout(timeout);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    setIsOpen(false);
  };

  const sortedFeeds = [...feeds].sort((a, b) => {
    const titleA = a.customTitle || a.url;
    const titleB = b.customTitle || b.url;
    return titleA.localeCompare(titleB);
  });

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={handleCategoryClick}
        className={`px-3 py-1.5 text-sm rounded-full transition-colors ${selectedCategory === category.id ? 'bg-[rgb(var(--color-accent))]/20 text-[rgb(var(--color-accent))]' : 'text-gray-400 hover:text-white'}`}
      >
        {category.name}
      </button>
      {isOpen && feeds.length > 0 && (
        <div className="absolute top-full mt-2 w-64 bg-[rgb(var(--color-background))]/95 backdrop-blur-md shadow-lg rounded-lg border border-gray-700/20 z-40">
          <ul className="p-2">
            {sortedFeeds.map((feed) => (
              <li key={feed.url}>
                <button
                  onClick={() => {
                    onSelectFeed(feed.url);
                    setIsOpen(false);
                  }}
                  className="w-full text-left flex items-center p-2 rounded-md hover:bg-[rgb(var(--color-accent))]/10 transition-colors"
                >
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${new URL(feed.url).hostname}&sz=16`}
                    alt=""
                    className="w-4 h-4 mr-2"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                  <span className="text-sm text-[rgb(var(--color-text))] truncate">{feed.customTitle || feed.url}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FeedDropdown;
