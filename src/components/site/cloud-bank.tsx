"use client";

import { motion, useReducedMotion, useTransform, type MotionValue } from "motion/react";

/*
 * Cloud bank on the border between the hero and About (inspired by the Stepout parallax
 * hero on Dribbble).
 *
 * It sits across the hero's bottom edge and overhangs into About. At rest only a few cloud
 * tops peek along the bottom of the screen. As you scroll, two layers rise at different
 * speeds (front faster than back), so the clouds swell up over the video and text, and the
 * About section's cloud sky appears out of them.
 *
 * Clouds are soft blobs roughed up by an SVG turbulence filter, tinted to the twilight
 * palette. `progress` is the hero's scroll progress (0 at the top, 1 once it has left).
 */

// x/w in vw, y/h in % of the bank. `dusk` puffs use darker violet so the bank's underside
// blends into the About sky instead of fading to grey.
type Puff = { x: number; y: number; w: number; h: number; dusk?: boolean };

const DUSK_BODY = "rgb(120 98 160 / 0.92)";
const DUSK_LIGHT = "rgb(176 146 200 / 0.7)";

const BACK: Puff[] = [
  { x: -10, y: 12, w: 36, h: 30 },
  { x: 16, y: 20, w: 30, h: 26 },
  { x: 38, y: 10, w: 34, h: 30 },
  { x: 62, y: 18, w: 30, h: 28 },
  { x: 84, y: 9, w: 32, h: 30 },
];
const FRONT: Puff[] = [
  { x: -14, y: 26, w: 42, h: 34 },
  { x: 12, y: 34, w: 38, h: 32 },
  { x: 36, y: 28, w: 40, h: 36 },
  { x: 60, y: 36, w: 38, h: 32 },
  { x: 82, y: 26, w: 40, h: 36 },
  // lower row: gives the bank a cloudy underside instead of a flat fade
  { x: -6, y: 52, w: 36, h: 30, dusk: true },
  { x: 26, y: 58, w: 34, h: 28, dusk: true },
  { x: 52, y: 54, w: 36, h: 30, dusk: true },
  { x: 78, y: 60, w: 34, h: 28, dusk: true },
];

function Filters() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      {[
        { id: "bank-back", freq: 0.012, scale: 150, seed: 21 },
        { id: "bank-front", freq: 0.011, scale: 190, seed: 34 },
      ].map((f) => (
        <filter key={f.id} id={f.id} x="-40%" y="-40%" width="180%" height="180%">
          <feTurbulence type="fractalNoise" baseFrequency={f.freq} numOctaves={4} seed={f.seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={f.scale} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      ))}
    </svg>
  );
}

function Layer({
  puffs,
  filter,
  body,
  light,
  y,
}: {
  puffs: Puff[];
  filter: string;
  body: string;
  light: string;
  y: MotionValue<string>;
}) {
  return (
    <motion.div style={{ y }} className="absolute inset-0">
      {/* soft body between the puff rows so the bank reads as one mass: bright at the top,
          shading to dusky violet below, then fading out behind the lower puffs */}
      <div
        className="absolute inset-x-[-10vw]"
        style={{
          top: "40%",
          height: "42%",
          background: `linear-gradient(to bottom, transparent 0%, ${body} 22%, ${DUSK_BODY} 62%, transparent 100%)`,
          filter: `url(#${filter})`,
        }}
      />
      {puffs.map((p, i) => {
        const b = p.dusk ? DUSK_BODY : body;
        const l = p.dusk ? DUSK_LIGHT : light;
        return (
          <div
            key={i}
            className="absolute rounded-[50%]"
            style={{
              left: `${p.x}vw`,
              top: `${p.y}%`,
              width: `max(${p.w}vw, ${p.w * 0.9}vh)`,
              height: `${p.h}%`,
              // lit top, soft body
              background: `radial-gradient(ellipse 55% 45% at 45% 30%, ${l}, transparent 70%), radial-gradient(ellipse 50% 50% at 50% 50%, ${b} 0%, ${b} 50%, transparent 72%)`,
              filter: `url(#${filter})`,
            }}
          />
        );
      })}
    </motion.div>
  );
}

export function CloudBank({ progress }: { progress: MotionValue<number> }) {
  const reduce = useReducedMotion();
  // Extra lift on top of normal scrolling: front clouds climb faster than back ones.
  const backY = useTransform(progress, [0, 1], ["0vh", reduce ? "0vh" : "-22vh"]);
  const frontY = useTransform(progress, [0, 1], ["0vh", reduce ? "0vh" : "-48vh"]);

  return (
    <div
      aria-hidden="true"
      // Bank straddles the hero's bottom edge: starts 14vh above it, 75vh tall.
      // overflow-x-clip stops wide puffs from causing sideways scrolling.
      className="pointer-events-none absolute inset-x-0 top-[calc(100%-14vh)] h-[75vh] overflow-x-clip"
    >
      <Filters />
      <Layer puffs={BACK} filter="bank-back" body="rgb(196 172 214 / 0.92)" light="rgb(255 228 232 / 0.95)" y={backY} />
      <Layer puffs={FRONT} filter="bank-front" body="rgb(226 200 222 / 0.97)" light="rgb(255 240 236 / 1)" y={frontY} />
    </div>
  );
}
