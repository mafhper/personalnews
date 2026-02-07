import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..');

function anyExists(candidates: string[]) {
  return candidates.some(p => fs.existsSync(path.join(repoRoot, p)));
}

describe('Assets presence', () => {
  it('should have main assets in public/', () => {
    const candidates = [
      'public/assets/logo.svg',
      'public/assets/logo.png',
      'public/logo.svg',
      'public/logo.png',
      'public/logo-dark.svg',
      'public/logo-dark.png'
    ];
    expect(anyExists(candidates)).toBe(true);
  });

  it('should have dashboard assets and project logo', () => {
    const dashboardCandidates = [
      'quality-core/dashboard/public/logo.svg',
      'quality-core/dashboard/public/logo.png',
      'quality-core/dashboard/public/logo-dark.svg',
      'quality-core/dashboard/public/logo-dark.png'
    ];
    const projectCandidates = [
      'quality-core/dashboard/public/projects/personal-news/logo.svg',
      'quality-core/dashboard/public/projects/personal-news/logo.png',
      'quality-core/dashboard/public/projects/personal-news/logo-dark.svg',
      'quality-core/dashboard/public/projects/personalnews/logo.svg',
      'quality-core/dashboard/public/projects/personalnews/logo.png',
      'quality-core/dashboard/public/projects/personalnews/logo-dark.svg',
    ];

    expect(anyExists(dashboardCandidates)).toBe(true);
    expect(anyExists(projectCandidates)).toBe(true);
  });

  it('should have build dist assets when dist exists', () => {
    const distDir = path.join(repoRoot, 'dist');
    if (!fs.existsSync(distDir)) return;

    const distCandidates = [
      'dist/logo.svg',
      'dist/logo.png'
    ];
    expect(anyExists(distCandidates)).toBe(true);
  });
});
