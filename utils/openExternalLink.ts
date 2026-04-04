type TauriInvoke = (
  command: string,
  args?: Record<string, unknown>,
) => Promise<unknown>;

type TauriWindow = Window & {
  __TAURI__?: {
    core?: {
      invoke?: TauriInvoke;
    };
    invoke?: TauriInvoke;
  };
  __TAURI_INTERNALS__?: {
    invoke?: TauriInvoke;
  };
};

const resolveTauriInvoke = (): TauriInvoke | null => {
  if (typeof window === "undefined") return null;

  const tauriWindow = window as TauriWindow;
  return (
    tauriWindow.__TAURI_INTERNALS__?.invoke ||
    tauriWindow.__TAURI__?.core?.invoke ||
    tauriWindow.__TAURI__?.invoke ||
    null
  );
};

export async function openExternalLink(url: string): Promise<void> {
  if (!url || typeof window === "undefined") return;

  const invoke = resolveTauriInvoke();
  if (invoke) {
    try {
      await invoke("open_external_url", { url });
      return;
    } catch (error) {
      console.warn("[external-link] failed to use desktop opener", error);
    }
  }

  const externalWindow = window.open(url, "_blank", "noopener,noreferrer");
  if (externalWindow) {
    externalWindow.opener = null;
    return;
  }

  window.location.assign(url);
}
