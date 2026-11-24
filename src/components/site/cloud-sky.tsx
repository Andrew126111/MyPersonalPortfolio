"use client";

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { Cloud } from "@/components/clouds/cloud";

/*
 * Animated cloud sky behind the About section.
 *
 * Three layers of clouds (far, mid, near) drift slowly sideways at different speeds and
 * move at different speeds when you scroll (parallax: near clouds move most). Uses the same
 * cloud images and theme colours (--sky-*, --cloud-*) as the hero's cloud bank, so the
 * hand-off between them is seamless.
 *
 * It's a fixed layer behind the page: hidden behind the full-bleed hero at first, it becomes
 * About's background as you scroll in, and fades out as About ends.
 */

type C = { s: number; w: number; x: number; y: number; flip?: boolean; o?: number };
// x/w in vw (within one 100vw copy), y = top edge in vh

const LAYERS: { id: string; rise: number; drift: number; duration: number; clouds: C[] }[] = [
  {
    id: "far",
    rise: 18, // vh the layer rises while About scrolls in
    drift: 14, // vh of slow parallax drift across the whole section
    duration: 260, // seconds for one full sideways loop
    clouds: [
      { s: 3, w: 24, x: 2, y: 8, o: 0.55 },
      { s: 1, w: 18, x: 30, y: 20, flip: true, o: 0.45 },
      { s: 5, w: 22, x: 55, y: 5, o: 0.5 },
      { s: 2, w: 20, x: 80, y: 16, flip: true, o: 0.45 },
    ],
  },
  {
    id: "mid",
    rise: 34,
    drift: 26,
    duration: 170,
    clouds: [
      { s: 0, w: 34, x: -6, y: 36, o: 0.85 },
      { s: 4, w: 28, x: 34, y: 48, flip: true, o: 0.8 },
      { s: 2, w: 32, x: 68, y: 38, o: 0.85 },
    ],
  },
  {
    id: "near",
    rise: 55,
    drift: 42,
    duration: 120,
    // overlapping clouds along the bottom form a continuous "sea of clouds"
    clouds: [
      { s: 5, w: 52, x: -16, y: 70 },
      { s: 1, w: 46, x: 18, y: 76, flip: true },
      { s: 3, w: 52, x: 46, y: 70 },
      { s: 0, w: 48, x: 76, y: 76, flip: true },
    ],
  },
];

function CloudLayer({
  layer,
  rise,
  drift,
  reduce,
}: {
  layer: (typeof LAYERS)[number];
  rise: MotionValue<number>;
  drift: MotionValue<number>;
  reduce: boolean | null;
}) {
  // Starts low (rise=0) and lifts into place, then drifts up slowly through the section.
  const y = useTransform([rise, drift], ([r, d]: number[]) =>
    reduce ? "0vh" : `${(1 - r) * layer.rise - d * layer.drift}vh`,
  );

  return (
    <motion.div style={{ y }} className="absolute inset-0">
      <div
        // Duration in the class keeps Tailwind's dev pipeline from dropping the keyframes;
        // the inline style then sets each layer's real speed.
        className="absolute inset-y-0 left-0 w-[200vw] animate-[cloud-drift_120s_linear_infinite] will-change-transform motion-reduce:animate-none"
        style={{ animationDuration: `${layer.duration}s` }}
      >
        {/* two identical copies side by side so the sideways loop is seamless */}
        {[0, 100].flatMap((offset) =>
          layer.clouds.map((c, i) => (
            <Cloud
              key={`${offset}-${i}`}
              sprite={c.s}
              width={`max(${c.w}vw, ${c.w * 1.1}vh)`}
              left={`${c.x + offset}vw`}
              top={`${c.y}vh`}
              flip={c.flip}
              opacity={c.o}
            />
          )),
        )}
      </div>
    </motion.div>
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
  // Full strength (so it matches the cloud bank's sky floor exactly), gone after About.
  const opacity = useTransform(leave, (l) => 1 - l);

  return (
    <motion.div
      aria-hidden="true"
      style={{ opacity }}
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0" style={{ backgroundImage: "var(--sky-gradient)" }} />
      {LAYERS.map((layer) => (
        <CloudLayer key={layer.id} layer={layer} rise={rise} drift={drift} reduce={reduce} />
      ))}
      {/* gentle darkening in the middle so white text stays readable */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_45%,rgb(10_10_11/0.55),transparent_75%)]" />
    </motion.div>
  );
}
