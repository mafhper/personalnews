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

    expect(onConfirm.mock.calls[0][0][0]).toMatchObject({
      id: "ready",
      categoryOverrideId: "design",
    });
  });
});
