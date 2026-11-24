"use client";

import { useEffect, useRef } from "react";

/** Soft vignette so every background fades out toward the hero's edges. */
export const EDGE_MASK =
  "radial-gradient(ellipse 75% 65% at 50% 45%, black 35%, transparent 100%)";

export type Pointer = {
  /** cursor position in the element's CSS pixels (-9999 when away) */
  x: number;
  y: number;
  /** eased 0..1: how "present" the cursor is; fades in/out smoothly */
  hover: number;
  /** target for hover, set by events */
  active: boolean;
};

/**
 * Tracks the mouse relative to `el` without causing React re-renders.
 * Touch input is ignored, so phones get the ambient animation only.
 */
export function usePointer(el: React.RefObject<HTMLElement | null>) {
  const p = useRef<Pointer>({ x: -9999, y: -9999, hover: 0, active: false });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !el.current) return;
      const r = el.current.getBoundingClientRect();
      p.current.x = e.clientX - r.left;
      p.current.y = e.clientY - r.top;
      p.current.active =
        p.current.x >= 0 && p.current.y >= 0 && p.current.x <= r.width && p.current.y <= r.height;
    };
    const onLeave = () => {
      p.current.active = false;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [el]);

  return p;
}

/** Ease pointer.hover toward its target; call once per frame. */
export function stepHover(p: Pointer, rate = 0.08) {
  p.hover += ((p.active ? 1 : 0) - p.hover) * rate;
}

/**
 * Runs `frame(time)` every animation frame while `el` is on screen and the tab is visible.
 * With `reduce`, it draws exactly one frame (a still image) and stops.
 */
export function useFrameLoop(
  el: React.RefObject<HTMLElement | null>,
  frame: (t: number) => void,
  reduce: boolean | null,
  fps = 60,
) {
  const frameRef = useRef(frame);
  useEffect(() => {
    frameRef.current = frame;
  });

  useEffect(() => {
    const node = el.current;
    if (!node) return;
    if (reduce) {
      frameRef.current(0);
      return;
    }
    let raf = 0;
    let visible = true;
    let last = 0;
    const interval = 1000 / fps;
    const loop = (t: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      if (t - last >= interval - 1) {
        last = t;
        frameRef.current(t / 1000);
      }
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    const onVis = () => !document.hidden && start();
    io.observe(node);
    document.addEventListener("visibilitychange", onVis);
    start();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [el, reduce, fps]);
}

/** Size a canvas to its CSS box at a capped device-pixel-ratio. Returns true if it changed. */
export function fitCanvas(canvas: HTMLCanvasElement, maxDpr = 2) {
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  const w = Math.round(canvas.clientWidth * dpr);
  const h = Math.round(canvas.clientHeight * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
    return true;
  }
  return false;
}
