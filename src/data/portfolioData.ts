// Centralized mock data for the "Selected Works" (projects) and "Engineering
// Log" (blogs) sections — the single source of truth consumed by both the
// DOM cards (`Overlay.tsx`) and the WebGL `RelationalGraph` (see
// `src/components/3d/RelationalGraph.tsx` and docs/ARCHITECTURE.md §8).
// Shared `tags`/`keywords` are what drive the 3D bubble clustering and
// (for blogs) the curved relational edges — keep them realistic and
// tech-focused so overlaps read as meaningful relationships, not noise.

/** A single "Selected Works" portfolio entry, clustered in 3D by shared `tags`. */
export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  /** Shared tags drive tag-based bubble clustering in `#projects` — no edges are drawn. */
  tags: string[];
  repoUrl: string;
  /** World-unit-ish radius hint for the 3D bubble; also usable for DOM emphasis. */
  nodeSize: number;
}

/** A single "Engineering Log" entry, connected in 3D by shared `keywords`. */
export interface BlogItem {
  id: string;
  title: string;
  description: string;
  /** Shared keywords drive the curved relational edges between blog bubbles in `#blogs`. */
  keywords: string[];
  url: string;
  nodeSize: number;
}

export const demoData: { projects: ProjectItem[]; blogs: BlogItem[] } = {
  projects: [
    {
      id: "proj-1",
      title: "Project Alpha // Distributed Engine",
      description: "High-throughput asynchronous task orchestrator built with Go and WebAssembly.",
      tags: ["Go", "Wasm", "Distributed Systems"],
      repoUrl: "https://github.com",
      nodeSize: 0.42,
    },
    {
      id: "proj-2",
      title: "Neural Vision // Edge AI Pipeline",
      description: "Low-latency object detection streaming pipeline leveraging TensorRT and WebGL.",
      tags: ["TypeScript", "C++", "TensorRT", "WebGL"],
      repoUrl: "https://github.com",
      nodeSize: 0.5,
    },
    {
      id: "proj-3",
      title: "Signal Mesh // Realtime Telemetry Bus",
      description: "Go-based pub/sub fabric distributing sensor telemetry across edge clusters.",
      tags: ["Go", "Distributed Systems", "gRPC"],
      repoUrl: "https://github.com",
      nodeSize: 0.36,
    },
    {
      id: "proj-4",
      title: "Render Loom // WebGL Particle Engine",
      description: "Instanced GPU particle framework powering this site's ambient background.",
      tags: ["WebGL", "TypeScript", "Three.js"],
      repoUrl: "https://github.com",
      nodeSize: 0.4,
    },
  ],
  blogs: [
    {
      id: "log-1",
      title: "Log // Building the Distributed Engine",
      description: "Notes on orchestrating asynchronous tasks at scale — the story behind Project Alpha.",
      keywords: ["Go", "Distributed Systems", "Concurrency"],
      url: "https://github.com",
      nodeSize: 0.38,
    },
    {
      id: "log-2",
      title: "Log // Edge AI in the Wild",
      description: "Lessons from shipping low-latency inference pipelines — the story behind Neural Vision.",
      keywords: ["TensorRT", "WebGL", "Inference"],
      url: "https://github.com",
      nodeSize: 0.44,
    },
    {
      id: "log-3",
      title: "Log // Taming gRPC Fan-Out",
      description: "Backpressure and retry strategies for a Go telemetry bus under bursty load.",
      keywords: ["Go", "gRPC", "Distributed Systems"],
      url: "https://github.com",
      nodeSize: 0.34,
    },
    {
      id: "log-4",
      title: "Log // Shaders for Non-Shader Engineers",
      description: "A practical primer on GLSL point sprites and clamped size-attenuation.",
      keywords: ["WebGL", "Three.js", "Shaders"],
      url: "https://github.com",
      nodeSize: 0.3,
    },
    {
      id: "log-5",
      title: "Log // Concurrency Bugs I've Shipped",
      description: "A postmortem tour of race conditions found the hard way in production Go services.",
      keywords: ["Go", "Concurrency"],
      url: "https://github.com",
      nodeSize: 0.28,
    },
  ],
};
