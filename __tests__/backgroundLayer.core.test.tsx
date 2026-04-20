import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BackgroundLayer } from '../components/BackgroundLayer';
import type { BackgroundConfig, ExtendedTheme } from '../types';

const backgroundImageStorage = vi.hoisted(() => ({
  loadBackgroundImage: vi.fn(),
}));

vi.mock('../services/backgroundImageStorage', () => ({
  isStoredBackgroundImageRef: (value?: string | null) =>
    Boolean(value?.startsWith('indexeddb:')),
  parseStoredBackgroundImageRef: (value?: string | null) =>
    value?.startsWith('indexeddb:') ? value.slice('indexeddb:'.length) : null,
  loadBackgroundImage: backgroundImageStorage.loadBackgroundImage,
}));

const theme = {
  id: 'seed-blue-light',
  colors: {
    background: '255 255 255',
  },
} as ExtendedTheme;

describe('BackgroundLayer', () => {
  beforeEach(() => {
    backgroundImageStorage.loadBackgroundImage.mockReset();
  });

  it('renders uploaded image backgrounds as an image layer', () => {
    const config: BackgroundConfig = {
      type: 'image',
      value: 'url(data:image/png;base64,abc123)',
      customImage: 'data:image/png;base64,abc123',
    };

    const { container } = render(
      <BackgroundLayer backgroundConfig={config} currentTheme={theme} />,
    );

    const image = container.querySelector('img');
    expect(image).toHaveAttribute('src', 'data:image/png;base64,abc123');
  });

  it('renders legacy image backgrounds saved as css url values', () => {
    const { container } = render(
      <BackgroundLayer
        backgroundConfig={{
          type: 'image',
          value: 'url("data:image/jpeg;base64,legacy")',
          customImage: null,
        }}
        currentTheme={theme}
      />,
    );

    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'data:image/jpeg;base64,legacy',
    );
  });

  it('renders legacy image backgrounds saved as raw data urls', () => {
    const { container } = render(
      <BackgroundLayer
        backgroundConfig={{
          type: 'image',
          value: 'data:image/webp;base64,legacy',
          customImage: null,
        }}
        currentTheme={theme}
      />,
    );

    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'data:image/webp;base64,legacy',
    );
  });

  it('loads uploaded image backgrounds stored outside localStorage', async () => {
    backgroundImageStorage.loadBackgroundImage.mockResolvedValue(
      'data:image/png;base64,stored',
    );

    const { container } = render(
      <BackgroundLayer
        backgroundConfig={{
          type: 'image',
          value: 'indexeddb:uploaded-background',
          customImage: 'indexeddb:uploaded-background',
        }}
        currentTheme={theme}
      />,
    );

    await waitFor(() => {
      expect(container.querySelector('img')).toHaveAttribute(
        'src',
        'data:image/png;base64,stored',
      );
    });
    expect(backgroundImageStorage.loadBackgroundImage).toHaveBeenCalledWith(
      'uploaded-background',
    );
  });
});
