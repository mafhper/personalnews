import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Script para converter config/initial-setup.md em constantes TypeScript.
 * Agora suporta Configurações Globais, Categorias e Feeds.
 */

const CONFIG_PATH = join(process.cwd(), 'config', 'initial-setup.md');
const OUTPUT_PATH = join(process.cwd(), 'constants', 'curatedFeeds.ts');

function sync() {
  console.log('🔄 Sincronizando configurações completas a partir do Markdown...');

  const content = readFileSync(CONFIG_PATH, 'utf-8');
  const lines = content.split('\n');

  const categories: any[] = [{
    id: 'all',
    name: 'All',
    color: '#6B7280',
    order: 0,
    isDefault: true,
    isPinned: true
  }];
  const feeds: any[] = [];
  const globalConfig: any = {
    theme: 'dark-blue',
    layout: 'bento',
    timeFormat: '24h'
  };

  const curatedLists: Record<string, any[]> = {};
  let currentCuratedList = '';
  let currentCategoryForCurated = '';

  let currentSection = '';
  let currentCategoryForFeeds = '';
  let buildingCategory: any = null;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

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
      let value = trimmed.substring(colonIndex + 1).trim();
      if (value.endsWith(';')) value = value.slice(0, -1).trim();

      if (key === 'tema padrão') globalConfig.theme = value;
      if (key === 'layout global') globalConfig.layout = value;
      if (key === 'header global') globalConfig.header = value;
      if (key === 'formato hora') globalConfig.timeFormat = value;
      if (key === 'cidade padrão') globalConfig.weatherCity = value;
    }

    // Processar Categorias
    if (currentSection === 'categories') {
      if (trimmed === '---') {
        if (buildingCategory && buildingCategory.id) {
          if (!buildingCategory.color) buildingCategory.color = '#3B82F6';
          categories.push(buildingCategory);
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
        let value = trimmed.substring(colonIndex + 1).trim();
        // Remove trailing semicolon if present
        if (value.endsWith(';')) value = value.slice(0, -1).trim();

        if (key === 'nome') buildingCategory.name = value;
        if (key === 'id') buildingCategory.id = value;
        if (key === 'cor') buildingCategory.color = value.toUpperCase();
        if (key === 'layout') buildingCategory.layoutMode = value;
        if (key === 'header') buildingCategory.headerPosition = value;
        if (key === 'pinned') buildingCategory.isPinned = value.toLowerCase() === 'true';
        if (key === 'auto-discovery') buildingCategory.autoDiscovery = value.toLowerCase() === 'true';
        if (key === 'hide-from-all') buildingCategory.hideFromAll = value.toLowerCase() === 'true';
        if (key === 'descrição') buildingCategory.description = value;
      }
    }

    // Processar Feeds
    if (currentSection === 'feeds') {
      if (trimmed.startsWith('### ')) {
        currentCategoryForFeeds = trimmed.replace('### ', '').toLowerCase();
      } else if (trimmed.startsWith('- ') && currentCategoryForFeeds) {
        // Regex adjusted to handle optional angle brackets around URLs and metadata
        const match = trimmed.match(/- ([^:]+): (?:<)?(https?:\/\/[^\s>| ]+)(?:>)?(?:\s*\|\s*(.*))?/);
        if (match) {
          const feed: any = {
            url: match[2],
            categoryId: currentCategoryForFeeds,
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
          feeds.push(feed);
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
        currentCategoryForCurated = trimmed.replace('### ', '').toLowerCase();
      } else if (trimmed.startsWith('- ') && currentCuratedList && currentCategoryForCurated) {
        const match = trimmed.match(/- ([^:]+): (?:<)?(https?:\/\/[^\s>| ]+)(?:>)?(?:\s*\|\s*(.*))?/);
        if (match) {
          const feed: any = {
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
  console.log('✅ Sincronização concluída! Configurações globais, categorias e feeds atualizados.');
}

sync();
