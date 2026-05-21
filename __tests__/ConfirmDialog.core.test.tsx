import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "../components/ConfirmDialog";

afterEach(() => {
  cleanup();
});

const renderDialog = (onClose = vi.fn()) => {
  render(
    <ConfirmDialog
      isOpen
      onClose={onClose}
      options={{
        title: "Excluir todos os feeds",
        message: "Excluir todos os 4 feeds da coleção?",
        impact:
          "A coleção ficará vazia. Esta ação não pode ser desfeita pelo aplicativo.",
        details: ["One", "Two"],
        confirmText: "Excluir todos",
        cancelText: "Manter coleção",
        type: "danger",
      }}
    />,
  );
  return onClose;
};

describe("ConfirmDialog", () => {
  it("renders impact details for strong confirmations", () => {
    renderDialog();

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Excluir todos os 4 feeds da coleção?")).toBeInTheDocument();
    expect(
      screen.getByText(
        "A coleção ficará vazia. Esta ação não pode ser desfeita pelo aplicativo.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("One")).toBeInTheDocument();
    expect(screen.getByText("Two")).toBeInTheDocument();
  });

  it("focuses cancel by default", async () => {
    renderDialog();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Manter coleção" })).toHaveFocus(),
    );
  });

  it("cancels with Escape and with the cancel button", () => {
    const onClose = renderDialog();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledWith(false);

    onClose.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Manter coleção" }));
    expect(onClose).toHaveBeenCalledWith(false);
  });

  it("confirms from the explicit destructive button", () => {
    const onClose = renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Excluir todos" }));

    expect(onClose).toHaveBeenCalledWith(true);
  });

  it("returns selected scopes for scoped confirmations", () => {
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        isOpen
        onClose={onClose}
        options={{
          title: "Redefinir dados locais",
          message: "Escolha os dados afetados.",
          confirmText: "Redefinir selecionados",
          type: "danger",
          scopes: [
            { id: "feeds", label: "Todos os feeds cadastrados" },
            { id: "favorites", label: "Favoritos" },
          ],
        }}
      />,
    );

    fireEvent.click(screen.getByLabelText("Favoritos"));
    fireEvent.click(
      screen.getByRole("button", { name: "Redefinir selecionados" }),
    );

    expect(onClose).toHaveBeenCalledWith({
      confirmed: true,
      selectedScopeIds: ["feeds"],
    });
  });

  it("blocks scoped confirmation when every optional scope is unchecked", () => {
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        isOpen
        onClose={onClose}
        options={{
          title: "Redefinir dados locais",
          message: "Escolha os dados afetados.",
          confirmText: "Redefinir selecionados",
          type: "danger",
          scopes: [{ id: "favorites", label: "Favoritos" }],
        }}
      />,
    );

    fireEvent.click(screen.getByLabelText("Favoritos"));

    const confirmButton = screen.getByRole("button", {
      name: "Redefinir selecionados",
    });
    expect(confirmButton).toBeDisabled();
    expect(
      screen.getByText("Selecione pelo menos um item para continuar."),
    ).toBeInTheDocument();
  });

  it("keeps required scopes selected", () => {
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        isOpen
        onClose={onClose}
        options={{
          title: "Confirmar",
          message: "Escolha os dados afetados.",
          confirmText: "Continuar",
          scopes: [{ id: "feeds", label: "Todos os feeds", required: true }],
        }}
      />,
    );

    expect(screen.getByLabelText("Todos os feeds")).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(onClose).toHaveBeenCalledWith({
      confirmed: true,
      selectedScopeIds: ["feeds"],
    });
  });

  it("can expand collapsed scope lists before editing", () => {
    render(
      <ConfirmDialog
        isOpen
        onClose={vi.fn()}
        options={{
          title: "Redefinir dados locais",
          message: "Escolha os dados afetados.",
          scopesCollapsed: true,
          scopes: [
            { id: "feeds", label: "Todos os feeds cadastrados" },
            { id: "favorites", label: "Favoritos" },
          ],
        }}
      />,
    );

    expect(screen.queryByLabelText("Favoritos")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Expandir lista" }));

    expect(screen.getByLabelText("Favoritos")).toBeInTheDocument();
  });
});
