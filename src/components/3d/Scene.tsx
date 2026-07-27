import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { NeuralGrid } from "./NeuralGrid";
import { CameraRig } from "./CameraRig";
import { NeuralLinks } from "./NeuralLinks";
import { DataFragments } from "./DataFragments";
import { WarpParticles } from "./WarpParticles";
import { FRAGMENT_HUBS } from "./sceneData";
import { useAppStore, type Section } from "../../store/useAppStore";

// Section-themed grid palettes — cyan/blue for intro, magenta/violet for
// projects, amber/green for blog. Kept module-level to avoid re-allocation.
const SECTION_PALETTES: Record<Section, { colorA: string; colorB: string; fog: string }> = {
  intro: { colorA: "#00ffcc", colorB: "#0066ff", fog: "#001a1a" },
  projects: { colorA: "#ff2fd0", colorB: "#7a1fff", fog: "#1a0022" },
  blog: { colorA: "#ffb020", colorB: "#33cc66", fog: "#1a1400" },
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
    // Camera position/FOV per section is now owned by `CameraRig`, which
    // animates a curve-based "travel" journey instead of a flat z-lerp.
  });

  return (
    <>
      <CameraRig />
      <fogExp2 ref={fogRef} attach="fog" args={[palette.fog, 0.06]} />
      <group ref={groupRef}>
        <NeuralGrid colorA={palette.colorA} colorB={palette.colorB} />
        {/* Sparser, slower-rotating parallax layer for extra depth at near-zero cost */}
        <NeuralGrid
          colorA={palette.colorA}
          colorB={palette.colorB}
          count={1200}
          radius={30}
          rotationSpeed={0.35}
          size={0.02}
          opacity={0.35}
        />
        <NeuralLinks />
        <DataFragments />
        {FRAGMENT_HUBS.slice(0, 2).map((hub) => (
          <Sparkles
            key={hub.id}
            position={hub.position}
            count={30}
            scale={1.5}
            size={2}
            speed={0.3}
            color={palette.colorA}
          />
        ))}
        <ambientLight intensity={0.5} />
      </group>
      <WarpParticles />
    </>
  );
};
