import { expect, test, type Page } from "@playwright/test";

/**
 * Auto-rotacja „What We Do” chodzi tylko, gdy sekcja przecina viewport.
 * Czas przesuwa `page.clock` (fałszuje setTimeout hooka), a IntersectionObserver
 * zostaje prawdziwy — raportuje w kroku renderowania, nie przez timery.
 */
const SECTION = "#what-we-do";
const HYDRATED_ISLAND = 'astro-island[component-export="OurWorks"]:not([ssr])';
const HYDRATION_TIMEOUT = 15_000;
const FIRST_TAB = "Blockchain Core & Infrastructure";
/** useAutoRotate: AUTO_ROTATE_INTERVAL + zapas. */
const PAST_INTERVAL_MS = 16_000;
const LONG_PAUSE_MS = 3 * PAST_INTERVAL_MS;

const VIEWPORTS = [
  { name: "desktop", viewport: { width: 1280, height: 800 } },
  { name: "mobile", viewport: { width: 390, height: 844 } },
] as const;

test.use({ contextOptions: { reducedMotion: "reduce" } });

test.beforeEach(async ({ page }) => {
  // Splash pierwszej wizyty blokuje scroll — strona pomija go, gdy intro było już widziane.
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("bw:intro-seen", "1");
    } catch {
      // sessionStorage niedostępny: reducedMotion i tak wyłącza animację splasha.
    }
  });
  await page.clock.install();
});

async function open_section(page: Page): Promise<void> {
  await page.goto("/");
  await page.locator(SECTION).scrollIntoViewIfNeeded();
  await expect(page.locator(HYDRATED_ISLAND)).toBeAttached({
    timeout: HYDRATION_TIMEOUT,
  });
  // SSR nie renderuje atrybutu — pojawia się dopiero po hydracji i pierwszym raporcie IO.
  await expect(page.locator(SECTION)).toHaveAttribute("data-in-view", "true", {
    timeout: HYDRATION_TIMEOUT,
  });
}

async function expect_open_tab(page: Page, title: string): Promise<void> {
  await expect(page.getByRole("tab", { name: title })).toHaveAttribute(
    "aria-selected",
    "true",
  );
}

async function expect_rotation(page: Page): Promise<void> {
  await page.clock.runFor(PAST_INTERVAL_MS);
  await expect(page.getByRole("tab", { name: FIRST_TAB })).toHaveAttribute(
    "aria-selected",
    "false",
  );
}

for (const { name, viewport } of VIEWPORTS) {
  test.describe(`What We Do auto-rotate (${name})`, () => {
    test.use({ viewport });

    test("pauzuje poza viewportem i wznawia po powrocie", async ({ page }) => {
      await open_section(page);
      await expect_open_tab(page, FIRST_TAB);

      await page.evaluate(() => window.scrollTo(0, 0));
      await expect(page.locator(SECTION)).toHaveAttribute(
        "data-in-view",
        "false",
      );

      await page.clock.runFor(LONG_PAUSE_MS);
      await expect_open_tab(page, FIRST_TAB);

      await page.locator(SECTION).scrollIntoViewIfNeeded();
      await expect(page.locator(SECTION)).toHaveAttribute(
        "data-in-view",
        "true",
      );

      await expect_rotation(page);
    });

    test("w viewporcie rotuje, a wybór użytkownika zatrzymuje ją na stałe", async ({
      page,
    }) => {
      await open_section(page);

      await expect_rotation(page);

      await page.getByRole("tab", { name: FIRST_TAB }).click();
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect(page.locator(SECTION)).toHaveAttribute(
        "data-in-view",
        "false",
      );
      await page.locator(SECTION).scrollIntoViewIfNeeded();
      await expect(page.locator(SECTION)).toHaveAttribute(
        "data-in-view",
        "true",
      );

      await page.clock.runFor(LONG_PAUSE_MS);
      await expect_open_tab(page, FIRST_TAB);
    });
  });
}
