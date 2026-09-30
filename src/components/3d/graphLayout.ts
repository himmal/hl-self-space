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

  // `getAttrs`/shared-count/target-distance are all static per pair (the
  // underlying data never changes), so pre-compute them once instead of
  // recomputing on every one of the `ITERATIONS` relaxation passes.
  const attrs = items.map((item) => getAttrs(item));
  const targetDist: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const shared = attrs[i].filter((attr) => attrs[j].includes(attr)).length;
      const dist = shared > 0 ? Math.max(0.25, (items[i].nodeSize + items[j].nodeSize) / shared) : BASE_SEPARATION;
      targetDist[i][j] = dist;
      targetDist[j][i] = dist;
    }
  }

  for (let iter = 0; iter < ITERATIONS; iter++) {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const delta = positions[j].clone().sub(positions[i]);
        const dist = Math.max(0.001, delta.length());
        const dir = delta.multiplyScalar(1 / dist);
        const correction = (dist - targetDist[i][j]) * RELAX_STEP;

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

export interface RadialTreeLayout {
  root: [number, number, number];
  tags: Record<string, [number, number, number]>;
  items: Record<string, [number, number, number]>;
  itemTags: Record<string, string>;
  branches: { parent: string; child: string }[];
}

const stableDepth = (id: string) => {
  let hash = 0;
  for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) | 0;
  return (Math.abs(hash) % 11) - 5;
};

/**
 * Builds a deterministic 2.5D radial tree: the root is centered, unique
 * attributes form the first ring, and each item is clustered near its primary
 * attribute on the outer ring.
 */
export const computeRadialTreeLayout = <T extends GraphSource>(
  items: T[],
  getAttrs: (item: T) => string[],
  tagRadius = 8,
  itemRadius = 16
): RadialTreeLayout => {
  const itemTags: Record<string, string> = {};
  const tags = Array.from(
    new Set(
      items.flatMap((item) => {
        const primaryTag = getAttrs(item)[0] ?? "Uncategorized";
        itemTags[item.id] = primaryTag;
        return primaryTag;
      })
    )
  );
  const tagAngles = new Map(tags.map((tag, index) => [tag, (index / Math.max(tags.length, 1)) * Math.PI * 2]));
  const tagPositions: Record<string, [number, number, number]> = {};
  tags.forEach((tag) => {
    const angle = tagAngles.get(tag) ?? 0;
    tagPositions[tag] = [Math.cos(angle) * tagRadius, Math.sin(angle) * tagRadius * 0.72, stableDepth(tag) * 0.35];
  });

  const groupedItems = new Map<string, T[]>();
  items.forEach((item) => {
    const tag = itemTags[item.id];
    groupedItems.set(tag, [...(groupedItems.get(tag) ?? []), item]);
  });
  const itemPositions: Record<string, [number, number, number]> = {};
  groupedItems.forEach((group, tag) => {
    const baseAngle = tagAngles.get(tag) ?? 0;
    group.forEach((item, index) => {
      const offset = (index - (group.length - 1) / 2) * 0.16;
      const angle = baseAngle + offset;
      itemPositions[item.id] = [
        Math.cos(angle) * itemRadius,
        Math.sin(angle) * itemRadius * 0.72,
        stableDepth(item.id),
      ];
    });
  });

  return {
    root: [0, 0, 0],
    tags: tagPositions,
    items: itemPositions,
    itemTags,
    branches: [
      ...tags.map((tag) => ({ parent: "__root__", child: tag })),
      ...items.map((item) => ({ parent: itemTags[item.id], child: item.id })),
    ],
  };
};
