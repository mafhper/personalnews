import React, { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ExternalLink,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Undo2,
  X,
} from "lucide-react";
import { useMediaPlayback } from "../contexts/MediaPlaybackContext";
import type { MediaOrigin, PlaybackRate, VideoState } from "../types/media";
import { openExternalLink } from "../utils/openExternalLink";

interface GlobalMediaLayerProps {
  onReturnToOrigin?: (origin: MediaOrigin) => void;
}

const formatPlaybackTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const getPortalRoot = () => {
  if (typeof document === "undefined") return null;
  return document.body;
};

const getVideoStyle = (state: VideoState): React.CSSProperties => {
  if (state.ui === "docked" && state.anchorRect) {
    return {
      position: "fixed",
      left: state.anchorRect.left,
      top: state.anchorRect.top,
      width: state.anchorRect.width,
      height: state.anchorRect.height,
      transform: "translate3d(0, 0, 0)",
    };
  }

  if (state.ui === "minimized") {
    return {
      position: "fixed",
      right: "1rem",
      bottom: "1rem",
      width: "min(18rem, calc(100vw - 2rem))",
      aspectRatio: "16 / 9",
      transform: "translate3d(0, 0, 0)",
    };
  }

  return {
    position: "fixed",
    right: "1rem",
    bottom: "1rem",
    width: "min(28rem, calc(100vw - 2rem))",
    aspectRatio: "16 / 9",
    transform: "translate3d(0, 0, 0)",
  };
};

export const GlobalMediaLayer: React.FC<GlobalMediaLayerProps> = ({
  onReturnToOrigin,
}) => {
  const {
    state,
    preferences,
    playbackRates,
    togglePodcast,
    seekPodcast,
    setVolume,
    setPlaybackRate,
    detachVideo,
    minimize,
    expand,
    close,
  } = useMediaPlayback();
  const playButtonRef = useRef<HTMLButtonElement | null>(null);
  const portalRoot = getPortalRoot();

  useEffect(() => {
    if (state.kind !== "none" && state.ui !== "minimized") {
      playButtonRef.current?.focus();
    }
  }, [state.kind, state.kind === "none" ? undefined : state.ui]);

  const liveLabel = useMemo(() => {
    if (state.kind === "podcast") {
      return `Podcast ativo: ${state.title}`;
    }
    if (state.kind === "video") {
      return `Vídeo ativo: ${state.title}`;
    }
    return "";
  }, [state]);

  if (!portalRoot || state.kind === "none") return null;

  const controls = (
    <>
      <div className="sr-only" aria-live="polite">
        {liveLabel}
      </div>

      {state.kind === "podcast" && (
        <section
          className={`fixed inset-x-3 bottom-4 z-[160] mx-auto border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]/95 shadow-2xl backdrop-blur-xl ${
            state.ui === "minimized"
              ? "max-w-3xl rounded-full p-2"
              : "max-w-screen-2xl rounded-2xl p-4"
          }`}
          role="region"
          aria-label="Player global de podcast"
          data-testid={
            state.ui === "minimized"
              ? "pocketfeeds-player-minimized"
              : "pocketfeeds-player-expanded"
          }
          data-global-media-player="podcast"
        >
          {state.ui === "minimized" ? (
            <div className="flex items-center gap-3">
              <button
                ref={playButtonRef}
                type="button"
                onClick={() => void togglePodcast()}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(var(--color-accent),0.75)] text-white transition-colors hover:bg-[rgb(var(--color-accent))]"
                aria-label={
                  state.status === "playing" ? "Pausar episódio" : "Tocar episódio"
                }
                aria-pressed={state.status === "playing"}
              >
                {state.status === "playing" ? (
                  <Pause className="h-5 w-5" aria-hidden />
                ) : (
                  <Play className="ml-0.5 h-5 w-5" aria-hidden />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[rgb(var(--color-text))]">
                  {state.title}
                </p>
                <p className="truncate text-xs text-[rgb(var(--color-textSecondary))]">
                  {state.origin.sourceTitle} •{" "}
                  {formatPlaybackTime(state.currentTime)}
                </p>
              </div>

              <div className="flex flex-shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={expand}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[rgb(var(--color-textSecondary))] transition-colors hover:bg-[rgba(var(--color-text),0.08)] hover:text-[rgb(var(--color-text))]"
                  aria-label="Expandir player"
                  title="Expandir player"
                >
                  <Maximize2 className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[rgb(var(--color-textSecondary))] transition-colors hover:bg-[rgba(var(--color-text),0.08)] hover:text-[rgb(var(--color-text))]"
                  aria-label="Fechar player e parar reprodução"
                  title="Fechar player e parar reprodução"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <button
                ref={playButtonRef}
                type="button"
                onClick={() => void togglePodcast()}
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(var(--color-accent),0.75)] text-white transition-colors hover:bg-[rgb(var(--color-accent))]"
                aria-label={
                  state.status === "playing" ? "Pausar episódio" : "Tocar episódio"
                }
                aria-pressed={state.status === "playing"}
              >
                {state.status === "playing" ? (
                  <Pause className="h-5 w-5" aria-hidden />
                ) : (
                  <Play className="ml-0.5 h-5 w-5" aria-hidden />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[rgb(var(--color-text))]">
                      {state.title}
                    </p>
                    <p className="truncate text-xs text-[rgb(var(--color-textSecondary))]">
                      {state.origin.sourceTitle}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-xs tabular-nums text-[rgb(var(--color-textSecondary))]">
                    {formatPlaybackTime(state.currentTime)} /{" "}
                    {formatPlaybackTime(state.duration)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={state.duration || 0}
                  step={1}
                  value={
                    state.duration
                      ? Math.min(state.currentTime, state.duration)
                      : 0
                  }
                  onChange={(event) =>
                    seekPodcast(Number(event.currentTarget.value))
                  }
                  className="w-full accent-[rgb(var(--color-accent))]"
                  aria-label="Posição da reprodução"
                  aria-valuemin={0}
                  aria-valuemax={state.duration || 0}
                  aria-valuenow={state.currentTime}
                  aria-valuetext={`${formatPlaybackTime(
                    state.currentTime,
                  )} de ${formatPlaybackTime(state.duration)}`}
                  disabled={state.seekStatus === "limited" || !state.duration}
                />
                {state.seekStatus === "limited" && (
                  <p className="mt-2 text-xs text-[rgb(var(--color-textSecondary))]">
                    Este episódio permite reprodução, mas limita avanço manual.
                  </p>
                )}
                {state.errorMessage && (
                  <p className="mt-2 text-xs text-red-300" role="status">
                    {state.errorMessage}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-[rgb(var(--color-textSecondary))] sm:flex sm:items-center">
                <label className="flex items-center gap-2">
                  <span>Volume</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={preferences.volume}
                    onChange={(event) =>
                      setVolume(Number(event.currentTarget.value))
                    }
                    className="w-24 accent-[rgb(var(--color-accent))]"
                    aria-label="Volume"
                  />
                </label>
                <label className="flex items-center gap-2">
                  <span>Velocidade</span>
                  <select
                    value={preferences.playbackRate}
                    onChange={(event) =>
                      setPlaybackRate(
                        Number(event.currentTarget.value) as PlaybackRate,
                      )
                    }
                    className="rounded-md border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] px-2 py-1 text-[rgb(var(--color-text))]"
                    aria-label="Velocidade de reprodução"
                  >
                    {playbackRates.map((rate) => (
                      <option key={rate} value={rate}>
                        {rate}x
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex flex-shrink-0 items-center gap-1 self-end lg:self-auto">
                {onReturnToOrigin && (
                  <button
                    type="button"
                    onClick={() => onReturnToOrigin(state.origin)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[rgb(var(--color-textSecondary))] transition-colors hover:bg-[rgba(var(--color-text),0.08)] hover:text-[rgb(var(--color-text))]"
                    aria-label="Voltar ao episódio"
                    title="Voltar ao episódio"
                  >
                    <Undo2 className="h-4 w-4" aria-hidden />
                  </button>
                )}
                <button
                  type="button"
                  onClick={minimize}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[rgb(var(--color-textSecondary))] transition-colors hover:bg-[rgba(var(--color-text),0.08)] hover:text-[rgb(var(--color-text))]"
                  aria-label="Minimizar player"
                  title="Minimizar player"
                >
                  <Minimize2 className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[rgb(var(--color-textSecondary))] transition-colors hover:bg-[rgba(var(--color-text),0.08)] hover:text-[rgb(var(--color-text))]"
                  aria-label="Fechar player e parar reprodução"
                  title="Fechar player e parar reprodução"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {state.kind === "video" && (
        <section
          className={`relative z-[210] overflow-hidden border border-[rgb(var(--color-border))] bg-black shadow-2xl transition-transform duration-300 ${
            state.ui === "docked"
              ? "rounded-none"
              : "rounded-[var(--feed-card-radius)]"
          }`}
          style={getVideoStyle(state)}
          role="region"
          aria-label="Player global de vídeo"
          data-testid="global-video-player"
        >
          <iframe
            key={state.iframeKey}
            src={state.iframeSrc}
            className="h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            title={state.title}
          />

          <div className="absolute left-2 right-2 top-2 flex items-center justify-between gap-2">
            <div className="min-w-0 rounded-full bg-black/65 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
              <span className="block truncate">{state.title}</span>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1 rounded-full bg-black/65 p-1 backdrop-blur-md">
              {state.ui === "docked" ? (
                <button
                  type="button"
                  onClick={detachVideo}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/12 hover:text-white"
                  aria-label="Desencaixar vídeo"
                  title="Desencaixar vídeo"
                >
                  <Maximize2 className="h-4 w-4" aria-hidden />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={state.ui === "minimized" ? expand : minimize}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/12 hover:text-white"
                  aria-label={
                    state.ui === "minimized" ? "Expandir vídeo" : "Minimizar vídeo"
                  }
                  title={
                    state.ui === "minimized" ? "Expandir vídeo" : "Minimizar vídeo"
                  }
                >
                  {state.ui === "minimized" ? (
                    <Maximize2 className="h-4 w-4" aria-hidden />
                  ) : (
                    <Minimize2 className="h-4 w-4" aria-hidden />
                  )}
                </button>
              )}
              {onReturnToOrigin && (
                <button
                  type="button"
                  onClick={() => onReturnToOrigin(state.origin)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/12 hover:text-white"
                  aria-label="Voltar ao vídeo"
                  title="Voltar ao vídeo"
                >
                  <Undo2 className="h-4 w-4" aria-hidden />
                </button>
              )}
              <button
                type="button"
                onClick={() => void openExternalLink(state.externalUrl)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/12 hover:text-white"
                aria-label="Abrir vídeo externamente"
                title="Abrir vídeo externamente"
              >
                <ExternalLink className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={close}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/12 hover:text-white"
                aria-label="Fechar vídeo"
                title="Fechar vídeo"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  );

  return createPortal(controls, portalRoot);
};
