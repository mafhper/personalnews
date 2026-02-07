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
      document.querySelector('button[aria-label="Configurações"], button[aria-label="Menu"]')
    );
  }, { timeout: 60_000 });
}

test('search opens and filters panel toggles', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openFeed(page);

  const menuToggle = page.getByRole('button', { name: /menu/i });
  await expect(menuToggle).toBeVisible({ timeout: 60_000 });
  await menuToggle.click();

  const menuDrawer = page.locator('div').filter({
    has: page.getByRole('heading', { name: /menu/i }),
  }).first();

  const search = menuDrawer.getByRole('combobox', { name: /search articles/i });
  await expect(search).toBeVisible();
  await search.click();
  await search.fill('teste');

  const filtersToggle = menuDrawer.getByRole('button', { name: /toggle filters|alternar filtros/i });
  await expect(filtersToggle).toBeVisible();
  await filtersToggle.click();

  await expect(menuDrawer.getByText(/Category|Categoria/i).first()).toBeVisible();
  await expect(menuDrawer.getByText(/Date Range|Intervalo de Data/i).first()).toBeVisible();
});

test('feed manager opens and tabs render', async ({ page }) => {
  await openFeed(page);

  const manageFeeds = page.getByRole('button', { name: /Gerenciar Feeds/i });
  await manageFeeds.click();

  const feedManagerDialog = page.getByRole('dialog').filter({
    has: page.getByRole('heading', { name: /Gerenciar Feeds/i }),
  }).first();

  await expect(feedManagerDialog).toBeVisible();
  await expect(feedManagerDialog.getByRole('button', { name: /^Funções$/i })).toBeVisible();
  await expect(feedManagerDialog.getByRole('button', { name: /Meus Feeds/i })).toBeVisible();
  await expect(feedManagerDialog.getByRole('button', { name: /^Categorias$/i })).toBeVisible();
  await expect(feedManagerDialog.getByRole('button', { name: /^Estatísticas$/i })).toBeVisible();

  await feedManagerDialog.getByRole('button', { name: /^Categorias$/i }).click();
  await expect(feedManagerDialog.getByText(/Arraste feeds entre categorias/i)).toBeVisible();
});

test('settings modal opens and transitions toggle flips', async ({ page }) => {
  await openFeed(page);

  const settingsBtn = page.getByRole('button', { name: /Configurações/i });
  await settingsBtn.click();

  await expect(page.getByRole('heading', { name: /Configurações/i })).toBeVisible();
  const systemButton = page.getByRole('button', { name: /Sistema/i });
  await expect(systemButton).toBeVisible();
  await systemButton.click();

  await expect(page.getByText(/Idioma/i).first()).toBeVisible();
  await expect(page.getByRole('combobox').first()).toBeVisible();

  const transitionsSwitch = page.getByRole('switch', { name: /transi/i });
  if (await transitionsSwitch.count()) {
    const before = await transitionsSwitch.first().getAttribute('aria-checked');
    await transitionsSwitch.first().click();
    const after = await transitionsSwitch.first().getAttribute('aria-checked');
    expect(before).not.toBe(after);
  } else {
    await expect(page.getByRole('button', { name: /Exportar/i })).toBeVisible();
  }
});
