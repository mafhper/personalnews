import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FeedCategoryManager } from "../components/FeedCategoryManager";
import { FeedAnalytics } from "../components/FeedAnalytics";
import { FeedCleanupModal } from "../components/FeedCleanupModal";
import { FeedDuplicateModal } from "../components/FeedDuplicateModal";
import { FeedManager } from "../components/FeedManager";
import { DEFAULT_CURATED_LISTS } from "../config/defaultConfig";
import { ProxyManager, proxyManager } from "../services/proxyManager";
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
  ProxyManager.setRss2jsonApiKey("");
  ProxyManager.setCorsproxyCIOApiKey("");
  ProxyManager.setRoutingMode("full-local");
  mocks.testCategories = [
    { id: "all", name: "Todos", color: "#111111", order: 0, isDefault: true },
    { id: "tech", name: "Tech", color: "#222222", order: 1 },
  ];
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
  it("renders the Portuguese shell with primary page navigation", async () => {
    render(
      <FeedManager
        currentFeeds={testFeeds}
        setFeeds={vi.fn()}
        closeModal={vi.fn()}
        onRefreshFeeds={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Central da Coleção" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Fechar gerenciador de feeds" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Restaurar aparência" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("navigation", {
        name: "Navegação do gerenciador de feeds",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Ações recomendadas" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Estado da coleção" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Total").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Válidos").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Erros").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Quarentena").length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", { name: /Adicionar fonte/ }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /Revalidar coleção/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Nenhum erro e nenhum feed/)).toBeInTheDocument();
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
      screen.getByRole("heading", { name: "Central da Coleção" }),
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
      ).getByRole("button", { name: "Fontes. Feeds, busca e quarentena" }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", {
          name: "Menu de navegação do gerenciador de feeds",
        }),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole("heading", { name: "Fontes da coleção" }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: "Recolher barra lateral" }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Diagnóstico. Saúde e infraestrutura",
      }),
    );
    expect(
      screen.getByRole("heading", { name: "Infraestrutura e proxies" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Proxies de terceiros"),
    ).toBeInTheDocument();
  });

  it("opens sources and organization as significant primary pages", async () => {
    const { container } = render(
      <FeedManager
        currentFeeds={testFeeds}
        setFeeds={vi.fn()}
        closeModal={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Fontes. Feeds, busca e quarentena",
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Fontes da coleção" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Adicionar uma fonte" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Listas curadas")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Organização. Categorias",
      }),
    );
    expect(
      screen.getByRole("heading", { name: "Categorias" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Clique para expandir/),
    ).toBeInTheDocument();
    expect(screen.getByText("Feeds sem categoria")).toBeInTheDocument();
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
        name: "Manutenção. Backup, reparos e risco",
      }),
    );
    expect(
      screen.getByRole("heading", { name: "Manutenção" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Próximo passo:")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Backup e transporte" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", {
      name: "Navegação do gerenciador de feeds",
    })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Listas curadas. Coleções prontas",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Zona de risco. Ações destrutivas",
      }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Backup e transporte")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Backup e transporte" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Importar OPML/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /Listas curadas.*Mescle coleções prontas/,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Reparos" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Restaurar categorias/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Excluir todos os feeds" })).toBeInTheDocument();
  });

  it("renders standardized page titles and workspace footer", async () => {
    const { container } = render(
      <FeedManager
        currentFeeds={testFeeds}
        setFeeds={vi.fn()}
        closeModal={vi.fn()}
      />,
    );

    expect(container.querySelector(".feed-manager-page-title")).not.toBeNull();
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
        name: "Manutenção. Backup, reparos e risco",
      }),
    );
    expect(
      screen.getByRole("heading", { name: "Manutenção" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Diagnóstico. Saúde e infraestrutura",
      }),
    );
    expect(
      screen.getByRole("heading", { name: "Saúde dos feeds" }),
    ).toBeInTheDocument();
    const diagnosticsOverview = container.querySelector(
      ".collection-central-page--diagnostics",
    );
    expect(diagnosticsOverview).not.toBeNull();
    expect(within(diagnosticsOverview as HTMLElement).getByText("Status geral")).toBeInTheDocument();
    expect(
      within(diagnosticsOverview as HTMLElement).getByText(
        "Infraestrutura e proxies",
      ),
    ).toBeInTheDocument();
    expect(within(diagnosticsOverview as HTMLElement).getByText("Relatórios")).toBeInTheDocument();
    expect(within(diagnosticsOverview as HTMLElement).queryByText(/rotas saudáveis/i)).not.toBeInTheDocument();
    expect(within(diagnosticsOverview as HTMLElement).getByText(/requisições/i)).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Relatórios" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Fontes. Feeds, busca e quarentena",
      }),
    );
    expect(
      screen.getAllByRole("heading", { name: "Adicionar uma fonte" }).length,
    ).toBeGreaterThan(0);
    expect(container.querySelectorAll(".feed-manager-page-title").length).toBeGreaterThan(
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
        screen.getByRole("heading", { name: "Infraestrutura e proxies" }),
      ).toBeInTheDocument(),
    );
  });

  it("filters curated lists and imports only selected feeds on merge", async () => {
    const setFeeds = vi.fn();
    const [listName, listFeeds] = Object.entries(DEFAULT_CURATED_LISTS)[0];
    const firstFeed = listFeeds[0];

    render(
      <FeedManager
        currentFeeds={[]}
        setFeeds={setFeeds}
        closeModal={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Fontes. Feeds, busca e quarentena",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ver todas" }));

    const dialog = screen.getByRole("dialog", { name: "Listas curadas" });
    expect(dialog).toBeInTheDocument();
    expect(screen.getAllByText(listName).length).toBeGreaterThan(0);

    fireEvent.change(screen.getByPlaceholderText("Buscar nesta lista"), {
      target: { value: firstFeed.customTitle || firstFeed.url },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(firstFeed.customTitle || firstFeed.url, "i"),
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Mesclar" }));

    await waitFor(() => expect(setFeeds).toHaveBeenCalledTimes(1));
    const importedFeeds = setFeeds.mock.calls[0][0] as FeedSource[];
    expect(importedFeeds).toHaveLength(listFeeds.length - 1);
    expect(importedFeeds.some((feed) => feed.url === firstFeed.url)).toBe(false);
  });

  it("keeps destructive confirmation for curated replace with selected count", async () => {
    const setFeeds = vi.fn();
    const [listName, listFeeds] = Object.entries(DEFAULT_CURATED_LISTS)[0];
    mocks.confirmDanger.mockResolvedValueOnce(false);

    render(
      <FeedManager
        currentFeeds={testFeeds}
        setFeeds={setFeeds}
        closeModal={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Fontes. Feeds, busca e quarentena",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Ver todas" }));
    fireEvent.click(screen.getByRole("button", { name: "Substituir coleção" }));

    await waitFor(() => expect(mocks.confirmDanger).toHaveBeenCalledTimes(1));
    expect(mocks.confirmDanger.mock.calls[0][0]).toMatchObject({
      title: "Substituir coleção",
      message: `Substituir a coleção atual pela lista "${listName}"?`,
      confirmText: "Substituir coleção",
      cancelText: "Manter coleção",
      type: "danger",
    });
    expect(mocks.confirmDanger.mock.calls[0][0].impact).toContain(
      `${listFeeds.length} feeds serão gravados`,
    );
    expect(setFeeds).not.toHaveBeenCalled();
  });

  it("persists proxy mode, local enable state, test action and API key", async () => {
    const testProxySpy = vi.spyOn(proxyManager, "testProxy").mockResolvedValue({
      success: true,
      responseTime: 12,
      detail: "ok",
      route: "client-proxy",
    });

    render(
      <FeedManager
        currentFeeds={testFeeds}
        setFeeds={vi.fn()}
        closeModal={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Diagnóstico. Saúde e infraestrutura",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Web" }));
    expect(window.localStorage.getItem("proxy_route_mode_v1")).toBe(
      "full-external-proxies",
    );

    fireEvent.click(screen.getByRole("button", { name: "Desativar LocalProxy" }));
    expect(
      JSON.parse(window.localStorage.getItem("disabled_proxies") || "[]"),
    ).toContain("LocalProxy");

    fireEvent.click(
      screen.getByRole("button", { name: "Configurar chave de RSS2JSON" }),
    );
    fireEvent.change(screen.getByPlaceholderText("Cole a chave aqui"), {
      target: { value: "abcdefghijklmnop" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() =>
      expect(window.localStorage.getItem("rss2json_api_key")).toBe(
        "abcdefghijklmnop",
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "Testar RSS2JSON" }));
    await waitFor(() => expect(testProxySpy).toHaveBeenCalledWith("RSS2JSON"));
    testProxySpy.mockRestore();
  });

  it("opens the cache policy preview from diagnostics", async () => {
    render(
      <FeedManager
        currentFeeds={testFeeds}
        setFeeds={vi.fn()}
        closeModal={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Diagnóstico. Saúde e infraestrutura",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Política de cache/ }));

    expect(
      screen.getByRole("dialog", { name: "Política de cache" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/placeholder de implementação/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Persistir TTL por coleção e por feed"),
    ).toBeInTheDocument();
  });

  it("reorders categories by the drag handle", async () => {
    mocks.testCategories = [
      { id: "all", name: "Todos", color: "#111111", order: 0, isDefault: true },
      { id: "tech", name: "Tech", color: "#222222", order: 1 },
      { id: "design", name: "Design", color: "#333333", order: 2 },
    ];
    mocks.getCategorizedFeeds.mockReturnValue({
      all: testFeeds,
      tech: testFeeds,
      design: [],
      uncategorized: [],
    });

    render(
      <FeedManager
        currentFeeds={testFeeds}
        setFeeds={vi.fn()}
        closeModal={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Organização. Categorias",
      }),
    );

    const dataTransfer = {
      data: {} as Record<string, string>,
      dropEffect: "move",
      effectAllowed: "move",
      types: [] as string[],
      getData(type: string) {
        return this.data[type] || "";
      },
      setData(type: string, value: string) {
        this.data[type] = value;
        if (!this.types.includes(type)) this.types.push(type);
      },
    };

    fireEvent.dragStart(
      screen.getByRole("button", { name: "Arrastar categoria Tech" }),
      { dataTransfer },
    );
    fireEvent.dragOver(
      screen.getByRole("button", { name: "Arrastar categoria Design" }),
      { dataTransfer },
    );
    fireEvent.drop(
      screen.getByRole("button", { name: "Arrastar categoria Design" }),
      { dataTransfer },
    );

    expect(mocks.reorderCategories).toHaveBeenCalledWith(["design", "tech"]);
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
        name: "Manutenção. Backup, reparos e risco",
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

  it("offers bulk actions for feeds in the attention list", () => {
    const onRetryFeeds = vi.fn();
    const onQuarantineFeeds = vi.fn();
    const onMoveFeedsCategory = vi.fn();

    render(
      <FeedAnalytics
        feeds={testFeeds}
        articles={[]}
        view="all"
        categories={mocks.testCategories}
        onRetryFeeds={onRetryFeeds}
        onQuarantineFeeds={onQuarantineFeeds}
        onMoveFeedsCategory={onMoveFeedsCategory}
        quarantineRecommendedUrls={new Set(["https://one.example/rss"])}
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
            [
              "https://two.example/rss",
              {
                url: "https://two.example/rss",
                isValid: false,
                status: "timeout",
                error: "Tempo esgotado",
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

    fireEvent.click(screen.getAllByLabelText("Selecionar One")[0]);
    fireEvent.click(screen.getByRole("button", { name: "Testar selecionados" }));
    expect(onRetryFeeds).toHaveBeenCalledWith(["https://one.example/rss"]);

    fireEvent.click(
      screen.getByRole("button", { name: "Quarentenar selecionados" }),
    );
    expect(onQuarantineFeeds).toHaveBeenCalledWith(["https://one.example/rss"]);

    fireEvent.change(screen.getByLabelText("Mover selecionados para categoria"), {
      target: { value: "tech" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Mover selecionados" }));
    expect(onMoveFeedsCategory).toHaveBeenCalledWith(
      ["https://one.example/rss"],
      "tech",
    );
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
        name: "Manutenção. Backup, reparos e risco",
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
