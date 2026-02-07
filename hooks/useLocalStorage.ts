/**
 * useLocalStorage Hook
 * 
 * Armazena dados no localStorage do navegador.
 * 
 * NOTA DE SEGURANÇA:
 * - Este hook armazena dados em texto plano no localStorage
 * - Para um agregador de notícias pessoal, isso é geralmente aceitável
 * - Se você precisar armazenar dados sensíveis (senhas, tokens, etc.),
 *   considere usar criptografia ou uma solução mais segura
 * - Dados no localStorage são acessíveis por qualquer script na mesma origem
 * 
 * Dados armazenados:
 * - Feeds RSS (não sensíveis)
 * - Configurações de aparência (não sensíveis)
 * - Favoritos (não sensíveis)
 * - Histórico de busca (não sensíveis)
 */

import { useState, useEffect } from 'react';

function getStorageValue<T,>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  const saved = window.localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse from localStorage", e);
      return defaultValue;
    }
  }
  return defaultValue;
}

export function useLocalStorage<T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    return getStorageValue(key, initialValue);
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      // Dispatch a custom event to notify other components of the change
      window.dispatchEvent(new CustomEvent('localStorage-change', {
        detail: { key, value }
      }));
    } catch (e) {
      console.error(`Failed to set item in localStorage for key "${key}"`, e);
    }
  }, [key, value]);

  // Listen for localStorage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = JSON.parse(e.newValue);
          setValue(newValue);
        } catch (error) {
          console.error('Failed to parse localStorage change:', error);
        }
      }
    };

    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail.key === key) {
        setValue(e.detail.value);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorage-change', handleCustomStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorage-change', handleCustomStorageChange as EventListener);
    };
  }, [key]);

  return [value, setValue];
}
