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
  blog: { position: [-1.4, -0.3, 4.2], lookAt: [-0.6, -0.1, -1], fov: 58 },
};

// Static anchor points for the "Selected Works" (projects) and "Log" (blog)
// entries, used by both `NeuralLinks` (connector lines) and the hover
// magnetism bias in `CameraRig`.
export const PROJECT_ANCHORS: Record<string, [number, number, number]> = {
  "proj-1": [2, 0.6, -1],
  "proj-2": [2.6, -0.5, -1.6],
};

export const LOG_ANCHORS: Record<string, [number, number, number]> = {
  "log-1": [-2, 0.5, -1.2],
  "log-2": [-2.6, -0.4, -1.8],
};

// Neural Node Links: models relationships between projects and blog log
// entries, rendered as glowing connector lines in the 3D layer.
export const NEURAL_LINKS: { projectId: string; logId: string }[] = [
  { projectId: "proj-1", logId: "log-1" },
  { projectId: "proj-2", logId: "log-2" },
];

// Collectible "data fragment" hub anchors — additional 3D-collectible
// fragments layered on top of the per-section fragments awarded on first
// visit (see `Overlay.tsx`).
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
  "fragment-blog",
  "terminal-easter-egg",
  ...FRAGMENT_HUBS.map((hub) => hub.id),
];
