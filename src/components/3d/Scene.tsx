import { Suspense, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { NeuralGrid } from "./NeuralGrid";
import { CameraController } from "./CameraController";
import { RelationalGraph } from "./RelationalGraph";
import { WarpParticles } from "./WarpParticles";
import { AntigravityParticles } from "./AntigravityParticles";
import { FRAGMENT_HUBS } from "./sceneData";
import { useAppStore, type Section } from "../../store/useAppStore";
import { demoData } from "../../data/portfolioData";

// Section-themed grid palettes — a single muted slate/accent scheme shared
// across all sections (see docs/ARCHITECTURE.md §5.2) so switching sections
// no longer washes the scene in a different neon hue. Only the fog tint and
// accent shift subtly between sections to preserve a sense of place — the
// `AntigravityParticles` field carries the drastic per-section theming.
const SECTION_PALETTES: Record<Section, { colorA: string; colorB: string; fog: string }> = {
  intro: { colorA: "#334155", colorB: "#38bdf8", fog: "#020617" },
  projects: { colorA: "#334155", colorB: "#2dd4bf", fog: "#0b1120" },
  blogs: { colorA: "#334155", colorB: "#38bdf8", fog: "#0c0a09" },
};

export const Scene = () => {
  const fogRef = useRef<THREE.FogExp2>(null);
  const activeSection = useAppStore((state) => state.activeSection);
  const viewMode = useAppStore((state) => state.viewMode);
  const palette = useMemo(
    () => SECTION_PALETTES[activeSection] ?? SECTION_PALETTES.intro,
    [activeSection]
  );
  const targetFogColor = useMemo(() => new THREE.Color(palette.fog), [palette]);

  useFrame((_state, delta) => {
    if (fogRef.current) {
      const alpha = 1 - Math.exp(-2 * delta);
      fogRef.current.color.lerp(targetFogColor, alpha);
    }

  });

  return (
    <>
      <CameraController />
      {viewMode !== "graph" && (
        <fogExp2 ref={fogRef} attach="fog" args={[palette.fog, 0.06]} />
      )}
      <group>
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
        <Suspense fallback={null}>
          {activeSection === "projects" && (
            <RelationalGraph data={demoData.projects} rootLabel="Projects" />
          )}
          {activeSection === "blogs" && (
            <RelationalGraph data={demoData.blogs} rootLabel="Blogs" />
          )}
        </Suspense>
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
