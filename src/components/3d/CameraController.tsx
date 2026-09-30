import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGlobalPointer } from "../../hooks/useGlobalPointer";
import { useAppStore } from "../../store/useAppStore";
import { BLOG_POSITIONS, PROJECT_POSITIONS } from "./graphNodes";
import { SECTION_WAYPOINTS } from "./sceneData";

const TRAVEL_DURATION = 1.1;
const DEFAULT_PARALLAX = 0.16;
const FOCUS_DISTANCE = 2.8;

export const CameraController = () => {
  const { camera } = useThree();
  const pointer = useGlobalPointer();
  const activeSection = useAppStore((state) => state.activeSection);
  const hoveredProject = useAppStore((state) => state.hoveredProject);
  const hoveredItemId = useAppStore((state) => state.hoveredItemId);
  const hoveredLog = useAppStore((state) => state.hoveredLog);
  const setTransitioning = useAppStore((state) => state.setTransitioning);

  const curveRef = useRef<THREE.CatmullRomCurve3 | null>(null);
  const progressRef = useRef(1);
  const startFovRef = useRef(60);
  const targetFovRef = useRef(60);
  const lookAtRef = useRef(new THREE.Vector3());
  const targetLookAtRef = useRef(new THREE.Vector3());
  const targetPositionRef = useRef(new THREE.Vector3());
  const focusPositionRef = useRef(new THREE.Vector3());

  useEffect(() => {
    const waypoint = SECTION_WAYPOINTS[activeSection];
    const startPosition = camera.position.clone();
    const endPosition = new THREE.Vector3(...waypoint.position);
    const midpoint = startPosition
      .clone()
      .lerp(endPosition, 0.5)
      .add(new THREE.Vector3(0, 0, 0.6));

    curveRef.current = new THREE.CatmullRomCurve3([startPosition, midpoint, endPosition]);
    startFovRef.current = camera instanceof THREE.PerspectiveCamera ? camera.fov : 60;
    targetFovRef.current = waypoint.fov;
    progressRef.current = 0;

    if (activeSection === "intro") setTransitioning(true);
  }, [activeSection, camera, setTransitioning]);

  useFrame((_, delta) => {
    const curve = curveRef.current;
    if (curve && progressRef.current < 1) {
      progressRef.current = Math.min(1, progressRef.current + delta / TRAVEL_DURATION);
      const eased = THREE.MathUtils.smoothstep(progressRef.current, 0, 1);
      camera.position.copy(curve.getPoint(eased));

      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = THREE.MathUtils.lerp(startFovRef.current, targetFovRef.current, eased);
        camera.updateProjectionMatrix();
      }

      if (progressRef.current >= 1) setTransitioning(false);
    }

    const projectPosition = hoveredProject ? PROJECT_POSITIONS[hoveredProject] : undefined;
    const blogPosition = hoveredLog ? BLOG_POSITIONS[hoveredLog] : undefined;
    const graphPosition =
      hoveredItemId && (PROJECT_POSITIONS[hoveredItemId] || BLOG_POSITIONS[hoveredItemId]);
    const focusedPosition = projectPosition || blogPosition || graphPosition;
    const damping = 1 - Math.exp(-6 * delta);

    if (focusedPosition) {
      focusPositionRef.current.set(...focusedPosition);
      targetPositionRef.current.copy(focusPositionRef.current);
      targetPositionRef.current.z += FOCUS_DISTANCE;
      targetLookAtRef.current.copy(focusPositionRef.current);
    } else {
      const waypoint = SECTION_WAYPOINTS[activeSection];
      targetPositionRef.current.set(...waypoint.position);
      targetPositionRef.current.x += pointer.x * DEFAULT_PARALLAX;
      targetPositionRef.current.y += pointer.y * DEFAULT_PARALLAX;
      targetLookAtRef.current.set(...waypoint.lookAt);
      targetLookAtRef.current.x += pointer.x * DEFAULT_PARALLAX * 0.35;
      targetLookAtRef.current.y += pointer.y * DEFAULT_PARALLAX * 0.35;
    }

    camera.position.lerp(targetPositionRef.current, damping);
    lookAtRef.current.lerp(targetLookAtRef.current, damping);
    camera.lookAt(lookAtRef.current);
  });

  return null;
};
