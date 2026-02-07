/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
  githubUrl: string;
  setGithubUrl: (url: string) => void;
  saveSettings: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [githubUrl, setGithubUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/config');
        const data = await res.json();
        if (data.githubUrl) {
          setGithubUrl(data.githubUrl);
        }
        setError(null);
      } catch (err) {
        console.error('Failed to load config', err);
        setError('Erro ao carregar configurações');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubUrl })
      });
      if (!res.ok) {
        throw new Error('Failed to save config');
      }
      setError(null);
    } catch (err) {
      console.error('Failed to save config', err);
      setError('Erro ao salvar configurações');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value: SettingsContextType = {
    githubUrl,
    setGithubUrl,
    saveSettings,
    isLoading,
    error,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
