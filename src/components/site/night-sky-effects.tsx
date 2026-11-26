"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";

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
