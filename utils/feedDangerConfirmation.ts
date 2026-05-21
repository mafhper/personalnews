import type { ConfirmDialogOptions, FeedCategory, FeedSource } from "../types";

const MAX_DETAILS = 3;

const plural = (count: number, singular: string, pluralValue: string) =>
  count === 1 ? singular : pluralValue;

export const getFeedDangerLabel = (feed: Pick<FeedSource, "url" | "customTitle">) =>
  feed.customTitle?.trim() || feed.url;

const limitedDetails = <T>(
  items: T[],
  labelFor: (item: T) => string,
): string[] => {
  const details = items.slice(0, MAX_DETAILS).map(labelFor);
  const hiddenCount = items.length - details.length;
  if (hiddenCount > 0) {
    details.push(`... e mais ${hiddenCount}`);
  }
  return details;
};

export const buildRemoveFeedConfirmation = (
  feed: Pick<FeedSource, "url" | "customTitle">,
): ConfirmDialogOptions => {
  const label = getFeedDangerLabel(feed);

  return {
    title: "Remover feed",
    message: `Remover "${label}" da coleção?`,
    impact: "Este feed sairá da coleção e deixará de carregar novos artigos.",
    details: [feed.url],
    confirmText: "Remover feed",
    cancelText: "Manter feed",
    type: "danger",
  };
};

export const buildRemoveSelectedFeedsConfirmation = (
  feeds: Pick<FeedSource, "url" | "customTitle">[],
): ConfirmDialogOptions => {
  const count = feeds.length;

  return {
    title: `Remover ${count} ${plural(count, "feed", "feeds")}`,
    message: `Remover ${count} ${plural(count, "feed selecionado", "feeds selecionados")}?`,
    impact:
      "Os feeds selecionados serão removidos da coleção e do histórico de erros da limpeza.",
    details: limitedDetails(feeds, getFeedDangerLabel),
    confirmText: `Remover ${count} ${plural(count, "feed", "feeds")}`,
    cancelText: "Manter feeds",
    type: "danger",
  };
};

export const buildDeleteAllFeedsConfirmation = (
  feeds: Pick<FeedSource, "url" | "customTitle">[],
): ConfirmDialogOptions => {
  const count = feeds.length;

  return {
    title: "Excluir todos os feeds",
    message: `Excluir todos os ${count} ${plural(count, "feed", "feeds")} da coleção?`,
    impact:
      "A coleção ficará vazia. Esta ação não pode ser desfeita pelo aplicativo.",
    details: limitedDetails(feeds, getFeedDangerLabel),
    confirmText: "Excluir todos",
    cancelText: "Manter coleção",
    type: "danger",
  };
};

export const buildReplaceCuratedCollectionConfirmation = ({
  currentFeeds,
  replacementFeeds,
  listName,
}: {
  currentFeeds: Pick<FeedSource, "url" | "customTitle">[];
  replacementFeeds: Pick<FeedSource, "url" | "customTitle">[];
  listName?: string;
}): ConfirmDialogOptions => {
  const listLabel = listName ? ` pela lista "${listName}"` : "";

  return {
    title: "Substituir coleção",
    message: `Substituir a coleção atual${listLabel}?`,
    impact: `${currentFeeds.length} ${plural(
      currentFeeds.length,
      "feed atual será removido",
      "feeds atuais serão removidos",
    )} e ${replacementFeeds.length} ${plural(
      replacementFeeds.length,
      "feed será gravado",
      "feeds serão gravados",
    )}.`,
    details: limitedDetails(currentFeeds, getFeedDangerLabel),
    confirmText: "Substituir coleção",
    cancelText: "Manter coleção",
    type: "danger",
  };
};

export const buildRestoreDefaultFeedsConfirmation = ({
  currentFeeds,
  defaultFeeds,
}: {
  currentFeeds: Pick<FeedSource, "url" | "customTitle">[];
  defaultFeeds: Pick<FeedSource, "url" | "customTitle">[];
}): ConfirmDialogOptions => ({
  title: "Restaurar padrões",
  message: "Restaurar a coleção inicial de feeds?",
  impact: `${currentFeeds.length} ${plural(
    currentFeeds.length,
    "feed atual será substituído",
    "feeds atuais serão substituídos",
  )} por ${defaultFeeds.length} ${plural(
    defaultFeeds.length,
    "feed padrão",
    "feeds padrão",
  )}.`,
  details: limitedDetails(currentFeeds, getFeedDangerLabel),
  confirmText: "Restaurar padrões",
  cancelText: "Manter coleção",
  type: "danger",
});

export const buildDeleteCategoryConfirmation = ({
  category,
  feedsInCategory,
}: {
  category: Pick<FeedCategory, "name">;
  feedsInCategory: Pick<FeedSource, "url" | "customTitle">[];
}): ConfirmDialogOptions => {
  const count = feedsInCategory.length;

  return {
    title: "Excluir categoria",
    message: `Excluir a categoria "${category.name}"?`,
    impact:
      count > 0
        ? `A categoria será removida e ${count} ${plural(
            count,
            "feed será movido",
            "feeds serão movidos",
          )} para "Sem categoria".`
        : "A categoria será removida. Nenhum feed será alterado.",
    details: limitedDetails(feedsInCategory, getFeedDangerLabel),
    confirmText: "Excluir categoria",
    cancelText: "Manter categoria",
    type: "danger",
  };
};

export const buildResetCategoriesConfirmation = ({
  categories,
  feedCount,
}: {
  categories: Pick<FeedCategory, "name" | "isDefault">[];
  feedCount: number;
}): ConfirmDialogOptions => {
  const customCategories = categories.filter((category) => !category.isDefault);

  return {
    title: "Restaurar categorias padrão",
    message: "Restaurar as categorias padrão?",
    impact: `${customCategories.length} ${plural(
      customCategories.length,
      "categoria personalizada será removida",
      "categorias personalizadas serão removidas",
    )} e ${feedCount} ${plural(
      feedCount,
      "feed ficará",
      "feeds ficarão",
    )} sem categoria.`,
    details: limitedDetails(customCategories, (category) => category.name),
    confirmText: "Restaurar padrões",
    cancelText: "Manter categorias",
    type: "danger",
  };
};

export const buildReplaceDuplicateFeedConfirmation = ({
  existingFeed,
  newFeedUrl,
  labels,
}: {
  existingFeed: Pick<FeedSource, "url" | "customTitle">;
  newFeedUrl: string;
  labels?: {
    impact?: string;
    current?: string;
    next?: string;
  };
}): ConfirmDialogOptions => ({
  title: "Substituir feed",
  message: `Substituir "${getFeedDangerLabel(existingFeed)}" pelo novo feed?`,
  impact:
    labels?.impact ||
    "O feed existente será removido antes de adicionar o novo endereço.",
  details: [
    `${labels?.current || "Atual"}: ${existingFeed.url}`,
    `${labels?.next || "Novo"}: ${newFeedUrl}`,
  ],
  confirmText: "Substituir feed",
  cancelText: "Manter existente",
  type: "danger",
});
