import { expect, test, type Page } from "@playwright/test";

/** Liczniki wstrzykiwane przed startem strony — zbierane per okno obserwacji, po `reset_probe()`. */
interface HeroProbe {
  frames: number;
  size_writes: number;
  raf_calls: number;
}

type StartGrid = (layers: {
  chain: HTMLCanvasElement;
  frame: HTMLCanvasElement;
}) => () => void;

type ProbeWindow = Window & {
  __hero_probe: HeroProbe;
  /** Liczba `stroke()` per płótno — nie zerowana przez `reset_probe()`. */
  __canvas_strokes: WeakMap<HTMLCanvasElement, number>;
  __start_grid?: StartGrid;
  __stop_grid?: () => void;
};

const OBSERVE_MS = 3000;
/** Pętla ma sufit 30 fps; zapas na jitter timera, ale 60 Hz bez limitu dałoby ~180 klatek. */
const MAX_FRAMES_IN_WINDOW = Math.ceil((OBSERVE_MS / 1000) * 30 * 1.2);
const MIN_FRAMES_IN_WINDOW = 10;
const IDLE_MS = 1500;
const SETTLE_MS = 200;
/** Debounce zmiany rozmiaru w pętli (150 ms) z zapasem. */
const RESIZE_SETTLE_MS = 600;
const STABILITY_MS = 1000;
/** Realokacja to zapis `width` + `height` na obu warstwach (łańcuch + klatka). */
const MIN_WRITES_PER_REALLOC = 4;
const MAX_WRITES_AFTER_DPR_CHANGE = MIN_WRITES_PER_REALLOC * 2;
/** Amplituda unoszenia kostki: 8 jednostek z 381 w pionie viewBoxa logo. */
const LOGO_FLOAT_RATIO = 8 / 381;
const LOGO_CUBE_COUNT = 3;
/** Nazwy i liczby cykli: 3 × `float-cube`, potem jedno `settle-cube` do pełnej jasności. */
const LOGO_ANIMATION = "float-cube, settle-cube|3, 1";

/**
 * Działa tylko na dev serwerze Vite (`playwright.config.ts` uruchamia `npm run dev`),
 * który podaje moduły źródłowe pod ich ścieżką z repo. E2E na preview/buildzie wymaga zmiany tego testu.
 */
const GRID_MODULE_URL = "/src/components/blockchain-grid/index.ts";
/** Strona bez hero — jedynym płótnem jest to, które test podpina sam. */
const PAGE_WITHOUT_HERO = "/markets";

/**
 * Klatka zaczyna się od `clearRect` na płótnie podpiętym do DOM — sprite'y pętli
 * rysowane są na płótnach odłączonych, więc się nie liczą. Zapis `width`/`height`
 * na podpiętym płótnie to realokacja bitmapy. `raf_calls` liczy tylko żądania
 * klatek ze stosu modułu `blockchain-grid` — framer-motion i nawigacja też używają
 * rAF, a ich wywołania nie mówią nic o pętli tła.
 */
function install_probe(): void {
  const probe: HeroProbe = { frames: 0, size_writes: 0, raf_calls: 0 };
  (window as unknown as ProbeWindow).__hero_probe = probe;

  const canvas_proto = HTMLCanvasElement.prototype;
  for (const prop of ["width", "height"] as const) {
    const descriptor = Object.getOwnPropertyDescriptor(canvas_proto, prop);
    const set = descriptor?.set;
    if (!descriptor || !set) continue;
    Object.defineProperty(canvas_proto, prop, {
      ...descriptor,
      set(this: HTMLCanvasElement, value: number) {
        if (this.isConnected) probe.size_writes++;
        set.call(this, value);
      },
    });
  }

  const strokes = new WeakMap<HTMLCanvasElement, number>();
  (window as unknown as ProbeWindow).__canvas_strokes = strokes;
  const stroke = CanvasRenderingContext2D.prototype.stroke;
  CanvasRenderingContext2D.prototype.stroke = function (
    this: CanvasRenderingContext2D,
    path?: Path2D,
  ) {
    strokes.set(this.canvas, (strokes.get(this.canvas) ?? 0) + 1);
    Reflect.apply(stroke, this, path ? [path] : []);
  };

  const clear_rect = CanvasRenderingContext2D.prototype.clearRect;
  CanvasRenderingContext2D.prototype.clearRect = function (x, y, w, h) {
    if (this.canvas.isConnected) probe.frames++;
    clear_rect.call(this, x, y, w, h);
  };

  const request_frame = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (callback) => {
    // Ścieżka modułu jest w stosie tylko na dev serwerze Vite (`npm run dev` w configu);
    // bundel buildu ją zatrze, więc E2E na preview/buildzie wymaga zmiany tego filtra.
    if (new Error().stack?.includes("/blockchain-grid/")) probe.raf_calls++;
    return request_frame(callback);
  };
}

/** Warstwa statyczna (linie łańcucha) leży w DOM pierwsza, pod płótnem klatki. */
function chain_canvas(page: Page) {
  return page.locator("section canvas").first();
}

function hero_canvas(page: Page) {
  return page.locator("section canvas").nth(1);
}

async function read_chain_strokes(page: Page): Promise<number> {
  return chain_canvas(page).evaluate(
    (canvas: HTMLCanvasElement) =>
      (window as unknown as ProbeWindow).__canvas_strokes.get(canvas) ?? 0,
  );
}

function logo_cubes(page: Page) {
  return page.locator(".hero-fade-in .logo-cube");
}

async function read_probe(page: Page): Promise<HeroProbe> {
  return page.evaluate(() => ({
    ...(window as unknown as ProbeWindow).__hero_probe,
  }));
}

async function reset_probe(page: Page): Promise<void> {
  await page.evaluate(() => {
    const probe = (window as unknown as ProbeWindow).__hero_probe;
    probe.frames = 0;
    probe.size_writes = 0;
    probe.raf_calls = 0;
  });
}

async function expect_idle(page: Page): Promise<void> {
  await page.waitForTimeout(SETTLE_MS);
  await reset_probe(page);
  await page.waitForTimeout(IDLE_MS);
  const probe = await read_probe(page);
  expect(probe.frames).toBe(0);
  expect(probe.raf_calls).toBe(0);
}

async function expect_animating(page: Page): Promise<void> {
  await reset_probe(page);
  await expect
    .poll(async () => (await read_probe(page)).frames)
    .toBeGreaterThan(1);
}

/** Czeka, aż pętla dopasuje bitmapę do rozmiaru CSS i narysuje pierwszą klatkę. */
async function wait_for_first_frame(page: Page): Promise<void> {
  await expect
    .poll(() =>
      hero_canvas(page).evaluate((canvas: HTMLCanvasElement) => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = canvas.getBoundingClientRect();
        return (
          canvas.width === Math.round(Math.round(rect.width) * dpr) &&
          canvas.height === Math.round(Math.round(rect.height) * dpr)
        );
      }),
    )
    .toBe(true);
  await expect
    .poll(async () => (await read_probe(page)).frames)
    .toBeGreaterThan(0);
}

async function has_painted_pixels(
  page: Page,
  layer = hero_canvas(page),
): Promise<boolean> {
  return layer.evaluate((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) return true;
    }
    return false;
  });
}

async function set_tab_hidden(page: Page, hidden: boolean): Promise<void> {
  await page.evaluate((is_hidden) => {
    if (is_hidden) {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => true,
      });
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => "hidden",
      });
    } else {
      Reflect.deleteProperty(document, "hidden");
      Reflect.deleteProperty(document, "visibilityState");
    }
    document.dispatchEvent(new Event("visibilitychange"));
  }, hidden);
}

test.describe("Hero canvas", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(install_probe);
  });

  test("renders the animated background", async ({ page }) => {
    await page.goto("/");
    await expect(hero_canvas(page)).toBeVisible();
    await wait_for_first_frame(page);
    expect(await has_painted_pixels(page)).toBe(true);
    expect(await has_painted_pixels(page, chain_canvas(page))).toBe(true);
    const sizes = await page
      .locator("section canvas")
      .evaluateAll((canvases: HTMLCanvasElement[]) =>
        canvases.map((canvas) => `${canvas.width}x${canvas.height}`),
      );
    expect(sizes).toHaveLength(2);
    expect(sizes[0]).toBe(sizes[1]);
  });

  test("paints the chain links once instead of on every frame", async ({
    page,
  }) => {
    await page.goto("/");
    await wait_for_first_frame(page);
    // Późny wpis ResizeObservera (np. po doładowaniu fontu) legalnie przerysowuje warstwę.
    await page.waitForTimeout(RESIZE_SETTLE_MS);
    const strokes_after_layout = await read_chain_strokes(page);
    expect(strokes_after_layout).toBeGreaterThan(0);

    await reset_probe(page);
    await page.waitForTimeout(OBSERVE_MS);
    expect((await read_probe(page)).frames).toBeGreaterThanOrEqual(
      MIN_FRAMES_IN_WINDOW,
    );
    expect(await read_chain_strokes(page)).toBe(strokes_after_layout);
  });

  test("floats the logo cubes as HTML boxes, not as SVG children", async ({
    page,
  }) => {
    await page.goto("/");
    const cubes = logo_cubes(page);
    await expect(cubes).toHaveCount(LOGO_CUBE_COUNT);

    const report = await cubes.evaluateAll((nodes: Element[]) =>
      nodes.map((node) => ({
        in_svg: node.parentElement?.closest("svg") !== null,
        animation: `${getComputedStyle(node).animationName}|${getComputedStyle(node).animationIterationCount}`,
        child_animations: Array.from(node.querySelectorAll("*")).map(
          (child) => getComputedStyle(child).animationName,
        ),
      })),
    );
    for (const cube of report) {
      expect(cube.in_svg).toBe(false);
      expect(cube.animation).toBe(LOGO_ANIMATION);
      expect(cube.child_animations.every((name) => name === "none")).toBe(true);
    }

    // Połowa cyklu to szczyt unoszenia — amplituda ma skalować się z wysokością logo.
    // `getAnimations()` oddaje animacje CSS w kolejności listy `animation-name`.
    const peak = await cubes.first().evaluate((node: Element) => {
      const [animation] = node.getAnimations();
      if (!animation) return null;
      animation.pause();
      const duration = Number(animation.effect?.getTiming().duration ?? 0);
      animation.currentTime = duration / 2;
      return {
        shift: new DOMMatrixReadOnly(getComputedStyle(node).transform).m42,
        height: node.getBoundingClientRect().height,
      };
    });
    expect(peak).not.toBeNull();
    expect(peak?.shift).toBeCloseTo(-(peak?.height ?? 0) * LOGO_FLOAT_RATIO, 1);
  });

  test("stops the logo cubes at rest after the last cycle", async ({ page }) => {
    await page.goto("/");
    const cubes = logo_cubes(page);
    await expect(cubes).toHaveCount(LOGO_CUBE_COUNT);

    // Przewinięcie przez `finish()` zamiast czekania ~8 s na koniec cykli.
    const states = await cubes.evaluateAll((nodes: Element[]) =>
      nodes.map((node) => {
        const [float, settle] = node.getAnimations();
        const [f, s] = [float, settle].map((entry) => entry?.effect?.getTiming());
        if (!float || !settle || !f || !s) return null;
        const gap = Number(s.delay) - Number(f.delay) - Number(f.duration) * Number(f.iterations);
        float.finish();
        settle.pause();
        settle.currentTime = Number(s.delay);
        const handoff = getComputedStyle(node).opacity;
        settle.finish();
        const { transform, opacity } = getComputedStyle(node);
        const running = node.getAnimations().length;
        return { gap, handoff, running, rest: `${transform}|${opacity}`, fill: `${f.fill}|${s.fill}` };
      }),
    );
    for (const state of states) {
      // Wyciszenie startuje dokładnie po ostatnim cyklu, z jego ostatniej klatki (0.7).
      expect(state?.gap).toBe(0);
      expect(state?.fill).toBe("backwards|none");
      expect(state?.handoff).toBe("0.7");
      expect(state?.running).toBe(0);
      expect(state?.rest).toBe("none|1");
    }
  });

  test("keeps the bitmap stable and caps the frame rate while animating", async ({
    page,
  }) => {
    await page.goto("/");
    await wait_for_first_frame(page);
    const canvas = hero_canvas(page);
    const size_before = await canvas.evaluate((node: HTMLCanvasElement) => [
      node.width,
      node.height,
    ]);

    await reset_probe(page);
    await page.waitForTimeout(OBSERVE_MS);
    const probe = await read_probe(page);

    expect(probe.size_writes).toBe(0);
    // Dowód, że filtr stosu w sondzie łapie pętlę — inaczej `raf_calls === 0` niżej nic nie znaczy.
    expect(probe.raf_calls).toBeGreaterThan(0);
    expect(probe.frames).toBeGreaterThanOrEqual(MIN_FRAMES_IN_WINDOW);
    expect(probe.frames).toBeLessThanOrEqual(MAX_FRAMES_IN_WINDOW);
    expect(
      await canvas.evaluate((node: HTMLCanvasElement) => [
        node.width,
        node.height,
      ]),
    ).toEqual(size_before);
  });

  test("stops the loop once the hero leaves the viewport and resumes on return", async ({
    page,
  }) => {
    await page.goto("/");
    await wait_for_first_frame(page);

    await page.locator("#contact").scrollIntoViewIfNeeded();
    await expect(hero_canvas(page)).not.toBeInViewport();
    await expect_idle(page);

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect_animating(page);
  });

  test("pauses while the tab is hidden and resumes with a single loop", async ({
    page,
  }) => {
    await page.goto("/");
    await wait_for_first_frame(page);

    await set_tab_hidden(page, true);
    await expect_idle(page);

    await set_tab_hidden(page, false);
    await expect_animating(page);
    await reset_probe(page);
    await page.waitForTimeout(OBSERVE_MS);
    expect((await read_probe(page)).frames).toBeLessThanOrEqual(
      MAX_FRAMES_IN_WINDOW,
    );
  });

  test("reallocates the bitmap on a device pixel ratio change without a realloc loop", async ({
    page,
    viewport,
  }) => {
    test.skip(!viewport, "Test wymaga stałego viewportu projektu");
    await page.goto("/");
    await wait_for_first_frame(page);
    await page.waitForTimeout(RESIZE_SETTLE_MS);
    await reset_probe(page);
    const strokes_before = await read_chain_strokes(page);

    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: viewport?.width ?? 0,
      height: viewport?.height ?? 0,
      deviceScaleFactor: 2,
      mobile: false,
    });

    await expect
      .poll(() =>
        hero_canvas(page).evaluate((canvas: HTMLCanvasElement) => {
          const rect = canvas.getBoundingClientRect();
          return canvas.width === Math.round(rect.width) * 2;
        }),
      )
      .toBe(true);
    await page.waitForTimeout(RESIZE_SETTLE_MS);
    // CDP może dołożyć jeden wpis ResizeObservera, czyli drugą realokację obu warstw.
    const writes_after_change = (await read_probe(page)).size_writes;
    expect(writes_after_change).toBeGreaterThanOrEqual(MIN_WRITES_PER_REALLOC);
    expect(writes_after_change).toBeLessThanOrEqual(
      MAX_WRITES_AFTER_DPR_CHANGE,
    );

    await page.waitForTimeout(STABILITY_MS);
    expect((await read_probe(page)).size_writes).toBe(writes_after_change);
    expect(
      await hero_canvas(page).evaluate((canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        return [
          canvas.width - Math.round(rect.width) * 2,
          canvas.height - Math.round(rect.height) * 2,
        ];
      }),
    ).toEqual([0, 0]);
    expect(await read_chain_strokes(page)).toBeGreaterThan(strokes_before);
    await expect_animating(page);
  });

  test("stops drawing and observing once torn down", async ({ page }) => {
    // Wyspy Astro nie da się odmontować w E2E, więc sprzątanie sprawdza sam moduł pętli.
    await page.goto(PAGE_WITHOUT_HERO);
    await page.evaluate(
      `import(${JSON.stringify(GRID_MODULE_URL)}).then((mod) => { window.__start_grid = mod.start_blockchain_grid; })`,
    );
    await page.evaluate(() => {
      const probe_window = window as unknown as ProbeWindow;
      const host = document.createElement("div");
      host.id = "grid-host";
      host.style.cssText =
        "position:fixed;top:0;left:0;width:400px;height:300px;";
      const [chain, frame] = [0, 1].map(() => {
        const canvas = document.createElement("canvas");
        canvas.style.cssText =
          "position:absolute;inset:0;width:100%;height:100%;";
        return canvas;
      });
      host.append(chain, frame);
      document.body.append(host);
      probe_window.__stop_grid = probe_window.__start_grid?.({ chain, frame });
    });
    await expect_animating(page);

    await page.evaluate(() =>
      (window as unknown as ProbeWindow).__stop_grid?.(),
    );
    await expect_idle(page);

    await reset_probe(page);
    await page.evaluate(() => {
      const host = document.getElementById("grid-host");
      if (host) host.style.width = "600px";
    });
    await page.waitForTimeout(RESIZE_SETTLE_MS);
    expect((await read_probe(page)).size_writes).toBe(0);
  });

  test.describe("with reduced motion", () => {
    test.use({ contextOptions: { reducedMotion: "reduce" } });

    test("draws one static frame and schedules no animation frames", async ({
      page,
    }) => {
      await page.goto("/");
      await wait_for_first_frame(page);
      expect(await has_painted_pixels(page)).toBe(true);
      expect(await has_painted_pixels(page, chain_canvas(page))).toBe(true);
      await expect_idle(page);
    });

    test("keeps the logo cubes still", async ({ page }) => {
      await page.goto("/");
      const cubes = logo_cubes(page);
      await expect(cubes).toHaveCount(LOGO_CUBE_COUNT);
      const styles = await cubes.evaluateAll((nodes: Element[]) =>
        nodes.map((node) => {
          const style = getComputedStyle(node);
          return `${style.animationName}|${style.opacity}`;
        }),
      );
      expect(styles).toEqual(Array(LOGO_CUBE_COUNT).fill("none|1"));
    });

    test("starts animating when the preference is switched off", async ({
      page,
    }) => {
      await page.goto("/");
      await wait_for_first_frame(page);

      await page.emulateMedia({ reducedMotion: "no-preference" });
      await expect_animating(page);

      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect_idle(page);
    });
  });
});
