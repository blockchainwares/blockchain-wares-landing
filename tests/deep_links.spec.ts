import { expect, test, type Page } from "@playwright/test";

/**
 * Sekcja „What We Do” czyta alias z query stringu: `?docs` i `?tab=docs` otwierają
 * tę samą zakładkę. Tytuł zakładki jest jej dostępną nazwą, więc po nim celujemy.
 */
const TABS = [
  { slug: "core", title: "Blockchain Core & Infrastructure" },
  { slug: "hive", title: "Hive Ecosystem Development" },
  { slug: "sdk", title: "Developer SDKs & Libraries" },
  { slug: "ufa", title: "User-Facing Applications" },
  { slug: "eos", title: "EOS Ecosystem" },
  { slug: "docs", title: "Documentation" },
  { slug: "eda", title: "EDA & Engineering" },
  { slug: "data", title: "Data Systems" },
] as const;

const DEFAULT_TAB = TABS[0].title;
const DOCS_TAB = "Documentation";

const SECTION_ANCHOR = "#what-we-do";
/** Deep-link cel scrolla: dwupanelowy layout, nie nagłówek sekcji. */
const CONTENT_ANCHOR = "#what-we-do-content";
/** Fixed navbar (h-16) + oddech — `scroll-mt-20` na `#what-we-do-content` w OurWorks.tsx. */
const CONTENT_TOP_PX = 80;
/** Zaokrąglenia layoutu i subpiksele — sam offset musi się zgadzać co do kilku px. */
const CONTENT_TOP_TOLERANCE_PX = 8;
/**
 * Astro zdejmuje z `<astro-island>` atrybut `ssr` dopiero po hydracji wyspy.
 * Wyspa jest `client:visible`, więc do tego momentu tabsy to statyczny HTML:
 * klik w nie przepada, bo React nie ma jeszcze podpiętych handlerów.
 */
const HYDRATED_ISLAND = 'astro-island[component-export="OurWorks"]:not([ssr])';
/** Wyspa jest `client:visible`, więc czekamy na hydrację po deep-linku. */
const TAB_TIMEOUT = 15_000;
const VIEWPORTS = [
  { name: "desktop", viewport: { width: 1280, height: 800 } },
  { name: "mobile", viewport: { width: 390, height: 844 } },
] as const;

/** Wejście na stronę + doprowadzenie sekcji na ekran, żeby wyspa się zhydratowała. */
async function open_section(page: Page, search: string): Promise<void> {
  await page.goto(`/${search}`);
  await page.locator(SECTION_ANCHOR).scrollIntoViewIfNeeded();
  await expect(page.locator(HYDRATED_ISLAND)).toBeAttached({
    timeout: TAB_TIMEOUT,
  });
}

async function expect_open_tab(page: Page, title: string): Promise<void> {
  await expect(page.getByRole("tab", { name: title })).toHaveAttribute(
    "aria-selected",
    "true",
    { timeout: TAB_TIMEOUT },
  );
  await expect(page.getByRole("tab", { selected: true })).toHaveCount(1);
}

test.describe("Deep-linki sekcji What We Do", () => {
  for (const { slug, title } of TABS) {
    test(`?${slug} i ?tab=${slug} otwierają „${title}”`, async ({ page }) => {
      for (const search of [`?${slug}`, `?tab=${slug}`]) {
        await open_section(page, search);
        await expect_open_tab(page, title);
      }
    });
  }

  for (const { name, viewport } of VIEWPORTS) {
    test(`deep-link zatrzymuje treść kategorii pod navbarem, nie nagłówek sekcji (${name})`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      // Bez scrollIntoViewIfNeeded: skok robi sama strona, inaczej test mierzyłby
      // pozycję ustawioną przez Playwright.
      await page.goto("/?ufa");
      await expect(page.locator(HYDRATED_ISLAND)).toBeAttached({
        timeout: TAB_TIMEOUT,
      });
      await expect_open_tab(page, "User-Facing Applications");

      await expect
        .poll(
          async () => {
            const top = await page
              .locator(CONTENT_ANCHOR)
              .evaluate((node) => node.getBoundingClientRect().top);
            return Math.abs(top - CONTENT_TOP_PX);
          },
          { timeout: TAB_TIMEOUT },
        )
        .toBeLessThanOrEqual(CONTENT_TOP_TOLERANCE_PX);

      // Nagłówek sekcji ma zostać nad kadrem — inaczej to stary cel scrolla.
      const heading_top = await page
        .locator(`${SECTION_ANCHOR} h2`)
        .evaluate((node) => node.getBoundingClientRect().top);
      expect(heading_top).toBeLessThan(0);
    });
  }

  test("nieznany alias zostawia zakładkę domyślną i nie wywala strony", async ({
    page,
  }) => {
    const failures: string[] = [];
    page.on("pageerror", (error) => failures.push(error.message));

    await open_section(page, "?nie-ma-takiej-sekcji");
    await expect_open_tab(page, DEFAULT_TAB);

    // Wyspa jest już zhydratowana (gate w open_section), więc reakcja na klik
    // dowodzi, że efekt deep-linku się wykonał i nie wybrał żadnej zakładki.
    await page.getByRole("tab", { name: DOCS_TAB }).click();
    await expect_open_tab(page, DOCS_TAB);

    expect(failures).toEqual([]);
  });

  test("serwer renderuje zakładkę z deep-linku otwartą, bez JS", async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/?docs");

    const open_panels = page.locator(
      `${SECTION_ANCHOR} [role="tabpanel"]:not([hidden])`,
    );
    await expect(open_panels).toHaveCount(1);
    await expect(
      open_panels.getByRole("heading", { name: DOCS_TAB, exact: true }),
    ).toBeVisible();
    await expect(page.locator(CONTENT_ANCHOR)).toHaveAttribute(
      "data-deep-link",
      "",
    );
    await context.close();
  });

  test("?utm_source=nl&docs otwiera docs — klucze z wartością są pomijane", async ({
    page,
  }) => {
    await open_section(page, "?utm_source=nl&docs");
    await expect_open_tab(page, DOCS_TAB);
  });
});
