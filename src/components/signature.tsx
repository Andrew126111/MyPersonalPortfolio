"use client";

import { useId, useRef } from "react";
import { motion, useInView, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import {
  SIGNATURE_GUIDE,
  SIGNATURE_GUIDE_LENGTHS,
  SIGNATURE_INK,
  SIGNATURE_VIEWBOX,
} from "@/components/signature-paths";

/*
 * Andrew's signature, writing itself in pen order.
 *
 * The ink is a calligraphic version of the real signature (scripts/generate-signature.py).
 * It sits under a mask made of the original pen strokes; growing those strokes reveals the
 * ink as if it's being written. Colour comes from `currentColor`.
 *
 * Two ways to drive it:
 *   - default: writes itself over `duration` seconds once it scrolls into view
 *   - `progress` (0 → 1 MotionValue): written in step with e.g. scroll position
 */

const TOTAL = SIGNATURE_GUIDE_LENGTHS.reduce((a, b) => a + b, 0);
const MIN_STROKE = 0.06; // share of the total, so the dot still "taps" down
const GAP = 0.05; // pen lift between strokes, as a share of the total

// each stroke's slice of the drawing (0 → 1), in proportion to its length, with pen lifts
const SHARES = SIGNATURE_GUIDE_LENGTHS.map((len) => Math.max(MIN_STROKE, len / TOTAL));
const SPAN = SHARES.reduce((a, b) => a + b, 0) + GAP * (SHARES.length - 1);
const SLICES = SHARES.map((share, i) => {
  const start = (SHARES.slice(0, i).reduce((a, b) => a + b, 0) + GAP * i) / SPAN;
  return { start, end: start + share / SPAN };
});

const EASE = [0.45, 0.05, 0.35, 1] as const;

export function Signature({
  className,
  duration = 2.4,
  delay = 0.2,
  progress,
  title = "Andrew Nguyen's signature",
}: {
  className?: string;
  duration?: number;
  delay?: number;
  progress?: MotionValue<number>;
  title?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const maskId = `sig-${useId().replace(/:/g, "")}`;

  return (
    <svg
      ref={ref}
      viewBox={SIGNATURE_VIEWBOX}
      className={className}
      // decorative when the surrounding link already says who it is (title="")
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          {SIGNATURE_GUIDE.map((d, i) =>
            progress && !reduce ? (
              <ScrollStroke key={i} d={d} progress={progress} {...SLICES[i]} />
            ) : (
              <motion.path
                key={i}
                d={d}
                {...MASK_STROKE}
                initial={{ pathLength: reduce ? 1 : 0 }}
                animate={{ pathLength: inView || reduce ? 1 : 0 }}
                transition={{
                  delay: delay + SLICES[i].start * duration,
                  duration: (SLICES[i].end - SLICES[i].start) * duration,
                  ease: EASE,
                }}
              />
            ),
          )}
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

const MASK_STROKE = {
  fill: "none",
  stroke: "white",
  strokeWidth: 6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function ScrollStroke({
  d,
  progress,
  start,
  end,
}: {
  d: string;
  progress: MotionValue<number>;
  start: number;
  end: number;
}) {
  const len = useTransform(progress, [start, end], [0, 1]);
  // hide fully until it starts, so the round cap doesn't leave a dot behind
  const opacity = useTransform(progress, (p) => (p > start ? 1 : 0));
  return <motion.path d={d} {...MASK_STROKE} style={{ pathLength: len, opacity }} />;
}
