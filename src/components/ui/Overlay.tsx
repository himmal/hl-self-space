import { useEffect, useRef, useState } from "react";
import { useAppStore, SECTIONS, type Section } from "../../store/useAppStore";
import { Terminal, FolderGit2, BookOpen } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "./BrandIcons";
import { useAudioManager } from "../../hooks/useAudioManager";
import { useActiveSection } from "../../hooks/useActiveSection";
import { PROJECT_TO_LOG, LOG_TO_PROJECT } from "../3d/sceneData";

// Per-section DOM theme: text accent, mirroring the WebGL per-section
// palette in `AntigravityParticles`/`Scene` (see docs/ARCHITECTURE.md
// §5.2/§7). Applied to each section's heading/link accents so scrolling
// between sections visibly recolors the page, not just the particle field.
// Deliberately has no `bg` — sections stay 100% transparent so the 3D canvas
// underneath is fully visible through the text.
const SECTION_THEME: Record<Section, { text: string; border: string; nav: string }> = {
  intro: {
    text: "text-cyan-400",
    border: "border-cyan-400/40",
    nav: "border-cyan-400/60 bg-cyan-400/10 text-cyan-300",
  },
  projects: {
    text: "text-purple-400",
    border: "border-purple-400/40",
    nav: "border-purple-400/60 bg-purple-400/10 text-purple-300",
  },
  blogs: {
    text: "text-amber-400",
    border: "border-amber-400/40",
    nav: "border-amber-400/60 bg-amber-400/10 text-amber-300",
  },
};

const NAV_ITEMS: { id: Section; label: string }[] = [
  { id: "intro", label: "[01. Intro]" },
  { id: "projects", label: "[02. Projects]" },
  { id: "blogs", label: "[03. Blogs]" },
];

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

const LOG_ENTRIES = [
  {
    id: "log-1",
    title: "Log // Building the Distributed Engine",
    excerpt: "Notes on orchestrating asynchronous tasks at scale — the story behind Project Alpha.",
  },
  {
    id: "log-2",
    title: "Log // Edge AI in the Wild",
    excerpt:
      "Lessons from shipping low-latency inference pipelines — the story behind Neural Vision.",
  },
];

export const Overlay = () => {
  const activeSection = useAppStore((state) => state.activeSection);
  const setHoveredProject = useAppStore((state) => state.setHoveredProject);
  const setHoveredLog = useAppStore((state) => state.setHoveredLog);
  const activeLinkId = useAppStore((state) => state.activeLinkId);
  const setActiveLinkId = useAppStore((state) => state.setActiveLinkId);
  const markSectionVisited = useAppStore((state) => state.markSectionVisited);
  const collectFragment = useAppStore((state) => state.collectFragment);
  const { playSfx } = useAudioManager();
  const [glitchActive, setGlitchActive] = useState(false);
  const isFirstRender = useRef(true);

  // Scroll-spy: `activeSection` is now derived from real scroll position
  // (see docs/ARCHITECTURE.md §5.4/§7), not set imperatively by nav clicks.
  useActiveSection(SECTIONS);

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

  const handleProjectHover = (id: string | null) => {
    setHoveredProject(id);
    setActiveLinkId(id ? (PROJECT_TO_LOG[id] ?? null) : null);
  };

  const handleLogHover = (id: string | null) => {
    setHoveredLog(id);
    setActiveLinkId(id ? (LOG_TO_PROJECT[id] ?? null) : null);
  };

  return (
    <>
      {/* Sticky, frosted-glass scroll-spy navbar (docs/ARCHITECTURE.md §7) */}
      <header className="fixed top-0 z-20 flex w-full items-center justify-between border-b border-[var(--color-border)] bg-black/80 px-[10vw] py-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Terminal className="h-6 w-6 text-[var(--color-accent)]" />
          <span className="text-lg font-bold tracking-widest">HIM.DEV // LOG</span>
        </div>
        <nav className="flex gap-4">
          {NAV_ITEMS.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={() => playSfx("nav")}
              className={`pointer-events-auto cursor-pointer border px-3 py-1 text-sm transition-all ${
                activeSection === id
                  ? SECTION_THEME[id].nav
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      <main className="ui-layer pt-24">
        {/* Intro Section */}
        <section
          id="intro"
          className="flex min-h-screen scroll-mt-24 flex-col justify-center gap-4"
        >
          <h1
            className={`text-glitch ${SECTION_THEME.intro.text}`}
            data-glitch-trigger={glitchActive}
          >
            Self Profile // Software Engineer
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-gray-300">
            Specializing in high-performance backend systems and real-time interactive spatial
            applications. Welcome to my digital terminal and personal engineering log.
          </p>
        </section>

        {/* Projects Showcase */}
        <section
          id="projects"
          className="flex min-h-screen scroll-mt-24 flex-col justify-center gap-6"
        >
          <h2
            className={`flex items-center gap-2 border-l-2 pl-3 text-xl font-bold ${SECTION_THEME.projects.border} ${SECTION_THEME.projects.text}`}
          >
            <FolderGit2 className="h-5 w-5" /> Selected Works
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {PROJECTS.map((proj) => (
              <div
                key={proj.id}
                className={`glass-card pointer-events-auto flex cursor-pointer flex-col justify-between gap-4 ${
                  activeLinkId === proj.id ? SECTION_THEME.projects.border : ""
                }`}
                onMouseEnter={() => handleProjectHover(proj.id)}
                onMouseLeave={() => handleProjectHover(null)}
              >
                <div>
                  <h3 className={`mb-2 text-lg font-bold ${SECTION_THEME.projects.text}`}>
                    {proj.title}
                  </h3>
                  <p className="mb-4 text-sm text-gray-300">{proj.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {proj.tags.map((tag) => (
                      <span
                        key={tag}
                        className="border border-[var(--color-border)] bg-black/40 px-2 py-0.5 text-xs text-purple-200"
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
                  className={`flex items-center gap-1 self-start text-xs tracking-wider uppercase hover:underline ${SECTION_THEME.projects.text}`}
                >
                  Launch Repository &rarr;
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Blogs / Log Showcase */}
        <section
          id="blogs"
          className="flex min-h-screen scroll-mt-24 flex-col justify-center gap-6"
        >
          <h2
            className={`flex items-center gap-2 border-l-2 pl-3 text-xl font-bold ${SECTION_THEME.blogs.border} ${SECTION_THEME.blogs.text}`}
          >
            <BookOpen className="h-5 w-5" /> Engineering Log
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {LOG_ENTRIES.map((entry) => (
              <div
                key={entry.id}
                className={`glass-card pointer-events-auto flex cursor-pointer flex-col gap-2 ${
                  activeLinkId === entry.id ? SECTION_THEME.blogs.border : ""
                }`}
                onMouseEnter={() => handleLogHover(entry.id)}
                onMouseLeave={() => handleLogHover(null)}
              >
                <h3 className={`text-lg font-bold ${SECTION_THEME.blogs.text}`}>{entry.title}</h3>
                <p className="text-sm text-gray-300">{entry.excerpt}</p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <footer className="pointer-events-auto mt-auto flex items-center justify-between border-t border-[var(--color-border)] pt-10 text-xs text-gray-400">
            <span>&copy; {new Date().getFullYear()} HIM // SYSTEM ONLINE</span>
            <div className="flex gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[var(--color-accent)]"
              >
                <GithubIcon className="h-4 w-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[var(--color-accent)]"
              >
                <LinkedinIcon className="h-4 w-4" />
              </a>
            </div>
          </footer>
        </section>
      </main>
    </>
  );
};
