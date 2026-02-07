import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';
import { FeedSource, FeedCategory } from '../../types';

const require = createRequire(import.meta.url);
const UI = require('../cli/ui-helpers.cjs');
const History = require('../cli/history.cjs');
const args = process.argv.slice(2);
const isSilent = args.includes('--silent') || args.includes('-s');
const isQuiet = args.includes('--quiet') || args.includes('-q');
const modeLabel = [
  isSilent ? 'silent' : isQuiet ? 'quiet' : 'default',
].join('-');
const log = UI.createLogger({ tag: 'CONFIG', silent: isSilent, quiet: isQuiet });

/**
 * Script para converter config/initial-setup.md em constantes TypeScript.
 * Agora suporta Configurações Globais, Categorias e Feeds.
 */

const CONFIG_PATH = join(process.cwd(), 'config', 'initial-setup.md');
const OUTPUT_PATH = join(process.cwd(), 'constants', 'curatedFeeds.ts');

const VALID_LAYOUTS = new Set([
  'grid',
  'list',
  'masonry',
  'bento',
  'magazine',
  'newspaper',
  'gallery',
  'compact',
  'minimal',
  'immersive',
  'brutalist',
  'timeline',
  'focus',
  'split',
  'cyberpunk',
  'terminal',
  'pocketfeeds',
  'modern',
  'default',
]);
const VALID_HEADER_POSITIONS = new Set(['static', 'sticky', 'floating', 'hidden']);
const VALID_TIME_FORMATS = new Set(['12h', '24h']);
const VALID_THEMES = new Set([
  'dark-blue',
  'dark-green',
  'dark-purple',
  'light-blue',
  'light-pink',
  'light-cyan',
]);

const normalizeValue = (value: string) => value.trim();
const normalizeId = (value: string) =>
  normalizeValue(value).toLowerCase().replace(/\s+/g, '-');

function sync() {
  const startTime = Date.now();
  let stopTimer = null;
  if (!isSilent) {
    UI.printHeader({
      title: 'QUALITY CORE - CONFIG SYNC',
      modes: ['--silent', '--quiet'],
      active: [
        isSilent ? 'silent' : null,
        isQuiet ? 'quiet' : null,
      ].filter(Boolean),
    });
    const avgHeader = History.getAverageDuration('config-sync', modeLabel);
    stopTimer = UI.printTimingHeader({
      avgLabel: avgHeader,
      modeLabel,
      live: UI.shouldLiveTimer() && !isQuiet,
    });
  }
  if (!isSilent && !isQuiet) {
    UI.printScriptStart('config sync', 1, 1);
  } else if (isQuiet) {
    UI.printQuietStepStart('config sync', 1, 1);
  }
  log.info('Sincronizando configurações completas a partir do Markdown...');

  const content = readFileSync(CONFIG_PATH, 'utf-8');
  const lines = content.split('\n');

  const categories: FeedCategory[] = [{
    id: 'all',
    name: 'All',
    color: '#6B7280',
    order: 0,
    isDefault: true,
    isPinned: true,
    // Add missing optional properties to satisfy type
    description: undefined,
    layoutMode: undefined,
    // headerPosition is now global only - not stored per category
    autoDiscovery: true
  }];
  const feeds: FeedSource[] = [];
  const globalConfig: Record<string, unknown> = {
    theme: 'dark-blue',
    layout: 'bento',
    timeFormat: '24h'
  };
  const seenCategoryIds = new Set<string>(['all']);
  const seenFeedUrls = new Set<string>();

  const curatedLists: Record<string, FeedSource[]> = {};
  let currentCuratedList = '';
  let currentCategoryForCurated = '';

  let currentSection = '';
  let currentCategoryForFeeds = '';
  let buildingCategory: Partial<FeedCategory> | null = null;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (trimmed.startsWith('<!--') || trimmed.startsWith('>')) return;

    // Detectar Seções
    if (trimmed.startsWith('# Configurações Globais') || trimmed.startsWith('## Configurações Globais')) {
      currentSection = 'globals';
      return;
    }
    if (trimmed.startsWith('## Categorias')) {
      currentSection = 'categories';
      return;
    }
    if (trimmed.startsWith('## Feeds Iniciais')) {
      currentSection = 'feeds';
      return;
    }
    if (trimmed.startsWith('# Listas Curadas')) {
      currentSection = 'curated_lists';
      return;
    }

    // Processar Globais
    if (currentSection === 'globals' && trimmed.startsWith('- ')) {
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) return;

      const key = trimmed.substring(2, colonIndex).trim().toLowerCase();
      let value = normalizeValue(trimmed.substring(colonIndex + 1));
      if (value.endsWith(';')) value = value.slice(0, -1).trim();
      const normalizedValue = value.toLowerCase();

      if (key === 'tema padrão') {
        if (VALID_THEMES.has(normalizedValue)) {
          globalConfig.theme = normalizedValue;
        } else {
          log.warn(`Tema inválido em config: "${value}" — mantendo padrão.`);
        }
      }
      if (key === 'layout global') {
        if (VALID_LAYOUTS.has(normalizedValue)) {
          globalConfig.layout = normalizedValue;
        } else {
          log.warn(`Layout global inválido: "${value}" — mantendo padrão.`);
        }
      }
      if (key === 'header global') {
        if (VALID_HEADER_POSITIONS.has(normalizedValue)) {
          globalConfig.header = normalizedValue;
        } else {
          log.warn(`Header global inválido: "${value}" — mantendo padrão.`);
        }
      }
      if (key === 'formato hora') {
        if (VALID_TIME_FORMATS.has(normalizedValue)) {
          globalConfig.timeFormat = normalizedValue;
        } else {
          log.warn(`Formato de hora inválido: "${value}" — mantendo padrão.`);
        }
      }
      if (key === 'cidade padrão') globalConfig.weatherCity = value;
    }

    // Processar Categorias
    if (currentSection === 'categories') {
      if (trimmed === '---') {
        if (buildingCategory && buildingCategory.id && buildingCategory.name) {
          if (!buildingCategory.color) buildingCategory.color = '#3B82F6';
          const id = buildingCategory.id;
          if (seenCategoryIds.has(id)) {
            log.warn(`Categoria duplicada ignorada: "${id}"`);
          } else {
            // Cast to FeedCategory as we ensure essential props
            categories.push(buildingCategory as FeedCategory);
            seenCategoryIds.add(id);
          }
          buildingCategory = null;
        } else {
          buildingCategory = {
            order: categories.length,
            isDefault: true
          };
        }
        return;
      }

      if (buildingCategory && trimmed.startsWith('- ')) {
        const colonIndex = trimmed.indexOf(':');
        if (colonIndex === -1) return;

        const key = trimmed.substring(2, colonIndex).trim().toLowerCase();
        let value = normalizeValue(trimmed.substring(colonIndex + 1));
        // Remove trailing semicolon if present
        if (value.endsWith(';')) value = value.slice(0, -1).trim();

        if (key === 'nome') buildingCategory.name = value;
        if (key === 'id') buildingCategory.id = normalizeId(value);
        if (key === 'cor') buildingCategory.color = value.toUpperCase();
        if (key === 'layout') {
          const layoutValue = value.toLowerCase();
          if (VALID_LAYOUTS.has(layoutValue)) {
            buildingCategory.layoutMode = layoutValue as typeof buildingCategory.layoutMode;
          } else {
            log.warn(`Layout inválido para categoria "${buildingCategory.name || 'unknown'}": "${value}"`);
          }
        }
        // headerPosition is now global only - not stored per category
        if (key === 'pinned') buildingCategory.isPinned = value.toLowerCase() === 'true';
        if (key === 'auto-discovery') buildingCategory.autoDiscovery = value.toLowerCase() === 'true';
        if (key === 'hide-from-all') (buildingCategory as any).hideFromAll = value.toLowerCase() === 'true';
        if (key === 'descrição') buildingCategory.description = value;
      }
    }

    // Processar Feeds
    if (currentSection === 'feeds') {
      if (trimmed.startsWith('### ')) {
        currentCategoryForFeeds = normalizeId(trimmed.replace('### ', ''));
      } else if (trimmed.startsWith('- ') && currentCategoryForFeeds) {
        // Regex adjusted to handle optional angle brackets around URLs and metadata
        const match = trimmed.match(/- ([^:]+): (?:<)?(https?:\/\/[^\s>| ]+)(?:>)?(?:\s*\|\s*(.*))?/);
        if (match) {
          const normalizedUrl = match[2].toLowerCase();
          if (seenFeedUrls.has(normalizedUrl)) {
            log.warn(`Feed duplicado ignorado: ${match[2]}`);
            return;
          }
          const feed: FeedSource = {
            url: match[2],
            categoryId: currentCategoryForFeeds,
            customTitle: match[1]
          };
          seenFeedUrls.add(normalizedUrl);

          const metadata = match[3];
          if (metadata) {
            const metaItems = metadata.split('|').map(i => i.trim());
            metaItems.forEach(item => {
              if (item.includes(':')) {
                const [key, value] = item.split(':').map(i => i.trim().toLowerCase());
                if (key === 'hide-from-all') feed.hideFromAll = value === 'true';
              }
            });
          }
          feeds.push(feed);
          if (!seenCategoryIds.has(currentCategoryForFeeds)) {
            log.warn(`Categoria inexistente para feed: "${currentCategoryForFeeds}" (${match[2]})`);
          }
        }
      }
    }

    // Processar Listas Curadas
    if (currentSection === 'curated_lists') {
      if (trimmed.startsWith('## ')) {
        const listName = trimmed.replace('## ', '').trim();
        // Initialize new list if needed
        if (!curatedLists[listName]) {
          curatedLists[listName] = [];
        }
        currentCuratedList = listName;
      } else if (trimmed.startsWith('### ')) {
        currentCategoryForCurated = normalizeId(trimmed.replace('### ', ''));
      } else if (trimmed.startsWith('- ') && currentCuratedList && currentCategoryForCurated) {
        const match = trimmed.match(/- ([^:]+): (?:<)?(https?:\/\/[^\s>| ]+)(?:>)?(?:\s*\|\s*(.*))?/);
        if (match) {
          const feed: FeedSource = {
            url: match[2],
            categoryId: currentCategoryForCurated,
            customTitle: match[1]
          };

          const metadata = match[3];
          if (metadata) {
            const metaItems = metadata.split('|').map(i => i.trim());
            metaItems.forEach(item => {
              if (item.includes(':')) {
                const [key, value] = item.split(':').map(i => i.trim().toLowerCase());
                if (key === 'hide-from-all') feed.hideFromAll = value === 'true';
              }
            });
          }
          curatedLists[currentCuratedList].push(feed);
          if (!seenCategoryIds.has(currentCategoryForCurated)) {
            log.warn(`Categoria inexistente em lista curada: "${currentCategoryForCurated}" (${match[2]})`);
          }
        }
      }
    }
  });

  const tsContent = `/**
 * ARQUIVO GERADO AUTOMATICAMENTE - NÃO EDITE DIRETAMENTE
 * Edite config/initial-setup.md e rode 'bun run config:sync'
 */

import { FeedSource, FeedCategory } from "../types";

export const INITIAL_APP_CONFIG = ${JSON.stringify(globalConfig, null, 2)};

export const DEFAULT_CATEGORIES: FeedCategory[] = ${JSON.stringify(categories, null, 2)};

export const DEFAULT_FEEDS: FeedSource[] = ${JSON.stringify(feeds, null, 2)};

export const CURATED_LISTS: Record<string, FeedSource[]> = ${JSON.stringify(curatedLists, null, 2)};

// Mantendo suporte para exportações legadas e mapeando para as novas listas
export const CURATED_FEEDS_BR = CURATED_LISTS['Brasil Tech & Ciência'] || DEFAULT_FEEDS;
export const CURATED_FEEDS_INTL = CURATED_LISTS['International Tech & Ciência'] || DEFAULT_FEEDS;
`;

  writeFileSync(OUTPUT_PATH, tsContent);
  log.success('Sincronização concluída! Configurações globais, categorias e feeds atualizados.');

  const duration = Date.now() - startTime;
  History.saveExecutionTime('config-sync', duration, modeLabel);
  const avg = History.getAverageDuration('config-sync', modeLabel);
  if (!isSilent && !isQuiet) {
    UI.printScriptEnd('config sync', duration, avg, true);
  } else if (isQuiet) {
    UI.printQuietStepEnd('config sync', 1, 1, duration, avg, true);
  }
  if (stopTimer) stopTimer();
  if (isSilent || isQuiet) {
    UI.printSummary({
      title: 'CONFIG SYNC',
      status: 'pass',
      duration: (duration / 1000).toFixed(2),
      reportDir: join(process.cwd(), 'constants'),
    });
  }
}

sync();
