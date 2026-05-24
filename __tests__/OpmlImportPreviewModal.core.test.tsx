import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OpmlImportPreviewModal } from "../components/FeedManager/OpmlImportPreviewModal";
import type { ImportCandidate } from "../services/opmlImportPreview";
import type { FeedCategory } from "../types";

const categories: FeedCategory[] = [
  { id: "tech", name: "Tecnologia", color: "#3B82F6", order: 1 },
  { id: "design", name: "Design", color: "#F97316", order: 2 },
];

const makeCandidate = (
  overrides: Partial<ImportCandidate>,
): ImportCandidate => ({
  id: "candidate-1",
  url: "https://example.com/rss",
  normalizedUrl: "https://example.com/rss",
  suggestedTitle: "Example",
  suggestedCategoryName: "Tecnologia",
  suggestedCategoryId: "tech",
  hideFromAll: false,
  isDuplicate: false,
  isDuplicateInFile: false,
  decision: "import",
  status: "ready",
  ...overrides,
});

describe("OpmlImportPreviewModal", () => {
  it("keeps confirmation in memory until the user imports selected candidates", () => {
    const onConfirm = vi.fn();
    render(
      <OpmlImportPreviewModal
        isOpen
        candidates={[
          makeCandidate({ id: "ready" }),
          makeCandidate({
            id: "duplicate",
            url: "https://existing.example.com/rss",
            normalizedUrl: "https://existing.example.com/rss",
            isDuplicate: true,
            duplicateOfUrl: "https://existing.example.com/rss",
            decision: "ignore",
            status: "duplicate",
          }),
          makeCandidate({
            id: "invalid",
            url: "not a url",
            normalizedUrl: "",
            decision: "ignore",
            status: "invalid-url",
          }),
        ]}
        categories={categories}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByText("Revisar OPML")).toBeInTheDocument();
    expect(screen.getByText("1 de 3 feeds marcados para importar.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Importar selecionados" }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { name: "Confirmar importação" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Tecnologia")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Confirmar importação" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm.mock.calls[0][0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "ready", decision: "import" }),
        expect.objectContaining({ id: "duplicate", decision: "ignore" }),
      ]),
    );
  });

  it("applies an existing category to selected candidates", () => {
    const onConfirm = vi.fn();
    render(
      <OpmlImportPreviewModal
        isOpen
        candidates={[makeCandidate({ id: "ready" })]}
        categories={categories}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    const [batchCategorySelect] = screen.getAllByRole("combobox");
    fireEvent.change(batchCategorySelect, { target: { value: "design" } });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));
    fireEvent.click(screen.getByRole("button", { name: "Importar selecionados" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar importação" }));

    expect(onConfirm.mock.calls[0][0][0]).toMatchObject({
      id: "ready",
      categoryOverrideId: "design",
      categoryOverrideCleared: false,
    });
  });

  it("can hide selected imports from All while keeping them in their category", () => {
    const onConfirm = vi.fn();
    render(
      <OpmlImportPreviewModal
        isOpen
        candidates={[makeCandidate({ id: "ready" })]}
        categories={categories}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Ocultar selecionados da All" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Importar selecionados" }));

    expect(screen.getByText("Ocultos da All")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar importação" }));

    expect(onConfirm.mock.calls[0][0][0]).toMatchObject({
      id: "ready",
      suggestedCategoryId: "tech",
      hideFromAll: true,
    });
  });

  it("keeps Sem categoria as an explicit override for suggested categories", () => {
    const onConfirm = vi.fn();
    render(
      <OpmlImportPreviewModal
        isOpen
        candidates={[makeCandidate({ id: "ready" })]}
        categories={categories}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    const [, candidateCategorySelect] = screen.getAllByRole("combobox");
    expect(candidateCategorySelect).toHaveValue("id:tech");

    fireEvent.change(candidateCategorySelect, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Importar selecionados" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar importação" }));

    expect(onConfirm.mock.calls[0][0][0]).toMatchObject({
      id: "ready",
      categoryOverrideCleared: true,
      categoryOverrideId: undefined,
      categoryOverrideName: undefined,
    });
  });

  it("guards import confirmation while a submit is pending", () => {
    let resolveImport: (() => void) | undefined;
    const onConfirm = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveImport = resolve;
        }),
    );
    render(
      <OpmlImportPreviewModal
        isOpen
        candidates={[makeCandidate({ id: "ready" })]}
        categories={categories}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(screen.getByRole("button", {
      name: "Importar selecionados",
    }));
    const confirmButton = screen.getByRole("button", {
      name: "Confirmar importação",
    });
    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(confirmButton).toBeDisabled();
    expect(screen.getByRole("button", { name: "Importando..." })).toBeDisabled();
    resolveImport?.();
  });

  it("returns to edit without losing draft changes", () => {
    const onConfirm = vi.fn();
    render(
      <OpmlImportPreviewModal
        isOpen
        candidates={[makeCandidate({ id: "ready" })]}
        categories={categories}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    const titleInput = screen.getByDisplayValue("Example");
    fireEvent.change(titleInput, { target: { value: "Edited title" } });
    fireEvent.click(screen.getByRole("button", { name: "Importar selecionados" }));
    fireEvent.click(screen.getByRole("button", { name: "Voltar para editar" }));

    expect(screen.getByDisplayValue("Edited title")).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("defaults large OPML imports to not loading immediately", () => {
    const candidates = Array.from({ length: 51 }, (_, index) =>
      makeCandidate({
        id: `ready-${index}`,
        url: `https://example.com/${index}.xml`,
        normalizedUrl: `https://example.com/${index}.xml`,
        suggestedTitle: `Feed ${index}`,
      }),
    );

    render(
      <OpmlImportPreviewModal
        isOpen
        candidates={candidates}
        categories={categories}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Importar selecionados" }));

    expect(
      screen.getByText(/Esta importação tem mais de 50 feeds/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", {
        name: /Carregar artigos e episódios agora/i,
      }),
    ).not.toBeChecked();
  });
});
