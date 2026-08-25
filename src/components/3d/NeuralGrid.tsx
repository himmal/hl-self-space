import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree, extend, type ThreeElement } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";

const DEFAULT_PARTICLE_COUNT = 3000;

// Custom circular point material with a *clamped* screen-space size. The
// stock `PointsMaterial`'s size-attenuation (`gl_PointSize = size * scale /
// -mvPosition.z`) grows without bound as a particle's depth approaches the
// camera — since particles are scattered through a cube centered on the
// origin while the camera travels through/near that same volume (see
// `CameraRig`), this produced oversized, screen-filling neon "blobs"
// whenever a particle passed close to the lens. Clamping `gl_PointSize` to
// `uMaxSize` keeps every dot small and precise regardless of depth.
const GridDotMaterialImpl = shaderMaterial(
  { uSize: 0.035, uResolution: 1000, uMaxSize: 5, uOpacity: 0.85 },
  /* glsl */ `
    uniform float uSize;
    uniform float uResolution;
    uniform float uMaxSize;
    attribute vec3 color;
    varying vec3 vColor;
    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      float computedSize = uSize * (uResolution / -mvPosition.z);
      gl_PointSize = clamp(computedSize, 1.0, uMaxSize);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  /* glsl */ `
    uniform float uOpacity;
    varying vec3 vColor;
    void main() {
      float d = length(gl_PointCoord - vec2(0.5));
      if (d > 0.5) discard;
      float alpha = smoothstep(0.5, 0.2, d);
      gl_FragColor = vec4(vColor, alpha * uOpacity);
    }
  `
);

extend({ GridDotMaterialImpl });

type GridDotMaterial = InstanceType<typeof GridDotMaterialImpl>;

declare module "@react-three/fiber" {
  interface ThreeElements {
    gridDotMaterialImpl: ThreeElement<typeof GridDotMaterialImpl>;
  }
}

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
  /** Max on-screen point size in pixels — hard ceiling that prevents the "giant blob" artifact near the camera. */
  maxSize?: number;
}

export const NeuralGrid = ({
  colorA = "#334155",
  colorB = "#38bdf8",
  count = DEFAULT_PARTICLE_COUNT,
  radius = 15,
  rotationSpeed = 1,
  size = 0.035,
  opacity = 0.85,
  maxSize = 5,
}: NeuralGridProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<GridDotMaterial>(null);
  const { size: viewportSize } = useThree();

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

      // Bias heavily toward the muted base color (`colorA`), with the
      // accent (`colorB`) surfacing only as a rare highlight — avoids the
      // washed-out, uniformly-bright neon field the old 50/50 lerp produced.
      const mixedColor = colA.clone().lerp(colB, Math.random() ** 3);
      col[i * 3] = mixedColor.r;
      col[i * 3 + 1] = mixedColor.g;
      col[i * 3 + 2] = mixedColor.b;
    }

    return [pos, col];
  }, [colorA, colorB, count, radius]);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uResolution = viewportSize.height;
    }
  }, [viewportSize.height]);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uSize = size;
      materialRef.current.uMaxSize = maxSize;
      materialRef.current.uOpacity = opacity;
    }
  }, [size, maxSize, opacity]);

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
      <gridDotMaterialImpl ref={materialRef} transparent depthWrite={false} />
    </points>
  );
};
