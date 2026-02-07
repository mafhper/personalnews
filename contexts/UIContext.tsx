import React, { useState, ReactNode, useCallback } from "react";
import { UIContext } from "./UIContextState";

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isFeedManagerOpen, setIsFeedManagerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const openFeedManager = useCallback(() => setIsFeedManagerOpen(true), []);
  const closeFeedManager = useCallback(() => setIsFeedManagerOpen(false), []);
  const toggleFeedManager = useCallback(
    () => setIsFeedManagerOpen((prev) => !prev),
    [],
  );

  const openSettings = useCallback(() => setIsSettingsOpen(true), []);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);
  const toggleSettings = useCallback(
    () => setIsSettingsOpen((prev) => !prev),
    [],
  );

  const openFavorites = useCallback(() => setIsFavoritesOpen(true), []);
  const closeFavorites = useCallback(() => setIsFavoritesOpen(false), []);
  const toggleFavorites = useCallback(
    () => setIsFavoritesOpen((prev) => !prev),
    [],
  );

  const openShortcuts = useCallback(() => setIsShortcutsOpen(true), []);
  const closeShortcuts = useCallback(() => setIsShortcutsOpen(false), []);
  const toggleShortcuts = useCallback(
    () => setIsShortcutsOpen((prev) => !prev),
    [],
  );

  const closeAllModals = useCallback(() => {
    setIsFeedManagerOpen(false);
    setIsSettingsOpen(false);
    setIsFavoritesOpen(false);
    setIsShortcutsOpen(false);
  }, []);

  const isAnyModalOpen =
    isFeedManagerOpen || isSettingsOpen || isFavoritesOpen || isShortcutsOpen;

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
    isAnyModalOpen,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};
