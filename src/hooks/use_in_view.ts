import { useEffect, useState, type RefObject } from "react";

/**
 * Two-way viewport tracking for an element owned by the caller.
 * Unlike `useScrollAnimation`, it flips back to `false` once the element leaves.
 * `null` until the first observation (SSR, pre-hydration, no IntersectionObserver).
 */
export function useInView<T extends HTMLElement>(
  ref: RefObject<T | null>,
  root_margin: string = "0px"
): boolean | null {
  const [in_view, set_in_view] = useState<boolean | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) set_in_view(entry.isIntersecting);
      },
      { rootMargin: root_margin }
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, [ref, root_margin]);

  return in_view;
}
