import { expect, test, type Page } from "@playwright/test";

const MOBILE_VIEWPORT = { width: 375, height: 800 };
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
const HYDRATED_NAV_ISLAND =
  'astro-island[component-export="Navigation"]:not([ssr])';

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

  test("zamknięcie szuflady na / zdejmuje lock i strona się przewija", async ({
    page,
  }) => {
    await page.goto("/");

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
});
