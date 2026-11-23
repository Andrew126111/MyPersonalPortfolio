"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

export type DotFieldVariant = "spotlight" | "repel";

const GAP = 28; // px between dots
const MASK =
  "radial-gradient(ellipse 70% 60% at 50% 45%, black 30%, transparent 100%)";

/**
 * The hero's dot-grid background, reacting to the cursor.
 *
 * - "spotlight": a second, lime dot layer is revealed in a soft circle around the cursor.
 *   Pure CSS (one mask follows the pointer), so it's practically free.
 * - "repel": dots are drawn on a canvas and ease away from the cursor, tinting lime
 *   as they get pushed. More playful, slightly more CPU.
 *
 * Mouse only; touch devices and reduced-motion users get the static grid.
 */
export function DotField({ variant }: { variant: DotFieldVariant }) {
  return variant === "spotlight" ? <SpotlightField /> : <RepelField />;
}

/* ───────────────────────── spotlight ───────────────────────── */

function SpotlightField() {
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
      {/* base grid, fading out toward the edges */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage: dots("var(--subtle)", 1.2),
          backgroundSize: `${GAP}px ${GAP}px`,
          maskImage: MASK,
          WebkitMaskImage: MASK,
        }}
      />
      {/* lime grid, only visible inside the spotlight (works anywhere in the hero) */}
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

/* ───────────────────────── repel ───────────────────────── */

const RADIUS = 140; // how far the cursor's influence reaches
const PUSH = 22; // max px a dot is pushed
const EASE = 0.12; // how quickly dots follow (0..1)

type Dot = { x: number; y: number; ox: number; oy: number };

function RepelField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const css = getComputedStyle(document.documentElement);
    const base = css.getPropertyValue("--subtle").trim() || "#5c5c61";
    const lime = css.getPropertyValue("--lime").trim() || "#c8f560";

    let dots: Dot[] = [];
    let w = 0;
    let h = 0;
    const mouse = { x: -9999, y: -9999 };
    let raf = 0;
    let visible = true;

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      for (let y = GAP / 2; y < h; y += GAP) {
        for (let x = GAP / 2; x < w; x += GAP) {
          dots.push({ x, y, ox: x, oy: y });
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        const dx = d.ox - mouse.x;
        const dy = d.oy - mouse.y;
        const dist = Math.hypot(dx, dy);
        const t = dist < RADIUS ? 1 - dist / RADIUS : 0; // 0 far … 1 at cursor
        const k = t * t; // ease-in falloff
        const tx = d.ox + (dist ? (dx / dist) * PUSH * k : 0);
        const ty = d.oy + (dist ? (dy / dist) * PUSH * k : 0);
        d.x += (tx - d.x) * EASE;
        d.y += (ty - d.y) * EASE;

        ctx.globalAlpha = 0.6 + 0.4 * t;
        ctx.fillStyle = t > 0.05 ? lime : base;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 1.2 + t * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const loop = () => {
      draw();
      raf = visible ? requestAnimationFrame(loop) : 0;
    };

    build();
    draw();
    if (reduce) {
      const ro = new ResizeObserver(() => {
        build();
        draw();
      });
      ro.observe(canvas);
      return () => ro.disconnect();
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => {
      mouse.x = mouse.y = -9999;
    };
    const ro = new ResizeObserver(build);
    // Pause the animation loop whenever the hero is off-screen.
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(loop);
    });

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    ro.observe(canvas);
    io.observe(canvas);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      ro.disconnect();
      io.disconnect();
    };
  }, [reduce]);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      style={{ maskImage: MASK, WebkitMaskImage: MASK }}
    />
  );
}
