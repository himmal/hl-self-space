import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { demoData } from "../../data/portfolioData";
import { useGlobalPointer } from "../../hooks/useGlobalPointer";
import { useAppStore } from "../../store/useAppStore";
import { computeRadialTreeLayout } from "./graphLayout";

const CAMERA_Z = 15;
const PARALLAX_DISTANCE = 0.5;

export const CameraController = () => {
  const { camera, viewport } = useThree();
  const pointer = useGlobalPointer();
  const viewMode = useAppStore((state) => state.viewMode);
  const hoveredItemId = useAppStore((state) => state.hoveredItemId);
  const hoveredProject = useAppStore((state) => state.hoveredProject);
  const hoveredLog = useAppStore((state) => state.hoveredLog);
  const activeSection = useAppStore((state) => state.activeSection);
  const layoutScale = Math.max(1, Math.min(viewport.width / 4, viewport.height / 3));
  const tree = useMemo(() => {
    const data = activeSection === "projects" ? demoData.projects : demoData.blogs;
    return computeRadialTreeLayout(
      data,
      (item) => ("tags" in item ? item.tags : item.keywords),
      2.4 * layoutScale,
      4.8 * layoutScale
    );
  }, [activeSection, layoutScale]);

  useFrame((_, delta) => {
    const selectedId = viewMode === "dom" ? (hoveredProject ?? hoveredLog) : hoveredItemId;
    const selectedPosition = viewMode === "dom" && selectedId ? tree.items[selectedId] : undefined;
    const targetX = (selectedPosition?.[0] ?? 0) + pointer.x * PARALLAX_DISTANCE;
    const targetY = (selectedPosition?.[1] ?? 0) + pointer.y * PARALLAX_DISTANCE;
    camera.position.z = THREE.MathUtils.damp(camera.position.z, CAMERA_Z, 6, delta);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 6, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, 6, delta);
  });

  return null;
};
