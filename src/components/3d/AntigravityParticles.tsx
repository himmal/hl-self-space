import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Total particle count. ~2000-3000 keeps this well within budget for
// `THREE.Points` even on modest GPUs since it's a single draw call.
const PARTICLE_COUNT = 2500;
// Half-extents of the volume particles are scattered across (world units).
const FIELD_WIDTH = 16;
const FIELD_HEIGHT = 9;
const FIELD_DEPTH = 4;
// Radius of the mouse "force field" bubble, in world units.
const REPULSION_RADIUS = 2.2;
// Peak outward speed imparted to a particle sitting at the field's center.
const REPULSION_STRENGTH = 6;
// Exponential damping rate applied to velocity every frame (higher = snappier stop).
const DAMPING_LAMBDA = 3.5;
// Exponential rate at which particles ease back toward their ambient drift anchor.
const RETURN_LAMBDA = 0.6;
// Amplitude / speed of the idle Brownian-ish sine drift.
const DRIFT_AMPLITUDE = 0.15;
const DRIFT_SPEED = 0.35;

// Subtle palette: dark blue, deep red, near-black/grey — reads well against
// a light background. Declared at module scope so `THREE.Color` instances
// are only ever allocated once.
const PALETTE = [
  new THREE.Color("#1e3a8a"), // dark blue
  new THREE.Color("#7f1d1d"), // dark red
  new THREE.Color("#27272a"), // near-black grey
];

/**
 * A lightweight, full-screen "anti-gravity" particle field: a single
 * `THREE.Points` draw call whose positions are mutated directly in a typed
 * array every frame (no React state, no per-particle objects). Particles
 * drift ambiently and are radially repelled from the unprojected mouse
 * position, easing back via damped velocity once the cursor moves away.
 */
export const AntigravityParticles = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const { camera, size } = useThree();

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
      const x = (Math.random() - 0.5) * FIELD_WIDTH;
      const y = (Math.random() - 0.5) * FIELD_HEIGHT;
      const z = (Math.random() - 0.5) * FIELD_DEPTH;

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      anchors[i3] = x;
      anchors[i3 + 1] = y;
      anchors[i3 + 2] = z;

      const color = PALETTE[(Math.random() * PALETTE.length) | 0];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      seeds[i * 2] = Math.random() * Math.PI * 2;
      seeds[i * 2 + 1] = 0.6 + Math.random() * 0.8;
    }

    return { positions, colors, anchors, velocities, seeds };
  }, []);

  // Reused scratch objects so `useFrame` never allocates.
  const mouseNdc = useRef(new THREE.Vector2(0, 0));
  const mouseWorld = useRef(new THREE.Vector3());
  const raycaster = useRef(new THREE.Raycaster());
  const dropPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const delta3 = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    const geometry = pointsRef.current?.geometry;
    if (!geometry) return;

    // Unproject the mouse: cast a ray from the camera through the pointer's
    // NDC coordinates and intersect it with the z=0 plane the field lives on.
    mouseNdc.current.set(state.pointer.x, state.pointer.y);
    raycaster.current.setFromCamera(mouseNdc.current, camera);
    raycaster.current.ray.intersectPlane(dropPlane.current, mouseWorld.current);
    // `posArray` stores positions in the points object's *local* space, which
    // may be non-uniformly scaled (see `scale` below) to match the viewport
    // aspect ratio. Transform the world-space mouse point into that same
    // local space so distance checks stay circular/undistorted.
    pointsRef.current!.worldToLocal(mouseWorld.current);

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
      delta3.current.set(posArray[i3] - mx, posArray[i3 + 1] - my, posArray[i3 + 2] - mz);
      const dist = delta3.current.length();
      if (dist < REPULSION_RADIUS && dist > 1e-4) {
        const falloff = 1 - dist / REPULSION_RADIUS;
        const force = falloff * falloff * REPULSION_STRENGTH;
        const invDist = 1 / dist;
        velocities[i3] += delta3.current.x * invDist * force * delta;
        velocities[i3 + 1] += delta3.current.y * invDist * force * delta;
        velocities[i3 + 2] += delta3.current.z * invDist * force * delta;
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

  // Keep the field roughly matched to the viewport aspect so particles
  // stay comfortably on-screen regardless of window size.
  const scale = useMemo(() => {
    const aspect = size.width / size.height || 1;
    return [Math.max(1, aspect), 1, 1] as const;
  }, [size.width, size.height]);

  return (
    <points ref={pointsRef} scale={scale} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={2}
        sizeAttenuation={false}
        vertexColors
        transparent
        opacity={0.85}
        depthWrite={false}
      />
    </points>
  );
};
