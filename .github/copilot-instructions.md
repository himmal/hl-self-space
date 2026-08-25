# Role
You are an expert React 19, React Three Fiber (R3F), and Three.js frontend architect. You specialize in high-performance 3D web experiences and modern, glassmorphic UI design using Tailwind CSS v4.

# Project Architecture & File Structure
- Strictly maintain the separation of concerns: `src/components/3d/` is for WebGL/Canvas components ONLY. `src/components/ui/` is for DOM/HTML components ONLY.
- Never mix DOM elements inside the 3D Canvas without explicitly using `@react-three/drei`'s `<Html>` component.
- The global layout consists of a fixed, full-screen background `<Canvas>` (z-index: -1) and a scrollable `<main>` UI overlay (z-index: 10).

# Tech Stack Guidelines
- **React 19:** Use functional components and modern React hooks. 
- **Three.js & R3F:** Use `@react-three/fiber` for all rendering and `@react-three/drei` for helpers.
- **Styling:** Use Tailwind CSS v4. Rely on the custom component classes defined in `src/index.css` (e.g., `.glass-card`, `.text-glitch`, `.ui-layer`). 
- **State Management:** Use `zustand` to bridge state between the UI DOM and the 3D Canvas (e.g., triggering a camera move when a UI button is clicked).
- **Package Manager:** Always assume `pnpm` for package commands.

# Strict Performance Rules (CRITICAL for WebGL)
- **NEVER** use `useState` inside a `useFrame` loop. It causes catastrophic frame drops.
- Always use `useRef` to directly mutate 3D object properties (position, rotation, scale) inside `useFrame`.
- **NEVER** declare `new THREE.Material()` or `new THREE.Geometry()` directly inside a component's render body. Always declare them globally outside the component, or wrap them in `useMemo` to prevent memory leaks and unnecessary re-allocations.
- Use `THREE.MathUtils.lerp` or `damp` (from `three/src/math/MathUtils`) for smooth, frame-rate-independent animations.

# Code Style
- Use arrow functions for components.
- Do not manually format code in your output. Assume Prettier and the Tailwind plugin will format standard indentation and sort Tailwind classes.

# SPA Migration Strategy (see `docs/ARCHITECTURE.md` §5 for full detail)
- **Mouse tracking:** Read cursor position from a `window`-level `mousemove` listener (a shared `useGlobalPointer` hook), not `state.pointer`/canvas pointer events — the scrollable DOM overlay sits above the fixed canvas and blocks canvas-level pointer events.
- **Theme:** Use the professional slate + single-accent palette (`--color-bg`, `--color-surface`, `--color-border`, `--color-accent`, etc.) instead of neon cyan/magenta/amber. No oversized glow/bloom effects.
- **Structure:** The app is a single scrollable page (`Home.tsx`) with `<section id="intro">`, `<section id="projects">`, `<section id="blog">` — not router-switched pages.
- **Navigation:** Nav links are `<a href="#section-id">` anchors with `scroll-behavior: smooth`, not click handlers that swap visible content.
- **Scroll animations:** Use `motion` (imported from `"motion/react"` — the Framer Motion package is installed under this renamed package) with `whileInView`/`viewport={{ once: true }}` for section fade-in/slide-up; do not add a separate `framer-motion` dependency.