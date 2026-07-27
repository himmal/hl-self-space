import { useAppStore } from "../../store/useAppStore";

/**
 * Fixed, full-screen CSS-only scanline + vignette overlay. Rendered above the
 * UI layer but purely decorative — never intercepts pointer events.
 */
export const CrtOverlay = () => {
  const crtModeEnabled = useAppStore((state) => state.crtModeEnabled);

  if (!crtModeEnabled) return null;

  return <div className="scanline-overlay" aria-hidden="true" />;
};
