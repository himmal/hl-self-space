# 🛰️ Exploration & Engagement Plan — "Neural Grid" Experience

This document is the strategic roadmap for evolving **hl-dev-log** from a static
sci-fi themed portfolio into an immersive, exploration-driven "Neural Grid"
experience. It expands on the current architecture (`Scene.tsx`, `NeuralGrid.tsx`,
`Overlay.tsx`, `useAppStore.ts`) described in `docs/ARCHITECTURE.md`, and proposes
concrete, incrementally shippable features across four pillars:

1. Spatial & 3D Environment Enhancements
2. Gamified Exploration & Inter-Page Mechanics
3. Futuristic Micro-Interactions & Audio/Visual Feedback
4. Implementation Plan & Architecture Integration

**Guiding constraint:** every feature must preserve the **60 FPS** target and the
strict separation between the WebGL layer (`src/components/3d/`) and the DOM UI
layer (`src/components/ui/`), bridged only via `zustand` (`src/store/useAppStore.ts`).

---

## 1. 🌌 Spatial & 3D Environment Enhancements

Goal: make the canvas feel like a living, navigable "neural space" rather than a
decorative background — reinforcing that each section is a physical "location."

- [x] **Section-to-Waypoint Camera Travel** — Define a `CameraRig.tsx` component
      that maps each `activeSection` to a named waypoint (position + lookAt +
      FOV). On section change, animate the camera along a `THREE.CatmullRomCurve3`
      path instead of a flat lerp, so transitions feel like "traveling" through
      the grid rather than snapping to a new depth.
- [x] **Reactive Camera Micro-Movement** — Extend the existing pointer-based
      parallax tilt in `Scene.tsx` with subtle "hover magnetism": when a UI
      element is hovered (tracked via `hoveredProject` / a new `hoveredNode` in
      the store), bias the camera's target slightly toward the corresponding 3D
      anchor point, reinforcing the UI ↔ 3D link.
- [x] **Environmental Depth Shifts (Fog & Parallax Layers)** — Add a
      `THREE.FogExp2` layer whose density/color lerps per section (e.g., denser
      cyan fog in "blog," clearer void in "intro"). Add a second, slower-rotating
      `NeuralGrid` instance (sparse, larger scale) behind the main one to create
      a parallax depth field with near-zero extra draw cost (shared geometry via
      `useMemo`, instanced or simply lower particle count).
- [x] **Volumetric Light Shafts** — Introduce a lightweight volumetric effect
      using `@react-three/drei`'s `<Sparkles>` or a custom additive-blended
      cone mesh with a noise shader, anchored at "hub" points in the grid
      (e.g., where projects cluster). Keep to 1–2 static instances to protect
      frame budget — avoid full post-processing volumetric passes.
- [x] **Particle Warp/Transition Effect** — On section transitions, temporarily
      stretch particles along the camera's forward vector (a "hyperspace jump"),
      driven by animating a `uProgress` uniform in a custom `ShaderMaterial`
      rather than mutating buffer geometry per-frame. Trigger via a transient
      Zustand flag (`isTransitioning`) set at the start/end of the tween.
- [ ] **Idle "Ambient Drift" Mode** — If no interaction is detected for N seconds
      (tracked via `useIdleTimer`-style hook, not `useState` in `useFrame`),
      slowly drift the camera in a small orbit to keep the scene alive and hint
      that the space is explorable, canceling on next pointer/keyboard input.
- [x] **Section-Themed Grid Palettes** — Extend `NeuralGrid` to accept a
      `colorA`/`colorB` prop pair (memoized) driven by `activeSection`, so each
      section has a distinct signature palette (e.g., cyan/blue for intro,
      magenta/violet for projects, amber/green for blog) without re-allocating
      buffers — only lerp existing vertex colors over a few frames.

---

## 2. 🕹️ Gamified Exploration & Inter-Page Mechanics

Goal: turn "browsing" into "exploring" — reward visitors for moving between
sections and finding connections, increasing time-on-site and section coverage.

- [x] **Neural Node Links (Project ↔ Blog Graph)** — Model relationships as data
      (`{ projectId, logId }[]`) and render them as glowing connector lines in
      the 3D layer between the two sections' anchor points. Hovering a project
      card in the UI highlights its linked blog "log entry" node in 3D (and
      vice versa) via a shared `activeLinkId` store field — encourages jumping
      between Projects and Blog/Log.
- [ ] **Secret Terminal Command Palette** — Add a hidden `Ctrl+'` shortcut
      (chosen to avoid common browser/devtools shortcut collisions, e.g.
      `Ctrl+Shift+K` opens the Firefox Web Console) alongside a visible
      "terminal" HUD icon as a discoverable alternative entry point — a
      "terminal" overlay (`components/ui/CommandTerminal.tsx`) supporting
      Easter-egg commands like `whoami`, `sudo unlock`, `cd /projects`,
      `cat manifesto.txt`. Purely a DOM component reading/writing Zustand state
      (e.g., `setActiveSection`, unlocking hidden content) — no 3D coupling
      required, low risk to performance.
- [x] **Collectible Data Fragments** — Scatter 3–5 small glowing "fragment"
      meshes across different sections (rendered as part of the 3D scene, one
      per section). Visiting a section for the first time (or clicking the
      fragment) marks it "collected" in a persisted Zustand slice
      (`collectedFragments: string[]`, persisted via `zustand/middleware`
      `persist` to `localStorage`). A HUD indicator shows collection progress
      (e.g., "3/5 FRAGMENTS RECOVERED"), incentivizing full-site exploration.
- [ ] **Exploration Progress HUD** — A fixed, low-opacity corner HUD
      (`components/ui/StatusHUD.tsx`) showing: sections visited, fragments
      collected, and a "signal strength" meter that fills as more of the site
      is explored. Reads purely from the store; no 3D dependency.
- [ ] **Unlockable "Deep Log" Content** — Gate a bonus blog entry or an
      "About — Classified" panel behind full exploration (all fragments
      collected), rendered conditionally in `Overlay.tsx` based on store state.
      Reinforces the incentive loop without requiring backend/auth.
- [ ] **Accessible Discovery Trigger** — Alongside the terminal palette
      described above, ensure a visible, discoverable affordance (e.g., a
      small HUD button or documented on-screen hint) exists for
      keyboard-shortcut-gated features,
      so exploration mechanics remain accessible to users unaware of hidden
      shortcuts.
- [ ] **Cross-Section "Signal Ping"** — When hovering a project tagged with a
      technology, ping related blog posts (and vice versa) with a brief pulse
      animation on their nav button (`className` transition, no 3D needed) —
      a lightweight discovery nudge rather than a heavy mechanic.

---

## 3. ✨ Futuristic Micro-Interactions & Audio/Visual Feedback

Goal: make every interaction feel like operating a piece of advanced hardware,
reinforcing the cybernetic tone at low performance cost.

- [ ] **Custom Magnetic Cursor** — A `components/ui/CyberCursor.tsx` DOM overlay
      (`position: fixed`, GPU-accelerated `transform: translate3d`) that snaps
      toward interactive elements' bounding boxes on hover using
      `THREE.MathUtils.damp`-style easing in a `requestAnimationFrame` loop
      (never React state per-frame — mirror the "no `useState` in `useFrame`"
      rule for DOM-side animation too).
- [ ] **Sci-Fi Hover Distortion** — Add a CSS-only "scan sweep" affordance to
      `.glass-card` and nav buttons: a `::before` pseudo-element with a
      `linear-gradient` sheen animated via `transform` on `:hover`, plus a 1px
      `clip-path` "glitch slice" jitter using a short CSS `@keyframes` — pure
      CSS/Tailwind, zero JS cost.
- [ ] **Scanline & CRT Overlay Shader** — A fixed, full-screen `<div>` with a
      subtle repeating-linear-gradient scanline texture and a very low-opacity
      vignette, toggleable via a "CRT MODE" HUD switch. Keep as a CSS overlay,
      not a WebGL post-process, to avoid extra render passes.
- [ ] **Glitch-on-Transition Text** — Reuse `.text-glitch`; add a
      `data-glitch-trigger` variant that briefly randomizes character glyphs
      (via a small `useGlitchText` hook using `setInterval`, capped duration)
      when a heading enters on section change — a DOM-only effect, decoupled
      from the 3D canvas.
- [ ] **Cybernetic Audio Feedback (Opt-in)** — Add a muted-by-default
      `AudioManager` (Web Audio API, lazily initialized on first user gesture
      per browser autoplay policy) triggering short synth blips on: nav clicks,
      fragment collection, terminal command execution. Store `audioEnabled` in
      Zustand; expose a HUD mute/unmute toggle. Preload small `.mp3`/`.ogg`
      assets (<20KB each) to avoid jank.
- [ ] **Status Overlays ("SYSTEM ONLINE" ticker)** — A slim top/bottom ticker
      bar showing live-ish status text (e.g., "GRID SYNCED", "SIGNAL: STABLE"),
      driven by simple interval-based text rotation in the DOM layer — reinforces
      the "operating a system" feeling without any 3D or heavy JS.
- [ ] **Focus/Selection Ring "Lock-On" Effect** — When a project card or nav
      item receives focus/hover, animate a bracket-style "targeting" reticle
      (`::before`/`::after` corner brackets) sliding into place with a CSS
      transition — reinforces the HUD aesthetic on top of existing
      `.glass-card:hover` styles.

---

## 4. 🧩 Implementation Plan & Architecture Integration

### 4.1 State Management (Zustand)

Extend `useAppStore.ts` incrementally — keep it the single source of truth
bridging DOM and Canvas, per existing convention:

```text
interface AppState {
  // existing
  activeSection: "intro" | "projects" | "blog";
  setActiveSection: (section) => void;
  hoveredProject: string | null;
  setHoveredProject: (id) => void;

  // proposed additions
  hoveredNode: string | null;          // 3D-side hover state, set by raycasting
                                        // in the canvas layer; UI components
                                        // read it to highlight the matching
                                        // card. `hoveredProject` is the
                                        // UI-side counterpart (set by DOM
                                        // `onMouseEnter`/`onMouseLeave`), which
                                        // the 3D layer reads to highlight the
                                        // matching node. Each is written by
                                        // its own layer and read by the other.
  setHoveredNode: (id: string | null) => void;

  activeLinkId: string | null;         // neural node link highlighting
  isTransitioning: boolean;            // drives particle warp shader uniform
  setTransitioning: (v: boolean) => void;

  collectedFragments: string[];        // persisted via `zustand/middleware` using `persist`
  collectFragment: (id: string) => void;

  audioEnabled: boolean;
  toggleAudio: () => void;

  crtModeEnabled: boolean;
  toggleCrtMode: () => void;
}
```

- [ ] Add new fields incrementally, each behind its own PR/feature slice.
- [ ] Use `zustand/middleware` `persist` **only** for `collectedFragments` and
      `audioEnabled`/`crtModeEnabled` (user preferences) — keep transient
      animation state (`isTransitioning`, `hoveredNode`) out of persistence.
- [ ] Keep all `useFrame`-driven reads as **selector subscriptions**
      (`useAppStore((s) => s.activeSection)`) so 3D components only re-render
      on the specific slice they need — never destructure the whole store in a
      3D component.

### 4.2 3D Canvas Layer (`src/components/3d/`)

| New Component | Responsibility |
|---|---|
| `CameraRig.tsx` | Owns curve-based camera travel between section waypoints; reads `activeSection`/`isTransitioning`. |
| `NeuralLinks.tsx` | Renders glowing connector lines between project/blog anchor points; reads `activeLinkId`/`hoveredNode`. |
| `DataFragments.tsx` | Renders collectible fragment meshes; reads/writes `collectedFragments` on click (via raycasting, not DOM events). |
| `WarpParticles.tsx` (or extend `NeuralGrid.tsx`) | Custom `ShaderMaterial` with a `uProgress` uniform animated on `isTransitioning`. |

Rules to enforce (per `docs/ARCHITECTURE.md` §3):
- [ ] All geometries/materials declared module-level or in `useMemo`.
- [ ] All per-frame mutation via `useRef` + `useFrame`; **no** `useState` in
      any `useFrame` callback (e.g., fragment "collected" pulse animation
      should mutate a ref's scale/emissive intensity, not local state).
- [ ] Shader uniforms updated via `material.uniforms.x.value = ...` inside
      `useFrame`, not via React re-renders.
- [ ] Any DOM needed inside the canvas (e.g., fragment tooltips) must use
      `@react-three/drei`'s `<Html>`.

### 4.3 DOM UI Layer (`src/components/ui/`)

| New Component | Responsibility |
|---|---|
| `StatusHUD.tsx` | Fixed-position exploration progress, signal meter, section-visited indicators. |
| `CommandTerminal.tsx` | Hidden `Ctrl+'` command palette for secret commands. |
| `CyberCursor.tsx` | Magnetic custom cursor using rAF, not React state. |
| `CrtOverlay.tsx` | Scanline/vignette overlay toggled by `crtModeEnabled`. |
| `AudioManager.tsx` (or a `hooks/useAudioManager.ts`) | Lazily-initialized Web Audio context, exposes `playSfx(name)`. |

Rules to enforce:
- [ ] All new UI components remain pure DOM/HTML/Tailwind — no Three.js
      imports.
- [ ] Any DOM animation loop (cursor, ticker) uses `requestAnimationFrame` +
      refs/direct style mutation, mirroring the 3D layer's "no `useState` in
      the hot loop" discipline, to avoid layout thrash.
- [ ] Tailwind v4 `@theme` tokens in `src/index.css` should gain a small set
      of additions to support new features without inline magic values:
      `--color-sci-magenta`, `--color-sci-amber` (section palettes), and a
      `.scanline-overlay` / `.terminal-panel` / `.hud-corner-bracket` component
      class group in the existing `@layer components` block.

### 4.4 Performance Safeguards (60 FPS Target)

- [ ] Cap total active particle count across `NeuralGrid` + parallax layer +
      `DataFragments` to a documented budget (e.g., ≤ 6,000 points) and verify
      via browser dev tools' performance panel before merging any new 3D
      feature.
- [ ] Prefer CSS-only effects (scanlines, hover sheens, glitch text) over
      WebGL post-processing passes wherever the visual goal is achievable in
      the DOM layer — reserve GPU budget for the canvas.
- [ ] Any shader-based effect (warp, volumetric light) must be gated behind a
      single `uProgress`/`uIntensity` uniform update per frame, never per-particle
      JS loops.
- [ ] Persisted Zustand state (`persist` middleware) should be scoped to a
      dedicated slice/store to avoid unnecessary serialization on unrelated
      state changes.
- [ ] New features should be feature-flaggable (simple boolean in the store)
      so heavier additions (volumetric light, particle warp) can be disabled
      on low-end devices — consider a lightweight `navigator.hardwareConcurrency`
      or `matchMedia("(prefers-reduced-motion)")` check to auto-disable
      non-essential motion/audio effects.

### 4.5 Suggested Rollout Order

- [ ] **Phase 1 (low risk, high polish):** hover distortions, HUD corner
      brackets, status ticker, CRT overlay toggle — pure CSS, no 3D/store
      changes beyond a couple of boolean flags.
- [ ] **Phase 2 (state-driven UI):** `StatusHUD`, `CommandTerminal`,
      collectible fragments' UI progress indicator, `audioEnabled` toggle +
      basic SFX.
- [x] **Phase 3 (3D depth features):** `CameraRig` waypoint travel, fog/parallax
      depth layer, section-themed grid palettes.
- [x] **Phase 4 (advanced/gamified):** `NeuralLinks` graph, `DataFragments`
      3D meshes + collection logic, particle warp transition shader,
      volumetric light shafts.

---

## Summary

This roadmap sequences "Neural Grid" enhancements from cheap, purely visual
CSS polish through to deeper 3D/gamification systems, always routed through
the existing `useAppStore` bridge and respecting the strict 3D/DOM separation
and performance rules already codified in `docs/ARCHITECTURE.md`. Each phase is
independently shippable and testable against the 60 FPS target before moving
to the next.
