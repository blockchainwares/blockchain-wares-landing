import { expect, test, type Page } from "@playwright/test";

const MOBILE_VIEWPORT = { width: 375, height: 800 };
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
const SPLASH = "#splash-screen";
const HYDRATED_NAV_ISLAND =
  'astro-island[component-export="Navigation"]:not([ssr])';

/** The splash's fade starts 2.5 s in, the fallback finish() runs 1 s later. */
const SPLASH_FADE_DELAY_MS = 2_500;
const SPLASH_SETTLED_TIMEOUT_MS = 5_000;

declare global {
  interface Window {
    __bw_release_splash?: () => void;
  }
}

/**
 * Parks the splash's fade timer until the test calls `__bw_release_splash`,
 * so assertions made "during the splash" never race a slow hydration.
 */
async function hold_splash(page: Page): Promise<void> {
  await page.addInitScript((fade_delay) => {
    const native_set_timeout = window.setTimeout;
    let held = false;
    const patched = (
      handler: TimerHandler,
      delay?: number,
      ...rest: unknown[]
    ): number => {
      if (!held && delay === fade_delay && typeof handler === "function") {
        held = true;
        window.__bw_release_splash = () => {
          native_set_timeout(handler, 0);
        };
        return 0;
      }
      return native_set_timeout(handler, delay, ...rest);
    };
    window.setTimeout = patched as typeof window.setTimeout;
  }, SPLASH_FADE_DELAY_MS);
}

function read_body_overflow(page: Page): Promise<string> {
  return page.evaluate(() => document.body.style.overflow);
}

async function expect_page_scrolls(page: Page): Promise<void> {
  await page.mouse.move(200, 400);
  await expect
    .poll(async () => {
      await page.mouse.wheel(0, 600);
      return page.evaluate(() => window.scrollY);
    })
    .toBeGreaterThan(0);
}

/** Astro drops `ssr` from the island once React has hydrated it. */
async function wait_for_navigation_hydration(page: Page): Promise<void> {
  await expect(page.locator(HYDRATED_NAV_ISLAND)).toHaveCount(1);
}

async function open_menu(page: Page): Promise<void> {
  const trigger = page.getByRole("button", { name: "Open menu" });
  await wait_for_navigation_hydration(page);
  await trigger.click();
  await expect(
    page.getByRole("button", { name: "Close menu" }).first(),
  ).toHaveAttribute("aria-expanded", "true");
}

test.describe("Scroll lock mobilnej szuflady", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
  });

  test("poszerzenie okna do md+ zamyka szufladę i zdejmuje lock", async ({
    page,
  }) => {
    await page.goto("/markets");
    expect(await read_body_overflow(page)).toBe("");

    await open_menu(page);
    expect(await read_body_overflow(page)).toBe("hidden");

    await page.setViewportSize(DESKTOP_VIEWPORT);
    await expect.poll(() => read_body_overflow(page)).toBe("");
    await page.setViewportSize(MOBILE_VIEWPORT);
    await expect(
      page.getByRole("button", { name: "Open menu" }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  test("przycisk zamknięcia zdejmuje lock", async ({ page }) => {
    await page.goto("/markets");
    await open_menu(page);

    await page
      .getByRole("button", { name: "Close menu" })
      .and(page.locator(":not([aria-expanded])"))
      .click();
    await expect.poll(() => read_body_overflow(page)).toBe("");
  });

  test("hydratacja nawigacji nie zdejmuje locka splasha z body", async ({
    page,
  }) => {
    await hold_splash(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await wait_for_navigation_hydration(page);

    await expect(page.locator(SPLASH)).toHaveCount(1);
    expect(await read_body_overflow(page)).toBe("hidden");
  });

  // Reduced motion only hides the splash node, it stays in the DOM without any lock
  test("przy reduced-motion zamknięcie szuflady na / zdejmuje lock", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator(SPLASH)).toBeHidden();

    await open_menu(page);
    expect(await read_body_overflow(page)).toBe("hidden");

    await page
      .getByRole("button", { name: "Close menu" })
      .and(page.locator(":not([aria-expanded])"))
      .click();
    await expect.poll(() => read_body_overflow(page)).toBe("");
    expect(
      await page.evaluate(() => document.documentElement.style.overflow),
    ).toBe("");
    await expect_page_scrolls(page);
  });

  test("szuflada otwarta w trakcie splasha nie przywraca locka po jego końcu", async ({
    page,
  }) => {
    await hold_splash(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await wait_for_navigation_hydration(page);

    // The splash overlay swallows clicks, but the hamburger under it stays focusable
    const trigger = page.getByRole("button", { name: "Open menu" });
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("button", { name: "Close menu" }).first(),
    ).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(SPLASH)).toHaveCount(1);
    expect(await read_body_overflow(page)).toBe("hidden");

    await page.evaluate(() => window.__bw_release_splash?.());
    await expect(page.locator(SPLASH)).toHaveCount(0, {
      timeout: SPLASH_SETTLED_TIMEOUT_MS,
    });

    await page
      .getByRole("button", { name: "Close menu" })
      .and(page.locator(":not([aria-expanded])"))
      .click();
    await expect.poll(() => read_body_overflow(page)).toBe("");
    expect(
      await page.evaluate(() => document.documentElement.style.overflow),
    ).toBe("");

    await expect_page_scrolls(page);
  });
});
