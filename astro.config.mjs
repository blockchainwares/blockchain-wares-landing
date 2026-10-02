// @ts-check
import { execSync } from "node:child_process";
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";

const SITE = "https://blockchainwares.com.pl";

// Panel admina jest noindex (AdminLayout.astro) — sitemap nie moze go reklamowac.
const SITEMAP_EXCLUDED = /^\/(admin(\/|$)|404\/?$)/;

/**
 * Integracja emituje sciezki w `build.format: "directory"`, czyli `/markets/`, a strony
 * deklaruja canonical bez koncowego slasha (`get_event_path()` buduje tak sciezki wydarzen).
 * Bez tego sitemap i canonical mowilyby wyszukiwarce dwie rozne rzeczy o tej samej stronie.
 * Korekta idzie tutaj, a nie przez globalne `trailingSlash` — to ruszaloby przekierowania
 * calego serwisu. Root zostaje `/`: sama domena bez sciezki nie ma wariantu bez slasha.
 *
 * @param {string} url
 * @returns {string}
 */
function drop_trailing_slash(url) {
  const parsed = new URL(url);
  if (parsed.pathname.length > 1) {
    parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  }
  return parsed.href;
}

const APP_VERSION_FALLBACK = "dev";
const APP_VERSION_LENGTH = 7;

/** @returns {string} */
function read_git_head() {
  try {
    return execSync("git rev-parse HEAD", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 2000,
    }).trim();
  } catch {
    return "";
  }
}

/**
 * Wersja widoczna w panelu, liczona raz w czasie builda. Deploy idzie recznie przez
 * `vercel` CLI, wiec VERCEL_GIT_COMMIT_SHA bywa puste, a na Vercelu nie ma `.git`.
 *
 * @returns {string}
 */
function resolve_app_version() {
  const sha =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.APP_VERSION_SHA ||
    read_git_head();
  return sha ? sha.slice(0, APP_VERSION_LENGTH) : APP_VERSION_FALLBACK;
}

// https://astro.build/config
export default defineConfig({
  site: SITE,
  output: "server",

  // Pobranie calego logu ma na siebie 60 s (FETCH_TIMEOUT_MS w src/lib/logs/source.ts),
  // a Vercel ubija funkcje po `maxDuration` — bez tego zapasu na parsowanie i render
  // timeout fetcha nigdy by nie zadzialal. 90 s miesci sie w limicie kazdego planu.
  adapter: vercel({ maxDuration: 90 }),

  // Wbudowany checkOrigin porownuje Origin z `Astro.url`, a ten na Vercelu wychodzi
  // jako `https://localhost` (Astro ufa Host dopiero przez security.allowedDomains).
  // Ochrone CSRF trzyma is_same_site_request() — porownuje do originu z konfiguracji.
  security: { checkOrigin: false },
  integrations: [
    react(),
    // Wydarzen tu nie ma: ich lista przychodzi z API dopiero w runtime, a `customPages`
    // domyka sie w trakcie builda. Trasy /markets/<id> wystawia /sitemap-events.xml
    // (src/pages/sitemap-events.xml.ts), zglosza osobno w public/robots.txt.
    sitemap({
      filter: (page) => !SITEMAP_EXCLUDED.test(new URL(page).pathname),
      serialize: (item) => ({ ...item, url: drop_trailing_slash(item.url) }),
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
    define: {
      __APP_VERSION__: JSON.stringify(resolve_app_version()),
    },
  },
});
