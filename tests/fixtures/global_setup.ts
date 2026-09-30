import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { FullConfig } from "@playwright/test";
import {
  EVENTS_FIXTURE_REQUESTS_URL,
  EVENTS_FIXTURE_RESET_URL,
  LOG_FIXTURE_FILE,
} from "../../playwright.config";
import { render_access_log } from "./access_log";
import { get_seed_event, HARNESS_USER_AGENT, SEED_EVENT_IDS } from "./events";

/** Pierwszy render dev serwera kompiluje trasę — potrafi trwać kilkanaście sekund. */
const PROBE_TIMEOUT_MS = 60_000;
const PROBE_ATTEMPTS = 5;
/** Dłużej niż 1 s TTL cache listy w testach — kolejna próba musi pytać API na nowo. */
const PROBE_RETRY_DELAY_MS = 1_500;

const HARNESS_HEADERS = { "user-agent": HARNESS_USER_AGENT };

interface FixtureRequests {
  next: number;
  entries: { method: string; path: string; userAgent: string | null }[];
}

/**
 * Log powstaje raz na uruchomienie runnera, z timestampami liczonymi od TERAZ —
 * inaczej zbiór zestarzałby się i asercje o wykresie zaczęłyby padać z czasem.
 * Serwer fixture'a (webServer) startuje wcześniej i czyta plik przy żądaniu.
 */
export default async function global_setup(config: FullConfig): Promise<void> {
  await mkdir(dirname(LOG_FIXTURE_FILE), { recursive: true });
  await writeFile(LOG_FIXTURE_FILE, render_access_log(new Date()), "utf8");
  await assert_app_uses_events_fixture(config);
}

/**
 * 2026-09-30 testy CRUD zapisały rekordy do produkcji przez przejęty serwer dev.
 * Zanim ruszy jakikolwiek test, aplikacja musi udowodnić ruchem, że czyta fixture —
 * zmienne z `webServer.env` nic nie dowodzą, bo przejęty proces je ignoruje.
 */
async function assert_app_uses_events_fixture(
  config: FullConfig,
): Promise<void> {
  const base_url = config.projects[0]?.use.baseURL;
  if (!base_url) {
    throw new Error("[events-guard] Brak baseURL w konfiguracji Playwrighta.");
  }

  const reset = await fetch(EVENTS_FIXTURE_RESET_URL, {
    method: "POST",
    headers: HARNESS_HEADERS,
  });
  if (!reset.ok) {
    throw new Error(
      `[events-guard] Fixture wydarzeń odrzucił reset (${reset.status}).`,
    );
  }

  const probe = get_seed_event(SEED_EVENT_IDS.upcoming_conference);
  const probe_name = probe.name;
  if (!probe_name) {
    throw new Error("[events-guard] Rekord próbny z SEED_EVENTS nie ma nazwy.");
  }
  const probe_url = new URL(`/markets/${probe.id}`, base_url).toString();
  let last_failure = "";

  for (let attempt = 1; attempt <= PROBE_ATTEMPTS; attempt += 1) {
    const cursor = (await read_fixture_requests(0)).next;
    let page: Response;
    let html: string;
    try {
      page = await fetch(probe_url, {
        signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      });
      html = await page.text();
    } catch (error) {
      last_failure = `[events-guard] ${probe_url} -> ${error instanceof Error ? error.message : String(error)}`;
      await new Promise((resolve) => setTimeout(resolve, PROBE_RETRY_DELAY_MS));
      continue;
    }
    const app_requests = (await read_fixture_requests(cursor)).entries.filter(
      (entry) => entry.userAgent !== HARNESS_USER_AGENT,
    );

    if (
      page.status === 200 &&
      html.includes(probe_name) &&
      app_requests.length > 0
    ) {
      return;
    }

    last_failure =
      `${probe_url} -> ${page.status}, rekord fixture'a w HTML: ` +
      `${html.includes(probe_name) ? "tak" : "nie"}, żądania aplikacji do fixture'a: ` +
      `${app_requests.length}`;
    await new Promise((resolve) => setTimeout(resolve, PROBE_RETRY_DELAY_MS));
  }

  throw new Error(
    `[events-guard] Aplikacja pod ${base_url} nie rozmawia z lokalnym fixture'em ` +
      `wydarzeń (${EVENTS_FIXTURE_REQUESTS_URL}). Przerywam run, zanim test CRUD ` +
      `wyśle zapis w nieznane API. Ostatnia próba: ${last_failure}.`,
  );
}

async function read_fixture_requests(since: number): Promise<FixtureRequests> {
  const response = await fetch(
    `${EVENTS_FIXTURE_REQUESTS_URL}?since=${since}`,
    {
      headers: HARNESS_HEADERS,
    },
  );
  if (!response.ok) {
    throw new Error(
      `[events-guard] Fixture wydarzeń nie oddał podglądu żądań (${response.status}).`,
    );
  }
  return (await response.json()) as FixtureRequests;
}
