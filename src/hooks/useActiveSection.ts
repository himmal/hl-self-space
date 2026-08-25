import { useEffect, useRef } from "react";
import { useAppStore, type Section } from "../store/useAppStore";

// Fraction of a section's height (from the top of the viewport, below the
// fixed navbar) treated as the "active" zone. Trimming both the top and
// bottom by 10% keeps the intersection observer from firing on a sliver of
// a section that has barely entered/exited the viewport — the previous
// asymmetric margin let a section register as "most visible" for a single
// frame while scrolling past it, causing `activeSection` to flap back to an
// earlier section before settling (see docs/ARCHITECTURE.md §5.4/§6).
const ROOT_MARGIN = "-10% 0px -10% 0px";

/**
 * Scroll-spy: watches each `#id` section listed in `sectionIds` with an
 * `IntersectionObserver` and writes whichever one is most visible into
 * `activeSection` (see docs/ARCHITECTURE.md §5.4/§6). Runs continuously
 * (`once: false` semantics) so it stays in sync with manual scrolling, not
 * just nav clicks — unlike a `motion`/`whileInView` entrance animation,
 * which only needs to fire once.
 */
export const useActiveSection = (sectionIds: readonly Section[]) => {
  const setActiveSection = useAppStore((state) => state.setActiveSection);
  // Tracks each section's current intersection ratio so the callback can
  // pick the most-visible candidate instead of just the last one reported.
  const ratiosRef = useRef<Map<Section, number>>(new Map());

  useEffect(() => {
    const elements = sectionIds
      .map((id) => ({ id, el: document.getElementById(id) }))
      .filter((entry): entry is { id: Section; el: HTMLElement } => entry.el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const match = elements.find(({ el }) => el === entry.target);
          if (match) ratiosRef.current.set(match.id, entry.intersectionRatio);
        }

        let bestId: Section | null = null;
        let bestRatio = 0;
        for (const id of sectionIds) {
          const ratio = ratiosRef.current.get(id) ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        }

        if (bestId && bestRatio > 0) setActiveSection(bestId);
      },
      { rootMargin: ROOT_MARGIN, threshold: [0, 0.3, 0.5, 0.75, 1] }
    );

    elements.forEach(({ el }) => observer.observe(el));
    return () => observer.disconnect();
  }, [sectionIds, setActiveSection]);
};
