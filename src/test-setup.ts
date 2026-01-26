import { expect, afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import '@testing-library/jest-dom';

// Estende o expect do Vitest com os matchers do jest-dom
expect.extend(matchers);

// Configuração global para determinismo e isolamento
beforeEach(() => {
  // Restaurar mocks para o estado original
  vi.restoreAllMocks();
  
  // Garantir timers reais por padrão para evitar timeouts em testes assíncronos
  vi.useRealTimers();
});

// Limpeza após cada teste
afterEach(async () => {
  // Limpar DOM para evitar vazamento de estado
  cleanup();
  
  // Limpeza de segurança
  vi.clearAllMocks();
  vi.clearAllTimers();
  vi.useRealTimers();
});

// Mock bÃ¡sico para localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock bÃ¡sico para matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
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

// Mock bÃ¡sico para ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock bÃ¡sico para IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
