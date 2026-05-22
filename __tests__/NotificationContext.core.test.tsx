import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NotificationContainer } from "../components/NotificationToast";
import { NotificationProvider } from "../contexts/NotificationContext";
import { useNotification } from "../hooks/useNotification";

const NotificationTrigger: React.FC = () => {
  const { showNotification } = useNotification();

  return (
    <button
      type="button"
      onClick={() => showNotification("Mensagem repetida", { type: "info" })}
    >
      Mostrar notificação
    </button>
  );
};

describe("NotificationProvider", () => {
  it("deduplicates identical active notifications", async () => {
    render(
      <NotificationProvider>
        <NotificationTrigger />
        <NotificationContainer />
      </NotificationProvider>,
    );

    const button = screen.getByRole("button", {
      name: "Mostrar notificação",
    });

    act(() => {
      fireEvent.click(button);
      fireEvent.click(button);
    });

    await waitFor(() =>
      expect(screen.getAllByText("Mensagem repetida")).toHaveLength(1),
    );
  });
});
