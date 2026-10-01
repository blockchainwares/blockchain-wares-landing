import { expect, test, type Page } from "@playwright/test";

/** Ikony „What We Do”: widoczna jest tylko ikona aktywnego panelu, poświata bez CSS filter. */
const SECTION = "#what-we-do";
const HYDRATED_ISLAND = 'astro-island[component-export="OurWorks"]:not([ssr])';
const ACTIVE_PANEL = `${SECTION} [role="tabpanel"]:not([hidden])`;
const TIMEOUT_MS = 15_000;

test.use({ viewport: { width: 1280, height: 900 } });

async function open_section(page: Page): Promise<void> {
  await page.goto("/");
  await page.locator(SECTION).scrollIntoViewIfNeeded();
  await expect(page.locator(HYDRATED_ISLAND)).toBeAttached({
    timeout: TIMEOUT_MS,
  });
}

test.describe("Ikony What We Do", () => {
  test("renderuje się ikona aktywnego panelu", async ({ page }) => {
    await open_section(page);

    await expect(page.locator(ACTIVE_PANEL)).toHaveCount(1);
    const icon = page.locator(`${ACTIVE_PANEL} [data-hero-icon] svg`).first();
    await expect(icon).toBeVisible();
  });

  test("poświata aktywnej ikony nie używa filtra", async ({ page }) => {
    await open_section(page);

    const wrapper = page.locator(`${ACTIVE_PANEL} [data-hero-icon]`);
    await expect(wrapper).toHaveCount(1);
    const filter = await wrapper.evaluate(
      (element) => getComputedStyle(element).filter,
    );
    expect(filter).toBe("none");
  });
});
