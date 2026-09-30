import { Billboard, Line, Text } from "@react-three/drei";
import { type ThreeEvent } from "@react-three/fiber";
import { demoData, type BlogItem, type ProjectItem } from "../../data/portfolioData";
import { useAppStore } from "../../store/useAppStore";
import { BLOG_TREE, PROJECT_TREE } from "./graphNodes";

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
  const hoveredItemId = useAppStore((state) => state.hoveredItemId);
  const setHoveredItemId = useAppStore((state) => state.setHoveredItemId);
  const isHovered = interactive && hoveredItemId === id;

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
      <Text
        color={isHovered ? HOVER_COLOR : interactive ? DEFAULT_COLOR : TAG_COLOR}
        fontSize={isHovered ? 0.3 : interactive ? 0.2 : 0.24}
        anchorX="center"
        anchorY="middle"
        maxWidth={2.2}
        textAlign="center"
        scale={isHovered ? 1.35 : 1}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        {label}
      </Text>
    </Billboard>
  );
};

interface MindmapProps<T extends ProjectItem | BlogItem> {
  items: T[];
  tree: typeof PROJECT_TREE;
  rootLabel: string;
}

const Mindmap = <T extends ProjectItem | BlogItem>({ items, tree, rootLabel }: MindmapProps<T>) => {
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
          interactive
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

export const RelationalGraph = () => {
  const activeSection = useAppStore((state) => state.activeSection);
  const viewMode = useAppStore((state) => state.viewMode);

  if (activeSection === "intro") return null;

  const isProjects = activeSection === "projects";
  if (viewMode !== "graph") return null;

  return (
    <group>
      <Mindmap
        items={isProjects ? demoData.projects : demoData.blogs}
        tree={isProjects ? PROJECT_TREE : BLOG_TREE}
        rootLabel={isProjects ? "Projects" : "Blogs"}
      />
    </group>
  );
};
