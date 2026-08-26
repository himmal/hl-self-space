import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { QuadraticBezierLine, type QuadraticBezierLineRef } from "@react-three/drei";
import * as THREE from "three";
import { useAppStore } from "../../store/useAppStore";
import { demoData } from "../../data/portfolioData";
import { PROJECT_POSITIONS, BLOG_POSITIONS, BLOG_EDGES } from "./graphNodes";

// Refined, professional "glowing glass sphere" node material — replaces the
// legacy oversized neon blobs and square/octahedron geometries. Smooth
// `sphereGeometry` only; no boxes/diamonds, no edges in `#projects`.
const NODE_COLOR = new THREE.Color("#38bdf8");
const NODE_HIGHLIGHT_COLOR = new THREE.Color("#f59e0b"); // amber/gold hover highlight
const EDGE_COLOR = new THREE.Color("#475569");
const EDGE_HIGHLIGHT_COLOR = new THREE.Color("#f59e0b");

const OPACITY_DEFAULT = 0.55;
const OPACITY_DIMMED = 0.18;
const OPACITY_HIGHLIGHT = 0.85;
const COLOR_LERP_LAMBDA = 6;
const OPACITY_LERP_LAMBDA = 6;

// `QuadraticBezierLineRef` (a `Line2` from `three-stdlib`, re-exported via
// `@react-three/drei`) exposes its `.material` as a `LineMaterial`; typed
// narrowly here (rather than importing `three-stdlib` directly, which isn't
// a direct project dependency) since only `color`/`opacity` are mutated.
interface BezierLineMaterial {
  color: THREE.Color;
  opacity: number;
}

// Static layouts — computed once from the static `demoData` (see
// `graphNodes.ts`/`graphLayout.ts`), never recomputed inside `useFrame`.

/** Tag-clustered project bubbles for `#projects` — no edges, no squares. */
const ProjectNodes = () => {
  const hoveredProject = useAppStore((state) => state.hoveredProject);
  const setHoveredNode = useAppStore((state) => state.setHoveredNode);
  const materialRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  useFrame((_state, delta) => {
    const colorAlpha = 1 - Math.exp(-COLOR_LERP_LAMBDA * delta);
    const opacityAlpha = 1 - Math.exp(-OPACITY_LERP_LAMBDA * delta);
    demoData.projects.forEach((project, i) => {
      const material = materialRefs.current[i];
      if (!material) return;
      const isHovered = hoveredProject === project.id;
      material.color.lerp(isHovered ? NODE_HIGHLIGHT_COLOR : NODE_COLOR, colorAlpha);
      material.emissive.lerp(isHovered ? NODE_HIGHLIGHT_COLOR : NODE_COLOR, colorAlpha);
      material.opacity = THREE.MathUtils.lerp(
        material.opacity,
        isHovered ? OPACITY_HIGHLIGHT : OPACITY_DEFAULT,
        opacityAlpha
      );
    });
  });

  return (
    <>
      {demoData.projects.map((project, i) => (
        <mesh
          key={project.id}
          position={PROJECT_POSITIONS[project.id]}
          onPointerOver={(event) => {
            event.stopPropagation();
            setHoveredNode(project.id);
          }}
          onPointerOut={(event) => {
            event.stopPropagation();
            setHoveredNode(null);
          }}
        >
          <sphereGeometry args={[project.nodeSize, 32, 32]} />
          <meshStandardMaterial
            ref={(el) => {
              materialRefs.current[i] = el;
            }}
            color={NODE_COLOR}
            emissive={NODE_COLOR}
            emissiveIntensity={0.4}
            roughness={0.25}
            metalness={0.1}
            transparent
            opacity={OPACITY_DEFAULT}
          />
        </mesh>
      ))}
    </>
  );
};

/** Full keyword-relational map for `#blogs` — bubbles plus shared-keyword curves. */
const BlogGraph = () => {
  const hoveredLog = useAppStore((state) => state.hoveredLog);
  const hoveredNode = useAppStore((state) => state.hoveredNode);
  const setHoveredNode = useAppStore((state) => state.setHoveredNode);
  const nodeMaterialRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const edgeMaterialRefs = useRef<(BezierLineMaterial | null)[]>([]);

  const activeId = hoveredLog ?? hoveredNode;

  // Ids of blogs connected to `activeId` via a shared keyword — recomputed
  // only when the hover target changes, not per-frame.
  const relatedIds = useMemo(() => {
    if (!activeId) return null;
    const related = new Set<string>([activeId]);
    for (const edge of BLOG_EDGES) {
      if (edge.a === activeId) related.add(edge.b);
      if (edge.b === activeId) related.add(edge.a);
    }
    return related;
  }, [activeId]);

  useFrame((_state, delta) => {
    const colorAlpha = 1 - Math.exp(-COLOR_LERP_LAMBDA * delta);
    const opacityAlpha = 1 - Math.exp(-OPACITY_LERP_LAMBDA * delta);

    demoData.blogs.forEach((blog, i) => {
      const material = nodeMaterialRefs.current[i];
      if (!material) return;
      const isRelated = relatedIds ? relatedIds.has(blog.id) : true;
      const isActive = blog.id === activeId;
      const targetColor = isActive ? NODE_HIGHLIGHT_COLOR : NODE_COLOR;
      const targetOpacity = !relatedIds ? OPACITY_DEFAULT : isRelated ? OPACITY_HIGHLIGHT : OPACITY_DIMMED;

      material.color.lerp(targetColor, colorAlpha);
      material.emissive.lerp(targetColor, colorAlpha);
      material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, opacityAlpha);
    });

    BLOG_EDGES.forEach((edge, i) => {
      const material = edgeMaterialRefs.current[i];
      if (!material) return;
      const isActiveEdge = !!activeId && (edge.a === activeId || edge.b === activeId);
      const targetColor = isActiveEdge ? EDGE_HIGHLIGHT_COLOR : EDGE_COLOR;
      const targetOpacity = !activeId ? 0.25 : isActiveEdge ? 0.9 : 0.08;

      material.color.lerp(targetColor, colorAlpha);
      material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, opacityAlpha);
    });
  });

  return (
    <>
      {BLOG_EDGES.map((edge, i) => {
        const start = BLOG_POSITIONS[edge.a];
        const end = BLOG_POSITIONS[edge.b];
        const mid: [number, number, number] = [
          (start[0] + end[0]) / 2,
          (start[1] + end[1]) / 2 + 0.6,
          (start[2] + end[2]) / 2,
        ];
        return (
          <QuadraticBezierLine
            key={`${edge.a}-${edge.b}`}
            ref={(el: QuadraticBezierLineRef | null) => {
              edgeMaterialRefs.current[i] = el ? (el.material as unknown as BezierLineMaterial) : null;
            }}
            start={start}
            end={end}
            mid={mid}
            color={EDGE_COLOR}
            lineWidth={1.5}
            transparent
            opacity={0.25}
          />
        );
      })}
      {demoData.blogs.map((blog, i) => (
        <mesh
          key={blog.id}
          position={BLOG_POSITIONS[blog.id]}
          onPointerOver={(event) => {
            event.stopPropagation();
            setHoveredNode(blog.id);
          }}
          onPointerOut={(event) => {
            event.stopPropagation();
            setHoveredNode(null);
          }}
        >
          <sphereGeometry args={[blog.nodeSize, 32, 32]} />
          <meshStandardMaterial
            ref={(el) => {
              nodeMaterialRefs.current[i] = el;
            }}
            color={NODE_COLOR}
            emissive={NODE_COLOR}
            emissiveIntensity={0.4}
            roughness={0.25}
            metalness={0.1}
            transparent
            opacity={OPACITY_DEFAULT}
          />
        </mesh>
      ))}
    </>
  );
};

/**
 * Section-scoped relational graph replacing the legacy always-on
 * `NeuralLinks`/square-geometry system. Strictly obeys `activeSection`:
 * fully hidden on `#intro` (zero curves/squares/bubbles — only the ambient
 * `AntigravityParticles`/`NeuralGrid` field remains visible), tag-clustered
 * bubbles with no edges on `#projects`, and a full keyword-relational map
 * (bubbles + curves, amber hover highlight) on `#blogs`. Renders alongside
 * — never in place of — the ambient particle background in `Scene.tsx`.
 */
export const RelationalGraph = () => {
  const activeSection = useAppStore((state) => state.activeSection);

  if (activeSection === "projects") return <ProjectNodes />;
  if (activeSection === "blogs") return <BlogGraph />;
  return null;
};
