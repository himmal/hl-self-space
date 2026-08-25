import { useEffect, useRef } from "react";

const DAMP_LAMBDA = 12;
const CURSOR_SIZE = 16;

/**
 * Custom magnetic cursor overlay. Uses refs + requestAnimationFrame for all
 * per-frame mutation (mirrors the "no React state in the hot loop" rule) and
 * snaps toward interactive elements' bounding boxes on hover.
 */
export const CyberCursor = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const el = (e.target as HTMLElement)?.closest?.("a, button, .glass-card, input");
      if (el) {
        const rect = el.getBoundingClientRect();
        targetRef.current = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      } else {
        targetRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    window.addEventListener("pointermove", handlePointerMove);

    let rafId: number;
    const tick = (time: number) => {
      const dt =
        lastTimeRef.current === null ? 1 / 60 : Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;

      // Frame-rate independent damped easing (same approach as THREE.MathUtils.damp).
      const alpha = 1 - Math.exp(-DAMP_LAMBDA * dt);
      posRef.current.x += (targetRef.current.x - posRef.current.x) * alpha;
      posRef.current.y += (targetRef.current.y - posRef.current.y) * alpha;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${
          posRef.current.x - CURSOR_SIZE / 2
        }px, ${posRef.current.y - CURSOR_SIZE / 2}px, 0)`;
      }

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={dotRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-50 hidden h-4 w-4 rounded-full border border-[var(--color-accent)] mix-blend-difference md:block"
      style={{ willChange: "transform" }}
    />
  );
};
