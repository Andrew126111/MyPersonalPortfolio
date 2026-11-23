"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { EDGE_MASK } from "./shared";

const GAP = 28; // px between dots

/**
 * Dot grid with a lime "spotlight" that follows the cursor.
 * Pure CSS: one radial mask tracks the pointer, so it costs almost nothing.
 */
export function DotSpotlight() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
      el.style.setProperty("--spot", "1");
    };
    const onLeave = () => el.style.setProperty("--spot", "0");
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [reduce]);

  const dots = (color: string, size: number) =>
    `radial-gradient(${color} ${size}px, transparent ${size}px)`;
  const spot =
    "radial-gradient(circle 220px at var(--mx, -999px) var(--my, -999px), black 0%, rgb(0 0 0 / 0.5) 40%, transparent 100%)";

  return (
    <div ref={ref} className="relative h-full w-full">
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage: dots("var(--subtle)", 1.2),
          backgroundSize: `${GAP}px ${GAP}px`,
          maskImage: EDGE_MASK,
          WebkitMaskImage: EDGE_MASK,
        }}
      />
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          backgroundImage: dots("var(--lime)", 1.5),
          backgroundSize: `${GAP}px ${GAP}px`,
          opacity: "var(--spot, 0)",
          maskImage: spot,
          WebkitMaskImage: spot,
        }}
      />
    </div>
  );
}
