import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { NeuralGrid } from "./NeuralGrid";
import { CameraRig } from "./CameraRig";
import { NeuralLinks } from "./NeuralLinks";
import { DataFragments } from "./DataFragments";
import { WarpParticles } from "./WarpParticles";
import { AntigravityParticles } from "./AntigravityParticles";
import { FRAGMENT_HUBS } from "./sceneData";
import { useAppStore, type Section } from "../../store/useAppStore";

// Section-themed grid palettes — a single muted slate/accent scheme shared
// across all sections (see docs/ARCHITECTURE.md §5.2) so switching sections
// no longer washes the scene in a different neon hue. Only the fog tint and
// accent shift subtly between sections to preserve a sense of place — the
// `AntigravityParticles` field carries the drastic per-section theming.
const SECTION_PALETTES: Record<Section, { colorA: string; colorB: string; fog: string }> = {
  intro: { colorA: "#334155", colorB: "#38bdf8", fog: "#020617" },
  projects: { colorA: "#334155", colorB: "#2dd4bf", fog: "#0b1120" },
  blog: { colorA: "#334155", colorB: "#38bdf8", fog: "#0c0a09" },
};

export const Scene = () => {
  const groupRef = useRef<THREE.Group>(null);
  const fogRef = useRef<THREE.FogExp2>(null);
  const activeSection = useAppStore((state) => state.activeSection);
  const palette = useMemo(
    () => SECTION_PALETTES[activeSection] ?? SECTION_PALETTES.intro,
    [activeSection]
  );
  const targetFogColor = useMemo(() => new THREE.Color(palette.fog), [palette]);

  useFrame((state, delta) => {
    if (fogRef.current) {
      const alpha = 1 - Math.exp(-2 * delta);
      fogRef.current.color.lerp(targetFogColor, alpha);
    }

    if (!groupRef.current) return;

    // Subtle parallax tilt based on mouse position
    const targetMouseX = (state.pointer.x * Math.PI) / 12;
    const targetMouseY = (state.pointer.y * Math.PI) / 12;

    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetMouseX,
      0.05
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      -targetMouseY,
      0.05
    );
  });

  return (
    <>
      <CameraRig />
      <fogExp2 ref={fogRef} attach="fog" args={[palette.fog, 0.06]} />
      <group ref={groupRef}>
        <NeuralGrid colorA={palette.colorA} colorB={palette.colorB} maxSize={5} />
        {/* Sparser, slower-rotating parallax layer for extra depth at near-zero cost */}
        <NeuralGrid
          colorA={palette.colorA}
          colorB={palette.colorB}
          count={1200}
          radius={30}
          rotationSpeed={0.35}
          size={0.02}
          opacity={0.35}
          maxSize={4}
        />
        <NeuralLinks />
        <DataFragments />
        {FRAGMENT_HUBS.slice(0, 2).map((hub) => (
          <Sparkles
            key={hub.id}
            position={hub.position}
            count={20}
            scale={1.2}
            size={0.6}
            speed={0.3}
            color={palette.colorB}
          />
        ))}
        <ambientLight intensity={0.5} />
      </group>
      <AntigravityParticles />
      <WarpParticles />
    </>
  );
};
