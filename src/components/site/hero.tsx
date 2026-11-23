"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Caustics } from "@/components/backgrounds/caustics";
import { GitHubIcon, LinkedInIcon } from "@/components/icons";
import { TextScramble } from "@/components/text-scramble";
import { site } from "@/lib/site";

// Stack chips float at different depths: bigger depth = moves more with the cursor.
// Kept to the right-hand side so they never sit on top of the hero text.
const CHIPS = [
  { label: "Next.js", x: "66%", y: "16%", depth: 28 },
  { label: "FastAPI", x: "86%", y: "27%", depth: 18 },
  { label: "n8n", x: "89%", y: "50%", depth: 12 },
  { label: "Gemini API", x: "74%", y: "66%", depth: 36 },
  { label: "Stripe", x: "64%", y: "82%", depth: 22 },
] as const;

function usePointerLayer(
  px: MotionValue<number>,
  py: MotionValue<number>,
  depth: number,
) {
  const x = useTransform(px, (v) => v * -depth);
  const y = useTransform(py, (v) => v * -depth);
  return { x, y };
}

function Chip({
  chip,
  px,
  py,
}: {
  chip: (typeof CHIPS)[number];
  px: MotionValue<number>;
  py: MotionValue<number>;
}) {
  const { x, y } = usePointerLayer(px, py, chip.depth);
  return (
    <motion.span
      style={{ left: chip.x, top: chip.y, x, y }}
      className="absolute hidden rounded-full border border-border bg-surface/80 px-3 py-1 font-mono text-xs text-muted-foreground backdrop-blur-sm lg:block"
    >
      {chip.label}
    </motion.span>
  );
}

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  // Scroll parallax: background drifts slower than the page, content lifts and fades out.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "30%"]);
  const chipsY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-20%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "18%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, reduce ? 1 : 0]);

  // Pointer parallax: normalised cursor position (-0.5..0.5), smoothed with a spring.
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const px = useSpring(rawX, { stiffness: 80, damping: 20, mass: 0.6 });
  const py = useSpring(rawY, { stiffness: 80, damping: 20, mass: 0.6 });
  const grid = usePointerLayer(px, py, 20);

  function onPointerMove(e: React.PointerEvent<HTMLElement>) {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    rawX.set((e.clientX - r.left) / r.width - 0.5);
    rawY.set((e.clientY - r.top) / r.height - 0.5);
  }
  function onPointerLeave() {
    rawX.set(0);
    rawY.set(0);
  }

  return (
    <section
      id="top"
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="relative flex min-h-svh items-center overflow-hidden"
    >
      {/* Layer 1: caustics light (slowest) */}
      <motion.div aria-hidden="true" style={{ y: bgY }} className="absolute -inset-16">
        <motion.div style={{ x: grid.x, y: grid.y }} className="h-full w-full">
          <Caustics />
        </motion.div>
      </motion.div>

      {/* Layer 2: floating stack chips */}
      <motion.div aria-hidden="true" style={{ y: chipsY }} className="absolute inset-0">
        {CHIPS.map((chip) => (
          <Chip key={chip.label} chip={chip} px={px} py={py} />
        ))}
      </motion.div>

      {/* Layer 3: content */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative mx-auto w-full max-w-[1200px] px-4 pt-16 sm:px-6"
      >
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="font-mono text-xs uppercase tracking-[0.12em] text-lime"
        >
          {/* "University" drops on phones so the line doesn't wrap */}
          Computing student · Queen&apos;s<span className="hidden sm:inline"> University</span> &apos;28
        </motion.p>

        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.06, ease: "easeOut" }}
          className="mt-5 text-[40px] leading-[1.05] font-bold sm:text-6xl lg:text-[72px]"
        >
          <TextScramble text="I build AI products" className="block" />
          <span className="block text-muted-foreground">
            that actually <span className="text-foreground">ship.</span>
          </span>
        </motion.h1>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease: "easeOut" }}
          className="mt-6 max-w-[52ch] text-base leading-relaxed text-muted-foreground sm:text-[17px]"
        >
          Computing (AI) student building full-stack AI products, from flight booking and
          payment flows to multi-model automation pipelines and generative media tools.
        </motion.p>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18, ease: "easeOut" }}
          className="mt-10 flex flex-wrap items-center gap-3"
        >
          <a
            href="#projects"
            className="group inline-flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-sm font-medium text-ink transition-transform duration-200 hover:-translate-y-0.5"
          >
            View projects
            <ArrowDownRight className="size-4 transition-transform duration-200 group-hover:rotate-[-45deg]" />
          </a>
          <a
            href={site.links.github}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="inline-flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors duration-200 hover:border-muted-foreground hover:text-foreground"
          >
            <GitHubIcon className="size-4" />
          </a>
          <a
            href={site.links.linkedin}
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
            className="inline-flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors duration-200 hover:border-muted-foreground hover:text-foreground"
          >
            <LinkedInIcon className="size-4" />
          </a>
          <a
            href="#experience"
            className="ml-1 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
          >
            Experience <ArrowUpRight className="size-3.5" />
          </a>
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <div
        aria-hidden="true"
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground sm:flex"
      >
        Scroll
        <span className="h-10 w-px overflow-hidden bg-border">
          <span className="block h-1/2 w-full animate-[scrollcue_1.8s_ease-in-out_infinite] bg-lime motion-reduce:animate-none" />
        </span>
      </div>
    </section>
  );
}
