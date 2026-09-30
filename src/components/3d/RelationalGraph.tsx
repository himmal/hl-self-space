import { Billboard, Line, Text } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import { type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { type BlogItem, type ProjectItem } from "../../data/portfolioData";
import { useAppStore } from "../../store/useAppStore";
import { computeRadialTreeLayout, type RadialTreeLayout } from "./graphLayout";

const DEFAULT_COLOR = "#38bdf8";
const TAG_COLOR = "#94a3b8";
const HOVER_COLOR = "#fbbf24";

interface GraphTextNodeProps {
  id: string;
  label: string;
  position: [number, number, number];
  interactive?: boolean;
}

const GraphTextNode = ({ id, label, position, interactive = false }: GraphTextNodeProps) => {
  const nodeRef = useRef<THREE.Group>(null);
  const viewMode = useAppStore((state) => state.viewMode);
  const hoveredItemId = useAppStore((state) => state.hoveredItemId);
  const hoveredProject = useAppStore((state) => state.hoveredProject);
  const hoveredLog = useAppStore((state) => state.hoveredLog);
  const setHoveredItemId = useAppStore((state) => state.setHoveredItemId);
  const activeHoveredId =
    viewMode === "graph" ? hoveredItemId : (hoveredProject ?? hoveredLog);
  const isHovered = activeHoveredId === id;
  const hasHoveredNode = activeHoveredId !== null;

  useFrame((_, delta) => {
    if (!nodeRef.current) return;
    const targetScale = isHovered ? 1.6 : hasHoveredNode ? 0.8 : 1;
    nodeRef.current.scale.x = THREE.MathUtils.damp(nodeRef.current.scale.x, targetScale, 8, delta);
    nodeRef.current.scale.y = THREE.MathUtils.damp(nodeRef.current.scale.y, targetScale, 8, delta);
    nodeRef.current.scale.z = THREE.MathUtils.damp(nodeRef.current.scale.z, targetScale, 8, delta);
  });

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    if (!interactive) return;
    event.stopPropagation();
    setHoveredItemId(id);
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = (event: ThreeEvent<PointerEvent>) => {
    if (!interactive) return;
    event.stopPropagation();
    if (useAppStore.getState().hoveredItemId === id) setHoveredItemId(null);
    document.body.style.cursor = "default";
  };

  return (
    <Billboard position={position}>
      <group ref={nodeRef}>
        <Text
          color={isHovered ? HOVER_COLOR : interactive ? DEFAULT_COLOR : TAG_COLOR}
          fillOpacity={isHovered ? 1 : hasHoveredNode ? 0.35 : 0.8}
          fontSize={interactive ? 0.2 : 0.24}
          anchorX="center"
          anchorY="middle"
          maxWidth={2.2}
          textAlign="center"
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          {label}
        </Text>
      </group>
    </Billboard>
  );
};

interface MindmapProps<T extends ProjectItem | BlogItem> {
  items: T[];
  tree: RadialTreeLayout;
  rootLabel: string;
  interactive: boolean;
}

const Mindmap = <T extends ProjectItem | BlogItem>({
  items,
  tree,
  rootLabel,
  interactive,
}: MindmapProps<T>) => {
  const hoveredItemId = useAppStore((state) => state.hoveredItemId);
  const pointsFor = (id: string): [number, number, number] =>
    id === "__root__" ? tree.root : tree.tags[id] ?? tree.items[id];

  return (
    <group>
      <GraphTextNode id="__root__" label={rootLabel} position={tree.root} />
      {Object.entries(tree.tags).map(([tag, position]) => (
        <GraphTextNode key={tag} id={tag} label={tag} position={position} />
      ))}
      {items.map((item) => (
        <GraphTextNode
          key={item.id}
          id={item.id}
          label={item.title || item.id}
          position={tree.items[item.id]}
          interactive={interactive}
        />
      ))}
      {tree.branches.map(({ parent, child }) => {
        const isItemBranch = child === hoveredItemId || parent === hoveredItemId;
        return (
          <Line
            key={`${parent}-${child}`}
            points={[pointsFor(parent), pointsFor(child)]}
            color={isItemBranch ? HOVER_COLOR : DEFAULT_COLOR}
            lineWidth={isItemBranch ? 1.5 : 0.7}
            transparent
            opacity={isItemBranch ? 0.8 : 0.28}
          />
        );
      })}
    </group>
  );
};

export interface RelationalGraphProps {
  data: Array<ProjectItem | BlogItem>;
  rootLabel: string;
}

export const RelationalGraph = ({ data, rootLabel }: RelationalGraphProps) => {
  const viewMode = useAppStore((state) => state.viewMode);
  const { viewport } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const tree = useMemo(
    () =>
      computeRadialTreeLayout(data, (item) =>
        "tags" in item ? item.tags : item.keywords
      ),
    [data]
  );
  const scale = Math.min(1, viewport.width / 20);

  useEffect(() => {
    if (groupRef.current) groupRef.current.visible = viewMode !== "particles";
  }, [viewMode]);

  return (
    <group ref={groupRef} scale={scale}>
      <Mindmap
        items={data}
        tree={tree}
        rootLabel={rootLabel}
        interactive={viewMode === "graph"}
      />
    </group>
  );
};
