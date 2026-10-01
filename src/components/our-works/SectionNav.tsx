import { memo } from "react";
import { cn } from "../../lib/utils";
import type { ProjectSection } from "../our-works-data";

interface SectionNavProps {
  sections: ProjectSection[];
  active_id: string;
  on_select: (id: string) => void;
}

interface SectionNavItemProps {
  section: ProjectSection;
  is_active: boolean;
  on_select: (id: string) => void;
}

const SectionNavItem = memo(function SectionNavItem({
  section,
  is_active,
  on_select,
}: SectionNavItemProps) {
  return (
    <button
      type="button"
      role="tab"
      id={`tab-${section.id}`}
      aria-selected={is_active}
      aria-controls={`tabpanel-${section.id}`}
      onClick={() => on_select(section.id)}
      className={cn(
        "w-full text-left px-4 py-3 rounded-r-lg cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100",
        is_active
          ? "bg-secondary/10 border-l-2 border-secondary"
          : "border-l-2 border-transparent hover:bg-base-200/50 hover:border-secondary/30",
      )}
    >
      <h3
        className={cn(
          "text-sm md:text-base font-bold leading-snug",
          is_active ? "text-secondary" : "text-base-content/70",
        )}
      >
        {section.title}
      </h3>
      <p
        className={cn(
          "text-xs md:text-sm leading-snug mt-0.5",
          is_active ? "text-base-content/80" : "text-base-content/60",
        )}
      >
        {section.subtitle}
      </p>
    </button>
  );
});

/** Left sidebar navigation for Our Works section (desktop). */
export const SectionNav = memo(function SectionNav({
  sections,
  active_id,
  on_select,
}: SectionNavProps) {
  return (
    <nav
      role="tablist"
      aria-label="Project categories"
      className="flex flex-col gap-1"
    >
      {sections.map((section) => (
        <SectionNavItem
          key={section.id}
          section={section}
          is_active={active_id === section.id}
          on_select={on_select}
        />
      ))}
    </nav>
  );
});
