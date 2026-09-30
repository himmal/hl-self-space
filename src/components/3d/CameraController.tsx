import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGlobalPointer } from "../../hooks/useGlobalPointer";
import { useAppStore } from "../../store/useAppStore";
import { BLOG_POSITIONS, PROJECT_POSITIONS } from "./graphNodes";

const BASE_Z = 5;
const PARALLAX_DISTANCE = 2;
const FOCUS_DISTANCE = 2.8;

export const CameraController = () => {
  const { camera } = useThree();
  const pointer = useGlobalPointer();
  const hoveredProject = useAppStore((state) => state.hoveredProject);
  const hoveredItemId = useAppStore((state) => state.hoveredItemId);
  const hoveredLog = useAppStore((state) => state.hoveredLog);
  const lookAtRef = useRef(new THREE.Vector3());
  const targetLookAtRef = useRef(new THREE.Vector3());
  const targetPositionRef = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const projectPosition = hoveredProject ? PROJECT_POSITIONS[hoveredProject] : undefined;
    const blogPosition = hoveredLog ? BLOG_POSITIONS[hoveredLog] : undefined;
    const graphPosition =
      hoveredItemId && (PROJECT_POSITIONS[hoveredItemId] || BLOG_POSITIONS[hoveredItemId]);
    const focusedPosition = projectPosition || blogPosition || graphPosition;

    targetPositionRef.current.set(
      focusedPosition?.[0] ?? 0,
      focusedPosition?.[1] ?? 0,
      (focusedPosition?.[2] ?? BASE_Z) + (focusedPosition ? FOCUS_DISTANCE : 0)
    );
    targetPositionRef.current.x += pointer.x * PARALLAX_DISTANCE;
    targetPositionRef.current.y += pointer.y * PARALLAX_DISTANCE;

    targetLookAtRef.current.set(
      focusedPosition?.[0] ?? 0,
      focusedPosition?.[1] ?? 0,
      focusedPosition?.[2] ?? 0
    );

    const damping = 1 - Math.exp(-6 * delta);
    camera.position.lerp(targetPositionRef.current, damping);
    lookAtRef.current.lerp(targetLookAtRef.current, damping);
    camera.lookAt(lookAtRef.current);
  });

  return null;
};
