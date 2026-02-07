/**
 * i18n-sync.cjs
 * Normaliza as traduções para eliminar chaves faltantes/extras e textos vazios.
 * - Garante que todos os locales tenham o mesmo conjunto de chaves (união).
 * - Preenche ausentes com base no pt-BR (ou fallback disponível).
 * - Preenche traduções vazias com fallback.
 */
const fs = require('fs');
const path = require('path');

const { extractTranslations, CONFIG } = require('./i18n-audit.cjs');

const T_FUNCTION_REGEX = /\bt\(['"]([^'"]+)['"]\)/g;

const componentsDir = CONFIG.componentsDir;
const translationsFile = CONFIG.translationsFile;
const baseLocale = CONFIG.baseLocale || 'pt-BR';

function collectUsedKeys(dir) {
  const used = new Set();

  function walk(folder) {
    if (!fs.existsSync(folder)) return;
    for (const entry of fs.readdirSync(folder)) {
      const fullPath = path.join(folder, entry);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (entry !== 'node_modules') walk(fullPath);
        continue;
      }
      if (!entry.endsWith('.tsx') && !entry.endsWith('.jsx') && !entry.endsWith('.ts')) continue;
      const content = fs.readFileSync(fullPath, 'utf8');
      let match;
      while ((match = T_FUNCTION_REGEX.exec(content)) !== null) {
        used.add(match[1]);
      }
    }
  }

  walk(dir);
  return used;
}

function escapeValue(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
}

function main() {
  const translations = extractTranslations();
  const locales = Object.keys(translations);
  if (!locales.includes(baseLocale)) {
    console.error(`[i18n-sync] Locale base não encontrado: ${baseLocale}`);
    process.exit(1);
  }

  const usedKeys = collectUsedKeys(componentsDir);
  const unionKeys = new Set();
  locales.forEach(locale => {
    Object.keys(translations[locale] || {}).forEach(key => {
      if (!key || !String(key).trim()) return;
      unionKeys.add(key);
    });
  });
  usedKeys.forEach(key => {
    if (!key || !String(key).trim()) return;
    unionKeys.add(key);
  });

  const orderedKeys = Array.from(unionKeys).sort((a, b) => a.localeCompare(b));

  // Ensure base values
  const baseMap = translations[baseLocale] || {};
  orderedKeys.forEach((key) => {
    const current = baseMap[key];
    if (current && String(current).trim() !== '') return;
    // find any non-empty value from other locales
    let fallback = '';
    for (const locale of locales) {
      const val = translations[locale]?.[key];
      if (val && String(val).trim() !== '') {
        fallback = val;
        break;
      }
    }
    baseMap[key] = fallback || key;
  });

  const nextTranslations = {};
  locales.forEach((locale) => {
    const map = translations[locale] || {};
    const next = {};
    orderedKeys.forEach((key) => {
      let value = map[key];
      if (!value || String(value).trim() === '') {
        value = locale === baseLocale ? baseMap[key] : baseMap[key];
      }
      next[key] = value;
    });
    nextTranslations[locale] = next;
  });

  const lines = [];
  lines.push("import { Language } from '../types';");
  lines.push('');
  lines.push('export const translations: Record<Language, Record<string, string>> = {');
  locales.forEach((locale, idx) => {
    lines.push(`  '${locale}': {`);
    const map = nextTranslations[locale];
    orderedKeys.forEach((key) => {
      const value = escapeValue(map[key]);
      lines.push(`    '${key}': '${value}',`);
    });
    lines.push('  },');
  });
  lines.push('};');
  lines.push('');

  fs.writeFileSync(translationsFile, lines.join('\n'), 'utf8');
  console.log(`[i18n-sync] Traduções normalizadas. Chaves: ${orderedKeys.length}.`);
}

if (require.main === module) {
  main();
}
