import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface UIContextType {
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

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isFeedManagerOpen, setIsFeedManagerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const openFeedManager = useCallback(() => setIsFeedManagerOpen(true), []);
  const closeFeedManager = useCallback(() => setIsFeedManagerOpen(false), []);
  const toggleFeedManager = useCallback(() => setIsFeedManagerOpen(prev => !prev), []);

  const openSettings = useCallback(() => setIsSettingsOpen(true), []);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);
  const toggleSettings = useCallback(() => setIsSettingsOpen(prev => !prev), []);

  const openFavorites = useCallback(() => setIsFavoritesOpen(true), []);
  const closeFavorites = useCallback(() => setIsFavoritesOpen(false), []);
  const toggleFavorites = useCallback(() => setIsFavoritesOpen(prev => !prev), []);

  const openShortcuts = useCallback(() => setIsShortcutsOpen(true), []);
  const closeShortcuts = useCallback(() => setIsShortcutsOpen(false), []);
  const toggleShortcuts = useCallback(() => setIsShortcutsOpen(prev => !prev), []);

  const closeAllModals = useCallback(() => {
    setIsFeedManagerOpen(false);
    setIsSettingsOpen(false);
    setIsFavoritesOpen(false);
    setIsShortcutsOpen(false);
  }, []);

  const isAnyModalOpen = isFeedManagerOpen || isSettingsOpen || isFavoritesOpen || isShortcutsOpen;

  const value = {
    isFeedManagerOpen,
    isSettingsOpen,
    isFavoritesOpen,
    isShortcutsOpen,
    openFeedManager,
    closeFeedManager,
    toggleFeedManager,
    openSettings,
    closeSettings,
    toggleSettings,
    openFavorites,
    closeFavorites,
    toggleFavorites,
    openShortcuts,
    closeShortcuts,
    toggleShortcuts,
    closeAllModals,
    isAnyModalOpen
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
