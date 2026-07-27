import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import { Terminal, FolderGit2 } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "./BrandIcons";
import { useAudioManager } from "../../hooks/useAudioManager";

const PROJECTS = [
  {
    id: "proj-1",
    title: "Project Alpha // Distributed Engine",
    description: "High-throughput asynchronous task orchestrator built with Go and WebAssembly.",
    link: "https://github.com",
    tags: ["Go", "Wasm", "Distributed Systems"],
  },
  {
    id: "proj-2",
    title: "Neural Vision // Edge AI Pipeline",
    description: "Low-latency object detection streaming pipeline leveraging TensorRT and WebGL.",
    link: "https://github.com",
    tags: ["TypeScript", "C++", "TensorRT"],
  },
];

export const Overlay = () => {
  const { activeSection, setActiveSection, setHoveredProject } = useAppStore();
  const markSectionVisited = useAppStore((state) => state.markSectionVisited);
  const collectFragment = useAppStore((state) => state.collectFragment);
  const { playSfx } = useAudioManager();
  const [glitchActive, setGlitchActive] = useState(false);
  const isFirstRender = useRef(true);

  // Mark each section as "visited" and award a collectible data fragment the
  // first time a section is reached — a lightweight interpretation of the
  // "Collectible Data Fragments" exploration mechanic.
  useEffect(() => {
    markSectionVisited(activeSection);
    collectFragment(`fragment-${activeSection}`);

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setGlitchActive(true);
    const timeout = setTimeout(() => setGlitchActive(false), 750);
    return () => clearTimeout(timeout);
  }, [activeSection, markSectionVisited, collectFragment]);

  const handleNavClick = (section: "intro" | "projects" | "blog") => {
    setActiveSection(section);
    playSfx("nav");
  };

  return (
    <main className="ui-layer">
      {/* Sci-Fi Navigation Header */}
      <header className="flex items-center justify-between border-b border-[var(--color-glass-border)] pb-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Terminal className="h-6 w-6 text-[var(--color-sci-cyan)]" />
          <span className="text-lg font-bold tracking-widest">HIM.DEV // LOG</span>
        </div>
        <nav className="flex gap-4">
          <button
            onClick={() => handleNavClick("intro")}
            className={`cursor-pointer border px-3 py-1 text-sm transition-all ${
              activeSection === "intro"
                ? "border-[var(--color-sci-cyan)] bg-[rgba(0,255,204,0.1)] text-white"
                : "border-transparent opacity-70 hover:opacity-100"
            }`}
          >
            [01. Intro]
          </button>
          <button
            onClick={() => handleNavClick("projects")}
            className={`cursor-pointer border px-3 py-1 text-sm transition-all ${
              activeSection === "projects"
                ? "border-[var(--color-sci-cyan)] bg-[rgba(0,255,204,0.1)] text-white"
                : "border-transparent opacity-70 hover:opacity-100"
            }`}
          >
            [02. Projects]
          </button>
        </nav>
      </header>

      {/* Intro Section */}
      <section className="mt-8 flex max-w-2xl flex-col gap-4">
        <h1 className="text-glitch" data-glitch-trigger={glitchActive}>
          Self Profile // Software Engineer
        </h1>
        <p className="text-base leading-relaxed text-gray-300">
          Specializing in high-performance backend systems and real-time interactive spatial
          applications. Welcome to my digital terminal and personal engineering log.
        </p>
      </section>

      {/* Projects Showcase */}
      <section className="mt-4 flex flex-col gap-6">
        <h2 className="flex items-center gap-2 border-l-2 border-[var(--color-sci-cyan)] pl-3 text-xl font-bold">
          <FolderGit2 className="h-5 w-5 text-[var(--color-sci-cyan)]" /> Selected Works
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {PROJECTS.map((proj) => (
            <div
              key={proj.id}
              className="glass-card flex cursor-pointer flex-col justify-between gap-4"
              onMouseEnter={() => setHoveredProject(proj.id)}
              onMouseLeave={() => setHoveredProject(null)}
            >
              <div>
                <h3 className="mb-2 text-lg font-bold text-[var(--color-sci-cyan)]">
                  {proj.title}
                </h3>
                <p className="mb-4 text-sm text-gray-300">{proj.description}</p>
                <div className="flex flex-wrap gap-2">
                  {proj.tags.map((tag) => (
                    <span
                      key={tag}
                      className="border border-[var(--color-glass-border)] bg-black/40 px-2 py-0.5 text-xs text-cyan-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <a
                href={proj.link}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 self-start text-xs tracking-wider text-[var(--color-sci-cyan)] uppercase hover:underline"
              >
                Launch Repository &rarr;
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto flex items-center justify-between border-t border-[var(--color-glass-border)] pt-10 text-xs text-gray-400">
        <span>&copy; {new Date().getFullYear()} HIM // SYSTEM ONLINE</span>
        <div className="flex gap-4">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[var(--color-sci-cyan)]"
          >
            <GithubIcon className="h-4 w-4" />
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[var(--color-sci-cyan)]"
          >
            <LinkedinIcon className="h-4 w-4" />
          </a>
        </div>
      </footer>
    </main>
  );
};
