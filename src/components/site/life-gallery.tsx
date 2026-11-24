"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { LIFE, type LifePhoto } from "@/content/life";
import { cn } from "@/lib/utils";

/*
 * "Life outside the terminal" photo gallery, adapted from 21st.dev's scroll-morph-hero.
 *
 * Sequence:
 *   1. When the section scrolls into view, photos fly in from a scatter, line up, then form a circle.
 *   2. Scrolling morphs the circle into a big arc across the screen.
 *   3. Further scrolling slides photos along the arc; the photo at the top is "active" and its
 *      caption shows below it. Clicking any photo scrolls straight to it.
 *
 * Unlike the original, this never hijacks the mouse wheel: a tall wrapper with a sticky
 * stage turns normal page scroll into progress, so visitors can always scroll past.
 * Reduced-motion users get a plain photo grid with captions instead.
 */

const N = LIFE.length;

// Scroll budget: which part of the section's scroll range drives each step.
const MORPH = [0.04, 0.24] as const; // circle → arc
const TRAVEL = [0.3, 0.94] as const; // slide through photos
const VH_PER_PHOTO = 22; // scroll distance per photo, in svh

type Phase = "scatter" | "line" | "circle";
type Target = { x: number; y: number; rotate: number; scale: number; opacity: number };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
// Deterministic pseudo-random so server and client agree (no hydration mismatch).
// Rounded because Math.sin can differ in the last digits between Node and browsers.
const rand = (i: number, k: number) => {
  const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return Math.round((s - Math.floor(s)) * 1000) / 1000;
};

export function LifeGallery() {
  const reduce = useReducedMotion();
  return reduce ? <LifeGrid /> : <LifeArc />;
}

/* ───────────────────────── animated arc ───────────────────────── */

function LifeArc() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Intro: scatter → line → circle, once, when the stage is mostly on screen.
  const inView = useInView(stageRef, { once: true, amount: 0.5 });
  const [phase, setPhase] = useState<Phase>("scatter");
  useEffect(() => {
    if (!inView) return;
    const t1 = setTimeout(() => setPhase("line"), 120);
    const t2 = setTimeout(() => setPhase("circle"), 1100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [inView]);

  // Page scroll through the tall wrapper → morph and travel progress (springy for smoothness).
  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ["start start", "end end"] });
  const morphS = useSpring(useTransform(scrollYProgress, [...MORPH], [0, 1]), {
    stiffness: 70,
    damping: 22,
  });
  const travelS = useSpring(useTransform(scrollYProgress, [...TRAVEL], [0, 1]), {
    stiffness: 70,
    damping: 24,
  });
  const [morph, setMorph] = useState(0);
  const [travel, setTravel] = useState(0);
  useMotionValueEvent(morphS, "change", setMorph);
  useMotionValueEvent(travelS, "change", setTravel);

  // ── geometry ──
  const mobile = size.w < 768;
  const W = mobile ? 150 : 220; // card width (3:4 portrait)
  const H = Math.round((W * 4) / 3);
  const R = Math.max(size.w * (mobile ? 1.7 : 1.1), 820); // arc radius
  // Arc top, relative to stage centre. Nudged up just enough that photo + caption sit centred.
  const apexY = -Math.min(size.h * 0.07, 70);
  const step = (W * 1.12) / R; // radians between neighbouring photos on the arc
  const visibleHalf = size.w / 2 / (W * 1.12) + 0.5; // photos visible either side of centre
  const circleR = mobile ? size.w * 0.38 : Math.min(Math.min(size.w, size.h) * 0.31, 320);
  const circleScale = mobile ? 0.34 : 0.42;
  // Fractional index of the photo at the apex. The sine term makes each photo "dwell" at
  // the top: progress slows near whole numbers and speeds up between them.
  const raw = travel * (N - 1);
  const frac = raw - Math.floor(raw);
  const pos = Math.floor(raw) + frac - (Math.sin(2 * Math.PI * frac) / (2 * Math.PI)) * 0.85;
  const active = phase === "circle" && morph > 0.7 ? Math.round(pos) : -1;

  function targetFor(i: number): Target {
    if (phase === "scatter") {
      return {
        x: (rand(i, 1) - 0.5) * size.w * 1.2,
        y: (rand(i, 2) - 0.5) * size.h * 1.2,
        rotate: (rand(i, 3) - 0.5) * 120,
        scale: 0.4,
        opacity: 0,
      };
    }
    if (phase === "line") {
      const spacing = Math.min(W * 0.62, (size.w * 0.9) / N);
      return {
        x: (i - (N - 1) / 2) * spacing,
        y: 0,
        rotate: 0,
        scale: Math.min(0.55, (spacing / W) * 0.92),
        opacity: 1,
      };
    }
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    const circle = {
      x: Math.cos(a) * circleR,
      y: Math.sin(a) * circleR,
      rotate: (a * 180) / Math.PI + 90,
      scale: circleScale,
    };
    const offset = i - pos;
    const b = -Math.PI / 2 + offset * step;
    const dist = Math.abs(offset);
    const arc = {
      x: Math.cos(b) * R,
      y: Math.sin(b) * R + apexY + R,
      rotate: offset * step * (180 / Math.PI),
      scale: 1 - Math.min(dist, 3) * 0.07,
    };
    return {
      x: lerp(circle.x, arc.x, morph),
      y: lerp(circle.y, arc.y, morph),
      rotate: lerp(circle.rotate, arc.rotate, morph),
      scale: lerp(circle.scale, arc.scale, morph),
      // photos far along the arc fade out instead of piling up off-screen
      opacity: lerp(1, clamp01(1 - (dist - visibleHalf)), morph),
    };
  }

  // Click a photo → scroll the page to where that photo sits at the top of the arc.
  function goTo(i: number) {
    const el = wrapRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const scrollable = el.offsetHeight - window.innerHeight;
    const p = TRAVEL[0] + (TRAVEL[1] - TRAVEL[0]) * (N > 1 ? i / (N - 1) : 0);
    window.scrollTo({ top: top + p * scrollable, behavior: "smooth" });
  }

  const introOpacity = phase === "circle" ? clamp01(1 - morph * 2.5) : 0;
  const captionTop = apexY + H / 2 + 28;

  return (
    <div
      ref={wrapRef}
      className="relative"
      style={{ height: `calc(100svh + ${Math.round(((N - 1) * VH_PER_PHOTO) / (TRAVEL[1] - TRAVEL[0]))}svh)` }}
    >
      <div ref={stageRef} className="sticky top-0 h-svh overflow-hidden">
        {/* centre text while photos form a circle */}
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center transition-opacity duration-500"
          style={{ opacity: introOpacity }}
          aria-hidden={introOpacity === 0}
        >
          <p className="max-w-[9ch] font-heading text-xl leading-tight font-bold sm:max-w-none sm:text-3xl">
            Life outside the terminal
          </p>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Scroll to explore
          </p>
        </div>

        {/* photos */}
        <div className="absolute inset-0">
          {LIFE.map((photo, i) => {
            const t = targetFor(i);
            const isActive = i === active;
            const hidden = t.opacity < 0.05;
            return (
              <motion.button
                key={photo.src}
                type="button"
                onClick={() => goTo(i)}
                tabIndex={hidden ? -1 : 0}
                aria-hidden={hidden}
                aria-label={`${photo.title}: ${photo.caption}`}
                initial={false}
                animate={t}
                transition={{ type: "spring", stiffness: 80, damping: 18, mass: 0.7 }}
                className={cn(
                  "absolute top-1/2 left-1/2 overflow-hidden rounded-xl border bg-surface",
                  "shadow-[0_24px_48px_-24px_rgb(0_0_0/0.9)] transition-[border-color,box-shadow] duration-300",
                  isActive
                    ? "border-lime shadow-[0_0_0_1px_var(--lime),0_24px_60px_-20px_rgb(200_245_96/0.35)]"
                    : "border-border hover:border-muted-foreground",
                )}
                style={{
                  width: W,
                  height: H,
                  marginLeft: -W / 2,
                  marginTop: -H / 2,
                  zIndex: 100 - Math.round(Math.abs(i - pos) * 2),
                }}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 768px) 150px, 220px"
                  className={cn(
                    "object-cover transition-[filter] duration-500",
                    isActive ? "grayscale-0" : "grayscale-[35%]",
                  )}
                />
              </motion.button>
            );
          })}
        </div>

        {/* caption for the active photo, right below it */}
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 flex justify-center px-4 text-center"
          style={{ transform: `translateY(${captionTop}px)` }}
          aria-live="polite"
        >
          <AnimatePresence mode="wait">
            {active >= 0 && (
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="max-w-[44ch]"
              >
                <p className="font-mono text-[11px] tracking-[0.12em] text-lime">
                  {String(active + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}
                </p>
                <p className="mt-2 font-heading text-xl font-bold sm:text-2xl">
                  {LIFE[active].title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                  {LIFE[active].caption}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── reduced-motion fallback ───────────────────────── */

function LifeGrid() {
  return (
    <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-4 px-4 sm:grid-cols-3 sm:px-6 lg:grid-cols-4">
      {LIFE.map((photo: LifePhoto) => (
        <figure key={photo.src}>
          <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-border">
            <Image src={photo.src} alt={photo.alt} fill sizes="300px" className="object-cover" />
          </div>
          <figcaption className="mt-3">
            <p className="font-heading font-bold">{photo.title}</p>
            <p className="text-sm text-muted-foreground">{photo.caption}</p>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
