import { expect, test } from "@playwright/test";

const LETTERBOXD_HOME =
  "https://www.youtube.com/channel/UClkMwShoqUJtuXEEhP8bH7w";
const LETTERBOXD_FEED =
  "https://www.youtube.com/feeds/videos.xml?channel_id=UClkMwShoqUJtuXEEhP8bH7w";

test("adds a new YouTube channel home as its canonical Atom feed", async ({ page }) => {
  await page.goto("/#feed", { waitUntil: "commit" });
  const menu = page
    .getByRole("button", { name: /Menu de ações|Menu/i })
    .first();
  await expect(menu).toBeVisible({ timeout: 60_000 });
  await menu.dispatchEvent("click");

  const manageFeeds = page
    .getByRole("button", { name: /Gerenciar Feeds|Gerenciar feeds Coleção/i })
    .first();
  await expect(manageFeeds).toBeVisible();
  await manageFeeds.dispatchEvent("click");

  const dialog = page.getByRole("dialog").filter({
    has: page.getByText(/Central da Coleção/i),
  });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: /Adicionar fonte/i }).first().click();
  await expect(dialog.getByRole("heading", { name: /Adicionar uma fonte/i })).toBeVisible();
  await dialog.getByLabel("URL da fonte").fill(LETTERBOXD_HOME);
  await dialog.getByRole("button", { name: /^Adicionar$/ }).click();

  await expect
    .poll(
      () =>
        page.evaluate((feedUrl) => {
          const feeds = JSON.parse(localStorage.getItem("rss-feeds") || "[]") as Array<{
            url?: string;
          }>;
          return feeds.some((feed) => feed.url === feedUrl);
        }, LETTERBOXD_FEED),
      { timeout: 30_000 },
    )
    .toBe(true);

  const storedUrls = await page.evaluate(() => {
    const feeds = JSON.parse(localStorage.getItem("rss-feeds") || "[]") as Array<{
      url?: string;
    }>;
    return feeds.map((feed) => feed.url);
  });
  expect(storedUrls).not.toContain(LETTERBOXD_HOME);
});
