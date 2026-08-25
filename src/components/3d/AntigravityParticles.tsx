import { useMemo, useRef } from "react";
import { useFrame, useThree, extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";

// Total particle count. ~2000-3000 keeps this well within budget for
// `THREE.Points` even on modest GPUs since it's a single draw call.
const PARTICLE_COUNT = 2500;
// Multiplier applied to the live viewport size to derive the field's
// half-extents, so particles always cover the visible screen (with a little
// overscan) regardless of window size/aspect ratio.
const FIELD_OVERSCAN = 1.15;
const FIELD_DEPTH = 4;
// Radius of the mouse "force field" bubble, in world units.
const REPULSION_RADIUS = 2.0;
// Peak outward speed imparted to a particle sitting at the field's center.
const REPULSION_STRENGTH = 6;
// Exponential damping rate applied to velocity every frame (higher = snappier stop).
const DAMPING_LAMBDA = 3.5;
// Exponential rate at which particles ease back toward their ambient drift anchor.
const RETURN_LAMBDA = 0.6;
// Amplitude / speed of the idle Brownian-ish sine drift.
const DRIFT_AMPLITUDE = 0.15;
const DRIFT_SPEED = 0.35;
// Base point size in world units — kept microscopic per the "tiny precise dot" spec.
const PARTICLE_SIZE = 0.035;

// Professional, muted palette: dark slate/gray with a rare subtle blue
// highlight. Declared at module scope so `THREE.Color` instances are only
// ever allocated once.
const PALETTE = [
  new THREE.Color("#1e293b"), // slate 800
  new THREE.Color("#334155"), // slate 700
  new THREE.Color("#475569"), // slate 600
  new THREE.Color("#0ea5e9"), // sky 500 (rare highlight)
];
// Relative weight of each palette entry — the blue highlight should be rare.
const PALETTE_WEIGHTS = [0.36, 0.32, 0.26, 0.06];

const pickPaletteColor = () => {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < PALETTE.length; i++) {
    acc += PALETTE_WEIGHTS[i];
    if (r <= acc) return PALETTE[i];
  }
  return PALETTE[PALETTE.length - 1];
};

// Custom circular point material: renders each vertex as a smooth, perfectly
// round dot by discarding fragments outside a radius of 0.5 in point-space,
// avoiding the square/blob look of the default `PointsMaterial`.
const DotMaterialImpl = shaderMaterial(
  { uSize: PARTICLE_SIZE, uResolution: 1000 },
  /* glsl */ `
    uniform float uSize;
    uniform float uResolution;
    attribute vec3 color;
    varying vec3 vColor;
    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = uSize * (uResolution / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  /* glsl */ `
    varying vec3 vColor;
    void main() {
      float d = length(gl_PointCoord - vec2(0.5));
      if (d > 0.5) discard;
      float alpha = smoothstep(0.5, 0.35, d);
      gl_FragColor = vec4(vColor, alpha * 0.9);
    }
  `
);

extend({ DotMaterialImpl });

type DotMaterial = InstanceType<typeof DotMaterialImpl>;

declare module "@react-three/fiber" {
  interface ThreeElements {
    dotMaterialImpl: Record<string, unknown>;
  }
}

/**
 * A lightweight, full-screen "anti-gravity" particle field: a single
 * `THREE.Points` draw call whose positions are mutated directly in a typed
 * array every frame (no React state, no per-particle objects). Particles
 * drift ambiently and are radially repelled from the mouse position —
 * unprojected from NDC into world space via `state.viewport` — easing back
 * via damped velocity + a return-to-origin force once the cursor moves away.
 */
export const AntigravityParticles = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<DotMaterial>(null);
  const { viewport, size } = useThree();

  // Scatter the field across the *actual* live viewport (with a touch of
  // overscan) so its bounds always match the area `state.viewport`/mouse
  // mapping below operates in, rather than a fixed box that could drift out
  // of sync at other aspect ratios or zoom levels.
  const fieldWidth = viewport.width * FIELD_OVERSCAN;
  const fieldHeight = viewport.height * FIELD_OVERSCAN;

  const { positions, colors, anchors, velocities, seeds } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    // Anchor points define each particle's ambient "home" — the point its
    // slow drift oscillates around and eventually returns to after a push.
    const anchors = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    // Per-particle random phase/frequency seeds so drift never looks uniform.
    const seeds = new Float32Array(PARTICLE_COUNT * 2);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const x = (Math.random() - 0.5) * fieldWidth;
      const y = (Math.random() - 0.5) * fieldHeight;
      const z = (Math.random() - 0.5) * FIELD_DEPTH;

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      anchors[i3] = x;
      anchors[i3 + 1] = y;
      anchors[i3 + 2] = z;

      const color = pickPaletteColor();
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      seeds[i * 2] = Math.random() * Math.PI * 2;
      seeds[i * 2 + 1] = 0.6 + Math.random() * 0.8;
    }

    return { positions, colors, anchors, velocities, seeds };
  }, [fieldWidth, fieldHeight]);

  // Reused scratch vector so `useFrame` never allocates.
  const mouseWorld = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    const geometry = pointsRef.current?.geometry;
    if (!geometry) return;

    // Keep the shader's size-attenuation resolved against the renderer's
    // actual pixel height, instead of a magic constant, so point size stays
    // resolution-independent.
    if (materialRef.current) {
      materialRef.current.uResolution = size.height;
    }

    // Map the pointer's normalized device coordinates (-1..1) into the 3D
    // viewport at the field's z = 0 plane using `state.viewport`, which
    // reports the visible width/height (in world units) at that depth.
    const { pointer, viewport } = state;
    mouseWorld.current.set((pointer.x * viewport.width) / 2, (pointer.y * viewport.height) / 2, 0);

    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;
    const t = state.clock.elapsedTime;
    const mx = mouseWorld.current.x;
    const my = mouseWorld.current.y;
    const mz = mouseWorld.current.z;
    const dampFactor = Math.exp(-DAMPING_LAMBDA * delta);
    const returnAlpha = 1 - Math.exp(-RETURN_LAMBDA * delta);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      // Ambient drift: each particle's anchor slowly bobs along a unique
      // sine phase — cheap, organic motion with no per-frame allocation.
      const phase = seeds[i * 2];
      const freq = seeds[i * 2 + 1];
      const driftX = Math.sin(t * DRIFT_SPEED * freq + phase) * DRIFT_AMPLITUDE;
      const driftY = Math.cos(t * DRIFT_SPEED * freq * 0.8 + phase) * DRIFT_AMPLITUDE;

      const targetX = anchors[i3] + driftX;
      const targetY = anchors[i3 + 1] + driftY;
      const targetZ = anchors[i3 + 2];

      // Ease current position toward its drifting anchor (the "settle back"
      // behaviour), independent of the repulsion velocity applied below.
      posArray[i3] += (targetX - posArray[i3]) * returnAlpha;
      posArray[i3 + 1] += (targetY - posArray[i3 + 1]) * returnAlpha;
      posArray[i3 + 2] += (targetZ - posArray[i3 + 2]) * returnAlpha;

      // Repulsion: push radially outward from the mouse when within range.
      const dx = posArray[i3] - mx;
      const dy = posArray[i3 + 1] - my;
      const dz = posArray[i3 + 2] - mz;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < REPULSION_RADIUS && dist > 1e-4) {
        const falloff = 1 - dist / REPULSION_RADIUS;
        const force = falloff * falloff * REPULSION_STRENGTH;
        const invDist = 1 / dist;
        velocities[i3] += dx * invDist * force * delta;
        velocities[i3 + 1] += dy * invDist * force * delta;
        velocities[i3 + 2] += dz * invDist * force * delta;
      }

      // Integrate velocity, then apply friction/damping so the push decays
      // smoothly instead of the particle flying off forever.
      posArray[i3] += velocities[i3] * delta;
      posArray[i3 + 1] += velocities[i3 + 1] * delta;
      posArray[i3 + 2] += velocities[i3 + 2] * delta;

      velocities[i3] *= dampFactor;
      velocities[i3 + 1] *= dampFactor;
      velocities[i3 + 2] *= dampFactor;
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry key={`${fieldWidth}-${fieldHeight}`}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <dotMaterialImpl ref={materialRef} transparent depthWrite={false} />
    </points>
  );
};
