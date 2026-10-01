import { useState, useCallback } from "react";
import { SectionHeader, SectionWrapper } from "./ui";
import { SECTIONS, section_slug_from_id } from "./our-works-data";
import { SectionNav, ContentPanel, MobileTabs } from "./our-works";
import { build_tab_url } from "./our-works/deep_link";

const SECTION_ANCHOR_ID = "what-we-do";
/** Deep-links land on the tab content, not on the section heading above it. */
const CONTENT_ANCHOR_ID = "what-we-do-content";

interface OurWorksProps {
  /** Section opened by `?tab=` / bare `?slug`, resolved on the server from the request URL. */
  deepLinkId?: string | null;
}

/**
 * Unified "What We Do" section — sticky sidebar (desktop) / tabs (mobile) and a
 * content panel with expertise badges woven into each section.
 *
 * The server renders the deep-linked section open, so hydration never swaps
 * panels under a page that has already jumped to it.
 */
export function OurWorks({ deepLinkId = null }: OurWorksProps) {
  const [active_id, set_active_id] = useState<string>(
    deepLinkId ?? SECTIONS[0]?.id ?? "",
  );

  const handle_select = useCallback((id: string) => {
    if (!SECTIONS.some((s) => s.id === id)) return;
    set_active_id(id);

    const slug = section_slug_from_id(id);
    if (slug) {
      window.history.replaceState(
        window.history.state,
        "",
        build_tab_url(slug),
      );
    }
  }, []);

  return (
    <section
      id={SECTION_ANCHOR_ID}
      className="relative py-16 md:py-24 lg:py-32 px-4"
    >
      <SectionWrapper maxWidth="max-w-7xl">
        <SectionHeader
          eyebrow="Our Expertise"
          title="What"
          accent="We Do"
          description="End-to-end engineering across blockchain, EDA, data, and frontend — shipped in production for partners worldwide."
          className="mb-12 md:mb-16"
        />

        {/* Deep-link scroll target: on mobile it includes the tabs, so the
            opened category stays identifiable once the heading is off-screen.
            scroll-mt-20 = fixed h-16 navbar + 1rem gap. */}
        <div
          id={CONTENT_ANCHOR_ID}
          className="scroll-mt-20"
          data-deep-link={deepLinkId ? "" : undefined}
        >
          <div className="md:hidden mb-6">
            <MobileTabs
              sections={SECTIONS}
              active_id={active_id}
              on_select={handle_select}
            />
          </div>

          <div className="flex flex-col md:flex-row gap-6 md:gap-8 lg:gap-10 max-w-6xl mx-auto">
            <aside className="hidden md:block md:w-[35%] lg:w-[32%] shrink-0">
              <div className="sticky top-24">
                <SectionNav
                  sections={SECTIONS}
                  active_id={active_id}
                  on_select={handle_select}
                />
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              <ContentPanel sections={SECTIONS} active_id={active_id} />
            </div>
          </div>
        </div>
      </SectionWrapper>
    </section>
  );
}
