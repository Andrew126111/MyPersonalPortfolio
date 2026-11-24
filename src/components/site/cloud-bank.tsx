"use client";

import { motion, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import { FogRow } from "@/components/clouds/cloud";

/*
 * Fog bank on the border between the hero and About (inspired by the Stepout parallax
 * hero on Dribbble).
 *
 * At rest only a thin strip of fog shows along the bottom of the hero. As you scroll it
 * reveals itself progressively: three rows of dense, overlapping fog (back, middle, front)
 * rise at increasing speeds, so the fog thickens and climbs with the scroll rather than
 * covering the screen all at once. Underneath, a "sky floor" painted with the same
 * viewport-fixed sky gradient as the About background makes the hand-off seamless.
 *
 * `progress` is the hero's scroll progress (0 at the top, 1 once it has left).
 */

export function CloudBank({ progress }: { progress: MotionValue<number> }) {
  const reduce = useReducedMotion();
  // Extra lift on top of normal scrolling; nearer rows climb faster (parallax).
  const backY = useTransform(progress, [0, 1], ["0vh", reduce ? "0vh" : "-16vh"]);
  const midY = useTransform(progress, [0, 1], ["0vh", reduce ? "0vh" : "-34vh"]);
  const frontY = useTransform(progress, [0, 1], ["0vh", reduce ? "0vh" : "-56vh"]);

  return (
    <div
      aria-hidden="true"
      // Starts --bank-offset above the hero's bottom edge (just a strip at rest),
      // 100vh tall, overhanging into About. overflow-x-clip prevents sideways scrolling.
      className="pointer-events-none absolute inset-x-0 top-[calc(100%-var(--bank-offset))] h-[100vh] overflow-x-clip [--bank-offset:7vh] [--fog-scale:2.2] sm:[--bank-offset:9vh] sm:[--fog-scale:1]"
    >
      {/* sky floor: the same viewport-fixed gradient as the About sky, solid from just below
          the fog tops down past the hero's edge, then fading out */}
      <div
        className="absolute inset-x-0 top-[var(--bank-offset)] h-[90%]"
        style={{
          backgroundImage: "var(--sky-gradient)",
          backgroundAttachment: "fixed",
          maskImage: "linear-gradient(to bottom, black 0, black 70%, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0, black 70%, transparent)",
        }}
      />

      {/* back row: furthest, softest, slowest */}
      <motion.div style={{ y: backY }} className="absolute inset-0">
        <FogRow top="0vh" width={46} step={22} offset={3} opacity={0.7} blur={3} />
      </motion.div>
      {/* middle row */}
      <motion.div style={{ y: midY }} className="absolute inset-0">
        <FogRow top="5vh" width={52} step={24} offset={11} opacity={0.88} />
      </motion.div>
      {/* front rows: densest, fastest */}
      <motion.div style={{ y: frontY }} className="absolute inset-0">
        {/* the fog's body: thick right under the rolling tops, thinning into the sky below
            (this is also what hides the hero's bottom edge as the fog rises) */}
        <div
          className="absolute inset-x-0 top-[24vh] h-[80vh]"
          style={{
            background:
              "linear-gradient(to bottom, color-mix(in srgb, var(--cloud-light) 40%, var(--cloud-shadow)) 0%, color-mix(in srgb, var(--cloud-light) 25%, var(--cloud-shadow)) 30%, transparent 100%)",
          }}
        />
        <FogRow top="11vh" width={58} step={26} offset={-4} />
        <FogRow top="19vh" width={60} step={26} offset={9} />
      </motion.div>
    </div>
  );
}
