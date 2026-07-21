import { create } from "zustand";

interface AppState {
  activeSection: "intro" | "projects" | "blog";
  setActiveSection: (section: "intro" | "projects" | "blog") => void;
  hoveredProject: string | null;
  setHoveredProject: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeSection: "intro",
  setActiveSection: (section) => set({ activeSection: section }),
  hoveredProject: null,
  setHoveredProject: (id) => set({ hoveredProject: id }),
}));