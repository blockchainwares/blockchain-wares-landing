import { expect, test, type Page } from "@playwright/test";
import { NO_JS_TAG } from "../playwright.config";

const SPLASH = "#splash-screen";
const INTRO_SEEN_KEY = "bw:intro-seen";
/** Fade startuje po 2.5 s, zapasowy timeout zdejmuje lock 1 s później. */
const SPLASH_SETTLED_TIMEOUT_MS = 8_000;

async function read_scroll_lock(page: Page): Promise<string[]> {
  return page.evaluate(() => [
    document.documentElement.style.overflow,
    document.body.style.overflow,
  ]);
}

async function expect_page_scrolls(page: Page): Promise<void> {
  await page.mouse.move(400, 400);
  await expect
    .poll(
      async () => {
        await page.mouse.wheel(0, 600);
        return page.evaluate(() => window.scrollY);
      },
      { timeout: SPLASH_SETTLED_TIMEOUT_MS },
    )
    .toBeGreaterThan(0);
}

test.describe("Splash na stronie głównej", () => {
  test("bez transitionend zapasowy timeout zdejmuje lock i usuwa splash", async ({
    page,
  }) => {
    // Inline `transition` ze skryptu przegrywa z `!important` — opacity zmienia się
    // natychmiast i `transitionend` nigdy nie przychodzi.
    await page.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        const style = document.createElement("style");
        style.textContent = "#splash-screen { transition: none !important; }";
        document.head.append(style);
      });
    });

    // `load` czeka na wszystkie zasoby; na wolnym dev serwerze fallback zdąży zdjąć splash.
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator(SPLASH)).toBeVisible();
    // Splash blokuje `<html>` i `<body>`; viewport przewija się według `<html>`, więc to on jest sprawdzany.
    expect((await read_scroll_lock(page))[0]).toBe("hidden");

    await expect(page.locator(SPLASH)).toHaveCount(0, {
      timeout: SPLASH_SETTLED_TIMEOUT_MS,
    });
    expect(await read_scroll_lock(page)).toEqual(["", ""]);
    expect(
      await page.evaluate((key) => sessionStorage.getItem(key), INTRO_SEEN_KEY),
    ).toBe("1");
    await expect_page_scrolls(page);
  });

  test("powtórna wizyta w sesji nie pokazuje splasha ani nie blokuje scrolla", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator(SPLASH)).toHaveCount(0, {
      timeout: SPLASH_SETTLED_TIMEOUT_MS,
    });

    await page.reload();
    await expect(page.locator(SPLASH)).toHaveCount(0);
    expect(await read_scroll_lock(page)).toEqual(["", ""]);
  });

  // `<noscript>` w `<head>` rozbijał kompilację layoutu: meta og/twitter znikały,
  // a wyrażenie `{!noindex && ...}` lądowało w body jako tekst.
  test("gate splasha nie psuje meta w head", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(
      page.locator('head meta[property="og:description"]'),
    ).toHaveCount(1);
    await expect(page.locator('head meta[name="twitter:card"]')).toHaveCount(1);
    expect(await page.locator("body").textContent()).not.toContain("!noindex");
  });

  test(
    "bez JS splash jest schowany, a strona przewijalna",
    { tag: NO_JS_TAG },
    async ({ page }) => {
      await page.goto("/");
      await expect(page.locator(SPLASH)).toBeHidden();
      await expect_page_scrolls(page);
    },
  );
});
