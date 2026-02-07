// @vitest-environment node
import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

let i18n: any;

beforeAll(async () => {
  const mod = await import('../scripts/i18n-audit.cjs');
  i18n = mod.default ?? mod;
});

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-audit-'));
}

function writeTempFile(dir: string, name: string, content: string) {
  const full = path.join(dir, name);
  fs.writeFileSync(full, content, 'utf8');
  return full;
}

describe('quality-core i18n audit', () => {
  afterEach(() => {
    // Best-effort cleanup handled per test
  });

  it('checkTranslationParity detects missing/extra/empty keys', () => {
    const translations = {
      'pt-BR': { hello: 'Ola', empty: '' },
      en: { hello: 'Hello', extra: 'Extra' },
    };

    const issues = i18n.checkTranslationParity(translations);
    const types = issues.map((i: { type: string }) => i.type);

    expect(types).toContain('MISSING_KEY');
    expect(types).toContain('EXTRA_KEY');
    expect(types).toContain('EMPTY_TRANSLATION');
  });

  it('scanForHardcodedStrings finds PT/EN hardcoded strings', () => {
    const dir = makeTempDir();
    writeTempFile(
      dir,
      'Sample.tsx',
      "export const X = () => <div>Salvar</div>\nexport const Y = () => <span>Cancel</span>\n"
    );

    const issues = i18n.scanForHardcodedStrings(dir);
    const types = issues.map((i: { type: string }) => i.type);

    expect(types).toContain('HARDCODED_PT');
    expect(types).toContain('HARDCODED_EN');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('scanForUndefinedKeys detects undefined and unused keys', () => {
    const dir = makeTempDir();
    writeTempFile(
      dir,
      'Keys.tsx',
      "const t = (k: string) => k;\nexport const X = () => t('known');\nexport const Y = () => t('missing');\n"
    );

    const translations = {
      'pt-BR': { known: 'Conhecido', unused: 'Nao usado' },
    };

    const issues = i18n.scanForUndefinedKeys(dir, translations);
    const types = issues.map((i: { type: string }) => i.type);

    expect(types).toContain('UNDEFINED_KEY');
    expect(types).toContain('UNUSED_KEY');
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
