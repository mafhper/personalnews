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
});
