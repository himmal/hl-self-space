import { Billboard, Float, Text } from "@react-three/drei";
import { type ThreeEvent } from "@react-three/fiber";
import { useAppStore } from "../../store/useAppStore";
import { demoData } from "../../data/portfolioData";
import { PROJECT_POSITIONS, BLOG_POSITIONS } from "./graphNodes";

const DEFAULT_COLOR = "#38bdf8";
const HOVER_COLOR = "#fbbf24";

interface GraphTextNodeProps {
  id: string;
  label: string;
  position: [number, number, number];
}

const GraphTextNode = ({ id, label, position }: GraphTextNodeProps) => {
  const hoveredNode = useAppStore((state) => state.hoveredNode);
  const setHoveredNode = useAppStore((state) => state.setHoveredNode);
  const isHovered = hoveredNode === id;

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setHoveredNode(id);
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (useAppStore.getState().hoveredNode === id) {
      setHoveredNode(null);
    }
    document.body.style.cursor = "default";
  };

  return (
    <Billboard position={position}>
      <Text
        color={isHovered ? HOVER_COLOR : DEFAULT_COLOR}
        fontSize={isHovered ? 0.34 : 0.28}
        anchorX="center"
        anchorY="middle"
        maxWidth={2.8}
        textAlign="center"
        scale={isHovered ? 1.2 : 1}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        {label}
      </Text>
    </Billboard>
  );
};

const ProjectTextNodes = () => (
  <>
    {demoData.projects.map((project) => (
      <GraphTextNode
        key={project.id}
        id={project.id}
        label={project.title || project.id}
        position={PROJECT_POSITIONS[project.id]}
      />
    ))}
  </>
);

const BlogTextNodes = () => (
  <>
    {demoData.blogs.map((blog) => (
      <GraphTextNode
        key={blog.id}
        id={blog.id}
        label={blog.title || blog.id}
        position={BLOG_POSITIONS[blog.id]}
      />
    ))}
  </>
);

export const RelationalGraph = () => {
  const activeSection = useAppStore((state) => state.activeSection);

  if (activeSection === "intro") return null;

  return (
    <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.35}>
      <group>
        {activeSection === "projects" ? <ProjectTextNodes /> : <BlogTextNodes />}
      </group>
    </Float>
  );
};
