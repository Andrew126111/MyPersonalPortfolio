"use client";

import { motion, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import { Cloud } from "@/components/clouds/cloud";

/*
 * Cloud bank on the border between the hero and About (inspired by the Stepout parallax
 * hero on Dribbble).
 *
 * It straddles the hero's bottom edge and overhangs into About:
 *   - at rest, big clouds sit in the bottom corners and a low bank peeks along the bottom
 *   - as you scroll, a back and a front layer rise at different speeds and swallow the hero
 *   - underneath the clouds is a "sky floor" painted with the exact same viewport-fixed sky
 *     gradient as the About background, so the hand-off has no visible seam
 *
 * `progress` is the hero's scroll progress (0 at the top, 1 once it has left).
 */

type C = { s: number; w: number; x: number; y: number; flip?: boolean; o?: number };
// x/w in vw, y = top edge in % of the bank's height

const BACK: C[] = [
  { s: 1, w: 46, x: -14, y: 6 },
  { s: 3, w: 50, x: 26, y: 2, flip: true },
  { s: 5, w: 46, x: 66, y: 8 },
  { s: 0, w: 40, x: 8, y: 22, flip: true, o: 0.9 },
  { s: 2, w: 40, x: 50, y: 24, o: 0.9 },
];
const FRONT: C[] = [
  // big corner clouds, visible at rest
  { s: 2, w: 62, x: -22, y: -6 },
  { s: 0, w: 60, x: 62, y: -4, flip: true },
  // the bank that rises through the middle
  { s: 4, w: 58, x: 18, y: 14 },
  { s: 1, w: 56, x: 46, y: 18, flip: true },
  { s: 5, w: 64, x: -10, y: 30 },
  { s: 3, w: 64, x: 44, y: 32, flip: true },
];

function Layer({ clouds, y }: { clouds: C[]; y: MotionValue<string> }) {
  return (
    <motion.div style={{ y }} className="absolute inset-0">
      {clouds.map((c, i) => (
        <Cloud
          key={i}
          sprite={c.s}
          // on tall phone screens, size by height a little so clouds aren't tiny (capped)
          width={`max(${c.w}vw, ${c.w * 0.75}vh)`}
          left={`${c.x}vw`}
          top={`${c.y}%`}
          flip={c.flip}
          opacity={c.o}
        />
      ))}
    </motion.div>
  );
}

export function CloudBank({ progress }: { progress: MotionValue<number> }) {
  const reduce = useReducedMotion();
  // Extra lift on top of normal scrolling: front clouds climb faster than back ones.
  const backY = useTransform(progress, [0, 1], ["0vh", reduce ? "0vh" : "-24vh"]);
  const frontY = useTransform(progress, [0, 1], ["0vh", reduce ? "0vh" : "-52vh"]);

  return (
    <div
      aria-hidden="true"
      // Starts --bank-offset above the hero's bottom edge (less on phones so the resting
      // clouds don't cover the intro text), 90vh tall, overhanging into About.
      // overflow-x-clip stops wide clouds from causing sideways scrolling.
      className="pointer-events-none absolute inset-x-0 top-[calc(100%-var(--bank-offset))] h-[90vh] overflow-x-clip [--bank-offset:9vh] sm:[--bank-offset:22vh]"
    >
      {/* sky floor: the same viewport-fixed gradient as the About sky. Fully solid from the
          hero's bottom edge down (so the edge never shows), fading out further below. */}
      <div
        className="absolute inset-x-0 top-0 h-[70%]"
        style={{
          backgroundImage: "var(--sky-gradient)",
          backgroundAttachment: "fixed",
          maskImage: "linear-gradient(to bottom, transparent 0, black var(--bank-offset), black 75%, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0, black var(--bank-offset), black 75%, transparent)",
        }}
      />
      <Layer clouds={BACK} y={backY} />
      <Layer clouds={FRONT} y={frontY} />
    </div>
  );
}
