/**
 * useVisibilityRecovery.ts
 *
 * Hook que detecta quando a aba fica visível novamente e dispara carregamentos
 * pendentes, mesmo que o requestIdleCallback não tenha sido chamado.
 *
 * Problema: Quando o usuário sai da aba e volta, o requestIdleCallback pode nunca
 * ser chamado, deixando a página descarregada.
 *
 * Solução: Usar a Visibility API para garantir que o carregamento comece
 * assim que a aba ficar visível.
 */

import { useEffect, useRef, useCallback, useSyncExternalStore } from "react";

interface VisibilityRecoveryOptions {
  onVisible?: () => void;
  onHidden?: () => void;
  autoStartLoadOnVisible?: boolean;
}

/**
 * Hook que garante que o carregamento ocorra mesmo quando a aba não está visível
 */
export const useVisibilityRecovery = (
  options: VisibilityRecoveryOptions = {},
) => {
  const { onVisible, onHidden } = options;

  const visibilityHandlerRef = useRef<(() => void) | null>(null);
  const hasBeenVisibleRef = useRef(false);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      // Aba ficou oculta
      onHidden?.();
    } else {
      // Aba ficou visível
      hasBeenVisibleRef.current = true;
      onVisible?.();
    }
  }, [onVisible, onHidden]);

  // Setup visibility listener
  useEffect(() => {
    // Verificar se já estava visível ao montar o hook
    if (!document.hidden) {
      hasBeenVisibleRef.current = true;
      onVisible?.();
    }

    visibilityHandlerRef.current = handleVisibilityChange;
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleVisibilityChange, onVisible]);

  // Use useSyncExternalStore to safely expose ref value to render
  const hasBeenVisible = useSyncExternalStore(
    (subscribe) => subscribe,
    () => hasBeenVisibleRef.current,
    () => false
  );

  return {
    isVisible: !document.hidden,
    hasBeenVisible,
  };
};

/**
 * Hook para garantir que o carregamento inicial ocorra mesmo em background
 */
export const useInitialLoadGuard = () => {
  const loadTriggeredRef = useRef(false);
  const forceLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setLoadStarted = useCallback(() => {
    loadTriggeredRef.current = true;
    if (forceLoadTimeoutRef.current) {
      clearTimeout(forceLoadTimeoutRef.current);
    }
  }, []);

  // Se ainda não iniciou o carregamento após 5 segundos, força o carregamento
  // mesmo que ainda não estejamos visíveis
  useEffect(() => {
    if (!loadTriggeredRef.current) {
      forceLoadTimeoutRef.current = setTimeout(() => {
        if (!loadTriggeredRef.current && document.hidden) {
          // A página está em background há 5 segundos e ainda não carregou
          // Dispara um evento personalizado para forçar o carregamento
          window.dispatchEvent(new CustomEvent("force-initial-load"));
        }
      }, 5000);
    }

    return () => {
      if (forceLoadTimeoutRef.current) {
        clearTimeout(forceLoadTimeoutRef.current);
      }
    };
  }, []);

  return {
    setLoadStarted,
    hasLoadStarted: () => loadTriggeredRef.current,
  };
};
