import type { Section } from "../../store/useAppStore";

// Per-section camera waypoints (position + lookAt + FOV) used by `CameraRig`
// to travel along a curve rather than snapping/lerping a flat depth value.
export interface Waypoint {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
}

export const SECTION_WAYPOINTS: Record<Section, Waypoint> = {
  intro: { position: [0, 0, 5], lookAt: [0, 0, 0], fov: 60 },
  projects: { position: [1.4, 0.35, 3.5], lookAt: [0.6, 0.1, -1], fov: 55 },
  blogs: { position: [-1.4, -0.3, 4.2], lookAt: [-0.6, -0.1, -1], fov: 58 },
};

// Collectible "data fragment" hub anchors — additional 3D-collectible
// fragments layered on top of the per-section fragments awarded on first
// visit (see `Overlay.tsx`). Only used as ambient `Sparkles` anchor points
// now — the collectible octahedron meshes themselves have been removed from
// the background (see `Scene.tsx`).
export const FRAGMENT_HUBS: { id: string; position: [number, number, number] }[] = [
  { id: "hub-alpha", position: [0, 1.3, -2] },
  { id: "hub-beta", position: [1.9, -0.9, -2.4] },
  { id: "hub-gamma", position: [-1.9, 1.0, -1.8] },
];

// Canonical list of every fragment id that can ever be collected, used to
// compute exploration progress consistently across the UI.
export const ALL_FRAGMENT_IDS: string[] = [
  "fragment-intro",
  "fragment-projects",
  "fragment-blogs",
  "terminal-easter-egg",
];
