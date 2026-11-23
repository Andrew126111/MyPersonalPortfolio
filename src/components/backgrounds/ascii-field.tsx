"use client";

import { useRef } from "react";
import { useReducedMotion } from "motion/react";
import { EDGE_MASK, fitCanvas, stepHover, useFrameLoop, usePointer } from "./shared";

const RAMP = " .:-=+*#%@"; // light → dense
const CELL_W = 11;
const CELL_H = 18;
const RADIUS = 180; // cursor influence, CSS px

// Cheap smooth 2D value noise, good enough for drifting texture.
function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/**
 * A field of monospace characters drifting like slow terminal static.
 * Near the cursor, characters get denser and turn lime.
 */
export function AsciiField() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  const pointer = usePointer(ref);

  useFrameLoop(
    ref,
    (t) => {
      const canvas = ref.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      fitCanvas(canvas, 2);
      const dpr = canvas.width / canvas.clientWidth;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const p = pointer.current;
      stepHover(p);

      const css = getComputedStyle(document.documentElement);
      const family = css.getPropertyValue("--font-jetbrains-mono").trim() || "monospace";
      const subtle = css.getPropertyValue("--subtle").trim();
      const lime = css.getPropertyValue("--lime").trim();

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.font = `12px ${family}`;
      ctx.textBaseline = "top";

      const cols = Math.ceil(w / CELL_W);
      const rows = Math.ceil(h / CELL_H);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * CELL_W;
          const y = r * CELL_H;
          // Sample noise in pixel space so the texture isn't stretched by the cell aspect ratio.
          let v = noise(x * 0.009 + t * 0.12, y * 0.009 - t * 0.08) * 0.8 - 0.3;

          const dx = x - p.x;
          const dy = y - p.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          const near = d < RADIUS ? (1 - d / RADIUS) ** 1.5 * p.hover : 0;
          v += near * 1.4;

          const idx = Math.floor(Math.max(0, Math.min(0.999, v)) * RAMP.length);
          if (idx === 0) continue;
          ctx.globalAlpha = near > 0.06 ? 0.6 + near * 0.4 : 0.6;
          ctx.fillStyle = near > 0.06 ? lime : subtle;
          ctx.fillText(RAMP[idx], x, y);
        }
      }
      ctx.globalAlpha = 1;
    },
    reduce,
    30, // text drawing is heavier; 30fps is plenty for this look
  );

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="h-full w-full"
      style={{ maskImage: EDGE_MASK, WebkitMaskImage: EDGE_MASK }}
    />
  );
}
