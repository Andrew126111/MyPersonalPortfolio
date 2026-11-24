"use client";

import { createContext, useContext, useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { cn } from "@/lib/utils";

/*
 * A card that tilts in 3D toward the cursor, with a soft glare that follows it.
 * Children wrapped in <Depth> shift by different amounts, giving a parallax effect
 * inside the card (things "closer" to you move more).
 *
 * Mouse only; touch and reduced-motion users get a flat card.
 */

type Tilt = { px: MotionValue<number>; py: MotionValue<number> };
const TiltContext = createContext<Tilt | null>(null);

const MAX_TILT = 8; // degrees

export function TiltCard({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // Pointer position within the card, -0.5..0.5, smoothed.
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const px = useSpring(rawX, { stiffness: 150, damping: 18, mass: 0.5 });
  const py = useSpring(rawY, { stiffness: 150, damping: 18, mass: 0.5 });

  const rotateY = useTransform(px, (v) => v * MAX_TILT * 2);
  const rotateX = useTransform(py, (v) => -v * MAX_TILT * 2);
  const glareX = useTransform(px, (v) => `${(v + 0.5) * 100}%`);
  const glareY = useTransform(py, (v) => `${(v + 0.5) * 100}%`);
  const glare = useMotionTemplate`radial-gradient(500px circle at ${glareX} ${glareY}, rgb(255 255 255 / 0.06), transparent 50%)`;

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduce || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    rawX.set((e.clientX - r.left) / r.width - 0.5);
    rawY.set((e.clientY - r.top) / r.height - 0.5);
  }
  function onPointerLeave() {
    rawX.set(0);
    rawY.set(0);
  }

  return (
    <TiltContext.Provider value={{ px, py }}>
      <div style={{ perspective: 1200 }} className={className}>
        <motion.div
          ref={ref}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          style={reduce ? undefined : { rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="group relative h-full w-full overflow-hidden rounded-2xl border border-border bg-card transition-colors duration-300 hover:border-muted-foreground/40"
        >
          {children}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: glare }}
          />
        </motion.div>
      </div>
    </TiltContext.Provider>
  );
}

/** Shifts its children with the cursor; larger `depth` = feels closer, moves more (px). */
export function Depth({
  depth,
  className,
  style,
  children,
}: {
  depth: number;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const ctx = useContext(TiltContext);
  const fallback = useMotionValue(0);
  const x = useTransform(ctx?.px ?? fallback, (v) => v * depth);
  const y = useTransform(ctx?.py ?? fallback, (v) => v * depth);
  return (
    <motion.div className={cn(className)} style={{ ...style, x, y }}>
      {children}
    </motion.div>
  );
}
