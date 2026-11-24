"use client";

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";

/*
 * Animated twilight cloud sky behind the About section.
 *
 * Three layers of soft clouds (far, mid, near) drift slowly sideways at different speeds,
 * and move at different speeds when you scroll (parallax: near clouds move most).
 *
 * The sky is a fixed layer behind the page:
 *   - On the home screen it sits low and dimmed, so you only glimpse it around the hero's
 *     video frame (more as the frame shrinks when you start scrolling).
 *   - As the About section scrolls in, the clouds rise into place at full strength and
 *     become its background.
 *   - It fades out as the About section ends.
 *
 * Each cloud is a soft blob roughed up with an SVG turbulence filter for fluffy edges.
 * Layers move with transforms only, so the browser doesn't redraw the filters while animating.
 */

type Cloud = { x: number; y: number; w: number; h: number }; // x/w in vw, y/h in vh

const LAYERS = [
  {
    id: "far",
    rise: 18, // vh the layer rises while the About section scrolls in
    drift: 14, // vh of slow parallax drift across the whole About section
    duration: 240, // seconds for one full sideways loop
    color: "rgb(170 140 200 / 0.55)",
    highlight: "rgb(220 190 230 / 0.5)",
    clouds: [
      { x: 2, y: 12, w: 26, h: 9 },
      { x: 22, y: 26, w: 18, h: 7 },
      { x: 42, y: 7, w: 30, h: 10 },
      { x: 66, y: 22, w: 22, h: 8 },
      { x: 82, y: 10, w: 26, h: 9 },
    ],
  },
  {
    id: "mid",
    rise: 34,
    drift: 26,
    duration: 160,
    color: "rgb(214 170 205 / 0.72)",
    highlight: "rgb(248 214 226 / 0.7)",
    clouds: [
      { x: -6, y: 38, w: 40, h: 16 },
      { x: 26, y: 52, w: 30, h: 13 },
      { x: 52, y: 40, w: 24, h: 11 },
      { x: 72, y: 50, w: 40, h: 17 },
    ],
  },
  {
    id: "near",
    rise: 55,
    drift: 42,
    duration: 110,
    color: "rgb(240 200 214 / 0.86)",
    highlight: "rgb(255 236 232 / 0.9)",
    // overlapping puffs along the bottom form a continuous "sea of clouds"
    clouds: [
      { x: -14, y: 80, w: 44, h: 30 },
      { x: 12, y: 84, w: 40, h: 26 },
      { x: 34, y: 78, w: 46, h: 32 },
      { x: 60, y: 85, w: 40, h: 26 },
      { x: 80, y: 79, w: 44, h: 30 },
      { x: 4, y: 64, w: 26, h: 16 },
      { x: 66, y: 66, w: 24, h: 14 },
    ],
  },
] as const;

/** SVG filters that rough up each layer's blobs into fluffy cloud edges. */
function CloudFilters() {
  const settings = [
    { id: "far", freq: 0.011, scale: 110, seed: 3 },
    { id: "mid", freq: 0.012, scale: 150, seed: 7 },
    { id: "near", freq: 0.013, scale: 190, seed: 11 },
  ];
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      {settings.map((s) => (
        <filter key={s.id} id={`cloud-${s.id}`} x="-40%" y="-40%" width="180%" height="180%">
          <feTurbulence type="fractalNoise" baseFrequency={s.freq} numOctaves={4} seed={s.seed} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={s.scale} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      ))}
    </svg>
  );
}

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

  // Two identical copies side by side, so the sideways loop is seamless.
  const blobs = [0, 100].flatMap((offset) =>
    layer.clouds.map((c: Cloud, i) => (
      <div
        key={`${offset}-${i}`}
        className="absolute rounded-[50%]"
        style={{
          left: `${(c.x + offset) / 2}%`, // container is 200vw wide, so vw → % is /2
          top: `${c.y}vh`,
          // on tall phone screens, widen clouds so they keep a natural shape
          width: `max(${c.w}vw, ${c.w * 0.85}vh)`,
          height: `${c.h}vh`,
          // soft body with a brighter top-left, like light catching the cloud
          background: `radial-gradient(ellipse 60% 55% at 40% 35%, ${layer.highlight}, transparent 70%), radial-gradient(ellipse 50% 50% at 50% 50%, ${layer.color} 0%, ${layer.color} 45%, transparent 72%)`,
          filter: `url(#cloud-${layer.id})`,
        }}
      />
    )),
  );

  return (
    <motion.div style={{ y }} className="absolute inset-0">
      <div
        // Duration in the class keeps Tailwind's dev pipeline from dropping the keyframes;
        // the inline style then sets each layer's real speed.
        className="absolute inset-y-0 left-0 w-[200vw] animate-[cloud-drift_120s_linear_infinite] will-change-transform motion-reduce:animate-none"
        style={{ animationDuration: `${layer.duration}s` }}
      >
        {blobs}
      </div>
    </motion.div>
  );
}

export function CloudSky({ sectionRef }: { sectionRef: React.RefObject<HTMLElement | null> }) {
  const reduce = useReducedMotion();
  const target = sectionRef;

  // 0 → 1 while the About section scrolls up from the bottom of the screen to the top.
  const { scrollYProgress: rise } = useScroll({ target, offset: ["start end", "start start"] });
  // 0 → 1 across the whole About section (slow drift while you're in it).
  const { scrollYProgress: drift } = useScroll({ target, offset: ["start start", "end end"] });
  // 0 → 1 as the About section's end scrolls out (fade away).
  const { scrollYProgress: leave } = useScroll({ target, offset: ["end end", "end start"] });

  // Dim while peeking behind the hero, full strength in About, gone after.
  const opacity = useTransform([rise, leave], ([r, l]: number[]) => (0.5 + 0.5 * r) * (1 - l));

  return (
    <motion.div
      aria-hidden="true"
      style={{ opacity }}
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* twilight sky gradient, matching the hero video's grade */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#0e0b1d_0%,#221a3d_35%,#4a3466_68%,#8d5f84_88%,#b47b92_100%)]" />
      <CloudFilters />
      {LAYERS.map((layer) => (
        <CloudLayer key={layer.id} layer={layer} rise={rise} drift={drift} reduce={reduce} />
      ))}
      {/* gentle darkening in the middle so white text stays readable */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_45%,rgb(10_10_11/0.6),transparent_75%)]" />
    </motion.div>
  );
}
