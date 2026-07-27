import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useAppStore } from "../../store/useAppStore";
import { SECTION_WAYPOINTS, PROJECT_ANCHORS, LOG_ANCHORS } from "./sceneData";

// Total travel time (seconds) for a section-to-section camera journey.
const TRAVEL_DURATION = 1.1;
// Damping rate for the hover-magnetism lookAt bias.
const LOOKAT_DAMP_LAMBDA = 3;

/**
 * Owns curve-based camera travel between per-section waypoints (position +
 * lookAt + FOV), animating along a `CatmullRomCurve3` rather than a flat
 * lerp so section changes feel like "traveling" through the grid. Also
 * applies a subtle hover-magnetism bias to the lookAt target when a project
 * or log entry is hovered, reinforcing the UI <-> 3D link.
 */
export const CameraRig = () => {
  const { camera } = useThree();
  const activeSection = useAppStore((state) => state.activeSection);
  const hoveredProject = useAppStore((state) => state.hoveredProject);
  const hoveredNode = useAppStore((state) => state.hoveredNode);
  const hoveredLog = useAppStore((state) => state.hoveredLog);
  const setTransitioning = useAppStore((state) => state.setTransitioning);

  const curveRef = useRef<THREE.CatmullRomCurve3 | null>(null);
  const progressRef = useRef(1); // 1 = arrived at current waypoint
  const startFovRef = useRef(60);
  const targetFovRef = useRef(60);
  const baseLookAtRef = useRef(new THREE.Vector3(0, 0, 0));
  const lookAtRef = useRef(new THREE.Vector3(0, 0, 0));
  const hasInitRef = useRef(false);

  // Kick off a new curve-based journey whenever the active section changes.
  useEffect(() => {
    const waypoint = SECTION_WAYPOINTS[activeSection];
    const startPos = camera.position.clone();
    const endPos = new THREE.Vector3(...waypoint.position);
    // Bulge the midpoint outward so the path reads as travel through the
    // grid rather than a straight-line snap.
    const midPoint = startPos
      .clone()
      .lerp(endPos, 0.5)
      .add(new THREE.Vector3(0, 0, 0.6));
    curveRef.current = new THREE.CatmullRomCurve3([startPos, midPoint, endPos]);

    baseLookAtRef.current.set(...waypoint.lookAt);
    startFovRef.current = camera instanceof THREE.PerspectiveCamera ? camera.fov : 60;
    targetFovRef.current = waypoint.fov;
    progressRef.current = 0;

    if (hasInitRef.current) setTransitioning(true);
    hasInitRef.current = true;
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

    // Reactive hover magnetism: bias the lookAt target slightly toward the
    // hovered project/log anchor point in 3D space.
    const hoveredAnchor =
      (hoveredProject && PROJECT_ANCHORS[hoveredProject]) ||
      (hoveredNode && PROJECT_ANCHORS[hoveredNode]) ||
      (hoveredLog && LOG_ANCHORS[hoveredLog]) ||
      null;

    const targetLookAt = baseLookAtRef.current.clone();
    if (hoveredAnchor) {
      targetLookAt.lerp(new THREE.Vector3(...hoveredAnchor), 0.25);
    }

    const alpha = 1 - Math.exp(-LOOKAT_DAMP_LAMBDA * delta);
    lookAtRef.current.lerp(targetLookAt, alpha);
    camera.lookAt(lookAtRef.current);
  });

  return null;
};
