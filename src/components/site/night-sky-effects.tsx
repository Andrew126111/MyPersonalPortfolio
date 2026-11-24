"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion, useTransform, type MotionValue } from "motion/react";

/* ───────────────────────── constellation ───────────────────────── */

// Stars that spell "AN" (viewBox 0 0 260 150). Lines connect them in drawing order.
const STARS = [
  // A
  { x: 20, y: 132 },
  { x: 62, y: 18 },
  { x: 104, y: 132 },
  { x: 40, y: 82 },
  { x: 84, y: 82 },
  // N
  { x: 150, y: 132 },
  { x: 150, y: 18 },
  { x: 236, y: 132 },
  { x: 236, y: 18 },
];
const LINES: [number, number][] = [
  [0, 1],
  [1, 2],
  [3, 4],
  [5, 6],
  [6, 7],
  [7, 8],
];
// a few loose background stars around the constellation
const EXTRAS = [
  { x: 120, y: 40, r: 1.2 },
  { x: 196, y: 70, r: 1 },
  { x: 8, y: 30, r: 1.1 },
  { x: 250, y: 92, r: 1.3 },
  { x: 128, y: 120, r: 0.9 },
];

/**
 * Your initials as a constellation. `progress` (0 → 1) draws the lines one after another
 * and lights each star as its line reaches it.
 */
export function Constellation({ progress, className }: { progress: MotionValue<number>; className?: string }) {
  return (
    <svg viewBox="0 0 260 150" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="star-glow">
          <stop offset="0%" stopColor="var(--glow)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--glow)" stopOpacity="0" />
        </radialGradient>
      </defs>
      {EXTRAS.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={0.5} />
      ))}
      {LINES.map(([a, b], i) => (
        <Line key={i} a={STARS[a]} b={STARS[b]} progress={progress} start={i / LINES.length} end={(i + 1) / LINES.length} />
      ))}
      {STARS.map((s, i) => {
        // a star lights up when the first line touching it starts drawing
        const first = LINES.findIndex(([a, b]) => a === i || b === i);
        return <Star key={i} x={s.x} y={s.y} progress={progress} at={first / LINES.length} />;
      })}
    </svg>
  );
}

function Line({
  a,
  b,
  progress,
  start,
  end,
}: {
  a: { x: number; y: number };
  b: { x: number; y: number };
  progress: MotionValue<number>;
  start: number;
  end: number;
}) {
  const len = useTransform(progress, [start, end], [0, 1]);
  return (
    <motion.line
      x1={a.x}
      y1={a.y}
      x2={b.x}
      y2={b.y}
      stroke="var(--glow)"
      strokeOpacity={0.55}
      strokeWidth={1}
      strokeLinecap="round"
      style={{ pathLength: len }}
    />
  );
}

function Star({ x, y, progress, at }: { x: number; y: number; progress: MotionValue<number>; at: number }) {
  const o = useTransform(progress, [at, at + 0.06], [0.25, 1]);
  const r = useTransform(progress, [at, at + 0.06], [1.4, 2.8]);
  return (
    <g>
      <motion.circle cx={x} cy={y} r={r} fill="white" style={{ opacity: o }} />
      <motion.circle cx={x} cy={y} r={9} fill="url(#star-glow)" style={{ opacity: o }} />
    </g>
  );
}

/* ───────────────────────── shooting stars ───────────────────────── */

type Shot = { id: number; top: number; left: number; length: number; angle: number };

/**
 * Every few seconds (while the container is on screen) a shooting star streaks across.
 * Off for reduced motion.
 */
export function ShootingStars({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-20%" });
  const reduce = useReducedMotion();
  const [shots, setShots] = useState<Shot[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    if (!inView || reduce) return;
    const spawn = () => {
      const shot: Shot = {
        id: idRef.current++,
        top: Math.random() * 45,
        left: 10 + Math.random() * 60,
        length: 90 + Math.random() * 90,
        angle: 18 + Math.random() * 22,
      };
      setShots((s) => [...s.slice(-3), shot]);
    };
    const first = window.setTimeout(spawn, 900);
    const id = window.setInterval(spawn, 3800);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [inView, reduce]);

  return (
    <div ref={ref} aria-hidden="true" className={className}>
      <AnimatePresence>
        {shots.map((s) => (
          <motion.span
            key={s.id}
            className="absolute h-px rounded-full bg-gradient-to-l from-white via-white/60 to-transparent"
            style={{ top: `${s.top}%`, left: `${s.left}%`, width: s.length, rotate: s.angle, transformOrigin: "right center" }}
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], x: 260, y: 260 * Math.tan((s.angle * Math.PI) / 180) }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            onAnimationComplete={() => setShots((all) => all.filter((x) => x.id !== s.id))}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
