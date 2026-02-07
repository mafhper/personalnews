import { createContext } from 'react';

export interface UIContextType {
  // Modal states
  isFeedManagerOpen: boolean;
  isSettingsOpen: boolean;
  isFavoritesOpen: boolean;
  isShortcutsOpen: boolean;
  
  // Actions
  openFeedManager: () => void;
  closeFeedManager: () => void;
  toggleFeedManager: () => void;
  
  openSettings: () => void;
  closeSettings: () => void;
  toggleSettings: () => void;
  
  openFavorites: () => void;
  closeFavorites: () => void;
  toggleFavorites: () => void;
  
  openShortcuts: () => void;
  closeShortcuts: () => void;
  toggleShortcuts: () => void;

  // Global close (useful for escape key)
  closeAllModals: () => void;
  isAnyModalOpen: boolean;
}

export const UIContext = createContext<UIContextType | undefined>(undefined);
