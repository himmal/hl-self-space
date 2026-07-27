import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const DEFAULT_PARTICLE_COUNT = 3000;

interface NeuralGridProps {
  colorA?: string;
  colorB?: string;
  /** Number of particles — kept configurable so a sparser parallax layer can share this component. */
  count?: number;
  /** Half-extent of the cube particles are scattered within. */
  radius?: number;
  /** Multiplier applied to the base rotation speed (lower = slower, for a parallax "background" feel). */
  rotationSpeed?: number;
  size?: number;
  opacity?: number;
}

export const NeuralGrid = ({
  colorA = "#00ffcc",
  colorB = "#0066ff",
  count = DEFAULT_PARTICLE_COUNT,
  radius = 15,
  rotationSpeed = 1,
  size = 0.035,
  opacity = 0.85,
}: NeuralGridProps) => {
  const pointsRef = useRef<THREE.Points>(null);

  // Pre-allocate particle positions and vertex colors
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const colA = new THREE.Color(colorA);
    const colB = new THREE.Color(colorB);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * radius;
      pos[i * 3 + 1] = (Math.random() - 0.5) * radius;
      pos[i * 3 + 2] = (Math.random() - 0.5) * radius;

      const mixedColor = colA.clone().lerp(colB, Math.random());
      col[i * 3] = mixedColor.r;
      col[i * 3 + 1] = mixedColor.g;
      col[i * 3 + 2] = mixedColor.b;
    }

    return [pos, col];
  }, [colorA, colorB, count, radius]);

  useFrame((state) => {
    if (!pointsRef.current) return;

    // Frame-rate independent continuous rotation
    const time = state.clock.getElapsedTime();
    pointsRef.current.rotation.y = time * 0.03 * rotationSpeed;
    pointsRef.current.rotation.x = Math.sin(time * 0.02 * rotationSpeed) * 0.1;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        vertexColors
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
