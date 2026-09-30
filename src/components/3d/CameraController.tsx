import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGlobalPointer } from "../../hooks/useGlobalPointer";
import { useAppStore } from "../../store/useAppStore";
import { BLOG_POSITIONS, PROJECT_POSITIONS } from "./graphNodes";

const BASE_Z = 5;
const PARALLAX_DISTANCE = 2;
const FOCUS_DISTANCE = 10;
const FOCUSED_PARALLAX_DISTANCE = 0.5;

export const CameraController = () => {
  const { camera } = useThree();
  const pointer = useGlobalPointer();
  const viewMode = useAppStore((state) => state.viewMode);
  const hoveredProject = useAppStore((state) => state.hoveredProject);
  const hoveredItemId = useAppStore((state) => state.hoveredItemId);
  const hoveredLog = useAppStore((state) => state.hoveredLog);
  const targetLookAtRef = useRef(new THREE.Vector3());
  const targetPositionRef = useRef(new THREE.Vector3());
  const targetQuaternionRef = useRef(new THREE.Quaternion());
  const currentQuaternionRef = useRef(new THREE.Quaternion());

  useFrame((_, delta) => {
    const projectPosition = hoveredProject ? PROJECT_POSITIONS[hoveredProject] : undefined;
    const blogPosition = hoveredLog ? BLOG_POSITIONS[hoveredLog] : undefined;
    const graphPosition =
      hoveredItemId && (PROJECT_POSITIONS[hoveredItemId] || BLOG_POSITIONS[hoveredItemId]);
    const focusedPosition =
      viewMode === "particles" ? undefined : projectPosition || blogPosition || graphPosition;

    targetPositionRef.current.set(
      focusedPosition?.[0] ?? 0,
      focusedPosition?.[1] ?? 0,
      (focusedPosition?.[2] ?? BASE_Z) + (focusedPosition ? FOCUS_DISTANCE : 0)
    );
    const parallaxDistance = focusedPosition ? FOCUSED_PARALLAX_DISTANCE : PARALLAX_DISTANCE;
    targetPositionRef.current.x += pointer.x * parallaxDistance;
    targetPositionRef.current.y += pointer.y * parallaxDistance;

    targetLookAtRef.current.set(
      focusedPosition?.[0] ?? 0,
      focusedPosition?.[1] ?? 0,
      focusedPosition?.[2] ?? 0
    );

    camera.position.lerp(targetPositionRef.current, 1 - Math.exp(-6 * delta));

    currentQuaternionRef.current.copy(camera.quaternion);
    camera.lookAt(targetLookAtRef.current);
    targetQuaternionRef.current.copy(camera.quaternion);
    camera.quaternion.copy(currentQuaternionRef.current);
    camera.quaternion.slerp(targetQuaternionRef.current, 1 - Math.exp(-8 * delta));
  });

  return null;
};
