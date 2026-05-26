import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { mediaPlaybackReducer } from "../services/mediaPlaybackReducer";
import { useMediaPreferences } from "../hooks/useMediaPreferences";
import {
  DEFAULT_MEDIA_STATE,
  MediaOrigin,
  MediaPreferences,
  MediaState,
  PlaybackRate,
  PodcastPayload,
  VideoAnchorRect,
  VideoPayload,
} from "../types/media";

interface MediaPlaybackContextValue {
  state: MediaState;
  preferences: MediaPreferences;
  playbackRates: PlaybackRate[];
  audioRef: React.RefObject<HTMLAudioElement | null>;
  playPodcast: (payload: PodcastPayload) => Promise<void>;
  togglePodcast: () => Promise<void>;
  pausePodcast: () => void;
  seekPodcast: (time: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (playbackRate: PlaybackRate) => void;
  openVideoDocked: (payload: VideoPayload, anchorRect?: VideoAnchorRect) => void;
  setVideoAnchorRect: (rect?: VideoAnchorRect) => void;
  detachVideo: () => void;
  minimize: () => void;
  expand: () => void;
  close: () => void;
  requestFocusForLink: (articleLink: string) => void;
  registerMediaItem: (
    articleLink: string,
    callback: () => void,
  ) => () => void;
}

const MediaPlaybackContext = createContext<
  MediaPlaybackContextValue | undefined
>(undefined);

const PLAYBACK_ERROR_MESSAGE =
  "Não foi possível iniciar o áudio. Verifique sua conexão ou tente outro episódio.";
const LOAD_ERROR_MESSAGE = "Não foi possível carregar o áudio deste episódio.";

const createIframeKey = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `media-iframe-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const MediaPlaybackProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(
    mediaPlaybackReducer,
    DEFAULT_MEDIA_STATE,
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const iframeKeyRef = useRef<string | null>(null);
  const pendingFocusRef = useRef<Set<string>>(new Set());
  const focusRegistryRef = useRef<Map<string, () => void>>(new Map());
  const stateRef = useRef(state);
  const { preferences, playbackRates, setVolume, setPlaybackRate } =
    useMediaPreferences();

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const requestFocusForLink = useCallback((articleLink: string) => {
    const callback = focusRegistryRef.current.get(articleLink);
    if (callback) {
      window.setTimeout(callback, 50);
      return;
    }
    pendingFocusRef.current.add(articleLink);
  }, []);

  const registerMediaItem = useCallback(
    (articleLink: string, callback: () => void) => {
      focusRegistryRef.current.set(articleLink, callback);

      if (pendingFocusRef.current.has(articleLink)) {
        pendingFocusRef.current.delete(articleLink);
        window.setTimeout(callback, 50);
      }

      return () => {
        const current = focusRegistryRef.current.get(articleLink);
        if (current === callback) {
          focusRegistryRef.current.delete(articleLink);
        }
      };
    },
    [],
  );

  const releaseAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = "";
    audio.load();
  }, []);

  const close = useCallback(() => {
    if (stateRef.current.kind === "podcast") {
      releaseAudio();
    }
    iframeKeyRef.current = null;
    dispatch({ type: "CLOSE" });
  }, [releaseAudio]);

  const playPodcast = useCallback(
    async (payload: PodcastPayload) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (stateRef.current.kind === "video") {
        iframeKeyRef.current = null;
      }

      dispatch({ type: "PLAY_PODCAST", payload });

      if (audio.src !== payload.src) {
        audio.pause();
        audio.src = payload.src;
        audio.load();
      }

      audio.volume = preferences.volume;
      audio.playbackRate = preferences.playbackRate;

      try {
        await audio.play();
        dispatch({ type: "PODCAST_PLAYING" });
      } catch {
        dispatch({ type: "AUDIO_ERROR", payload: PLAYBACK_ERROR_MESSAGE });
      }
    },
    [preferences.playbackRate, preferences.volume],
  );

  const togglePodcast = useCallback(async () => {
    const audio = audioRef.current;
    const current = stateRef.current;
    if (!audio || current.kind !== "podcast") return;

    if (current.status === "playing") {
      audio.pause();
      dispatch({ type: "PAUSE_PODCAST" });
      return;
    }

    try {
      await audio.play();
      dispatch({ type: "PODCAST_PLAYING" });
    } catch {
      dispatch({ type: "AUDIO_ERROR", payload: PLAYBACK_ERROR_MESSAGE });
    }
  }, []);

  const pausePodcast = useCallback(() => {
    if (stateRef.current.kind !== "podcast") return;
    audioRef.current?.pause();
    dispatch({ type: "PAUSE_PODCAST" });
  }, []);

  const seekPodcast = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      audio.currentTime = time;
      dispatch({
        type: "AUDIO_TIMEUPDATE",
        payload: {
          currentTime: audio.currentTime || 0,
          duration: audio.duration || 0,
        },
      });
    } catch {
      dispatch({ type: "AUDIO_SEEK_LIMITED" });
    }
  }, []);

  const openVideoDocked = useCallback(
    (payload: VideoPayload, anchorRect?: VideoAnchorRect) => {
      if (stateRef.current.kind === "podcast") {
        releaseAudio();
      }

      const replacingVideo =
        stateRef.current.kind === "video" &&
        stateRef.current.iframeSrc !== payload.iframeSrc;

      if (iframeKeyRef.current === null || replacingVideo) {
        iframeKeyRef.current = createIframeKey();
      }

      dispatch({
        type: "OPEN_VIDEO_DOCKED",
        payload,
        iframeKey: iframeKeyRef.current,
        replace: replacingVideo,
      });

      if (anchorRect) {
        dispatch({ type: "SET_VIDEO_ANCHOR_RECT", payload: anchorRect });
      }
    },
    [releaseAudio],
  );

  const setVideoAnchorRect = useCallback((rect?: VideoAnchorRect) => {
    dispatch({ type: "SET_VIDEO_ANCHOR_RECT", payload: rect });
  }, []);

  const detachVideo = useCallback(() => {
    dispatch({ type: "DETACH_VIDEO" });
  }, []);

  const minimize = useCallback(() => {
    dispatch({ type: "MINIMIZE" });
  }, []);

  const expand = useCallback(() => {
    dispatch({ type: "EXPAND" });
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = preferences.volume;
    audio.playbackRate = preferences.playbackRate;
  }, [preferences.playbackRate, preferences.volume]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      const audio = audioRef.current;
      const current = stateRef.current;
      if (!audio || current.kind !== "podcast" || current.status !== "playing") {
        return;
      }
      if (!audio.paused) return;

      audio.play().catch(() => {
        dispatch({ type: "AUDIO_EXTERNALLY_PAUSED" });
      });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    if (state.kind !== "podcast") {
      navigator.mediaSession.metadata = null;
      return;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: state.title,
      artist: state.origin.sourceTitle,
      artwork: state.artworkUrl
        ? [{ src: state.artworkUrl, sizes: "512x512" }]
        : undefined,
    });

    navigator.mediaSession.setActionHandler("play", () => {
      void togglePodcast();
    });
    navigator.mediaSession.setActionHandler("pause", pausePodcast);
    navigator.mediaSession.setActionHandler("seekbackward", () => {
      const audio = audioRef.current;
      if (audio) seekPodcast(Math.max(0, audio.currentTime - 15));
    });
    navigator.mediaSession.setActionHandler("seekforward", () => {
      const audio = audioRef.current;
      if (audio) seekPodcast(Math.min(audio.duration || 0, audio.currentTime + 15));
    });

    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("seekbackward", null);
      navigator.mediaSession.setActionHandler("seekforward", null);
    };
  }, [pausePodcast, seekPodcast, state, togglePodcast]);

  const value = useMemo<MediaPlaybackContextValue>(
    () => ({
      state,
      preferences,
      playbackRates,
      audioRef,
      playPodcast,
      togglePodcast,
      pausePodcast,
      seekPodcast,
      setVolume,
      setPlaybackRate,
      openVideoDocked,
      setVideoAnchorRect,
      detachVideo,
      minimize,
      expand,
      close,
      requestFocusForLink,
      registerMediaItem,
    }),
    [
      state,
      preferences,
      playbackRates,
      playPodcast,
      togglePodcast,
      pausePodcast,
      seekPodcast,
      setVolume,
      setPlaybackRate,
      openVideoDocked,
      setVideoAnchorRect,
      detachVideo,
      minimize,
      expand,
      close,
      requestFocusForLink,
      registerMediaItem,
    ],
  );

  return (
    <MediaPlaybackContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        onLoadedMetadata={(event) =>
          dispatch({
            type: "AUDIO_TIMEUPDATE",
            payload: {
              currentTime: event.currentTarget.currentTime || 0,
              duration: event.currentTarget.duration || 0,
            },
          })
        }
        onTimeUpdate={(event) =>
          dispatch({
            type: "AUDIO_TIMEUPDATE",
            payload: {
              currentTime: event.currentTarget.currentTime || 0,
              duration: event.currentTarget.duration || 0,
            },
          })
        }
        onEnded={() => dispatch({ type: "AUDIO_ENDED" })}
        onError={() =>
          dispatch({ type: "AUDIO_ERROR", payload: LOAD_ERROR_MESSAGE })
        }
        className="hidden"
      />
    </MediaPlaybackContext.Provider>
  );
};

export const useMediaPlayback = () => {
  const context = useContext(MediaPlaybackContext);
  if (!context) {
    throw new Error(
      "useMediaPlayback must be used within a MediaPlaybackProvider",
    );
  }
  return context;
};

export const buildMediaOriginFromArticle = (
  article: {
    link: string;
    sourceTitle: string;
    feedUrl?: string;
  },
  categoryId: string,
): MediaOrigin => ({
  categoryId,
  articleLink: article.link,
  feedUrl: article.feedUrl,
  sourceTitle: article.sourceTitle,
});
