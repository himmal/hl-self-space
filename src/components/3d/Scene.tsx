import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { NeuralGrid } from "./NeuralGrid";
import { useAppStore } from "../../store/useAppStore";

// Section-themed grid palettes — cyan/blue for intro, magenta/violet for
// projects, amber/green for blog. Kept module-level to avoid re-allocation.
const SECTION_PALETTES: Record<string, { colorA: string; colorB: string; fog: string }> = {
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

  useFrame((state) => {
    if (fogRef.current) {
      fogRef.current.color.lerp(targetFogColor, 0.02);
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

    // Dynamic camera Z depth according to navigation section
    let targetZ = 5;
    if (activeSection === "projects") targetZ = 3.5;
    if (activeSection === "blog") targetZ = 4.2;

    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, 0.03);
  });

  return (
    <>
      <fogExp2 ref={fogRef} attach="fog" args={[palette.fog, 0.06]} />
      <group ref={groupRef}>
        <NeuralGrid colorA={palette.colorA} colorB={palette.colorB} />
        <ambientLight intensity={0.5} />
      </group>
    </>
  );
};
