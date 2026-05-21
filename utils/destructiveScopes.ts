export type ResetScopeId =
  | "feeds"
  | "categories"
  | "style"
  | "read-history"
  | "favorites";

export interface ResetScopeDefinition {
  id: ResetScopeId;
  label: string;
  description: string;
  storageKeys: string[];
}

export const RESET_SCOPE_DEFINITIONS: ResetScopeDefinition[] = [
  {
    id: "feeds",
    label: "Todos os feeds cadastrados",
    description: "Remove a coleção atual, fontes legadas e histórico de erro dos feeds.",
    storageKeys: [
      "rss-feeds",
      "feed-sources",
      "feed-error-history",
      "personalnews-feed-onboarding-dismissed",
    ],
  },
  {
    id: "categories",
    label: "Todas as categorias",
    description: "Remove categorias personalizadas para restaurar a organização padrão.",
    storageKeys: ["feed-categories"],
  },
  {
    id: "style",
    label: "Todas as personalizações de estilo",
    description: "Restaura aparência, tema, header, plano de fundo e layout de leitura.",
    storageKeys: [
      "appearance-header",
      "appearance-content",
      "appearance-background",
      "appearance-active-layout",
      "appearance-overrides",
      "extended-theme-settings",
      "article-layout-settings",
    ],
  },
  {
    id: "read-history",
    label: "Histórico de leitura",
    description: "Remove os registros locais de artigos lidos.",
    storageKeys: ["article-read-status"],
  },
  {
    id: "favorites",
    label: "Favoritos",
    description: "Remove todos os favoritos salvos localmente.",
    storageKeys: ["favorites-data"],
  },
];

export const RESET_SCOPE_IDS = RESET_SCOPE_DEFINITIONS.map(
  (scope) => scope.id,
);

export const getResetScopeStorageKeys = (
  scopeIds: readonly string[],
): string[] => {
  const selectedIds = new Set(scopeIds);

  return RESET_SCOPE_DEFINITIONS.filter((scope) => selectedIds.has(scope.id))
    .flatMap((scope) => scope.storageKeys)
    .filter((key, index, keys) => keys.indexOf(key) === index);
};

export const applySelectedResetScopes = (
  scopeIds: readonly string[],
  storage: Pick<Storage, "removeItem"> = localStorage,
): string[] => {
  const keys = getResetScopeStorageKeys(scopeIds);
  keys.forEach((key) => storage.removeItem(key));
  return keys;
};

