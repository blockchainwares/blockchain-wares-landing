import { cn } from "../lib/utils";
import { SectionHeader, SectionWrapper } from "./ui";

/**
 * Team section component
 * Displays team photo
 * Features:
 * - Large centered team photo
 * - Subtle border with glow effect
 * - Rounded corners
 */
export function Team() {
  return (
    <section
      id="team"
      className="relative min-h-screen flex items-center py-16 md:py-24 lg:py-32 px-4"
    >
      <SectionWrapper>
        <SectionHeader
          eyebrow="Who We Are"
          title="Our"
          accent="Team"
          description="A dedicated team of engineers and developers passionate about building cutting-edge solutions in blockchain technology and high-performance software."
          className="mb-12 md:mb-16"
        />

        <div
          className={cn(
            "relative p-4 md:p-6 rounded-[28px] md:rounded-[36px]",
            "bg-base-200/30 backdrop-blur-sm",
            "border border-white/5",
            "shadow-card",
            "hover:shadow-card-hover"
          )}
        >
          <div className="relative overflow-hidden rounded-xl z-10">
            <div className="relative aspect-video md:aspect-[16/9] lg:aspect-[21/9] bg-base-100/50">
              <picture>
                <source srcSet="/assets/img/team.webp" type="image/webp" />
                <img
                  src="/assets/img/team.jpeg"
                  alt="BlockchainWares Team"
                  width={1600}
                  height={757}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target;
                    if (target instanceof HTMLImageElement) {
                      target.style.display = "none";
                      const placeholder = target.nextElementSibling;
                      if (placeholder instanceof HTMLElement) {
                        placeholder.style.display = "flex";
                      }
                    }
                  }}
                />
              </picture>
              <div
                className={cn(
                  "hidden absolute inset-0",
                  "items-center justify-center",
                  "bg-base-100/50"
                )}
              >
                <div className="text-center px-4">
                  <p className="text-base-content/80 text-lg">
                    Team photo coming soon
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>
    </section>
  );
}
