# Relatorio de Auditoria i18n

> Gerado em: 17/12/2025, 13:47:11

## Resumo

| Categoria | Problemas |
|-----------|----------|
| Paridade de Idiomas | 199 |
| Strings Hardcoded | 95 |
| Chaves Indefinidas/Nao Usadas | 85 |
| **Total** | **379** |

## Paridade de Idiomas

### MISSING_KEY

- Chave "header.manage_feeds" faltando em en-US
- Chave "feeds.category.empty" faltando em es
- Chave "feeds.category.pin" faltando em es
- Chave "feeds.category.unpin" faltando em es
- Chave "customizer.title" faltando em es
- Chave "customizer.subtitle" faltando em es
- Chave "customizer.tab.layouts" faltando em es
- Chave "customizer.tab.colors" faltando em es
- Chave "customizer.tab.header" faltando em es
- Chave "customizer.tab.content" faltando em es
- Chave "customizer.tab.background" faltando em es
- Chave "customizer.tab.import_export" faltando em es
- Chave "customizer.group.primary_colors" faltando em es
- Chave "customizer.group.background_colors" faltando em es
- Chave "customizer.export.desc" faltando em es
- Chave "customizer.import.desc" faltando em es
- Chave "customizer.import.placeholder" faltando em es
- Chave "article.read_full" faltando em es
- Chave "article.scroll_hint" faltando em es
- Chave "article.vol" faltando em es
- ... e mais 177 problemas

### EXTRA_KEY

- Chave "layout.polaroid" existe em zh mas nao em pt-BR
- Chave "layout.polaroid" existe em ja mas nao em pt-BR

## Strings Hardcoded

### components\AppearanceCustomizer.tsx

- `Adjust colors individually`
- `Edit Colors`

### components\BackgroundCreator.tsx

- `Baixar Wallpaper`
- `Carregar Imagem`
- `Remover`
- `Remover`

### components\BackgroundSelector.tsx

- `Remove Background`

### components\ErrorBoundary.tsx

- `Error Details`
- `Error Details`
- `Error loading component`
- `Error loading component`

### components\ErrorRecovery.tsx

- `void;
  onRemove?: (url: string) => void;
  isRetrying?: b...`
- `void;
  onRemove?: (url: string) => void;
  isRetrying?: b...`
- `void;
  onRetrySelected?: (urls: string[]) => void;
  onDi...`
- `void;
  onRetrySelected?: (urls: string[]) => void;
  onDi...`
- `Dismiss All Errors`
- `Dismiss All Errors`
- `void;
  className?: string;
}

/**
 * Component that su...`
- `void;
  className?: string;
}

/**
 * Component that su...`

### components\FavoritesModal.tsx

- `Clear All`
- `Clear All`
- `setShowConfirmClear(false)}
                  variant="seco...`

### components\FeedAnalytics.tsx

- `Erros`

### components\FeedCategoryManager.tsx

- `f.url !== feedUrl));
      await alertSuccess("Feed removid...`
- `f.url !== feedUrl));
      await alertSuccess("Feed removid...`
- `setShowNewCategoryForm(false)}
                className="b...`
- `Edit Category`
- `Save Changes`
- `Cancel`
- `Salvar`
- `Cancelar`
- `Cancelar`
- `Salvar`
- ... e mais 2 strings

### components\FeedCleanupModal.tsx

- `void;
  feeds: FeedSource[];
  onRemoveFeeds: (urls: strin...`
- `f.url === item.url);
      if (!feedExists) return false;
...`
- `Mínimo de Falhas`
- `Tipo de Erro`
- `Todos`
- `handleSelectAll(e.target.checked)}
                      cl...`
- `handleSelectAll(e.target.checked)}
                      cl...`
- `Cancelar`
- `Cancelar`

### components\FeedDiscoveryModal.tsx

- `void;
  originalUrl: string;
  discoveredFeeds: Discovered...`
- `Cancel`

### components\FeedItem.tsx

- `void;
  onRetry: (url: string) => void;
  onEdit: (url: st...`
- `void;
  onRetry: (url: string) => void;
  onEdit: (url: st...`
- `onShowError(feed.url)}
                        className="t...`
- `onShowError(feed.url)}
                        className="t...`

### components\FeedManager.tsx

- `Limpar Erros`
- `Excluir Tudo`
- `Todos`
- `Detalhes do Erro`
- `setShowErrorModal(false)}
                    className="px-...`
- `setShowErrorModal(false)}
                    className="px-...`

### components\FeedManagerControls.tsx

- `void;
  statusFilter: string;
  onStatusFilterChange: (val...`
- `Clear Filters`

### components\FeedProgressIndicator.tsx

- `void;
  canCancel?: boolean;
  showDetails?: boolean;
  o...`
- `Cancel`

### components\FeedValidationErrorModal.tsx

- `void;
  feedUrl: string;
  validationResult: FeedValidatio...`
- `void;
  feedUrl: string;
  validationResult: FeedValidatio...`
- `Feed Validation Error`
- `Feed Validation Error`
- `Edit URL`
- `Add Anyway`

### components\Header.tsx

- `void;
  articles: Article[];
  onSearch: (query: string, fil...`

### components\KeyboardShortcutsModal.tsx

- `Close`

### components\layouts\ModernPortalLayout.tsx

- `View All Archives`

### components\LazyImage.tsx

- `Image Error`
- `Image Error`
- `void;
  onError?: () => void;
  retryAttempts?: number;
 ...`
- `void;
  onError?: () => void;
  retryAttempts?: number;
 ...`

### components\LoadingStates.tsx

- `void;
}

/**
 * Button with loading state
 */
export c...`
- `void;
  className?: string;
}

/**
 * Full-screen overl...`
- `Cancel`
- `void;
  className?: string;
}

/**
 * Smart loading com...`
- `Cancel`
- `void;
}

/**
 * Touch-friendly loading button optimized ...`

### components\OptimizedImage.tsx

- `Image Error`
- `Image Error`

### components\PerformanceDashboard.tsx

- `PerformanceLogger.logFailedOperations()}
                  ...`
- `Success Rate`
- `Feed Loading Details`
- `Failed Feed Loads`

### components\PerformanceDebugger.tsx

- `PerformanceLogger.logFailedOperations()}
                  ...`

### components\ProgressIndicator.tsx

- `void;
  onRetryErrors?: () => void;
  className?: string;...`
- `void;
  onRetryErrors?: () => void;
  className?: string;...`

### components\SearchBar.tsx

- `All Categories`
- `All Time`
- `All Sources`
- `Recent Searches`

### components\SettingsModal.tsx

- `Nenhum`
- `Salvar configurações`

### components\SettingsSidebar.tsx

- `Remove categorias personalizadas`

## Problemas de Chaves

### Chaves Indefinidas (usadas mas nao existem)

- ` ` em components\AppearanceCustomizer.tsx
- `a` em components\BackgroundCreator.tsx
- `canvas` em components\BackgroundCreator.tsx
- `2d` em components\BackgroundCreator.tsx
- `a` em components\BackgroundCreator.tsx
- `a` em components\FavoritesModal.tsx
- `T` em components\FavoritesModal.tsx
- `a` em components\FeedCategoryManager.tsx
- `T` em components\FeedCategoryManager.tsx
- `a` em components\FeedCategoryManager.tsx
- `T` em components\FeedCategoryManager.tsx
- `confirm.category_delete` em components\FeedDropdown.tsx
- `alert.category_deleted_success` em components\FeedDropdown.tsx
- `a` em components\FeedManager.tsx
- `T` em components\FeedManager.tsx
- `link` em components\Header.tsx
- `/` em components\layouts\FocusLayout.tsx
- `feeds.empty` em components\layouts\MagazineLayout.tsx
- `layout.featured` em components\layouts\MagazineLayout.tsx
- `layout.more_news` em components\layouts\MagazineLayout.tsx

### Chaves Nao Usadas (definidas mas sem uso)

> Nota: Algumas podem ser usadas dinamicamente

- `search.results`
- `no.results`
- `published`
- `author`
- `source`
- `action.delete`
- `action.close`
- `action.remove`
- `header.settings`
- `settings.tab.appearance`
- `settings.tab.display`
- `settings.tab.advanced`
- `settings.header.config`
- `settings.header.upload`
- `settings.header.position`
- `settings.header.height`
- `settings.header.theme_color`
- `settings.header.blur`
- `settings.layout.preset`
- `settings.colors`
- `settings.background`
- `settings.display.options`
- `settings.display.show_time`
- `settings.system`
- `settings.system.detect_theme`
- `settings.backup.desc`
- `settings.reset.desc`
- `feeds.category.pin`
- `feeds.category.unpin`
- `analytics.total_articles`
- ... e mais 25 chaves

## Status: ATENCAO

379 problema(s) encontrado(s). Recomenda-se revisao.
