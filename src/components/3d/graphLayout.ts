import * as THREE from "three";

// Deterministic, tag/keyword-driven bubble layout for `RelationalGraph`.
// Positions are computed once at module load (the underlying `demoData` is
// static mock data — see `src/data/portfolioData.ts`), never recomputed
// inside a `useFrame` loop, so this stays perf-free at runtime.

/** Minimal shape a graph node's source item must satisfy. */
export interface GraphSource {
  id: string;
  nodeSize: number;
}

const ITERATIONS = 160;
const RELAX_STEP = 0.05;
// Baseline separation for items sharing no attributes — keeps unrelated
// bubbles from ever overlapping, while shared-attribute pairs relax closer.
const BASE_SEPARATION = 1.9;

/**
 * Places `items` on an initial ring, then relaxes pairwise distances toward
 * a target that shrinks with the number of shared attributes (tags for
 * projects, keywords for blogs) — a simple, deterministic stand-in for a
 * full force-directed graph. Shared-attribute pairs cluster/overlap; pairs
 * with nothing in common settle at `BASE_SEPARATION` or further apart.
 */
export const computeClusterLayout = <T extends GraphSource>(
  items: T[],
  getAttrs: (item: T) => string[],
  spread = 2.2
): Record<string, [number, number, number]> => {
  const n = items.length;
  const positions = items.map((_item, i) => {
    const angle = (i / Math.max(1, n)) * Math.PI * 2;
    // Small deterministic depth offset (index-based, not random) so the
    // ring isn't perfectly flat, without making layout non-reproducible.
    const depthOffset = ((i % 3) - 1) * 0.35;
    return new THREE.Vector3(Math.cos(angle) * spread, Math.sin(angle) * spread * 0.55, depthOffset);
  });

  for (let iter = 0; iter < ITERATIONS; iter++) {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const shared = getAttrs(items[i]).filter((attr) => getAttrs(items[j]).includes(attr)).length;
        const targetDist = shared > 0 ? Math.max(0.25, (items[i].nodeSize + items[j].nodeSize) / shared) : BASE_SEPARATION;

        const delta = positions[j].clone().sub(positions[i]);
        const dist = Math.max(0.001, delta.length());
        const dir = delta.multiplyScalar(1 / dist);
        const correction = (dist - targetDist) * RELAX_STEP;

        positions[i].addScaledVector(dir, correction);
        positions[j].addScaledVector(dir, -correction);
      }
    }
  }

  const out: Record<string, [number, number, number]> = {};
  items.forEach((item, i) => {
    out[item.id] = [positions[i].x, positions[i].y, positions[i].z];
  });
  return out;
};

export interface SharedEdge {
  a: string;
  b: string;
  shared: string[];
}

/** Every pair of `items` that shares at least one attribute (keyword), for edge rendering. */
export const computeSharedEdges = <T extends GraphSource>(
  items: T[],
  getAttrs: (item: T) => string[]
): SharedEdge[] => {
  const edges: SharedEdge[] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const shared = getAttrs(items[i]).filter((attr) => getAttrs(items[j]).includes(attr));
      if (shared.length > 0) edges.push({ a: items[i].id, b: items[j].id, shared });
    }
  }
  return edges;
};
