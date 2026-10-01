import { memo } from "react";
import { cn } from "../../lib/utils";
import type { ProjectSection } from "../our-works-data";

interface MobileTabsProps {
  sections: ProjectSection[];
  active_id: string;
  on_select: (id: string) => void;
}

/** Wrapping pill tabs for the mobile view. */
export const MobileTabs = memo(function MobileTabs({
  sections,
  active_id,
  on_select,
}: MobileTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Project categories"
      className="flex flex-wrap gap-2 pb-2"
    >
      {sections.map((section) => {
        const is_active = active_id === section.id;
        return (
          <button
            key={section.id}
            type="button"
            role="tab"
            id={`tab-mobile-${section.id}`}
            aria-selected={is_active}
            aria-controls={`tabpanel-${section.id}`}
            onClick={() => on_select(section.id)}
            className={cn(
              "px-3 py-2.5 rounded-full text-xs font-semibold cursor-pointer",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary",
              is_active
                ? "bg-secondary text-secondary-content"
                : "bg-base-200/50 text-base-content/70 hover:text-base-content/80 hover:bg-base-200",
            )}
          >
            {section.title}
          </button>
        );
      })}
    </div>
  );
});
