import { expect, test, type Page } from "@playwright/test";

const MOBILE_VIEWPORT = { width: 375, height: 800 };
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
const HYDRATED_NAV_ISLAND =
  'astro-island[component-export="Navigation"]:not([ssr])';

test.use({ viewport: MOBILE_VIEWPORT });

async function open_menu(page: Page): Promise<void> {
  await page.goto("/markets");
  await expect(page.locator(HYDRATED_NAV_ISLAND)).toHaveCount(1);
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("dialog", { name: "Menu" })).toBeVisible();
}

function menu_trigger(page: Page) {
  return page.locator("button[aria-controls='mobile-menu']");
}

test.describe("Szuflada menu mobilnego — dostępność", () => {
  test("jest modalnym dialogiem sterowanym przez przycisk menu", async ({
    page,
  }) => {
    await open_menu(page);

    const dialog = page.getByRole("dialog", { name: "Menu" });
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    await expect(dialog).toHaveAttribute("id", "mobile-menu");
    await expect(menu_trigger(page)).toHaveAttribute("aria-expanded", "true");
  });

  test("po otwarciu fokus trafia do szuflady", async ({ page }) => {
    await open_menu(page);

    const focus_inside = await page.evaluate(
      () =>
        document
          .getElementById("mobile-menu")
          ?.contains(document.activeElement) ?? false,
    );
    expect(focus_inside).toBe(true);
  });

  test("Escape zamyka szufladę i oddaje fokus przyciskowi menu", async ({
    page,
  }) => {
    await open_menu(page);

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden();
    await expect(menu_trigger(page)).toHaveAttribute("aria-expanded", "false");
    await expect(menu_trigger(page)).toBeFocused();
  });

  test("Tab i Shift+Tab krążą w obrębie szuflady", async ({ page }) => {
    await open_menu(page);

    const focusables = page
      .getByRole("dialog", { name: "Menu" })
      .locator("a[href], button:not([disabled])");
    const first = focusables.first();
    const last = focusables.last();

    await last.focus();
    await page.keyboard.press("Tab");
    await expect(first).toBeFocused();

    await page.keyboard.press("Shift+Tab");
    await expect(last).toBeFocused();
  });

  // `<main>` siedzi w wyspie `Markets`, więc inert dostaje jej host w `<body>`.
  test("tło pod otwartą szufladą jest inert, po zamknięciu już nie", async ({
    page,
  }) => {
    await open_menu(page);
    expect(await is_main_inert(page)).toBe(true);
    expect(
      await page.evaluate(
        () =>
          document.getElementById("mobile-menu")?.closest("[inert]") ?? null,
      ),
    ).toBeNull();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden();
    expect(await is_main_inert(page)).toBe(false);
  });

  test("zamknięcie przez poszerzenie do md+ nie gubi fokusu na body", async ({
    page,
  }) => {
    await open_menu(page);

    await page.setViewportSize(DESKTOP_VIEWPORT);
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden();
    await expect
      .poll(() =>
        page.evaluate(() => {
          const active = document.activeElement;
          if (!(active instanceof HTMLElement) || active === document.body) {
            return false;
          }
          return active.offsetParent !== null;
        }),
      )
      .toBe(true);
  });
});

function is_main_inert(page: Page): Promise<boolean> {
  return page.evaluate(
    () => document.querySelector("main")?.closest("[inert]") != null,
  );
}
