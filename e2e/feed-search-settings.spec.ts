import { test, expect, type Page } from '@playwright/test';

async function openFeed(page: Page) {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await page.goto('/', { waitUntil: 'commit', timeout: 90_000 });
      await page.goto('/#feed', { waitUntil: 'commit', timeout: 90_000 });
      break;
    } catch (error) {
      lastError = error;
      if (attempt === 1) throw error;
      await page.waitForTimeout(1500);
    }
  }

  if (lastError && page.url() === 'about:blank') {
    throw lastError;
  }

  await page.waitForFunction(() => {
    return Boolean(
      document.querySelector(
        'button[aria-label="Configurações"], button[aria-label="Menu"], button[aria-label="Menu de ações"]'
      )
    );
  }, { timeout: 60_000 });
}

async function closeLoadingOverlayIfPresent(page: Page) {
  const closeProgress = page.getByRole('button', { name: /^Fechar$/ }).last();
  if (await closeProgress.isVisible().catch(() => false)) {
    await closeProgress.dispatchEvent('click');
  }
}

async function openActionsMenu(page: Page) {
  await closeLoadingOverlayIfPresent(page);
  const menuToggle = page
    .getByRole('button', { name: /Menu de ações|Menu/i })
    .first();
  await expect(menuToggle).toBeVisible({ timeout: 60_000 });
  await menuToggle.dispatchEvent('click');
}

type HeaderLayoutMetrics = {
  viewportWidth: number;
  viewportClientWidth: number;
  gridTemplateColumns: string;
  headerCenterDelta: number;
  layoutCenterDelta: number;
  viewportCenterDelta: number;
  railActionsGap: number;
  scrollWidth: number;
  clientWidth: number;
};

async function measureHeaderLayout(page: Page): Promise<HeaderLayoutMetrics> {
  return page.evaluate(() => {
    const layout = document.querySelector<HTMLElement>('.feed-header-layout');
    const header = layout?.closest<HTMLElement>('header');
    const rail = document.querySelector<HTMLElement>('.feed-header-category-rail');
    const actions = document.querySelector<HTMLElement>('.feed-header-actions');
    const scroll = document.querySelector<HTMLElement>('.feed-header-category-scroll');

    if (!layout || !header || !rail || !actions || !scroll) {
      throw new Error('Header navigation elements were not rendered');
    }

    const headerRect = header.getBoundingClientRect();
    const layoutRect = layout.getBoundingClientRect();
    const railRect = rail.getBoundingClientRect();
    const actionsRect = actions.getBoundingClientRect();
    const railCenter = railRect.left + railRect.width / 2;

    return {
      viewportWidth: window.innerWidth,
      viewportClientWidth: document.documentElement.clientWidth,
      gridTemplateColumns: getComputedStyle(layout).gridTemplateColumns,
      headerCenterDelta: Math.abs(
        railCenter - (headerRect.left + headerRect.width / 2),
      ),
      layoutCenterDelta: Math.abs(
        railCenter - (layoutRect.left + layoutRect.width / 2),
      ),
      viewportCenterDelta: Math.abs(
        railCenter - document.documentElement.clientWidth / 2,
      ),
      railActionsGap: actionsRect.left - railRect.right,
      scrollWidth: scroll.scrollWidth,
      clientWidth: scroll.clientWidth,
    };
  });
}

test('desktop category rail stays centered and clear of actions at compact widths', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 844 });
  await openFeed(page);

  for (const width of [768, 900]) {
    await test.step(`${width}px viewport`, async () => {
      await page.setViewportSize({ width, height: 844 });

      const layout = page.locator('.feed-header-layout');
      const rail = page.locator('.feed-header-category-rail');
      const actions = page.locator('.feed-header-actions');
      await expect(layout).toBeVisible();
      await expect(rail).toBeVisible();
      await expect(actions).toBeVisible();
      await page.evaluate(
        () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
      );

      const metrics = await measureHeaderLayout(page);
      console.info('[header-layout-metrics]', JSON.stringify(metrics));

      expect.soft(metrics.headerCenterDelta).toBeLessThanOrEqual(2);
      expect.soft(metrics.layoutCenterDelta).toBeLessThanOrEqual(2);
      expect.soft(metrics.railActionsGap).toBeGreaterThanOrEqual(0);
      if (width === 768) {
        expect.soft(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth);
      }
    });
  }
});

test('mobile action menu opens collection shortcuts', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openFeed(page);
  await openActionsMenu(page);

  await expect(
    page.getByRole('button', { name: /Gerenciar feeds Coleção/i }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Adicionar fontes RSS/i }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Diagnóstico Feeds/i }),
  ).toBeVisible();
});

test('feed manager opens and tabs render', async ({ page }) => {
  await openFeed(page);
  await openActionsMenu(page);

  const manageFeeds = page
    .getByRole('button', { name: /Gerenciar Feeds|Gerenciar feeds Coleção/i })
    .first();
  await manageFeeds.dispatchEvent('click');

  const feedManagerDialog = page.getByRole('dialog').filter({
    has: page.getByText(/Central da Coleção/i),
  }).first();

  await expect(feedManagerDialog).toBeVisible();
  await expect(feedManagerDialog.getByRole('button', { name: /^Fontes\./i })).toBeVisible();
  await expect(feedManagerDialog.getByRole('button', { name: /^Organização\./i })).toBeVisible();
  await expect(feedManagerDialog.getByRole('button', { name: /^Manutenção\./i })).toBeVisible();

  await feedManagerDialog
    .getByRole('button', { name: /^Organização\./i })
    .dispatchEvent('click');
  await expect(feedManagerDialog.getByRole('heading', { name: /^Categorias$/i })).toBeVisible();
  await expect(feedManagerDialog.getByRole('button', { name: /Nova categoria/i })).toBeVisible();
});

test('settings modal opens and transitions toggle flips', async ({ page }) => {
  await openFeed(page);
  await openActionsMenu(page);

  const settingsBtn = page.getByRole('button', { name: /Settings|Configurações/i }).first();
  await settingsBtn.dispatchEvent('click');

  await expect(page.getByRole('heading', { name: /Configurações/i })).toBeVisible();
  const systemButton = page.getByRole('button', { name: /Sistema/i });
  await expect(systemButton).toBeVisible();
  await systemButton.dispatchEvent('click');

  await expect(page.getByText(/Idioma/i).first()).toBeVisible();
  await expect(page.getByRole('combobox').first()).toBeVisible();

  const transitionsSwitch = page.getByRole('switch', { name: /transi/i });
  if (await transitionsSwitch.count()) {
    const before = await transitionsSwitch.first().getAttribute('aria-checked');
    await transitionsSwitch.first().dispatchEvent('click');
    const after = await transitionsSwitch.first().getAttribute('aria-checked');
    expect(before).not.toBe(after);
  } else {
    await expect(page.getByRole('button', { name: /Exportar/i })).toBeVisible();
  }
});
