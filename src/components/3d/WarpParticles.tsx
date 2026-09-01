import { useMemo, useRef } from "react";
import { useFrame, extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useAppStore } from "../../store/useAppStore";

const WARP_PARTICLE_COUNT = 500;
const WARP_RADIUS = 9;
// Rate at which the warp progress eases toward its target (in/out).
const WARP_DAMP_LAMBDA = 6;

// Custom warp material: a `uProgress` uniform (0 -> 1) stretches each
// particle away from the camera along its own random `aStretch` factor,
// simulating a "hyperspace jump" without mutating buffer geometry per-frame.
// `gl_PointSize` is clamped to `uMaxSize` — the same fix already applied to
// `NeuralGrid`/`AntigravityParticles` — since unbounded size-attenuation
// balloons a particle into an oversized, screen-filling blue "bubble"
// whenever it passes close to the camera during the transition.
const WarpMaterialImpl = shaderMaterial(
  { uProgress: 0, uColor: new THREE.Color("#38bdf8"), uMaxSize: 5 },
  /* glsl */ `
    uniform float uProgress;
    uniform float uMaxSize;
    attribute float aStretch;
    void main() {
      vec3 pos = position;
      pos.z -= aStretch * uProgress * 8.0;
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      float computedSize = mix(2.5, 0.6, uProgress) * (120.0 / -mvPosition.z);
      gl_PointSize = clamp(computedSize, 0.6, uMaxSize);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  /* glsl */ `
    uniform vec3 uColor;
    uniform float uProgress;
    void main() {
      float d = length(gl_PointCoord - vec2(0.5));
      if (d > 0.5) discard;
      gl_FragColor = vec4(uColor, (1.0 - uProgress) * 0.85);
    }
  `
);

extend({ WarpMaterialImpl });

type WarpMaterial = InstanceType<typeof WarpMaterialImpl>;

declare module "@react-three/fiber" {
  interface ThreeElements {
    warpMaterialImpl: Record<string, unknown>;
  }
}

/**
 * On section transitions, temporarily stretches a lightweight particle set
 * along the camera's forward vector (a "hyperspace jump") driven purely by
 * animating the `uProgress` shader uniform — never per-particle JS mutation.
 * Triggered by the transient `isTransitioning` Zustand flag set by
 * `CameraRig` at the start/end of each section-to-section tween.
 */
export const WarpParticles = () => {
  const isTransitioning = useAppStore((state) => state.isTransitioning);
  const materialRef = useRef<WarpMaterial | null>(null);
  const progressRef = useRef(0);

  const [positions, stretches] = useMemo(() => {
    const pos = new Float32Array(WARP_PARTICLE_COUNT * 3);
    const stretch = new Float32Array(WARP_PARTICLE_COUNT);
    for (let i = 0; i < WARP_PARTICLE_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * WARP_RADIUS;
      pos[i * 3 + 1] = (Math.random() - 0.5) * WARP_RADIUS;
      pos[i * 3 + 2] = (Math.random() - 0.5) * WARP_RADIUS;
      stretch[i] = Math.random();
    }
    return [pos, stretch];
  }, []);

  useFrame((_, delta) => {
    const target = isTransitioning ? 1 : 0;
    const alpha = 1 - Math.exp(-WARP_DAMP_LAMBDA * delta);
    progressRef.current += (target - progressRef.current) * alpha;
    if (materialRef.current) {
      materialRef.current.uProgress = progressRef.current;
    }
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aStretch" args={[stretches, 1]} />
      </bufferGeometry>
      <warpMaterialImpl
        ref={materialRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
