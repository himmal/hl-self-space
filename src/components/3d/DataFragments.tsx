import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useAppStore } from "../../store/useAppStore";
import { useAudioManager } from "../../hooks/useAudioManager";
import { FRAGMENT_HUBS } from "./sceneData";

// Pulse animation tuning for uncollected fragments (collected ones settle to
// a fixed, dimmer `COLLECTED_SCALE`).
const COLLECTED_SCALE = 0.55;
const UNCOLLECTED_BASE_SCALE = 0.85;
const PULSE_AMPLITUDE = 0.15;
const PULSE_FREQUENCY = 2;
// Per-fragment phase offset so hubs don't all pulse in lockstep.
const PULSE_PHASE_STEP = 1.7;
const ROTATION_SPEED_Y = 0.6;
const ROTATION_SPEED_X = 0.3;

/**
 * Renders collectible "data fragment" meshes scattered across the grid.
 * Clicking an uncollected fragment (via R3F raycasting) marks it collected
 * in the persisted Zustand slice. All per-frame animation mutates mesh refs
 * directly — no `useState` inside the `useFrame` loop.
 */
export const DataFragments = () => {
  const collectedFragments = useAppStore((state) => state.collectedFragments);
  const collectFragment = useAppStore((state) => state.collectFragment);
  const { playSfx } = useAudioManager();
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  // Reset the cursor on unmount in case the component is removed mid-hover.
  useEffect(() => {
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    FRAGMENT_HUBS.forEach((hub, i) => {
      const mesh = meshRefs.current[i];
      if (!mesh) return;
      const collected = collectedFragments.includes(hub.id);
      const pulse = collected
        ? COLLECTED_SCALE
        : UNCOLLECTED_BASE_SCALE +
          Math.sin(time * PULSE_FREQUENCY + i * PULSE_PHASE_STEP) * PULSE_AMPLITUDE;
      mesh.scale.setScalar(pulse);
      mesh.rotation.y = time * ROTATION_SPEED_Y + i;
      mesh.rotation.x = time * ROTATION_SPEED_X;
    });
  });

  return (
    <>
      {FRAGMENT_HUBS.map((hub, i) => {
        const collected = collectedFragments.includes(hub.id);
        return (
          <mesh
            key={hub.id}
            ref={(el) => {
              meshRefs.current[i] = el;
            }}
            position={hub.position}
            onClick={(event) => {
              event.stopPropagation();
              if (collected) return;
              collectFragment(hub.id);
              playSfx("fragment");
            }}
            onPointerOver={(event) => {
              event.stopPropagation();
              if (!collected) document.body.style.cursor = "pointer";
            }}
            onPointerOut={(event) => {
              event.stopPropagation();
              document.body.style.cursor = "auto";
            }}
          >
            <octahedronGeometry args={[0.18, 0]} />
            <meshStandardMaterial
              color={collected ? "#335544" : "#00ffcc"}
              emissive={collected ? "#113322" : "#00ffcc"}
              emissiveIntensity={collected ? 0.3 : 1.4}
              transparent
              opacity={collected ? 0.35 : 0.95}
            />
          </mesh>
        );
      })}
    </>
  );
};
