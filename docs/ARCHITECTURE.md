# 🌌 Architecture & Code Conventions

This document outlines the file structure, coding standards, and rendering architecture for the **hl-dev-log** 3D portfolio.

## 📂 1. Directory Structure

The `src/` directory is strictly separated into **WebGL (3D)** and **HTML (UI)** layers. Do not mix DOM elements directly inside WebGL components without using `@react-three/drei`'s `<Html>` wrapper.

```text
src/
├── components/
│   ├── 3d/               # React Three Fiber components (WebGL)
│   │   ├── NeuralGrid.tsx
│   │   ├── CameraRig.tsx
│   │   └── Scene.tsx
│   ├── ui/               # Tailwind HTML components (DOM)
│   │   ├── GlassCard.tsx
│   │   ├── GlitchText.tsx
│   │   └── Overlay.tsx
│   └── layout/           # Page structural wrappers
├── store/                # Zustand state management
│   └── useAppStore.ts    # Tracks UI state to drive 3D camera changes
├── styles/
│   └── index.css         # Tailwind v4 configuration & @layer overrides
├── utils/                # Helper functions (Math, formatting)
├── App.tsx               # Main entry point combining UI and Canvas
└── main.tsx              # React 19 root render
```

## 📐 2. Code Style & Formatting
We use ESLint 9 (Flat Config) and Prettier to enforce code quality.

Formatting: Prettier will automatically format files and sort Tailwind classes on save. Do not manually format code.

Component Style: Use React 19 functional components with arrow functions.

Type Safety (Optional but encouraged): Use TypeScript `interface` for component props.

```Typescript
// ✅ Good: Clean functional component with sorted Tailwind classes
export const GlassCard = ({ title, children }) => {
  return (
    <div className="glass-card flex flex-col p-4 shadow-lg">
      <h2 className="text-glitch mb-2 text-xl">{title}</h2>
      <div>{children}</div>
    </div>
  );
};
```

## 🚀 3. React Three Fiber (R3F) Conventions
WebGL performance is the highest priority. Dropped frames will ruin the futuristic aesthetic.

Avoid React state in animation loops: Never use `useState` inside a `useFrame` loop. It will trigger a full component re-render 60 times a second.

Use Refs for animation: Mutate object properties directly via `useRef`.

Reuse Geometries/Materials: Declare geometries and materials globally outside the component or use `useMemo` if they require props.

```Typescript
// ✅ Good: High-performance 3D animation
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Global declaration saves memory allocation per-instance
const material = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
const geometry = new THREE.BoxGeometry(1, 1, 1);

export const FloatingNode = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    // Mutate rotation directly, avoiding React state overhead
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
};
```

## 🧠 4. State Management (Zustand)
Use Zustand (`store/useAppStore.ts`) to bridge the gap between the HTML UI and the 3D Canvas.
For example, clicking a UI button should update a Zustand state (e.g., `targetCameraPosition`). The 3D `<CameraRig />` component will listen to this state and smoothly interpolate the camera's actual position using a math helper (like `THREE.MathUtils.lerp`).

## 🧭 5. Professional SPA Migration Strategy

This section defines the plan for migrating the current router-driven, "cyberpunk terminal" experience into a clean, professional, single-page-application (SPA) with anchor-link navigation and scroll-triggered animations. It is the design contract for the migration — implementation must follow this document.

### 5.1 Event Handling Strategy — Global Mouse Tracking

**Diagnosis:** `AntigravityParticles` currently derives repulsion from `state.pointer` (R3F's NDC pointer, updated via `onPointerMove` on the `<canvas>` DOM element). Because the scrollable `.ui-layer` (`z-index: 10`) sits on top of the fixed `.canvas-layer` (`z-index: -1`) and covers the full viewport, the browser routes pointer events to the topmost DOM element under the cursor. Whenever the cursor is over any UI content (nav, cards, text), the `<canvas>` never receives the `pointermove` event, so `state.pointer` freezes and the particle field stops reacting — R3F's built-in pointer tracking is blocked by DOM capture/bubbling, not a rendering bug.

**Fix — bypass the DOM entirely:**
- Attach a single `window.addEventListener("mousemove", ...)` (and `pointermove` for touch/pen parity) at the `document`/`window` level, outside of React Three Fiber's canvas event system. Window-level listeners fire regardless of which element is topmost, since they are attached above the DOM capture/bubble chain for the whole page.
- Store the raw client coordinates in a `useRef<{ x: number; y: number }>` (never `useState`) normalized to NDC space (`x = (clientX / innerWidth) * 2 - 1`, `y = -(clientY / innerHeight) * 2 + 1`), updated in the event handler only — no React re-render per mouse move.
- Inside `useFrame`, read this ref instead of `state.pointer` and unproject it into world space via `state.viewport` (same math already used in `AntigravityParticles`), so the repulsion field keeps working identically whether the cursor is over empty canvas or over a glass card.
- Register/cleanup the listener in a `useEffect` with an empty dependency array, removing it on unmount. Keep `<Canvas>` `pointer-events` on the DOM overlay untouched — no need for `pointer-events: none` hacks, since we no longer depend on canvas-level events.
- Keep this logic in a small shared hook, e.g. `useGlobalPointer()` (in `src/hooks/`), so any future 3D component needing cursor position reads from the same source of truth instead of duplicating listeners.

### 5.2 Color & Theme System

Replace the neon cyan/magenta/amber "sci-fi terminal" palette with a restrained, professional palette centered on slate and near-black, with a single muted accent:

| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#020617` (slate-950) | Page/canvas background, fog color |
| `--color-surface` | `#0f172a` (slate-900) | Card backgrounds |
| `--color-border` | `#1e293b` (slate-800) | Card/nav borders, dividers |
| `--color-muted` | `#334155` / `#475569` (slate-700/600) | Secondary particles, secondary text |
| `--color-foreground` | `#e2e8f0` (slate-200) | Body text |
| `--color-accent` | `#0ea5e9` (sky-500) or `#14b8a6` (teal-500) | Links, active nav state, rare particle highlight, focus rings |

Rules:
- Retire `--color-sci-cyan`, `--color-sci-magenta`, `--color-sci-amber`, and the per-section palette swap in `Scene.tsx`/`NeuralGrid` (magenta/violet, amber/green) in favor of one consistent slate + single-accent theme across all sections — no more per-section neon re-theming.
- Eliminate large, saturated bloom/glow blobs (e.g. the wide `Sparkles`/glow at `FRAGMENT_HUBS`, oversized glass-card box-shadows); accents should read as small, deliberate highlights (a thin border, a subtly glowing dot), not full-screen color washes.
- `.glass-card` keeps subtle glassmorphism (blur + low-opacity surface) but its border/glow color moves from `--color-sci-cyan` to `--color-accent` at low opacity.
- All existing hard-coded hex/rgba color literals in components and `index.css` are replaced with references to the new theme tokens so the palette stays centrally controlled.

### 5.3 Single Page Architecture

Collapse the router-driven page model into one continuously scrollable page:
- Remove `react-router-dom`'s `<Routes>`/`<Route>` switching between `NeuralGridExperience` and `NotFoundUI` as the primary navigation model (routing can remain only for a true 404 fallback at the app root, not for in-page section switching).
- Introduce `src/pages/Home.tsx` (or fold directly into `App.tsx`) that renders one `<main>` containing, in order:
  - `<Intro id="intro" />`
  - `<Projects id="projects" />`
  - `<Log id="blog" />` (renamed conceptually from "blog" to "Log", matching current `LOG_ENTRIES` content)
- Each section component is extracted from the current monolithic `Overlay.tsx` into its own file under `src/components/ui/sections/` (`Intro.tsx`, `Projects.tsx`, `Log.tsx`), each rendering a `<section id="...">` wrapper with generous vertical padding so anchors land cleanly below the fixed nav.
- `activeSection` in `useAppStore` changes meaning: instead of being set imperatively by nav clicks to swap visible content, it is derived from scroll position (via `IntersectionObserver`, see §6.5) and used only to drive non-content side effects that should remain (e.g. subtle fog/tint shifts, HUD indicators) — content visibility itself is no longer conditional on it.
- The fixed 3D `<Canvas>` background and its `z-index: -1`/`position: fixed` treatment is unchanged; only the HTML content becomes a normal flowing document instead of a state-switched single view.

### 5.4 Navigation — Anchor Links + Smooth Scroll

- Replace the nav `<button onClick={() => handleNavClick(section)}>` elements in `Overlay`/header with plain `<a href="#intro">`, `<a href="#projects">`, `<a href="#blog">` anchors targeting the section `id`s from §6.3.
- Enable smooth scrolling globally via CSS: `html { scroll-behavior: smooth; }` in `index.css`, plus `scroll-margin-top` on each `<section>` equal to the fixed header's height so anchored sections aren't hidden underneath it.
- The header itself becomes `position: sticky; top: 0;` (or `fixed`) so it remains visible while scrolling, sitting above the content (`z-index` between the canvas and the content, e.g. `20`) but below nothing else.
- Active-link highlighting is driven by the same `IntersectionObserver` from §6.5 rather than click state, so the nav reflects true scroll position (including when the user scrolls manually, not just via nav clicks).
- Drop `setActiveSection` calls from click handlers; keep the store action only for the observer-driven update.

### 5.5 Scroll Animations

Adopt `motion` (already a dependency — the renamed Framer Motion package, imported as `import { motion } from "motion/react"`) for section entrance animations, avoiding a redundant `framer-motion` install:
- Wrap each section's outer element with `motion.section`, using a shared, reusable variant, e.g. `initial={{ opacity: 0, y: 24 }}`, animate target `{ opacity: 1, y: 0 }`, `transition={{ duration: 0.6, ease: "easeOut" }}`.
- Trigger via `whileInView` with `viewport={{ once: true, amount: 0.3 }}` so each section fades/slides in the first time ~30% of it enters the viewport, and does not replay on scroll-up (keeps the feel calm/professional rather than gimmicky).
- For the same active-nav-highlight need (§6.4), use a lightweight `IntersectionObserver` hook (e.g. `useActiveSection(ids: string[])`) rather than relying on `motion`'s `whileInView` callback, since nav highlighting needs continuous re-triggering (`once: false`) while entrance animation needs to fire once — two distinct observers/concerns.
- Stagger inner content (headings, cards) with a `staggerChildren` parent variant only where it clearly improves readability (e.g. project cards), avoiding excessive motion on dense text blocks.
- All new animation variants live in one shared module (e.g. `src/lib/motionVariants.ts`) so easing/duration stays consistent across sections instead of being redefined per component.

### 5.6 Migration Checklist

1. `useGlobalPointer` hook → rewire `AntigravityParticles` to read it instead of `state.pointer`.
2. New theme tokens in `index.css`; remove neon tokens and per-section palette in `Scene.tsx`.
3. Extract `Intro`/`Projects`/`Log` section components from `Overlay.tsx`; assemble in `Home.tsx`.
4. Convert nav buttons to `<a href="#...">`; add `scroll-behavior: smooth` + `scroll-margin-top`.
5. Add `useActiveSection` IntersectionObserver hook for nav highlighting.
6. Wrap sections in `motion.section` with shared fade/slide-up variants, `whileInView` + `once: true`.
7. Verify `pnpm lint` / `pnpm build` after each step.

## 📦 6. Package Management (pnpm)
This project strictly uses pnpm.

Never use `npm install` or `yarn add`.

To add a dependency: `pnpm add <package>`

To run the dev server: `pnpm dev`

Peer Dependencies: If you experience missing dependencies regarding `three` or `@react-three/fiber`, ensure you explicitly add the required package, as pnpm enforces strict module isolation.
