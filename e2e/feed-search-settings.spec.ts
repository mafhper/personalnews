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
