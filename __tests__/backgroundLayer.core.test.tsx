import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BackgroundLayer } from '../components/BackgroundLayer';
import type { BackgroundConfig, ExtendedTheme } from '../types';

const theme = {
  id: 'seed-blue-light',
  colors: {
    background: '255 255 255',
  },
} as ExtendedTheme;

describe('BackgroundLayer', () => {
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
});
