import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { demoData } from "../../data/portfolioData";
import { useGlobalPointer } from "../../hooks/useGlobalPointer";
import { useAppStore } from "../../store/useAppStore";
import { computeRadialTreeLayout, getRadialTreeFitScale } from "./graphLayout";

const CAMERA_Z = 15;
const PARALLAX_DISTANCE = 0.5;

export const CameraController = () => {
  const { camera, viewport } = useThree();
  const pointer = useGlobalPointer();
  const viewMode = useAppStore((state) => state.viewMode);
  const hoveredProject = useAppStore((state) => state.hoveredProject);
  const hoveredLog = useAppStore((state) => state.hoveredLog);
  const activeSection = useAppStore((state) => state.activeSection);
  const tree = useMemo(() => {
    const data = activeSection === "projects" ? demoData.projects : demoData.blogs;
    return computeRadialTreeLayout(
      data,
      (item) => ("tags" in item ? item.tags : item.keywords),
      2.4,
      4.8
    );
  }, [activeSection]);
  const fitScale = getRadialTreeFitScale(tree, viewport.width, viewport.height);

  useFrame((_, delta) => {
    const selectedId = viewMode === "dom" ? (hoveredProject ?? hoveredLog) : null;
    const selectedPosition = selectedId ? tree.items[selectedId] : undefined;
    const targetX =
      (selectedPosition?.[0] ?? 0) * fitScale +
      (viewMode === "dom" || viewMode === "particles" ? pointer.x * PARALLAX_DISTANCE : 0);
    const targetY =
      (selectedPosition?.[1] ?? 0) * fitScale +
      (viewMode === "dom" || viewMode === "particles" ? pointer.y * PARALLAX_DISTANCE : 0);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, CAMERA_Z, 6, delta);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 6, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, 6, delta);
    if (viewMode === "dom" && selectedPosition) {
      camera.lookAt(
        selectedPosition[0] * fitScale,
        selectedPosition[1] * fitScale,
        selectedPosition[2] * fitScale
      );
    } else {
      camera.lookAt(0, 0, 0);
    }
  });

  return null;
};
