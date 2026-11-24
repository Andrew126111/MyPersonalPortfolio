"use client";

import { motion, useReducedMotion } from "motion/react";

type Props = {
  /** small mono label, e.g. "01 · About" */
  eyebrow: string;
  title: React.ReactNode;
  id?: string;
};

/** Shared heading for every section below the hero, so they all line up the same way. */
export function SectionHeading({ eyebrow, title, id }: Props) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mb-10 sm:mb-14"
    >
      <p className="font-mono text-xs uppercase tracking-[0.12em] text-glow">{eyebrow}</p>
      <h2 id={id} className="mt-3 max-w-[22ch] text-3xl leading-[1.1] font-bold sm:text-[44px]">
        {title}
      </h2>
    </motion.div>
  );
}
