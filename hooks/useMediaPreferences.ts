import { useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import {
  DEFAULT_MEDIA_PREFERENCES,
  MediaPreferences,
  PlaybackRate,
} from "../types/media";

const MEDIA_PREFERENCES_STORAGE_KEY = "media-playback-preferences";
const PLAYBACK_RATES: PlaybackRate[] = [0.5, 0.75, 1, 1.25, 1.5, 2];

const clampVolume = (value: unknown) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_MEDIA_PREFERENCES.volume;
  }
  return Math.min(1, Math.max(0, value));
};

const normalizeRate = (value: unknown): PlaybackRate => {
  return PLAYBACK_RATES.includes(value as PlaybackRate)
    ? (value as PlaybackRate)
    : DEFAULT_MEDIA_PREFERENCES.playbackRate;
};

const normalizePreferences = (
  preferences: MediaPreferences,
): MediaPreferences => ({
  volume: clampVolume(preferences.volume),
  playbackRate: normalizeRate(preferences.playbackRate),
});

export const useMediaPreferences = () => {
  const [storedPreferences, setStoredPreferences] =
    useLocalStorage<MediaPreferences>(
      MEDIA_PREFERENCES_STORAGE_KEY,
      DEFAULT_MEDIA_PREFERENCES,
    );

  const preferences = useMemo(
    () => normalizePreferences(storedPreferences),
    [storedPreferences],
  );

  const setVolume = (volume: number) => {
    setStoredPreferences((current) =>
      normalizePreferences({
        ...current,
        volume,
      }),
    );
  };

  const setPlaybackRate = (playbackRate: PlaybackRate) => {
    setStoredPreferences((current) =>
      normalizePreferences({
        ...current,
        playbackRate,
      }),
    );
  };

  return {
    preferences,
    playbackRates: PLAYBACK_RATES,
    setVolume,
    setPlaybackRate,
  };
};
