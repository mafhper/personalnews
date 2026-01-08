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

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Detectar Seções
    if (trimmed.startsWith('## Configurações Globais')) {
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
      if (trimmed.includes('Tema Padrão:')) globalConfig.theme = trimmed.split(':')[1].trim();
      if (trimmed.includes('Layout Global:')) globalConfig.layout = trimmed.split(':')[1].trim();
      if (trimmed.includes('Formato Hora:')) globalConfig.timeFormat = trimmed.split(':')[1].trim();
      if (trimmed.includes('Cidade Padrão:')) globalConfig.weatherCity = trimmed.split(':')[1].trim();
    }

    // Processar Categorias
    if (currentSection === 'categories' && trimmed.startsWith('- [')) {
      const idMatch = trimmed.match(/- \[([^\]]+)\]/);
      if (!idMatch) return;

      const id = idMatch[1];
      // Rest of parsing logic remains similar but ensures no emojis are accidentally captured
      const mainContent = trimmed.split(']')[1];
      const [metaPart, ...descParts] = mainContent.split(' - ');
      const description = descParts.join(' - ').trim();
      const metaItems = metaPart.split('|').map(i => i.trim());
      const name = metaItems[0];

      const category: any = {
        id,
        name,
        description: description || undefined,
        order: categories.length,
        isDefault: true
      };

      metaItems.forEach(item => {
        if (item.includes(':')) {
          const [key, value] = item.split(':').map(i => i.trim().toLowerCase());
          if (key === 'cor') category.color = value.toUpperCase();
          if (key === 'layout') category.layoutMode = value;
          if (key === 'header') category.headerPosition = value;
          if (key === 'pinned') category.isPinned = value === 'true';
        }
      });

      if (!category.color) category.color = '#3B82F6';
      categories.push(category);
    }

    // Processar Feeds
    if (currentSection === 'feeds') {
      if (trimmed.startsWith('### ')) {
        currentCategoryForFeeds = trimmed.replace('### ', '').toLowerCase();
      } else if (trimmed.startsWith('- ') && currentCategoryForFeeds) {
        // Regex adjusted to handle optional angle brackets around URLs
        const match = trimmed.match(/- ([^:]+): (?:<)?(https?:\/\/[^\s>]+)(?:>)?/);
        if (match) {
          feeds.push({
            url: match[2],
            categoryId: currentCategoryForFeeds,
            customTitle: match[1]
          });
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
        const match = trimmed.match(/- ([^:]+): (?:<)?(https?:\/\/[^\s>]+)(?:>)?/);
        if (match) {
          curatedLists[currentCuratedList].push({
            url: match[2],
            categoryId: currentCategoryForCurated,
            customTitle: match[1]
          });
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
