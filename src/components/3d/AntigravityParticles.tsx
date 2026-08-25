import { useMemo, useRef } from "react";
import { useFrame, useThree, extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useAppStore, type Section } from "../../store/useAppStore";

// Total particle count. Also doubles as GRID_COLS * GRID_ROWS * GRID_LAYERS
// below so the "#intro" lattice divides evenly with no leftover particles.
const PARTICLE_COUNT = 2500;
const GRID_COLS = 25;
const GRID_ROWS = 20;
const GRID_LAYERS = 5;
if (GRID_COLS * GRID_ROWS * GRID_LAYERS !== PARTICLE_COUNT) {
  throw new Error(
    "AntigravityParticles: GRID_COLS * GRID_ROWS * GRID_LAYERS must equal PARTICLE_COUNT"
  );
}
// Number of vertical streams used by the "#blogs" column layout.
const COLUMN_COUNT = 14;
// Multiplier applied to the live viewport size to derive the field's
// half-extents, so particles always cover the visible screen (with a little
// overscan) regardless of window size/aspect ratio.
const FIELD_OVERSCAN = 1.15;
const FIELD_DEPTH = 4;
// Rate (per second, exponential) at which each particle's morph target
// eases from one section's base geometry toward another's, so switching
// sections reshapes the field smoothly instead of snapping.
const ANCHOR_MORPH_LAMBDA = 1.1;
// Rate at which the scalar physics globals (radius/strength/friction/etc.)
// themselves ease toward the active section's target values.
const PARAM_LERP_LAMBDA = 2.2;
// Rate at which per-particle colors ease toward the active section's palette.
const COLOR_LERP_LAMBDA = 1.6;
// Clamp on the mouse's frame-to-frame speed used to scale the "#blogs" wake
// force, so a very fast flick can't inject an unstable amount of velocity.
const MAX_WAKE_SPEED = 40;
// Base point size in world units — kept microscopic per the "tiny precise dot" spec.
const PARTICLE_SIZE = 0.035;
const PARTICLE_MAX_PIXEL_SIZE = 5;

interface SectionTheme {
  /** Weighted per-particle palette; index matches each particle's fixed `colorSlots` role. */
  colors: [THREE.Color, THREE.Color, THREE.Color];
  /** World-unit radius of the mouse force field. */
  repulsionRadius: number;
  /** Peak radial push imparted to a particle at the field's center. */
  repulsionStrength: number;
  /** Peak directional "wake" push along the mouse's motion vector. */
  wakeStrength: number;
  /** Exponential velocity damping rate (higher = snappier stop / more friction). */
  dampingLambda: number;
  /** Exponential rate at which particles ease back toward their base anchor. */
  returnLambda: number;
  /** Amplitude of the idle "breathing" sine drift on Y (#intro). */
  breatheAmplitude: number;
  /** Amplitude of the idle Brownian-ish jitter (#projects). */
  brownianAmplitude: number;
  /** Whole-field Y-axis rotation speed, rad/s (#projects). */
  rotationSpeed: number;
  /** Upward "data stream" drift speed on Y, world units/s (#blogs). */
  streamSpeed: number;
}

// Professional, muted per-section palettes. Declared at module scope so
// `THREE.Color` instances are only ever allocated once and simply lerped
// in-place every frame.
const SECTION_THEMES: Record<Section, SectionTheme> = {
  intro: {
    colors: [new THREE.Color("#334155"), new THREE.Color("#1e293b"), new THREE.Color("#38bdf8")],
    repulsionRadius: 1.5,
    repulsionStrength: 5,
    wakeStrength: 0,
    dampingLambda: 3.5,
    returnLambda: 1.4, // strong elastic pull back to basePosition
    breatheAmplitude: 0.12,
    brownianAmplitude: 0,
    rotationSpeed: 0,
    streamSpeed: 0,
  },
  projects: {
    colors: [new THREE.Color("#334155"), new THREE.Color("#a855f7"), new THREE.Color("#e879f9")],
    repulsionRadius: 3.0,
    repulsionStrength: 16,
    wakeStrength: 0,
    dampingLambda: 1.1, // low friction so an explosive push carries particles far
    returnLambda: 0.12, // weak pull — takes much longer to drift back to center
    breatheAmplitude: 0,
    brownianAmplitude: 0.4,
    rotationSpeed: 0.15,
    streamSpeed: 0,
  },
  blogs: {
    colors: [new THREE.Color("#3f3f46"), new THREE.Color("#d97706"), new THREE.Color("#eab308")],
    repulsionRadius: 2.2,
    repulsionStrength: 1.5,
    wakeStrength: 10,
    dampingLambda: 2.5,
    returnLambda: 0.5,
    breatheAmplitude: 0,
    brownianAmplitude: 0,
    rotationSpeed: 0,
    streamSpeed: 0.5,
  },
};

const pickColorSlot = () => {
  const r = Math.random();
  if (r < 0.55) return 0;
  if (r < 0.85) return 1;
  return 2;
};

// Custom circular point material: renders each vertex as a smooth, perfectly
// round dot by discarding fragments outside a radius of 0.5 in point-space,
// avoiding the square/blob look of the default `PointsMaterial`. Point size
// is clamped to `uMaxSize` so particles never balloon into oversized blobs
// when they pass close to the camera.
const DotMaterialImpl = shaderMaterial(
  { uSize: PARTICLE_SIZE, uResolution: 1000, uMaxSize: PARTICLE_MAX_PIXEL_SIZE },
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

/** Fills `out` with a loose, jittered 3D lattice — the "#intro" base geometry. */
const buildGridAnchors = (out: Float32Array, width: number, height: number) => {
  let i = 0;
  for (let layer = 0; layer < GRID_LAYERS; layer++) {
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const i3 = i * 3;
        const jitterX = (Math.random() - 0.5) * (width / GRID_COLS) * 0.6;
        const jitterY = (Math.random() - 0.5) * (height / GRID_ROWS) * 0.6;
        const jitterZ = (Math.random() - 0.5) * (FIELD_DEPTH / GRID_LAYERS) * 0.6;
        out[i3] = (col / (GRID_COLS - 1) - 0.5) * width + jitterX;
        out[i3 + 1] = (row / (GRID_ROWS - 1) - 0.5) * height + jitterY;
        out[i3 + 2] = (layer / (GRID_LAYERS - 1) - 0.5) * FIELD_DEPTH + jitterZ;
        i++;
      }
    }
  }
};

/** Fills `out` with a chaotic, swirling volumetric scatter — the "#projects" base geometry. */
const buildSwirlAnchors = (out: Float32Array, width: number, height: number) => {
  const radius = Math.max(width, height) * 0.6;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.cbrt(Math.random()) * radius;
    out[i3] = r * Math.sin(phi) * Math.cos(theta);
    out[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) * (height / Math.max(width, height));
    out[i3 + 2] = r * Math.cos(phi) * (FIELD_DEPTH / radius);
  }
};

/** Fills `out` with particles grouped into vertical columns — the "#blogs" base geometry. */
const buildColumnAnchors = (out: Float32Array, width: number, height: number) => {
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    const column = i % COLUMN_COUNT;
    const jitterX = (Math.random() - 0.5) * (width / COLUMN_COUNT) * 0.3;
    out[i3] = (column / (COLUMN_COUNT - 1) - 0.5) * width + jitterX;
    out[i3 + 1] = (Math.random() - 0.5) * height * 1.4;
    out[i3 + 2] = (Math.random() - 0.5) * FIELD_DEPTH;
  }
};

/**
 * A full-screen particle field whose physics, distribution, and mouse
 * interaction change drastically with `activeSection`:
 *  - "#intro": a stable, breathing 3D grid with elastic mouse repulsion.
 *  - "#projects": a chaotic, rotating swirl with explosive mouse scatter.
 *  - "#blogs": vertical data streams drifting upward with a directional
 *    mouse "wake" instead of radial repulsion.
 *
 * A single `THREE.Points` draw call whose positions are mutated directly in
 * typed arrays every frame (no React state, no per-particle objects). Every
 * scalar physics global (radius/strength/friction/etc.) and every particle
 * color eases toward its target with `THREE.MathUtils.lerp` /
 * `THREE.Color.lerp`, so section changes morph smoothly instead of popping.
 */
export const AntigravityParticles = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<DotMaterial>(null);
  const activeSection = useAppStore((state) => state.activeSection);
  const { viewport, size } = useThree();

  // Scatter the field across the *actual* live viewport (with a touch of
  // overscan) so its bounds always match the area the mouse-mapping below
  // operates in, rather than a fixed box that could drift out of sync at
  // other aspect ratios or zoom levels.
  const fieldWidth = viewport.width * FIELD_OVERSCAN;
  const fieldHeight = viewport.height * FIELD_OVERSCAN;

  const {
    positions,
    colors,
    gridAnchors,
    swirlAnchors,
    columnAnchors,
    anchors,
    velocities,
    seeds,
    colorSlots,
  } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const gridAnchors = new Float32Array(PARTICLE_COUNT * 3);
    const swirlAnchors = new Float32Array(PARTICLE_COUNT * 3);
    const columnAnchors = new Float32Array(PARTICLE_COUNT * 3);
    // Current, continuously-morphed anchor — eases between the three base
    // geometries above whenever `activeSection` changes.
    const anchors = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    // Per-particle random phase/frequency seeds so drift never looks uniform.
    const seeds = new Float32Array(PARTICLE_COUNT * 2);
    const colorSlots = new Uint8Array(PARTICLE_COUNT);

    buildGridAnchors(gridAnchors, fieldWidth, fieldHeight);
    buildSwirlAnchors(swirlAnchors, fieldWidth, fieldHeight);
    buildColumnAnchors(columnAnchors, fieldWidth, fieldHeight);

    const initialTheme = SECTION_THEMES.intro;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      positions[i3] = anchors[i3] = gridAnchors[i3];
      positions[i3 + 1] = anchors[i3 + 1] = gridAnchors[i3 + 1];
      positions[i3 + 2] = anchors[i3 + 2] = gridAnchors[i3 + 2];

      const slot = pickColorSlot();
      colorSlots[i] = slot;
      const color = initialTheme.colors[slot];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      seeds[i * 2] = Math.random() * Math.PI * 2;
      seeds[i * 2 + 1] = 0.6 + Math.random() * 0.8;
    }

    return {
      positions,
      colors,
      gridAnchors,
      swirlAnchors,
      columnAnchors,
      anchors,
      velocities,
      seeds,
      colorSlots,
    };
  }, [fieldWidth, fieldHeight]);

  // Reused scratch objects so `useFrame` never allocates.
  const mouseWorld = useRef(new THREE.Vector3());
  const prevMouseWorld = useRef(new THREE.Vector3());
  const mouseVelocity = useRef(new THREE.Vector3());
  const scratchColor = useRef(new THREE.Color());
  const hasPrevMouse = useRef(false);

  // Smoothly-lerped scalar physics globals — these are what actually make
  // section transitions feel like a morph rather than a hard cut.
  const currentParams = useRef({ ...SECTION_THEMES.intro });

  useFrame((state, delta) => {
    const geometry = pointsRef.current?.geometry;
    if (!geometry) return;

    // Keep the shader's size-attenuation resolved against the renderer's
    // actual pixel height, instead of a magic constant, so point size stays
    // resolution-independent.
    if (materialRef.current) {
      materialRef.current.uResolution = size.height;
    }

    const theme = SECTION_THEMES[activeSection];
    const targetAnchors =
      activeSection === "projects"
        ? swirlAnchors
        : activeSection === "blogs"
          ? columnAnchors
          : gridAnchors;

    // Ease every scalar physics global toward the active section's target —
    // this is what lets radius/strength/friction morph smoothly instead of
    // snapping the instant the user switches sections.
    const params = currentParams.current;
    const paramAlpha = 1 - Math.exp(-PARAM_LERP_LAMBDA * delta);
    params.repulsionRadius = THREE.MathUtils.lerp(
      params.repulsionRadius,
      theme.repulsionRadius,
      paramAlpha
    );
    params.repulsionStrength = THREE.MathUtils.lerp(
      params.repulsionStrength,
      theme.repulsionStrength,
      paramAlpha
    );
    params.wakeStrength = THREE.MathUtils.lerp(params.wakeStrength, theme.wakeStrength, paramAlpha);
    params.dampingLambda = THREE.MathUtils.lerp(
      params.dampingLambda,
      theme.dampingLambda,
      paramAlpha
    );
    params.returnLambda = THREE.MathUtils.lerp(params.returnLambda, theme.returnLambda, paramAlpha);
    params.breatheAmplitude = THREE.MathUtils.lerp(
      params.breatheAmplitude,
      theme.breatheAmplitude,
      paramAlpha
    );
    params.brownianAmplitude = THREE.MathUtils.lerp(
      params.brownianAmplitude,
      theme.brownianAmplitude,
      paramAlpha
    );
    params.rotationSpeed = THREE.MathUtils.lerp(
      params.rotationSpeed,
      theme.rotationSpeed,
      paramAlpha
    );
    params.streamSpeed = THREE.MathUtils.lerp(params.streamSpeed, theme.streamSpeed, paramAlpha);

    // "#projects": slow whole-field rotation around Y.
    if (pointsRef.current) {
      pointsRef.current.rotation.y += params.rotationSpeed * delta;
    }

    // Map the pointer's normalized device coordinates (-1..1) into the 3D
    // viewport at the field's z = 0 plane using `state.viewport`, which
    // reports the visible width/height (in world units) at that depth.
    const { pointer } = state;
    prevMouseWorld.current.copy(mouseWorld.current);
    mouseWorld.current.set(
      (pointer.x * state.viewport.width) / 2,
      (pointer.y * state.viewport.height) / 2,
      0
    );

    // "#blogs": directional "wake" — the mouse's frame-to-frame motion vector,
    // instead of its position, drives a local push in the direction of travel.
    if (hasPrevMouse.current) {
      mouseVelocity.current.subVectors(mouseWorld.current, prevMouseWorld.current);
    } else {
      mouseVelocity.current.set(0, 0, 0);
      hasPrevMouse.current = true;
    }
    const wakeMagnitude = mouseVelocity.current.length();
    const wakeSpeed = delta > 1e-5 ? Math.min(wakeMagnitude / delta, MAX_WAKE_SPEED) : 0;
    const wakeDirX = wakeMagnitude > 1e-4 ? mouseVelocity.current.x / wakeMagnitude : 0;
    const wakeDirY = wakeMagnitude > 1e-4 ? mouseVelocity.current.y / wakeMagnitude : 0;

    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;
    const colorAttr = geometry.attributes.color as THREE.BufferAttribute;
    const colorArray = colorAttr.array as Float32Array;
    const t = state.clock.elapsedTime;
    const mx = mouseWorld.current.x;
    const my = mouseWorld.current.y;
    const mz = mouseWorld.current.z;
    const dampFactor = Math.exp(-params.dampingLambda * delta);
    const returnAlpha = 1 - Math.exp(-params.returnLambda * delta);
    const anchorMorphAlpha = 1 - Math.exp(-ANCHOR_MORPH_LAMBDA * delta);
    const colorAlpha = 1 - Math.exp(-COLOR_LERP_LAMBDA * delta);

    // "#blogs": particles stream upward and wrap around the camera's visible
    // frustum instead of homing back to a fixed Y anchor.
    const isStreaming = activeSection === "blogs";
    const topBound = (state.viewport.height * FIELD_OVERSCAN) / 2;
    const streamRange = topBound * 2;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      // Morph this particle's anchor toward the active section's base
      // geometry (grid / swirl / columns).
      anchors[i3] += (targetAnchors[i3] - anchors[i3]) * anchorMorphAlpha;
      anchors[i3 + 1] += (targetAnchors[i3 + 1] - anchors[i3 + 1]) * anchorMorphAlpha;
      anchors[i3 + 2] += (targetAnchors[i3 + 2] - anchors[i3 + 2]) * anchorMorphAlpha;

      // Ambient animation: "#intro" breathes on Y, "#projects" adds Brownian
      // jitter on all axes — cheap sine-based motion with no per-frame
      // allocation.
      const phase = seeds[i * 2];
      const freq = seeds[i * 2 + 1];
      const breatheY = Math.sin(t * 0.35 * freq + phase) * params.breatheAmplitude;
      const brownianX = Math.sin(t * 0.9 * freq + phase) * params.brownianAmplitude;
      const brownianY = Math.cos(t * 0.8 * freq * 1.3 + phase) * params.brownianAmplitude;
      const brownianZ = Math.sin(t * 0.7 * freq * 0.6 + phase * 1.7) * params.brownianAmplitude;

      const targetX = anchors[i3] + brownianX;
      const targetY = anchors[i3 + 1] + breatheY + brownianY;
      const targetZ = anchors[i3 + 2] + brownianZ;

      // Ease current position toward its drifting anchor (the "settle back"
      // behaviour). On "#blogs", Y instead streams upward continuously and
      // wraps at the top of the camera's frustum.
      posArray[i3] += (targetX - posArray[i3]) * returnAlpha;
      posArray[i3 + 2] += (targetZ - posArray[i3 + 2]) * returnAlpha;
      if (isStreaming) {
        posArray[i3 + 1] += params.streamSpeed * delta;
        if (posArray[i3 + 1] > topBound) posArray[i3 + 1] -= streamRange;
      } else {
        posArray[i3 + 1] += (targetY - posArray[i3 + 1]) * returnAlpha;
      }

      // Radial repulsion: push outward from the mouse when within range
      // ("#intro" elastic repulsion, "#projects" explosive scatter).
      const dx = posArray[i3] - mx;
      const dy = posArray[i3 + 1] - my;
      const dz = posArray[i3 + 2] - mz;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < params.repulsionRadius && dist > 1e-4) {
        const falloff = 1 - dist / params.repulsionRadius;
        const force = falloff * falloff * params.repulsionStrength;
        const invDist = 1 / dist;
        velocities[i3] += dx * invDist * force * delta;
        velocities[i3 + 1] += dy * invDist * force * delta;
        velocities[i3 + 2] += dz * invDist * force * delta;
      }

      // Directional wake: within the same radius, push locally along the
      // mouse's motion vector instead of radially ("#blogs" parting curtain).
      // Scaled by `wakeSpeed` so a fast flick of the mouse parts particles
      // harder than a slow drift.
      if (params.wakeStrength > 1e-3 && dist < params.repulsionRadius && wakeSpeed > 1e-4) {
        const falloff = 1 - dist / params.repulsionRadius;
        const force = falloff * falloff * params.wakeStrength * wakeSpeed;
        velocities[i3] += wakeDirX * force * delta;
        velocities[i3 + 1] += wakeDirY * force * delta;
      }

      // Integrate velocity, then apply friction/damping so the push decays
      // smoothly instead of the particle flying off forever.
      posArray[i3] += velocities[i3] * delta;
      posArray[i3 + 1] += velocities[i3 + 1] * delta;
      posArray[i3 + 2] += velocities[i3 + 2] * delta;

      velocities[i3] *= dampFactor;
      velocities[i3 + 1] *= dampFactor;
      velocities[i3 + 2] *= dampFactor;

      // Color: ease this particle's fixed color slot toward the active
      // section's palette using `THREE.Color.lerp`, reusing one scratch
      // `Color` instance so no allocation happens per-particle per-frame.
      const targetColor = theme.colors[colorSlots[i]];
      scratchColor.current.setRGB(colorArray[i3], colorArray[i3 + 1], colorArray[i3 + 2]);
      scratchColor.current.lerp(targetColor, colorAlpha);
      colorArray[i3] = scratchColor.current.r;
      colorArray[i3 + 1] = scratchColor.current.g;
      colorArray[i3 + 2] = scratchColor.current.b;
    }

    posAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
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
