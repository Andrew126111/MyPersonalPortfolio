"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { Cloud, FogRow } from "@/components/clouds/cloud";

/*
 * The page-wide sky: one fixed layer behind the whole site that changes as you scroll,
 * like time passing ("a journey through the sky", blue hour into night).
 *
 *   Hero → About   blue hour: drifting clouds (far + mid) and a fog bank along the bottom
 *   Experience     clouds thin out, the sky deepens
 *   Projects       deep blue, the first stars appear
 *   Contact        night: a full field of softly twinkling stars
 *
 * Each section's sky is its own gradient layer, crossfading in as that section scrolls
 * into view. Cloud layers drift sideways and move with parallax. Colours come from the
 * theme tokens (--sky-*, --cloud-*, --glow).
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

// Deterministic star field (integer LCG, so server and browser render identical HTML).
const STARS = (() => {
  let seed = 1234567;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  return Array.from({ length: 140 }, () => {
    const big = rnd() < 0.08;
    return {
      x: Math.round(rnd() * 1000) / 10,
      y: Math.round(rnd() * 1000) / 10,
      size: big ? 2.5 : 1 + Math.round(rnd() * 10) / 10,
      base: Math.round((0.35 + rnd() * 0.6) * 100) / 100,
      dur: Math.round((2.5 + rnd() * 4) * 10) / 10,
      delay: Math.round(rnd() * 50) / 10,
      big,
    };
  });
})();

function Stars() {
  return (
    <div className="absolute inset-0">
      {STARS.map((s, i) => (
        <span
          key={i}
          // duration in the class keeps Tailwind's dev pipeline from dropping the keyframes
          className="absolute rounded-full bg-white animate-[twinkle_4s_ease-in-out_infinite] motion-reduce:animate-none"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            opacity: s.base,
            animationDuration: `${s.dur}s`,
            animationDelay: `${s.delay}s`,
            boxShadow: s.big ? "0 0 6px 1px rgb(200 235 255 / 0.7)" : undefined,
          }}
        />
      ))}
    </div>
  );
}

/** A ref pointing at a section on the page, found by id after mount. */
function useSectionRef(id: string) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    ref.current = document.getElementById(id);
  }, [id]);
  return ref;
}

export function Sky() {
  const reduce = useReducedMotion();
  // Find sections first (effects run in order, so these are set before useScroll reads them).
  const about = useSectionRef("about");
  const experience = useSectionRef("experience");
  const projects = useSectionRef("projects");
  const contact = useSectionRef("contact");
  const aboutMore = useSectionRef("about-more"); // the statement after the photo gallery

  // About: clouds rise into place, then drift up slowly through the section.
  const { scrollYProgress: rise } = useScroll({ target: about, offset: ["start end", "start start"] });
  const { scrollYProgress: drift } = useScroll({ target: about, offset: ["start start", "end end"] });
  // Each later section: 0 → 1 as it scrolls up into view.
  const enter = (target: React.RefObject<HTMLElement | null>) => ({
    target,
    offset: ["start end", "start 0.3"] as ["start end", "start 0.3"],
  });
  const { scrollYProgress: expIn } = useScroll(enter(experience));
  const { scrollYProgress: projIn } = useScroll(enter(projects));
  const { scrollYProgress: contactIn } = useScroll(enter(contact));
  // Dusk starts as the About statement scrolls in, so text never sits on the palest sky.
  const { scrollYProgress: duskIn } = useScroll({ target: aboutMore, offset: ["start end", "start 0.35"] });

  // Parallax: each cloud layer starts lower and lifts into place, then drifts up slowly.
  const farY = useLayerY(rise, drift, reduce, 14, 10);
  const midY = useLayerY(rise, drift, reduce, 28, 22);
  const fogY = useLayerY(rise, drift, reduce, 46, 36);

  // Clouds thin out under the About statement and are gone by Experience, so text never sits
  // on a bright wisp; the fog fades as the statement scrolls in.
  const cloudsOpacity = useTransform([duskIn, expIn, projIn], ([d, e, p]: number[]) => (1 - Math.max(d * 0.7, e)) * (1 - p));
  const fogOpacity = useTransform([duskIn, expIn], ([d, e]: number[]) => Math.min(1 - d, 1 - Math.min(1, e / 0.8)));
  const starsOpacity = useTransform([projIn, contactIn], ([p, c]: number[]) => p * 0.45 + c * 0.55);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden [--fog-scale:2.2] sm:[--fog-scale:1]"
    >
      {/* skies, crossfading from blue hour into night */}
      <div className="absolute inset-0" style={{ backgroundImage: "var(--sky-gradient)" }} />
      {/* early dusk under the About statement (keeps text readable before Experience) */}
      <motion.div
        style={{ opacity: duskIn }}
        className="absolute inset-0 bg-[linear-gradient(to_bottom,#0a2140_0%,#14375c_55%,#21507c_100%)]"
      />
      <motion.div
        style={{ opacity: expIn }}
        className="absolute inset-0 bg-[linear-gradient(to_bottom,#081a31_0%,#0f2c4d_50%,#1d4a73_100%)]"
      />
      <motion.div
        style={{ opacity: projIn }}
        className="absolute inset-0 bg-[linear-gradient(to_bottom,#050e1c_0%,#0a1e38_60%,#12304f_100%)]"
      />
      <motion.div
        style={{ opacity: contactIn }}
        className="absolute inset-0 bg-[linear-gradient(to_bottom,#03070f_0%,#06101f_60%,#0b1a30_100%)]"
      />

      <motion.div style={{ opacity: starsOpacity }} className="absolute inset-0">
        <Stars />
      </motion.div>

      <motion.div style={{ opacity: cloudsOpacity }} className="absolute inset-0">
        <CloudLayer clouds={FAR} duration={300} y={farY} />
        <CloudLayer clouds={MID} duration={190} y={midY} />
      </motion.div>

      {/* fog bank along the bottom (same fog as the hero's) */}
      <motion.div style={{ y: fogY, opacity: fogOpacity }} className="absolute inset-0">
        <Drift duration={140} distance="calc(100vw * var(--fog-scale, 1))">
          <div
            className="absolute inset-x-0 top-[84vh] h-[40vh]"
            style={{
              background:
                "linear-gradient(to bottom, color-mix(in srgb, var(--cloud-light) 35%, var(--cloud-shadow)), transparent)",
            }}
          />
          {/* step 25 divides 100 evenly (and 4 fog images), so the loop is seamless */}
          <FogRow top="70vh" width={48} step={25} offset={5} opacity={0.75} blur={2} span={200} />
          <FogRow top="77vh" width={56} step={25} offset={-7} span={200} />
        </Drift>
      </motion.div>

      {/* gentle darkening in the middle so white text stays readable */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_45%,rgb(5_12_24/0.45),transparent_75%)]" />
    </div>
  );
}
