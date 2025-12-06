/**
 * backupService.ts
 *
 * Service to handle full application state export and import.
 * Aggregates all localStorage keys used by the application.
 */

export const STORAGE_KEYS = {
  // Core Data
  FEEDS: 'rss-feeds',
  CATEGORIES: 'feed-categories',
  FAVORITES: 'favorites-data',
  READ_STATUS: 'article-read-status',

  // Appearance & Settings
  HEADER: 'appearance-header',
  CONTENT: 'appearance-content',
  BACKGROUND: 'appearance-background',
  ACTIVE_LAYOUT: 'appearance-active-layout',
  LAYOUT_SETTINGS: 'article-layout-settings',
  
  // Theme
  THEME_SETTINGS: 'theme-settings',
  CURRENT_THEME: 'extended-theme-current',
  CUSTOM_THEMES: 'extended-theme-custom',

  // App Level
  TIME_FORMAT: 'time-format',
  // Add any other keys here as needed
};

export interface BackupData {
  version: string;
  timestamp: string;
  data: Record<string, any>;
}

export const createBackup = (): BackupData => {
  const data: Record<string, any> = {};

  Object.values(STORAGE_KEYS).forEach((key) => {
    const item = localStorage.getItem(key);
    if (item) {
      try {
        data[key] = JSON.parse(item);
      } catch (e) {
        console.warn(`Failed to parse key ${key} for backup`, e);
        data[key] = item; // Store raw string if parse fails
      }
    }
  });

  return {
    version: '1.0',
    timestamp: new Date().toISOString(),
    data,
  };
};

export const downloadBackup = (backup: BackupData) => {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `personal-news-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const validateBackup = (data: any): boolean => {
  if (!data || typeof data !== 'object') return false;
  if (!data.version || !data.timestamp || !data.data) return false;
  return true;
};

export const restoreBackup = (backup: BackupData): boolean => {
  if (!validateBackup(backup)) {
    throw new Error('Invalid backup file format');
  }

  try {
    Object.entries(backup.data).forEach(([key, value]) => {
      if (typeof value === 'object') {
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        localStorage.setItem(key, String(value));
      }
    });
    return true;
  } catch (e) {
    console.error('Failed to restore backup', e);
    return false;
  }
};
