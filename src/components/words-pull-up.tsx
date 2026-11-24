"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

/**
 * Words slide up into place one after another the first time they scroll into view.
 * Adapted from 21st.dev's prisma-hero (WordsPullUp).
 */
export function WordsPullUp({
  text,
  className = "",
  asterisk,
  delay = 0,
}: {
  text: string;
  className?: string;
  /** small mark after the last word (e.g. "*"), styled by `asteriskClassName` */
  asterisk?: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const words = text.split(" ");

  return (
    <span ref={ref} className={`inline-flex flex-wrap ${className}`}>
      {words.map((word, i) => {
        const last = i === words.length - 1;
        return (
          // overflow-hidden clips each word so it appears to rise out of a slot
          <span
            key={i}
            className="inline-block overflow-hidden pb-[0.08em]"
            // the last word gets extra room on the right so the asterisk isn't clipped
            style={{ marginRight: last ? 0 : "0.25em", paddingRight: last && asterisk ? "0.4em" : 0 }}
          >
            <motion.span
              className="relative inline-block"
              initial={reduce ? false : { y: "100%", opacity: 0 }}
              animate={inView ? { y: 0, opacity: 1 } : undefined}
              transition={{ duration: 0.9, delay: delay + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              {word}
              {last && asterisk}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}
