import { useEffect, useRef, useState } from "react";
import { TerminalSquare } from "lucide-react";
import { useAppStore, SECTIONS, type Section } from "../../store/useAppStore";
import { useAudioManager } from "../../hooks/useAudioManager";

const isSection = (value: string): value is Section =>
  (SECTIONS as readonly string[]).includes(value);

/**
 * Hidden terminal command palette, toggled via `Ctrl+'` (visible HUD button
 * provided as an accessible, discoverable alternative entry point). Purely a
 * DOM component reading/writing Zustand state — no 3D coupling.
 */
export const CommandTerminal = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([
    "> SYSTEM READY. Type `help` for available commands.",
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const setActiveSection = useAppStore((state) => state.setActiveSection);
  const collectFragment = useAppStore((state) => state.collectFragment);
  const collectedFragments = useAppStore((state) => state.collectedFragments);
  const { playSfx } = useAudioManager();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "'") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const runCommand = (raw: string) => {
    const command = raw.trim();
    if (!command) return;

    let output = `Unknown command: ${command}`;

    if (command === "help") {
      output =
        "Available: whoami, sudo unlock, cd /projects, cd /blog, cd /intro, cat manifesto.txt, clear";
    } else if (command === "whoami") {
      output = "himmal // software engineer // exploring the neural grid";
    } else if (command === "sudo unlock") {
      collectFragment("terminal-easter-egg");
      output = "ACCESS GRANTED. Hidden fragment recovered.";
    } else if (command === "cat manifesto.txt") {
      output = "Build small, ship often, and make the machine feel alive.";
    } else if (command === "clear") {
      setHistory([]);
      setInput("");
      return;
    } else if (command.startsWith("cd /")) {
      const target = command.replace("cd /", "");
      if (isSection(target)) {
        setActiveSection(target);
        output = `Navigated to /${target}`;
      } else {
        output = `No such section: /${target}`;
      }
    }

    playSfx("terminal");
    setHistory((prev) => [...prev, `$ ${command}`, output]);
    setInput("");
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open command terminal (Ctrl+')"
        className="hud-corner-bracket fixed bottom-4 left-4 z-30 flex cursor-pointer items-center gap-2 border border-[var(--color-glass-border)] bg-black/50 px-3 py-2 text-[10px] tracking-widest text-[var(--color-sci-cyan)] uppercase backdrop-blur-md transition-opacity hover:opacity-100"
      >
        <TerminalSquare className="h-3.5 w-3.5" /> Terminal (Ctrl+&apos;)
      </button>
    );
  }

  return (
    <div className="terminal-panel fixed bottom-4 left-4 z-30 flex w-80 flex-col gap-2 p-3 text-xs text-[var(--color-sci-cyan)]">
      <div className="flex items-center justify-between">
        <span className="tracking-widest uppercase">Command Terminal</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close terminal"
          className="cursor-pointer opacity-70 hover:opacity-100"
        >
          [x]
        </button>
      </div>
      <div className="max-h-40 overflow-y-auto whitespace-pre-wrap opacity-80">
        {history.join("\n")}
      </div>
      <div className="flex items-center gap-2 border-t border-[var(--color-glass-border)] pt-2">
        <span>$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") runCommand(input);
          }}
          className="w-full bg-transparent outline-none"
          spellCheck={false}
          autoComplete="off"
        />
      </div>
      <span className="opacity-60">Fragments recovered: {collectedFragments.length}</span>
    </div>
  );
};
