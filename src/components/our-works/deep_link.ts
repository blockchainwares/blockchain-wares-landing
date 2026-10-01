import {
  SECTIONS,
  is_section_slug,
  section_id_from_slug,
  type SectionSlug,
} from "../our-works-data";

/** Above this the page was scrolled by the user, so a deep-link jump would fight them. */
const FRESH_LOAD_SCROLL_PX = 8;
const DEEP_LINK_SELECTOR = "[data-deep-link]";

/** Reads `?tab=docs`, falling back to a bare `?docs`; keys carrying a value are ignored. */
function read_tab_slug(search: string): string | null {
  const params = new URLSearchParams(search);
  const named = params.get("tab");
  if (named) return named;
  for (const [key, value] of params) {
    if (value === "") return key;
  }
  return null;
}

/** Section id opened by the query string, or `null` when it names no section. */
export function read_deep_link_section_id(search: string): string | null {
  const slug = read_tab_slug(search);
  if (slug === null) return null;
  const id = section_id_from_slug(slug);
  if (id === null || !SECTIONS.some((section) => section.id === id)) {
    return null;
  }
  return id;
}

/** Keeps unrelated params, drops a stale bare alias, writes the canonical `?tab=`. */
export function build_tab_url(slug: SectionSlug): string {
  const url = new URL(window.location.href);
  for (const key of [...url.searchParams.keys()]) {
    if (is_section_slug(key)) url.searchParams.delete(key);
  }
  url.searchParams.set("tab", slug);
  return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * Jumps to the server-marked deep-link target. Runs from a page script, not from
 * the `client:visible` island, so it does not wait for the section to hydrate.
 */
export function scroll_to_deep_link(): void {
  const target = document.querySelector(DEEP_LINK_SELECTOR);
  if (!target || window.scrollY > FRESH_LOAD_SCROLL_PX) return;
  target.scrollIntoView({ block: "start", behavior: "instant" });
}
