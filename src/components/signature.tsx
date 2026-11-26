"use client";

import { useId, useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import {
  SIGNATURE_GUIDE,
  SIGNATURE_GUIDE_LENGTHS,
  SIGNATURE_INK,
  SIGNATURE_VIEWBOX,
} from "@/components/signature-paths";

/*
 * Andrew's signature, writing itself in pen order when it scrolls into view.
 *
 * The ink is a calligraphic version of the real signature (scripts/generate-signature.py).
 * It sits under a mask made of the original pen strokes; animating those strokes' length
 * reveals the ink as if it's being written. Colour comes from `currentColor`.
 */

const TOTAL = SIGNATURE_GUIDE_LENGTHS.reduce((a, b) => a + b, 0);
const MIN_STROKE = 0.15; // seconds, so the dot still "taps" down
const GAP = 0.12; // pen lift between strokes

export function Signature({
  className,
  duration = 2.4,
  delay = 0.2,
  title = "Andrew Nguyen's signature",
}: {
  className?: string;
  duration?: number;
  delay?: number;
  title?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const reduce = useReducedMotion();
  const maskId = `sig-${useId().replace(/:/g, "")}`;

  // each stroke starts after the previous one, with time in proportion to its length
  const durations = SIGNATURE_GUIDE_LENGTHS.map((len) => Math.max(MIN_STROKE, (len / TOTAL) * duration));
  const timings = durations.map((d, i) => ({
    delay: delay + durations.slice(0, i).reduce((sum, prev) => sum + prev + GAP, 0),
    duration: d,
  }));

  return (
    <svg ref={ref} viewBox={SIGNATURE_VIEWBOX} role="img" aria-label={title} className={className}>
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          {SIGNATURE_GUIDE.map((d, i) => (
            <motion.path
              key={i}
              d={d}
              fill="none"
              stroke="white"
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: reduce ? 1 : 0 }}
              animate={{ pathLength: inView || reduce ? 1 : 0 }}
              transition={{ ...timings[i], ease: [0.45, 0.05, 0.35, 1] }}
            />
          ))}
        </mask>
      </defs>
      <g mask={`url(#${maskId})`} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {SIGNATURE_INK.map((layer) => (
          <path key={layer.w} d={layer.d} strokeWidth={layer.w} />
        ))}
      </g>
    </svg>
  );
}
