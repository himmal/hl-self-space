import { useEffect } from "react";

// Module-scope, mutated-in-place pointer state shared by every consumer.
// Written by a single window-level "pointermove" listener (reference-counted
// below) and read directly inside `useFrame` loops, so tracking the mouse
// never triggers a React re-render.
const pointer = { x: 0, y: 0 };
let listenerCount = 0;

const handlePointerMove = (event: PointerEvent) => {
  // Normalize to (-1, 1), matching R3F's `state.pointer` convention (y flips
  // so +1 is the top of the viewport).
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -((event.clientY / window.innerHeight) * 2 - 1);
};

/**
 * Global, normalized (-1..1) pointer position tracked via a window-level
 * "pointermove" listener rather than `state.pointer`/canvas pointer events.
 * Required because the scrollable DOM overlay sits above the fixed 3D
 * canvas and (correctly) has `pointer-events-none` set on its text
 * containers, so canvas-level pointer events would otherwise never fire
 * over most of the page (see docs/ARCHITECTURE.md §5).
 *
 * Returns the same shared object on every call — safe to read inside
 * `useFrame` but not meant to drive React state/re-renders.
 */
export const useGlobalPointer = () => {
  useEffect(() => {
    listenerCount++;
    if (listenerCount === 1) {
      window.addEventListener("pointermove", handlePointerMove);
    }

    return () => {
      listenerCount--;
      if (listenerCount === 0) {
        window.removeEventListener("pointermove", handlePointerMove);
      }
    };
  }, []);

  return pointer;
};
