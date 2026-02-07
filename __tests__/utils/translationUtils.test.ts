import { describe, it, expect } from 'vitest';
import { getTranslation } from '../../utils/translationUtils';

describe('translationUtils', () => {
  it('returns translation when key exists', () => {
    const value = getTranslation('settings.title', 'pt-BR');
    expect(value).toBe('Configurações');
  });

  it('falls back to key when missing', () => {
    const value = getTranslation('missing.key', 'en-US');
    expect(value).toBe('missing.key');
  });
});
