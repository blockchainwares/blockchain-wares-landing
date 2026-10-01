import { expect, test, type Page } from "@playwright/test";

/**
 * „What We Do” nie rotuje zakładek samo — zmienia je wyłącznie użytkownik.
 * `page.clock` przesuwa timery strony daleko poza dawny 15-sekundowy interwał.
 */
const SECTION = "#what-we-do";
const HYDRATED_ISLAND = 'astro-island[component-export="OurWorks"]:not([ssr])';
const HYDRATION_TIMEOUT = 15_000;
const FIRST_TAB = "Blockchain Core & Infrastructure";
const SECOND_TAB = "Hive Ecosystem Development";
const LONG_WAIT_MS = 60_000;

const VIEWPORTS = [
  { name: "desktop", viewport: { width: 1280, height: 800 } },
  { name: "mobile", viewport: { width: 390, height: 844 } },
] as const;

test.beforeEach(async ({ page }) => {
  await page.clock.install();
});

async function open_section(page: Page): Promise<void> {
  await page.goto("/");
  await page.locator(SECTION).scrollIntoViewIfNeeded();
  await expect(page.locator(HYDRATED_ISLAND)).toBeAttached({
    timeout: HYDRATION_TIMEOUT,
  });
}

async function expect_open_tab(page: Page, title: string): Promise<void> {
  await expect(page.getByRole("tab", { name: title })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("tab", { selected: true })).toHaveCount(1);
}

for (const { name, viewport } of VIEWPORTS) {
  test.describe(`What We Do bez auto-rotacji (${name})`, () => {
    test.use({ viewport });

    test("zakładka nie zmienia się sama", async ({ page }) => {
      await open_section(page);
      await expect_open_tab(page, FIRST_TAB);

      await page.clock.runFor(LONG_WAIT_MS);
      await expect_open_tab(page, FIRST_TAB);
    });

    test("klik przełącza zakładkę i pokazuje tylko jej panel", async ({
      page,
    }) => {
      await open_section(page);

      await page.getByRole("tab", { name: SECOND_TAB }).click();
      await expect_open_tab(page, SECOND_TAB);
      await expect(
        page.locator(`${SECTION} [role="tabpanel"]:not([hidden])`),
      ).toHaveCount(1);

      await page.clock.runFor(LONG_WAIT_MS);
      await expect_open_tab(page, SECOND_TAB);
    });
  });
}
