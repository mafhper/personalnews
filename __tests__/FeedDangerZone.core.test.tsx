import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FeedCategoryManager } from "../components/FeedCategoryManager";
import { FeedAnalytics } from "../components/FeedAnalytics";
import { FeedCleanupModal } from "../components/FeedCleanupModal";
import { FeedDuplicateModal } from "../components/FeedDuplicateModal";
import { FeedManager } from "../components/FeedManager";
import type { FeedSource } from "../types";

const mocks = vi.hoisted(() => ({
  alertError: vi.fn(),
  alertSuccess: vi.fn(),
  confirm: vi.fn(),
  confirmDanger: vi.fn(),
  confirmWarning: vi.fn(),
  createCategory: vi.fn(),
  deleteCategory: vi.fn(),
  getCategorizedFeeds: vi.fn(),
  importCategories: vi.fn(),
  moveFeedToCategory: vi.fn(),
  reorderCategories: vi.fn(),
  resetToDefaults: vi.fn(),
  testCategories: [
    { id: "all", name: "Todos", color: "#111111", order: 0, isDefault: true },
    { id: "tech", name: "Tech", color: "#222222", order: 1 },
  ],
  testFeeds: [
    { url: "https://one.example/rss", customTitle: "One", categoryId: "tech" },
    { url: "https://two.example/rss", customTitle: "Two", categoryId: "tech" },
  ],
  translations: {} as Record<string, string>,
  updateCategory: vi.fn(),
  validateFeeds: vi.fn(),
  validateFeed: vi.fn(),
}));

vi.mock("../hooks/useLanguage", () => ({
  useLanguage: () => ({
    language: "pt-BR",
    setLanguage: vi.fn(),
    t: (key: string) =>
      mocks.translations[key] || key,
  }),
}));

vi.mock("../hooks/useAppearance", () => ({
  useAppearance: () => ({
    refreshAppearance: vi.fn(),
  }),
}));

vi.mock("../hooks/useNotificationReplacements", () => ({
  useNotificationReplacements: () => ({
    alertError: mocks.alertError,
    alertSuccess: mocks.alertSuccess,
    confirm: mocks.confirm,
    confirmDanger: mocks.confirmDanger,
    confirmWarning: mocks.confirmWarning,
  }),
}));

vi.mock("../hooks/useFeedCategories", () => ({
  useFeedCategories: () => ({
    categories: mocks.testCategories,
    createCategory: mocks.createCategory,
    deleteCategory: mocks.deleteCategory,
    getCategorizedFeeds: mocks.getCategorizedFeeds,
    importCategories: mocks.importCategories,
    moveFeedToCategory: mocks.moveFeedToCategory,
    reorderCategories: mocks.reorderCategories,
    resetToDefaults: mocks.resetToDefaults,
    updateCategory: mocks.updateCategory,
  }),
}));

vi.mock("../services/feedValidator", () => ({
  feedValidator: {
    validateFeed: mocks.validateFeed,
    validateFeeds: mocks.validateFeeds,
  },
}));

const testFeeds = mocks.testFeeds as FeedSource[];

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  mocks.translations = {
    "action.export": "Exportar",
    "action.import": "Importar",
    "action.reset": "Resetar",
    "feeds.action.add_anyway": "Adicionar mesmo assim",
    "feeds.action.cancel_dont_add": "Cancelar",
    "feeds.action.replace": "Substituir existente",
    "feeds.duplicate.confidence": "Confiança",
    "feeds.duplicate.existing": "Existente",
    "feeds.duplicate.message": "Este feed parece ser uma duplicata.",
    "feeds.duplicate.new": "Novo",
    "feeds.duplicate.current": "Atual",
    "feeds.duplicate.replace_impact": "O feed existente será removido antes de adicionar o novo endereço.",
    "feeds.duplicate.replacement": "Novo",
    "feeds.duplicate.title": "Feed duplicado",
    "feeds.title": "Feeds",
  };
  mocks.confirm.mockResolvedValue(false);
  mocks.confirmDanger.mockResolvedValue(false);
  mocks.confirmWarning.mockResolvedValue(false);
  mocks.getCategorizedFeeds.mockReturnValue({
    all: testFeeds,
    tech: testFeeds,
    uncategorized: [],
  });
  mocks.validateFeed.mockResolvedValue({
    isValid: true,
    status: "valid",
    url: "https://one.example/rss",
  });
  mocks.validateFeeds.mockResolvedValue([]);
});

describe("Feed danger zone flows", () => {
  it("renders the Portuguese shell with hierarchical sidebar navigation", async () => {
    render(
      <FeedManager
        currentFeeds={testFeeds}
        setFeeds={vi.fn()}
        closeModal={vi.fn()}
        onRefreshFeeds={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Gerenciar Feeds" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Fechar gerenciador de feeds" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", {
        name: "Navegação do gerenciador de feeds",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Painel da coleção" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Estado da coleção" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Total").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Válidos").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Erros").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Quarentena").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "Adicionar feed" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Revalidar feeds" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Use esta entrada como mapa da coleção/)).toBeInTheDocument();
    expect(screen.queryByText("Feed Manager")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Abrir menu de navegação" }));
    expect(
      screen.getByRole("dialog", {
        name: "Menu de navegação do gerenciador de feeds",
      }),
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole("dialog", {
          name: "Menu de navegação do gerenciador de feeds",
        }),
      ).getByRole("button", { name: "Fechar menu de navegação" }),
    ).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", {
          name: "Menu de navegação do gerenciador de feeds",
        }),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole("heading", { name: "Gerenciar Feeds" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Abrir menu de navegação" }));
    fireEvent.click(
      within(
        screen.getByRole("dialog", {
          name: "Menu de navegação do gerenciador de feeds",
        }),
      ).getByRole("button", { name: "Fechar menu de navegação" }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", {
          name: "Menu de navegação do gerenciador de feeds",
        }),
      ).not.toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Abrir menu de navegação" }));
    fireEvent.click(
      within(
        screen.getByRole("dialog", {
          name: "Menu de navegação do gerenciador de feeds",
        }),
      ).getByRole("button", { name: "Adicionar. Novo feed e OPML" }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", {
          name: "Menu de navegação do gerenciador de feeds",
        }),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole("heading", { name: "Adicionar feed" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Recolher Adicionar fontes" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Recolher barra lateral" })[0]);
    expect(
      screen.getAllByRole("button", { name: "Expandir barra lateral" })[0],
    ).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Expandir barra lateral" })[0]);

    fireEvent.click(
      screen.getByRole("button", { name: /Expandir Diagnóstico/ }),
    );
    expect(
      screen.getByRole("button", { name: /Recolher Diagnóstico/ }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Infraestrutura. Backend, proxies e rotas",
      }),
    );
    expect(
      screen.getByRole("heading", { name: "Backend, proxies e rotas" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Recolher Backend, proxies e rotas" }),
    ).toBeInTheDocument();
  });

  it("collapses and expands collection sections without losing anchors", async () => {
    const { container } = render(
      <FeedManager
        currentFeeds={testFeeds}
        setFeeds={vi.fn()}
        closeModal={vi.fn()}
      />,
    );

    const reviewSection = container.querySelector(
      "#feed-manager-section-feeds-list",
    ) as HTMLElement;
    expect(reviewSection).not.toBeNull();
    expect(
      within(reviewSection).getByRole("heading", { name: "Revisão de feeds" }),
    ).toBeInTheDocument();
    expect(
      within(reviewSection).getByRole("button", {
        name: "Expandir Revisão de feeds",
      }),
    ).toBeInTheDocument();

    fireEvent.click(
      within(reviewSection).getByRole("button", {
        name: "Expandir Revisão de feeds",
      }),
    );
    expect(
      within(reviewSection).getByRole("button", {
        name: "Recolher Revisão de feeds",
      }),
    ).toBeInTheDocument();

    fireEvent.click(
      within(reviewSection).getByRole("button", {
        name: "Recolher Revisão de feeds",
      }),
    );
    expect(
      within(reviewSection).getByRole("button", {
        name: "Expandir Revisão de feeds",
      }),
    ).toBeInTheDocument();
  });

  it("opens operation overview and anchors submenu sections", async () => {
    render(
      <FeedManager
        currentFeeds={testFeeds}
        setFeeds={vi.fn()}
        closeModal={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Operações. Intercâmbio, reparos e risco",
      }),
    );
    expect(
      screen.getByRole("heading", { name: "Escolha o tipo de intervenção" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Próximo passo:")).not.toBeInTheDocument();
    expect(screen.getByText("Como escolher:")).toBeInTheDocument();
    const navigation = screen.getByRole("navigation", {
      name: "Navegação do gerenciador de feeds",
    });
    expect(
      within(navigation).getByRole("button", {
        name: "Arquivos e listas. OPML, backups e coleções",
      }),
    ).toBeInTheDocument();
    expect(
      within(navigation).getByRole("button", {
        name: "Manutenção e risco. Reparos e ações críticas",
      }),
    ).toBeInTheDocument();
    expect(
      within(navigation).queryByRole("button", {
        name: "Listas curadas. Coleções prontas",
      }),
    ).not.toBeInTheDocument();
    expect(
      within(navigation).queryByRole("button", {
        name: "Zona de risco. Ações destrutivas",
      }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Transporte da coleção")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Arquivos e listas. OPML, backups e coleções",
      }),
    );
    expect(
      screen.getByRole("heading", { name: "Transporte da coleção" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Recolher Transporte da coleção" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /Listas curadas.*Mescle coleções prontas/,
      }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Manutenção e risco. Reparos e ações críticas",
      }),
    );
    expect(
      screen.getByRole("heading", { name: "Reparos e ações críticas" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Recolher Reparos e ações críticas" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Excluir todos os feeds" })).toBeInTheDocument();
  });

  it("renders standardized section headers and workspace footer", async () => {
    const { container } = render(
      <FeedManager
        currentFeeds={testFeeds}
        setFeeds={vi.fn()}
        closeModal={vi.fn()}
      />,
    );

    expect(container.querySelector(".feed-manager-section-header")).not.toBeNull();
    expect(
      screen.getByRole("contentinfo", { name: "Resumo do gerenciador" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Personal News v/)).toBeInTheDocument();
    expect(screen.getByText("Desenvolvimento")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Fechar gerenciador de feeds" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Operações. Intercâmbio, reparos e risco",
      }),
    );
    expect(
      screen.getByRole("heading", { name: "Escolha o tipo de intervenção" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Diagnóstico. Saúde, infraestrutura e relatórios",
      }),
    );
    expect(
      screen.getByRole("heading", { name: "Diagnóstico em camadas" }),
    ).toBeInTheDocument();
    const diagnosticsOverview = container.querySelector(
      "#feed-manager-section-diagnostics-overview",
    );
    expect(diagnosticsOverview).not.toBeNull();
    expect(within(diagnosticsOverview as HTMLElement).getByText("Investigar fontes")).toBeInTheDocument();
    expect(
      within(diagnosticsOverview as HTMLElement).getByText(
        "Ver rotas de carregamento",
      ),
    ).toBeInTheDocument();
    expect(within(diagnosticsOverview as HTMLElement).getByText("Exportar diagnóstico")).toBeInTheDocument();
    expect(within(diagnosticsOverview as HTMLElement).queryByText(/rotas saudáveis/i)).not.toBeInTheDocument();
    expect(within(diagnosticsOverview as HTMLElement).queryByText(/requisições/i)).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Relatórios. Exportação de diagnóstico",
      }),
    );
    expect(
      screen.getByRole("button", { name: "Recolher Relatórios" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Coleção. Fontes, entrada e organização",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Quarentena. Feeds preservados fora da carga",
      }),
    );
    expect(
      screen.getAllByRole("heading", { name: "Quarentena" }).length,
    ).toBeGreaterThan(0);
    expect(container.querySelectorAll(".feed-manager-anchor-section").length).toBeGreaterThan(
      0,
    );
  });

  it("maps persisted proxy focus to the infrastructure route", async () => {
    window.sessionStorage.setItem(
      "feed-manager-focus",
      JSON.stringify({ tab: "diagnostics", openProxySettings: true }),
    );

    render(
      <FeedManager
        currentFeeds={testFeeds}
        setFeeds={vi.fn()}
        closeModal={vi.fn()}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Backend, proxies e rotas" }),
      ).toBeInTheDocument(),
    );
  });

  it("shows a strong delete-all confirmation and preserves feeds on cancel", async () => {
    const setFeeds = vi.fn();

    render(
      <FeedManager
        currentFeeds={testFeeds}
        setFeeds={setFeeds}
        closeModal={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Operações. Intercâmbio, reparos e risco",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Manutenção e risco. Reparos e ações críticas",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Excluir todos os feeds" }));

    await waitFor(() => expect(mocks.confirmDanger).toHaveBeenCalledTimes(1));
    expect(mocks.confirmDanger.mock.calls[0][0]).toMatchObject({
      title: "Excluir todos os feeds",
      confirmText: "Excluir todos",
      cancelText: "Manter coleção",
      impact:
        "A coleção ficará vazia. Esta ação não pode ser desfeita pelo aplicativo.",
    });
    expect(setFeeds).not.toHaveBeenCalled();
  });

  it("keeps affected diagnostics as an attention list inside feed health", () => {
    render(
      <FeedAnalytics
        feeds={testFeeds}
        articles={[]}
        view="all"
        feedValidations={
          new Map([
            [
              "https://one.example/rss",
              {
                url: "https://one.example/rss",
                isValid: false,
                status: "network_error",
                error: "Falha de rede",
                lastChecked: Date.now(),
                validationAttempts: [],
                suggestions: [],
                totalRetries: 0,
                totalValidationTime: 0,
              },
            ],
          ])
        }
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Lista de atenção" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Feeds afetados")).not.toBeInTheDocument();
  });

  it("empties feeds after confirming delete-all", async () => {
    const setFeeds = vi.fn();
    mocks.confirmDanger.mockResolvedValueOnce(true);

    render(
      <FeedManager
        currentFeeds={testFeeds}
        setFeeds={setFeeds}
        closeModal={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Operações. Intercâmbio, reparos e risco",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Manutenção e risco. Reparos e ações críticas",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Excluir todos os feeds" }));

    await waitFor(() => expect(setFeeds).toHaveBeenCalledTimes(1));
    expect(setFeeds.mock.calls[0][0]).toEqual([]);
  });

  it("requires confirmation before deleting selected feeds from cleanup", async () => {
    window.localStorage.setItem(
      "feed-error-history",
      JSON.stringify([
        {
          url: "https://one.example/rss",
          failures: 3,
          lastError: Date.now(),
          lastErrorType: "timeout",
        },
      ]),
    );
    const onRemoveFeeds = vi.fn();

    render(
      <FeedCleanupModal
        isOpen
        feeds={testFeeds}
        onClose={vi.fn()}
        onRemoveFeeds={onRemoveFeeds}
      />,
    );

    await screen.findByText("One");
    fireEvent.click(screen.getByLabelText("Selecionar Todos"));
    fireEvent.click(screen.getByRole("button", { name: "Excluir (1)" }));

    await waitFor(() => expect(mocks.confirmDanger).toHaveBeenCalledTimes(1));
    expect(mocks.confirmDanger.mock.calls[0][0]).toMatchObject({
      title: "Remover 1 feed",
      confirmText: "Remover 1 feed",
      cancelText: "Manter feeds",
      details: ["One"],
    });
    expect(onRemoveFeeds).not.toHaveBeenCalled();
  });

  it("uses strong category delete and reset copy inside Feed Manager categories", async () => {
    render(
      <FeedCategoryManager
        feeds={testFeeds}
        setFeeds={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTitle("Delete Tech"));

    await waitFor(() => expect(mocks.confirmDanger).toHaveBeenCalledTimes(1));
    expect(mocks.confirmDanger.mock.calls[0][0]).toMatchObject({
      title: "Excluir categoria",
      confirmText: "Excluir categoria",
      impact:
        'A categoria será removida e 2 feeds serão movidos para "Sem categoria".',
      details: ["One", "Two"],
    });

    mocks.confirmDanger.mockClear();
    fireEvent.click(screen.getByRole("button", { name: /Mais ações/ }));
    fireEvent.click(screen.getByRole("button", { name: "Resetar" }));

    await waitFor(() => expect(mocks.confirmDanger).toHaveBeenCalledTimes(1));
    expect(mocks.confirmDanger.mock.calls[0][0]).toMatchObject({
      title: "Restaurar categorias padrão",
      confirmText: "Restaurar padrões",
      cancelText: "Manter categorias",
      details: ["Tech"],
    });
  });

  it("shows explicit duplicate replacement impact", () => {
    render(
      <FeedDuplicateModal
        isOpen
        onAddAnyway={vi.fn()}
        onClose={vi.fn()}
        onReplace={vi.fn()}
        existingFeed={testFeeds[0]}
        newFeedUrl="https://new.example/rss"
        confidence={0.95}
      />,
    );

    expect(screen.getByRole("button", { name: "Substituir existente" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "O feed existente será removido antes de adicionar o novo endereço.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Atual: https://one.example/rss")).toBeInTheDocument();
    expect(screen.getByText("Novo: https://new.example/rss")).toBeInTheDocument();
  });

  it("keeps localized duplicate action labels when replacement copy exists", () => {
    mocks.translations["feeds.action.cancel_dont_add"] = "Cancel - Do Not Add";
    mocks.translations["feeds.action.replace"] = "Replace Existing";
    mocks.translations["feeds.duplicate.current"] = "Current";
    mocks.translations["feeds.duplicate.replace_impact"] =
      "The existing feed will be removed before adding the new URL.";
    mocks.translations["feeds.duplicate.replacement"] = "New";

    render(
      <FeedDuplicateModal
        isOpen
        onAddAnyway={vi.fn()}
        onClose={vi.fn()}
        onReplace={vi.fn()}
        existingFeed={testFeeds[0]}
        newFeedUrl="https://new.example/rss"
        confidence={0.95}
      />,
    );

    expect(screen.getByRole("button", { name: "Replace Existing" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel - Do Not Add" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "The existing feed will be removed before adding the new URL.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Current: https://one.example/rss")).toBeInTheDocument();
    expect(screen.getByText("New: https://new.example/rss")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Substituir feed" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Manter existente" })).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "O feed existente será removido antes de adicionar o novo endereço.",
      ),
    ).not.toBeInTheDocument();
  });
});
