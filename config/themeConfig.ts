/**
 * themeConfig.ts
 * 
 * Configuração centralizada de temas do Personal News.
 * Cada tema define cores, layout, densidade e efeitos visuais.
 * 
 * GUIA DE CORES:
 * - Todas as cores devem estar no formato RGB separado por espaços: "R G B"
 * - Exemplo: vermelho = "255 0 0", branco = "255 255 255"
 * 
 * IMPACTO DE CADA COR:
 * - primary: Botões principais, links ativos, elementos de destaque
 * - secondary: Elementos secundários, fundos de cards
 * - accent: Destaques especiais, badges, notificações
 * - background: Fundo principal da aplicação
 * - surface: Fundo de cards, modais, dropdowns
 * - text: Texto principal
 * - textSecondary: Texto secundário, descrições, metadados
 * - border: Bordas de elementos
 * - success/warning/error: Cores de feedback ao usuário
 * 
 * @author Matheus Pereira
 * @version 1.0.0
 */

import type { ExtendedTheme } from '../types';

// =============================================================================
// INTERFACE DE TEMA
// =============================================================================

export interface ThemePreset {
    id: string;                   // Identificador único
    name: string;                 // Nome exibido ao usuário
    description: string;          // Descrição do tema
    category: 'dark' | 'light' | 'colorful';  // Categoria do tema
    theme: ExtendedTheme;         // Configurações completas do tema
}

// =============================================================================
// TEMA PADRÃO (Light Blue)
// =============================================================================

export const DEFAULT_THEME_ID = 'light-blue';

// =============================================================================
// TEMAS ESCUROS
// =============================================================================

export const DARK_BLUE_THEME: ThemePreset = {
    id: 'dark-blue',
    name: 'Azul Escuro',
    description: 'Tema escuro com tons de azul e contraste otimizado',
    category: 'dark',
    theme: {
        id: 'dark-blue',
        name: 'Azul Escuro',
        colors: {
            primary: '18 102 204',      // Azul principal (botões, links)
            secondary: '30 30 30',      // Cinza escuro (cards)
            accent: '138 101 8',        // Dourado (destaques)
            background: '18 18 18',     // Preto suave (fundo)
            surface: '30 30 30',        // Cinza escuro (superfícies)
            text: '255 255 255',        // Branco (texto principal)
            textSecondary: '176 176 176', // Cinza claro (texto secundário)
            border: '75 85 99',         // Cinza médio (bordas)
            success: '16 185 129',      // Verde (sucesso)
            warning: '245 158 11',      // Amarelo (alerta)
            error: '239 68 68',         // Vermelho (erro)
        },
        layout: 'comfortable',        // 'compact' | 'comfortable' | 'spacious'
        density: 'medium',            // 'low' | 'medium' | 'high'
        borderRadius: 'medium',       // 'none' | 'small' | 'medium' | 'large'
        shadows: true,                // Habilitar sombras
        animations: true,             // Habilitar animações
    },
};

export const DARK_GREEN_THEME: ThemePreset = {
    id: 'dark-green',
    name: 'Verde Escuro',
    description: 'Tema escuro com tons de verde natural',
    category: 'dark',
    theme: {
        id: 'dark-green',
        name: 'Verde Escuro',
        colors: {
            primary: '52 125 54',       // Verde principal
            secondary: '27 31 29',      // Verde escuro
            accent: '122 105 17',       // Dourado
            background: '13 13 13',     // Preto
            surface: '27 31 29',        // Verde escuro
            text: '241 241 241',        // Branco
            textSecondary: '168 168 168', // Cinza
            border: '75 85 99',
            success: '16 185 129',
            warning: '245 158 11',
            error: '239 68 68',
        },
        layout: 'comfortable',
        density: 'medium',
        borderRadius: 'medium',
        shadows: true,
        animations: true,
    },
};

export const DARK_PURPLE_THEME: ThemePreset = {
    id: 'dark-purple',
    name: 'Roxo Escuro',
    description: 'Tema escuro com tons de roxo e rosa',
    category: 'dark',
    theme: {
        id: 'dark-purple',
        name: 'Roxo Escuro',
        colors: {
            primary: '173 46 207',      // Roxo vibrante
            secondary: '26 26 35',      // Roxo escuro
            accent: '204 51 102',       // Rosa
            background: '16 16 20',     // Quase preto
            surface: '26 26 35',        // Roxo escuro
            text: '224 224 224',        // Cinza claro
            textSecondary: '156 156 156', // Cinza
            border: '75 85 99',
            success: '16 185 129',
            warning: '245 158 11',
            error: '239 68 68',
        },
        layout: 'comfortable',
        density: 'medium',
        borderRadius: 'medium',
        shadows: true,
        animations: true,
    },
};

// =============================================================================
// TEMAS CLAROS
// =============================================================================

export const LIGHT_BLUE_THEME: ThemePreset = {
    id: 'light-blue',
    name: 'Azul Claro',
    description: 'Tema claro com tons de azul e alto contraste',
    category: 'light',
    theme: {
        id: 'light-blue',
        name: 'Azul Claro',
        colors: {
            primary: '25 118 210',      // Azul principal
            secondary: '245 245 245',   // Cinza claro
            accent: '184 61 23',        // Laranja
            background: '255 255 255',  // Branco
            surface: '245 245 245',     // Cinza bem claro
            text: '33 33 33',           // Preto suave
            textSecondary: '97 97 97',  // Cinza
            border: '156 163 175',      // Cinza médio
            success: '16 185 129',
            warning: '245 158 11',
            error: '239 68 68',
        },
        layout: 'comfortable',
        density: 'medium',
        borderRadius: 'medium',
        shadows: true,
        animations: true,
    },
};

export const LIGHT_PINK_THEME: ThemePreset = {
    id: 'light-pink',
    name: 'Rosa Claro',
    description: 'Tema claro com tons de rosa e lilás',
    category: 'light',
    theme: {
        id: 'light-pink',
        name: 'Rosa Claro',
        colors: {
            primary: '178 48 92',       // Rosa
            secondary: '255 255 255',   // Branco
            accent: '126 87 194',       // Roxo
            background: '255 248 240',  // Creme
            surface: '255 255 255',     // Branco
            text: '33 33 33',           // Preto
            textSecondary: '97 97 97',  // Cinza
            border: '156 163 175',
            success: '16 185 129',
            warning: '245 158 11',
            error: '239 68 68',
        },
        layout: 'comfortable',
        density: 'medium',
        borderRadius: 'medium',
        shadows: true,
        animations: true,
    },
};

export const LIGHT_CYAN_THEME: ThemePreset = {
    id: 'light-cyan',
    name: 'Ciano Claro',
    description: 'Tema claro minimalista com tons frios',
    category: 'light',
    theme: {
        id: 'light-cyan',
        name: 'Ciano Claro',
        colors: {
            primary: '0 129 145',       // Ciano
            secondary: '255 255 255',   // Branco
            accent: '184 81 49',        // Laranja
            background: '240 244 248',  // Azul gelo
            surface: '255 255 255',     // Branco
            text: '28 28 28',           // Preto
            textSecondary: '94 94 94',  // Cinza
            border: '156 163 175',
            success: '16 185 129',
            warning: '245 158 11',
            error: '239 68 68',
        },
        layout: 'comfortable',
        density: 'medium',
        borderRadius: 'medium',
        shadows: true,
        animations: true,
    },
};

// =============================================================================
// TODOS OS TEMAS PRÉ-DEFINIDOS
// =============================================================================

export const ALL_THEME_PRESETS: ThemePreset[] = [
    // Escuros
    DARK_BLUE_THEME,
    DARK_GREEN_THEME,
    DARK_PURPLE_THEME,
    // Claros
    LIGHT_BLUE_THEME,
    LIGHT_PINK_THEME,
    LIGHT_CYAN_THEME,
];

// =============================================================================
// CONFIGURAÇÕES DE TEMA DO SISTEMA
// =============================================================================

export const DEFAULT_THEME_SETTINGS = {
    currentTheme: LIGHT_BLUE_THEME.theme,  // Tema inicial
    customThemes: [] as ExtendedTheme[],   // Temas customizados pelo usuário
    autoDetectSystemTheme: true,           // Detectar tema do sistema (claro/escuro)
    systemThemeOverride: null as 'light' | 'dark' | null,  // Forçar tema específico
    themeTransitions: true,                // Transições suaves entre temas
};

// =============================================================================
// IMPACTO DE CADA PROPRIEDADE NO LAYOUT
// =============================================================================

/**
 * LAYOUT (spacing):
 * - compact:     padding: 0.5rem, gap: 0.5rem  - Mais conteúdo visível
 * - comfortable: padding: 1rem,   gap: 1rem   - Equilibrado (padrão)
 * - spacious:    padding: 1.5rem, gap: 1.5rem - Mais espaçamento
 * 
 * DENSITY (tipografia):
 * - low:    fontSize: 0.875rem, lineHeight: 1.25rem - Texto menor
 * - medium: fontSize: 1rem,     lineHeight: 1.5rem  - Padrão
 * - high:   fontSize: 1.125rem, lineHeight: 1.75rem - Texto maior
 * 
 * BORDER RADIUS:
 * - none:   0       - Cantos retos
 * - small:  0.25rem - Cantos levemente arredondados
 * - medium: 0.5rem  - Cantos arredondados (padrão)
 * - large:  1rem    - Cantos bem arredondados
 * 
 * ELEMENTOS IMPACTADOS PELAS CORES:
 * - primary:       Botões de ação, links, tabs ativas, toggles, badges
 * - secondary:     Cards, fundos de seções, sidebars
 * - accent:        Notificações, indicadores, elementos de destaque
 * - background:    Body background, áreas vazias
 * - surface:       Modais, dropdowns, tooltips, popovers, cards elevados
 * - text:          Títulos, parágrafos, labels
 * - textSecondary: Subtítulos, descrições, timestamps, metadados
 * - border:        Bordas de inputs, separadores, divisores
 */
