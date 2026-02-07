# Configurações do Personal News

Esta pasta contém os arquivos de configuração centralizada da aplicação. Edite estes arquivos para alterar os valores padrão do sistema.

## Arquivos

### `defaultConfig.ts`
Configurações gerais da aplicação:
- **Header**: Logo, título, posição, estilo visual
- **Content**: Exibição de autor, data, layout de artigos
- **Background**: Tipo de fundo (sólido, gradiente, aura)
- **Categorias**: Categorias padrão do sistema
- **Feeds**: Feeds pré-configurados para novos usuários
- **Outras**: Cidade do clima, performance, chaves do localStorage

### `themeConfig.ts`
Configuração de temas de cores:
- **Temas Escuros**: Azul Escuro, Verde Escuro, Roxo Escuro
- **Temas Claros**: Azul Claro, Rosa Claro, Ciano Claro
- **Documentação**: Impacto de cada cor em cada elemento da UI

## Como Usar

### Alterar o tema padrão
Em `themeConfig.ts`, altere a linha:
```typescript
currentTheme: LIGHT_BLUE_THEME.theme,  // Altere para outro tema
```

Opções:
- `DARK_BLUE_THEME.theme`
- `DARK_GREEN_THEME.theme`
- `DARK_PURPLE_THEME.theme`
- `LIGHT_BLUE_THEME.theme`
- `LIGHT_PINK_THEME.theme`
- `LIGHT_CYAN_THEME.theme`

### Alterar cores de um tema
Em `themeConfig.ts`, localize o tema desejado e altere as cores no formato RGB:
```typescript
colors: {
  primary: '25 118 210',    // Cor principal (azul)
  background: '255 255 255', // Fundo (branco)
  // ...
}
```

### Alterar categorias padrão
Em `defaultConfig.ts`, modifique o array `DEFAULT_CATEGORIES`:
```typescript
export const DEFAULT_CATEGORIES: FeedCategory[] = [
  { id: 'all', name: 'Todos', color: '#6B7280', order: 0, isDefault: true },
  { id: 'tech', name: 'Tecnologia', color: '#3B82F6', order: 1, isDefault: true },
  // Adicione ou remova categorias aqui
];
```

### Alterar feeds padrão
Em `defaultConfig.ts`, modifique o array `DEFAULT_FEEDS`:
```typescript
export const DEFAULT_FEEDS: FeedSource[] = [
  { url: "https://exemplo.com/feed", categoryId: "tech", customTitle: "Meu Feed" },
  // Adicione ou remova feeds aqui
];
```

## Impacto das Cores

| Cor | Elementos Afetados |
|-----|-------------------|
| `primary` | Botões de ação, links, tabs ativas, toggles, badges |
| `secondary` | Cards, fundos de seções, sidebars |
| `accent` | Notificações, indicadores, elementos de destaque |
| `background` | Body background, áreas vazias |
| `surface` | Modais, dropdowns, tooltips, cards elevados |
| `text` | Títulos, parágrafos, labels |
| `textSecondary` | Subtítulos, descrições, timestamps |
| `border` | Bordas de inputs, separadores |
| `success` | Mensagens de sucesso, ícones de confirmação |
| `warning` | Alertas, ícones de atenção |
| `error` | Mensagens de erro, ícones de problema |

## Impacto do Layout

| Propriedade | Valores | Impacto |
|-------------|---------|---------|
| `layout` | compact / comfortable / spacious | Espaçamento entre elementos |
| `density` | low / medium / high | Tamanho da fonte e altura de linha |
| `borderRadius` | none / small / medium / large | Arredondamento dos cantos |
| `shadows` | true / false | Sombras nos elementos |
| `animations` | true / false | Transições e animações |
### `initial-setup.md`
Fonte declarativa para configurações globais, categorias e feeds padrão.  
Edite este arquivo e rode `bun run config:sync` para gerar `constants/curatedFeeds.ts`.
