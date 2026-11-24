"use client";

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { Cloud, FogRow } from "@/components/clouds/cloud";

/*
 * Animated sky behind the About section.
 *
 *   - far:  small, faint, slightly blurred clouds high up (depth)
 *   - mid:  a few varied clouds at different sizes, flips, and opacities
 *   - fog:  a continuous fog bank along the bottom (same fog as the hero's, so the two
 *           sections feel like one sky)
 *
 * Each layer drifts sideways at its own speed and moves at its own speed when you scroll
 * (parallax). Colours come from the theme tokens (--sky-*, --cloud-*). It's a fixed layer
 * behind the page that becomes About's background, and fades out as About ends.
 */

type C = { s: number; w: number; x: number; y: number; flip?: boolean; o?: number; blur?: number };
// x/w in vw (within one 100vw copy), y = top edge in vh

const FAR: C[] = [
  { s: 3, w: 16, x: 3, y: 7, o: 0.45, blur: 2 },
  { s: 1, w: 11, x: 22, y: 20, flip: true, o: 0.35, blur: 2.5 },
  { s: 5, w: 19, x: 38, y: 4, o: 0.5, blur: 2 },
  { s: 4, w: 12, x: 58, y: 16, o: 0.35, blur: 2.5 },
  { s: 2, w: 17, x: 72, y: 6, flip: true, o: 0.45, blur: 2 },
  { s: 0, w: 10, x: 90, y: 22, o: 0.3, blur: 3 },
];
const MID: C[] = [
  { s: 0, w: 30, x: -4, y: 34, o: 0.85 },
  { s: 4, w: 20, x: 27, y: 46, flip: true, o: 0.7, blur: 0.5 },
  { s: 2, w: 26, x: 47, y: 30, o: 0.8 },
  { s: 5, w: 34, x: 70, y: 42, flip: true, o: 0.9 },
];

function Drift({ duration, distance, children }: { duration: number; distance?: string; children: React.ReactNode }) {
  return (
    <div
      // Duration in the class keeps Tailwind's dev pipeline from dropping the keyframes;
      // the inline style then sets each layer's real speed.
      className="absolute inset-y-0 left-0 w-[200vw] animate-[cloud-drift_120s_linear_infinite] will-change-transform motion-reduce:animate-none"
      style={{ animationDuration: `${duration}s`, ...(distance ? { ["--drift-distance" as string]: distance } : {}) }}
    >
      {children}
    </div>
  );
}

function CloudLayer({ clouds, duration, y }: { clouds: C[]; duration: number; y: MotionValue<string> }) {
  return (
    <motion.div style={{ y }} className="absolute inset-0">
      <Drift duration={duration}>
        {/* two identical copies side by side so the sideways loop is seamless */}
        {[0, 100].flatMap((offset) =>
          clouds.map((c, i) => (
            <Cloud
              key={`${offset}-${i}`}
              sprite={c.s}
              width={`max(${c.w}vw, ${c.w * 1.1}vh)`}
              left={`${c.x + offset}vw`}
              top={`${c.y}vh`}
              flip={c.flip}
              opacity={c.o}
              blur={c.blur}
            />
          )),
        )}
      </Drift>
    </motion.div>
  );
}

function useLayerY(
  rise: MotionValue<number>,
  drift: MotionValue<number>,
  reduce: boolean | null,
  riseVh: number,
  driftVh: number,
) {
  return useTransform([rise, drift], ([r, d]: number[]) =>
    reduce ? "0vh" : `${(1 - r) * riseVh - d * driftVh}vh`,
  );
}

export function CloudSky({ sectionRef }: { sectionRef: React.RefObject<HTMLElement | null> }) {
  const reduce = useReducedMotion();
  const target = sectionRef;

  // 0 → 1 while About scrolls up from the bottom of the screen to the top.
  const { scrollYProgress: rise } = useScroll({ target, offset: ["start end", "start start"] });
  // 0 → 1 across the whole About section (slow drift while you're in it).
  const { scrollYProgress: drift } = useScroll({ target, offset: ["start start", "end end"] });
  // 0 → 1 as About's end scrolls out (fade away).
  const { scrollYProgress: leave } = useScroll({ target, offset: ["end end", "end start"] });
  const opacity = useTransform(leave, (l) => 1 - l);

  // Parallax: each layer starts lower and lifts into place, then drifts up slowly.
  const farY = useLayerY(rise, drift, reduce, 14, 10);
  const midY = useLayerY(rise, drift, reduce, 28, 22);
  const fogY = useLayerY(rise, drift, reduce, 46, 36);

  return (
    <motion.div
      aria-hidden="true"
      style={{ opacity }}
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden [--fog-scale:2.2] sm:[--fog-scale:1]"
    >
      <div className="absolute inset-0" style={{ backgroundImage: "var(--sky-gradient)" }} />
      <CloudLayer clouds={FAR} duration={300} y={farY} />
      <CloudLayer clouds={MID} duration={190} y={midY} />

      {/* fog bank along the bottom, matching the hero's fog */}
      <motion.div style={{ y: fogY }} className="absolute inset-0">
        <Drift duration={140} distance="calc(100vw * var(--fog-scale, 1))">
          <div
            className="absolute inset-x-0 top-[84vh] h-[40vh]"
            style={{
              background:
                "linear-gradient(to bottom, color-mix(in srgb, var(--cloud-light) 35%, var(--cloud-shadow)), transparent)",
            }}
          />
          {/* step 25vw divides 100vw evenly (and 4 fog images), so the loop is seamless */}
          <FogRow top="70vh" width={48} step={25} offset={5} opacity={0.75} blur={2} span={200} />
          <FogRow top="77vh" width={56} step={25} offset={-7} span={200} />
        </Drift>
      </motion.div>

      {/* gentle darkening in the middle so white text stays readable */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_45%,rgb(10_10_11/0.55),transparent_75%)]" />
    </motion.div>
  );
}
