import { describe, expect, it } from "vitest";
import {
  buildDeleteAllFeedsConfirmation,
  buildDeleteCategoryConfirmation,
  buildRemoveFeedConfirmation,
  buildRemoveSelectedFeedsConfirmation,
  buildReplaceCuratedCollectionConfirmation,
  buildReplaceDuplicateFeedConfirmation,
  buildResetCategoriesConfirmation,
  buildRestoreDefaultFeedsConfirmation,
} from "../utils/feedDangerConfirmation";
import type { FeedCategory, FeedSource } from "../types";

const feeds: FeedSource[] = [
  { url: "https://one.example/rss", customTitle: "One" },
  { url: "https://two.example/rss", customTitle: "Two" },
  { url: "https://three.example/rss", customTitle: "Three" },
  { url: "https://four.example/rss", customTitle: "Four" },
];

describe("feed danger confirmations", () => {
  it("builds a specific confirmation for removing one feed", () => {
    expect(buildRemoveFeedConfirmation(feeds[0])).toMatchObject({
      title: "Remover feed",
      message: 'Remover "One" da coleção?',
      impact: "Este feed sairá da coleção e deixará de carregar novos artigos.",
      details: ["https://one.example/rss"],
      confirmText: "Remover feed",
      cancelText: "Manter feed",
      type: "danger",
    });
  });

  it("summarizes selected errored feeds with count and truncation", () => {
    const confirmation = buildRemoveSelectedFeedsConfirmation(feeds);

    expect(confirmation).toMatchObject({
      title: "Remover 4 feeds",
      message: "Remover 4 feeds selecionados?",
      confirmText: "Remover 4 feeds",
      cancelText: "Manter feeds",
    });
    expect(confirmation.details).toEqual(["One", "Two", "Three", "... e mais 1"]);
  });

  it("marks delete-all as a collection-emptying action", () => {
    const confirmation = buildDeleteAllFeedsConfirmation(feeds);

    expect(confirmation).toMatchObject({
      title: "Excluir todos os feeds",
      message: "Excluir todos os 4 feeds da coleção?",
      impact:
        "A coleção ficará vazia. Esta ação não pode ser desfeita pelo aplicativo.",
      confirmText: "Excluir todos",
      cancelText: "Manter coleção",
    });
    expect(confirmation.details).toEqual(["One", "Two", "Three", "... e mais 1"]);
  });

  it("describes replacing the current collection with a curated list", () => {
    expect(
      buildReplaceCuratedCollectionConfirmation({
        currentFeeds: feeds.slice(0, 2),
        replacementFeeds: feeds,
        listName: "Tecnologia",
      }),
    ).toMatchObject({
      title: "Substituir coleção",
      message: 'Substituir a coleção atual pela lista "Tecnologia"?',
      impact: "2 feeds atuais serão removidos e 4 feeds serão gravados.",
      details: ["One", "Two"],
      confirmText: "Substituir coleção",
      cancelText: "Manter coleção",
    });
  });

  it("describes restoring default feeds", () => {
    expect(
      buildRestoreDefaultFeedsConfirmation({
        currentFeeds: feeds.slice(0, 1),
        defaultFeeds: feeds.slice(0, 3),
      }),
    ).toMatchObject({
      title: "Restaurar padrões",
      impact: "1 feed atual será substituído por 3 feeds padrão.",
      confirmText: "Restaurar padrões",
      cancelText: "Manter coleção",
    });
  });

  it("describes deleting a category and moving its feeds", () => {
    const category: FeedCategory = {
      id: "custom-tech",
      name: "Tech",
      color: "#000000",
      order: 1,
    };

    expect(
      buildDeleteCategoryConfirmation({
        category,
        feedsInCategory: feeds.slice(0, 2),
      }),
    ).toMatchObject({
      title: "Excluir categoria",
      message: 'Excluir a categoria "Tech"?',
      impact:
        'A categoria será removida e 2 feeds serão movidos para "Sem categoria".',
      details: ["One", "Two"],
      confirmText: "Excluir categoria",
      cancelText: "Manter categoria",
    });
  });

  it("describes resetting categories", () => {
    const categories: FeedCategory[] = [
      { id: "all", name: "Todos", color: "#000000", order: 0, isDefault: true },
      { id: "custom-tech", name: "Tech", color: "#000000", order: 1 },
      { id: "custom-news", name: "News", color: "#000000", order: 2 },
    ];

    expect(
      buildResetCategoriesConfirmation({ categories, feedCount: 5 }),
    ).toMatchObject({
      title: "Restaurar categorias padrão",
      impact: "2 categorias personalizadas serão removidas e 5 feeds ficarão sem categoria.",
      details: ["Tech", "News"],
      confirmText: "Restaurar padrões",
      cancelText: "Manter categorias",
    });
  });

  it("describes replacing an existing duplicate feed", () => {
    expect(
      buildReplaceDuplicateFeedConfirmation({
        existingFeed: feeds[0],
        newFeedUrl: "https://new.example/rss",
      }),
    ).toMatchObject({
      title: "Substituir feed",
      message: 'Substituir "One" pelo novo feed?',
      impact: "O feed existente será removido antes de adicionar o novo endereço.",
      details: ["Atual: https://one.example/rss", "Novo: https://new.example/rss"],
      confirmText: "Substituir feed",
      cancelText: "Manter existente",
    });
  });
});
