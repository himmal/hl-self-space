import { create } from "zustand";
import { persist } from "zustand/middleware";

export const SECTIONS = ["intro", "projects", "blog"] as const;
export type Section = (typeof SECTIONS)[number];

interface AppState {
  activeSection: Section;
  setActiveSection: (section: Section) => void;
  hoveredProject: string | null;
  setHoveredProject: (id: string | null) => void;

  // 3D-side hover state (set by raycasting in the canvas layer); UI reads it
  // to highlight the matching card. `hoveredProject` is the UI-side
  // counterpart read by the 3D layer. Each is written by its own layer.
  hoveredNode: string | null;
  setHoveredNode: (id: string | null) => void;

  // UI-side hover state for blog "log entry" cards — the 3D-side
  // counterpart to `hoveredProject`, used by `NeuralLinks`/`CameraRig`.
  hoveredLog: string | null;
  setHoveredLog: (id: string | null) => void;

  // Shared "Neural Node Link" highlight id — set when hovering a project or
  // log entry to its linked counterpart id, read by `NeuralLinks` (3D) and
  // `Overlay` (UI) to highlight both ends of the connection together.
  activeLinkId: string | null;
  setActiveLinkId: (id: string | null) => void;

  // Drives particle warp / transition shader uniforms on section change.
  isTransitioning: boolean;
  setTransitioning: (v: boolean) => void;

  // Exploration tracking (persisted user progress)
  visitedSections: Section[];
  markSectionVisited: (section: Section) => void;
  collectedFragments: string[];
  collectFragment: (id: string) => void;

  audioEnabled: boolean;
  toggleAudio: () => void;

  crtModeEnabled: boolean;
  toggleCrtMode: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeSection: "intro",
      setActiveSection: (section) => set({ activeSection: section }),
      hoveredProject: null,
      setHoveredProject: (id) => set({ hoveredProject: id }),

      hoveredNode: null,
      setHoveredNode: (id) => set({ hoveredNode: id }),

      hoveredLog: null,
      setHoveredLog: (id) => set({ hoveredLog: id }),

      activeLinkId: null,
      setActiveLinkId: (id) => set({ activeLinkId: id }),

      isTransitioning: false,
      setTransitioning: (v) => set({ isTransitioning: v }),

      visitedSections: [],
      markSectionVisited: (section) =>
        set((state) =>
          state.visitedSections.includes(section)
            ? state
            : { visitedSections: [...state.visitedSections, section] }
        ),
      collectedFragments: [],
      collectFragment: (id) =>
        set((state) =>
          state.collectedFragments.includes(id)
            ? state
            : { collectedFragments: [...state.collectedFragments, id] }
        ),

      audioEnabled: false,
      toggleAudio: () => set((state) => ({ audioEnabled: !state.audioEnabled })),

      crtModeEnabled: false,
      toggleCrtMode: () => set((state) => ({ crtModeEnabled: !state.crtModeEnabled })),
    }),
    {
      name: "hl-self-space-progress",
      partialize: (state) => ({
        collectedFragments: state.collectedFragments,
        visitedSections: state.visitedSections,
        audioEnabled: state.audioEnabled,
        crtModeEnabled: state.crtModeEnabled,
      }),
    }
  )
);
