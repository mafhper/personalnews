// src/test-setup.ts
import { expect, afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import '@testing-library/jest-dom';
import { DOMParser } from 'xmldom';

// 1. ESTABELECER GLOBAIS ANTES DE QUALQUER COISA
// Prover DOMParser global para o FeedDiscoveryService
if (typeof global.DOMParser === 'undefined') {
  (global as unknown as { DOMParser: typeof DOMParser }).DOMParser = DOMParser;
}

// Mock robusto para localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value?.toString() || '';
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

// Injetar globais dependendo do ambiente
if (typeof window !== 'undefined') {
  // Ambiente JSDOM
  // Forçar o mock em cima do jsdom se necessário
  Object.defineProperty(window, 'localStorage', { 
    value: localStorageMock, 
    writable: true,
    configurable: true 
  });
  
  if (typeof window.matchMedia === 'undefined') {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  }
} else {
  // Ambiente Node puro
  vi.stubGlobal('localStorage', localStorageMock);
}

// Mock observers
if (typeof global.ResizeObserver === 'undefined') {
  vi.stubGlobal('ResizeObserver', vi.fn().mockImplementation(() => ({
    observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn(),
  })));
}

if (typeof global.IntersectionObserver === 'undefined') {
  vi.stubGlobal('IntersectionObserver', vi.fn().mockImplementation(() => ({
    observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn(),
  })));
}

// 2. CONFIGURAÇÕES DO VITEST
expect.extend(matchers);

beforeEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  // Limpar localStorage entre testes para isolamento
  localStorageMock.clear();
});

afterEach(async () => {
  cleanup();
  vi.clearAllMocks();
  vi.clearAllTimers();
});
