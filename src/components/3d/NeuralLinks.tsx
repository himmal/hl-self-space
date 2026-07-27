import { QuadraticBezierLine } from "@react-three/drei";
import * as THREE from "three";
import { useAppStore } from "../../store/useAppStore";
import { NEURAL_LINKS, PROJECT_ANCHORS, LOG_ANCHORS } from "./sceneData";

// Static per-link geometry — anchors never change at runtime, so this is
// computed once at module scope rather than recomputed on every render.
const LINKS = NEURAL_LINKS.filter(
  (link) => PROJECT_ANCHORS[link.projectId] && LOG_ANCHORS[link.logId]
).map((link) => {
  const start = PROJECT_ANCHORS[link.projectId];
  const end = LOG_ANCHORS[link.logId];
  return {
    ...link,
    start,
    end,
    mid: new THREE.Vector3(
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2 + 0.8,
      (start[2] + end[2]) / 2
    ),
  };
});

/**
 * Renders glowing connector lines between project and blog-log anchor
 * points in the 3D layer, modeling the `NEURAL_LINKS` relationship data.
 * Hovering a project card in the UI (or its 3D node) highlights the linked
 * log entry's connector (and vice versa) via `hoveredProject`/`hoveredNode`/
 * `hoveredLog`/`activeLinkId`.
 */
export const NeuralLinks = () => {
  const hoveredProject = useAppStore((state) => state.hoveredProject);
  const hoveredNode = useAppStore((state) => state.hoveredNode);
  const hoveredLog = useAppStore((state) => state.hoveredLog);
  const activeLinkId = useAppStore((state) => state.activeLinkId);

  return (
    <>
      {LINKS.map((link) => {
        const isActive =
          hoveredProject === link.projectId ||
          hoveredNode === link.projectId ||
          hoveredLog === link.logId ||
          activeLinkId === link.projectId ||
          activeLinkId === link.logId;

        return (
          <QuadraticBezierLine
            key={`${link.projectId}-${link.logId}`}
            start={link.start}
            end={link.end}
            mid={link.mid}
            color={isActive ? "#ffffff" : "#00ffcc"}
            lineWidth={isActive ? 2.5 : 1}
            transparent
            opacity={isActive ? 0.9 : 0.25}
          />
        );
      })}
    </>
  );
};
