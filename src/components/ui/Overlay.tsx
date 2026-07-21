import { useAppStore } from "../../store/useAppStore";
import { Terminal, FolderGit2 } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "./BrandIcons";

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

  return (
    <main className="ui-layer">
      {/* Sci-Fi Navigation Header */}
      <header className="flex justify-between items-center border-b border-[var(--color-glass-border)] pb-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Terminal className="text-[var(--color-sci-cyan)] w-6 h-6" />
          <span className="font-bold tracking-widest text-lg">HIM.DEV // LOG</span>
        </div>
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveSection("intro")}
            className={`px-3 py-1 border transition-all text-sm cursor-pointer ${
              activeSection === "intro"
                ? "border-[var(--color-sci-cyan)] bg-[rgba(0,255,204,0.1)] text-white"
                : "border-transparent opacity-70 hover:opacity-100"
            }`}
          >
            [01. Intro]
          </button>
          <button
            onClick={() => setActiveSection("projects")}
            className={`px-3 py-1 border transition-all text-sm cursor-pointer ${
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
      <section className="flex flex-col gap-4 max-w-2xl mt-8">
        <h1 className="text-glitch">Self Profile // Software Engineer</h1>
        <p className="text-gray-300 text-base leading-relaxed">
          Specializing in high-performance backend systems and real-time interactive spatial applications.
          Welcome to my digital terminal and personal engineering log.
        </p>
      </section>

      {/* Projects Showcase */}
      <section className="flex flex-col gap-6 mt-4">
        <h2 className="text-xl font-bold flex items-center gap-2 border-l-2 border-[var(--color-sci-cyan)] pl-3">
          <FolderGit2 className="w-5 h-5 text-[var(--color-sci-cyan)]" /> Selected Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PROJECTS.map((proj) => (
            <div
              key={proj.id}
              className="glass-card flex flex-col justify-between gap-4 cursor-pointer"
              onMouseEnter={() => setHoveredProject(proj.id)}
              onMouseLeave={() => setHoveredProject(null)}
            >
              <div>
                <h3 className="font-bold text-lg text-[var(--color-sci-cyan)] mb-2">
                  {proj.title}
                </h3>
                <p className="text-sm text-gray-300 mb-4">{proj.description}</p>
                <div className="flex flex-wrap gap-2">
                  {proj.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 border border-[var(--color-glass-border)] bg-black/40 text-cyan-200"
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
                className="text-xs uppercase tracking-wider text-[var(--color-sci-cyan)] hover:underline flex items-center gap-1 self-start"
              >
                Launch Repository &rarr;
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto pt-10 border-t border-[var(--color-glass-border)] flex justify-between items-center text-xs text-gray-400">
        <span>&copy; {new Date().getFullYear()} HIM // SYSTEM ONLINE</span>
        <div className="flex gap-4">
          <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-[var(--color-sci-cyan)]">
            <GithubIcon className="w-4 h-4" />
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-[var(--color-sci-cyan)]">
            <LinkedinIcon className="w-4 h-4" />
          </a>
        </div>
      </footer>
    </main>
  );
};