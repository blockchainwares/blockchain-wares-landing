import { expect, test, type Page } from "@playwright/test";
import { E2E_APP_VERSION_SHA, NO_JS_TAG } from "../playwright.config";
import { LOGIN_PATH, log_in } from "./support/admin";
import { ADMIN_EVENTS_PATH } from "./support/admin_events";

const EXPECTED_VERSION = E2E_APP_VERSION_SHA.slice(0, 7);
const PUBLIC_PATHS = ["/", "/markets"] as const;

async function expect_version(page: Page): Promise<void> {
  await expect(page.locator("[data-app-version]")).toHaveText(EXPECTED_VERSION);
}

test.describe("Wersja aplikacji w panelu", () => {
  test("logowanie pokazuje wersję bez sesji", async ({ page }) => {
    await page.goto(LOGIN_PATH);
    await expect_version(page);
  });

  test("zalogowany panel pokazuje wersję na każdej sekcji", async ({
    page,
  }) => {
    await log_in(page);
    await expect(page).toHaveURL(/\/admin$/);
    await expect_version(page);

    await page.goto(ADMIN_EVENTS_PATH);
    await expect_version(page);
  });

  for (const path of PUBLIC_PATHS) {
    test(`strona publiczna ${path} nie zdradza wersji`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("[data-app-version]")).toHaveCount(0);
    });
  }

  test(
    "wersja jest tekstem SSR — widoczna bez JS",
    { tag: NO_JS_TAG },
    async ({ page }) => {
      await page.goto(LOGIN_PATH);
      await expect_version(page);

      await log_in(page);
      await page.goto(ADMIN_EVENTS_PATH);
      await expect_version(page);
    },
  );
});
