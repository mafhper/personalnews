import { describe, expect, it } from 'vitest';
import { buildProductionCsp, shouldInjectProductionCsp } from '../vite.config';

describe('vite production CSP', () => {
  it('injects CSP for published web builds with explicit frame sources', () => {
    expect(shouldInjectProductionCsp({ command: 'build', isTauri: false })).toBe(true);

    const csp = buildProductionCsp({ isTauri: false });
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://player.twitch.tv");
  });

  it('skips the web CSP for tauri builds', () => {
    expect(shouldInjectProductionCsp({ command: 'build', isTauri: true })).toBe(false);
    expect(buildProductionCsp({ isTauri: true })).toBeNull();
  });
});
