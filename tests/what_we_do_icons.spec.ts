import { expect, test, type Page } from "@playwright/test";

/**
 * Ikony „What We Do” są nieskończonymi animacjami CSS. Wszystkie panele leżą
 * w jednej komórce siatki, więc na md+ nieaktywne panele są tylko przezroczyste —
 * bez pauzy ich ikony animowałyby się niewidoczne.
 */
const SECTION = "#what-we-do";
const HYDRATED_ISLAND = 'astro-island[component-export="OurWorks"]:not([ssr])';
const ACTIVE_PANEL = `${SECTION} [role="tabpanel"][data-active="true"]`;
const INACTIVE_PANELS = `${SECTION} [role="tabpanel"][data-active="false"]`;
const INTRO_SEEN_KEY = "bw:intro-seen";
const TIMEOUT_MS = 15_000;
/** Lewy i prawy rząd po 6 pinów, górny i dolny po 4. */
const EDA_PIN_COUNT = 20;

test.use({ viewport: { width: 1280, height: 900 } });

/** Stan odtwarzania wszystkich animowanych elementów SVG pod selektorem. */
async function read_play_states(
  page: Page,
  selector: string,
): Promise<string[]> {
  return page.evaluate((root_selector) => {
    const states: string[] = [];
    for (const root of document.querySelectorAll(root_selector)) {
      for (const element of root.querySelectorAll("svg *")) {
        const style = getComputedStyle(element);
        if (style.animationName !== "none")
          states.push(style.animationPlayState);
      }
    }
    return states;
  }, selector);
}

async function open_section(page: Page): Promise<void> {
  // Powtórna wizyta: splash nie blokuje scrolla i nie zasłania sekcji.
  await page.addInitScript((key) => {
    sessionStorage.setItem(key, "1");
  }, INTRO_SEEN_KEY);
  await page.goto("/");
  await page.locator(SECTION).scrollIntoViewIfNeeded();
  await expect(page.locator(HYDRATED_ISLAND)).toBeAttached({
    timeout: TIMEOUT_MS,
  });
  await expect(page.locator(SECTION)).toHaveClass(/is-visible/, {
    timeout: TIMEOUT_MS,
  });
  await expect(page.locator(SECTION)).not.toHaveAttribute(
    "data-in-view",
    "false",
  );
}

test.describe("Ikony What We Do", () => {
  test("animuje się tylko aktywny panel", async ({ page }) => {
    await open_section(page);

    await expect
      .poll(() => read_play_states(page, ACTIVE_PANEL), { timeout: TIMEOUT_MS })
      .toContain("running");
    const active = await read_play_states(page, ACTIVE_PANEL);
    expect(active.every((state) => state === "running")).toBe(true);

    const inactive = await read_play_states(page, INACTIVE_PANELS);
    expect(inactive.length).toBeGreaterThan(0);
    expect(inactive.every((state) => state === "paused")).toBe(true);
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

  test("sekcja poza ekranem pauzuje wszystkie ikony", async ({ page }) => {
    await open_section(page);

    await page.locator(SECTION).evaluate((section) => {
      section.setAttribute("data-in-view", "false");
    });

    const all = await read_play_states(page, SECTION);
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((state) => state === "paused")).toBe(true);
  });

  test("piny EDA animują się klasą, nie stylem inline", async ({ page }) => {
    await open_section(page);

    const pins = page.locator(`${SECTION} svg circle[class*="eda-pin"]`);
    // Ikona EDA może wystąpić w więcej niż jednym panelu.
    expect(await pins.count()).toBeGreaterThanOrEqual(EDA_PIN_COUNT);

    const inline_animations = await page
      .locator(`${SECTION} svg [style*="animation:"]`)
      .count();
    expect(inline_animations).toBe(0);

    // `.eda-pin` ustawia własne `animation` — reguła pauzy musi wygrać kolejnością.
    const inactive_pin_states = await page.evaluate(
      (selector) =>
        Array.from(
          document.querySelectorAll(selector),
          (pin) => getComputedStyle(pin).animationPlayState,
        ),
      `${INACTIVE_PANELS} svg circle.eda-pin`,
    );
    expect(inactive_pin_states.length).toBeGreaterThan(0);
    expect(inactive_pin_states.every((state) => state === "paused")).toBe(true);
  });
});
