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

## 📦 5. Package Management (pnpm)
This project strictly uses pnpm.

Never use `npm install` or `yarn add`.

To add a dependency: `pnpm add <package>`

To run the dev server: `pnpm dev`

Peer Dependencies: If you experience missing dependencies regarding `three` or `@react-three/fiber`, ensure you explicitly add the required package, as pnpm enforces strict module isolation.
