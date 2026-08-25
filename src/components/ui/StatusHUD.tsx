import { SECTIONS, useAppStore } from "../../store/useAppStore";
import { ALL_FRAGMENT_IDS } from "../3d/sceneData";

const TOTAL_FRAGMENTS = ALL_FRAGMENT_IDS.length;

/**
 * Fixed, low-opacity corner HUD showing exploration progress. Reads purely
 * from the store — no 3D dependency.
 */
export const StatusHUD = () => {
  const visitedSections = useAppStore((state) => state.visitedSections);
  const collectedFragments = useAppStore((state) => state.collectedFragments);
  const crtModeEnabled = useAppStore((state) => state.crtModeEnabled);
  const toggleCrtMode = useAppStore((state) => state.toggleCrtMode);

  // Clamp defensively: `collectedFragments` is persisted to localStorage, so
  // ids collected under a previous build (e.g. before a fragment was
  // renamed/removed) could otherwise push the count above 100%.
  const signalPercent = Math.min(
    100,
    Math.round((collectedFragments.length / TOTAL_FRAGMENTS) * 100)
  );

  return (
    <div className="fixed right-4 bottom-4 z-30 flex flex-col gap-1 border border-[var(--color-border)] bg-black/50 px-3 py-2 text-[10px] tracking-widest text-[var(--color-accent)] uppercase backdrop-blur-md">
      <span>
        Sections Visited: {visitedSections.length}/{SECTIONS.length}
      </span>
      <span>
        Fragments Recovered: {collectedFragments.length}/{TOTAL_FRAGMENTS}
      </span>
      <div className="h-1 w-32 bg-white/10">
        <div
          className="h-full bg-[var(--color-accent)] transition-all duration-500"
          style={{ width: `${signalPercent}%` }}
        />
      </div>
      <span>Signal Strength: {signalPercent}%</span>
      <button
        type="button"
        onClick={toggleCrtMode}
        className="mt-1 cursor-pointer self-start border border-[var(--color-border)] px-2 py-0.5 opacity-70 transition-opacity hover:opacity-100"
      >
        CRT MODE: {crtModeEnabled ? "ON" : "OFF"}
      </button>
    </div>
  );
};
