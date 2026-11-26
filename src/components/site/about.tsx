"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { LifeGallery } from "@/components/site/life-gallery";
import { cn } from "@/lib/utils";

/*
 * About, part two: after the photo gallery, a short statement in big type that lights up
 * word by word as you scroll past it, a single line of quick facts, and the tech stack as
 * one slow-scrolling row. Everything sits straight on the sky, with no cards.
 */

/* ───────────────────────── content ───────────────────────── */

// Words wrapped in *asterisks* light up in the accent colour.
const STATEMENT =
  "I'm *Andrew,* a Computing student at Queen's specializing in *AI.* I like building things people *actually* *use,* from the LLM pipeline all the way to the checkout button.";

const STACK = [
  "TypeScript",
  "Python",
  "Java",
  "C",
  "SQL",
  "Next.js",
  "React",
  "FastAPI",
  "Node.js",
  "Tailwind",
  "Gemini API",
  "HuggingFace",
  "n8n",
  "Docker",
  "GCP",
];

const WORDS = STATEMENT.split(" ").map((w) => {
  const accent = w.startsWith("*") && w.endsWith("*");
  return { text: accent ? w.slice(1, -1) : w, accent };
});

/* ───────────────────────── statement ───────────────────────── */

function Word({
  text,
  accent,
  progress,
  range,
}: {
  text: string;
  accent: boolean;
  progress: MotionValue<number>;
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.16, 1]);
  return (
    <motion.span style={{ opacity }} className={cn(accent && "text-glow")}>
      {text}{" "}
    </motion.span>
  );
}

/** Big statement whose words light up in reading order as it scrolls through the screen. */
function ScrollLitStatement() {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  // starts lighting as the text enters the lower part of the screen, done by the middle
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.5"] });
  const lit = useTransform(scrollYProgress, () => 1);
  const progress = reduce ? lit : scrollYProgress;

  return (
    <p
      ref={ref}
      className="font-heading text-[8.4vw] leading-[1.08] font-medium tracking-[-0.03em] text-foreground sm:text-5xl lg:text-[64px]"
    >
      {/* screen readers get the sentence in one piece */}
      <span className="sr-only">{STATEMENT.replaceAll("*", "")}</span>
      <span aria-hidden="true">
        {WORDS.map((w, i) => (
          <Word
            key={i}
            text={w.text}
            accent={w.accent}
            progress={progress}
            range={[i / WORDS.length, (i + 1) / WORDS.length]}
          />
        ))}
      </span>
    </p>
  );
}

/* ───────────────────────── facts + stack ───────────────────────── */

/** Toronto local time, h:mm (client-side only, refreshed every 15 s). */
function TorontoTime() {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Toronto",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const tick = () => setTime(fmt.format(new Date()));
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 15_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  return <span className="tabular-nums">{time ?? "--:--"}</span>;
}

function Facts() {
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs tracking-[0.12em] text-white/80 uppercase [text-shadow:0_1px_10px_rgb(0_0_0/0.45)] sm:text-[13px]">
      <span>Queen&apos;s &apos;28</span>
      <span aria-hidden="true">·</span>
      <span className="inline-flex items-center gap-2">
        <span className="relative flex size-2" aria-hidden="true">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-glow opacity-60 motion-reduce:animate-none" />
          <span className="relative inline-flex size-2 rounded-full bg-glow" />
        </span>
        Toronto, ON
      </span>
      <span aria-hidden="true">·</span>
      <span>
        <TorontoTime /> local
      </span>
    </p>
  );
}

/** The stack as one slow, endless row. Pauses on hover; static and wrapped for reduced motion. */
function StackMarquee() {
  const item = (name: string, dup = false) => (
    <li
      key={dup ? `dup-${name}` : name}
      aria-hidden={dup || undefined}
      className={cn("flex shrink-0 items-center gap-6 pr-6", dup && "motion-reduce:hidden")}
    >
      <span className="font-heading text-xl font-medium text-foreground/85 transition-colors duration-200 hover:text-glow sm:text-2xl">
        {name}
      </span>
      <span className="size-1 rounded-full bg-glow/60" aria-hidden="true" />
    </li>
  );
  return (
    <div className="group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <h3 className="sr-only">Tech stack</h3>
      {/* two copies side by side; sliding by exactly one copy loops seamlessly */}
      <ul className="flex w-max motion-safe:animate-[marquee_45s_linear_infinite] group-hover:[animation-play-state:paused] motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:gap-y-3">
        {STACK.map((s) => item(s))}
        {STACK.map((s) => item(s, true))}
      </ul>
    </div>
  );
}

/* ───────────────────────── section ───────────────────────── */

export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="pb-24 sm:pb-36">
      {/* Tunnel fly-through → photo circle → arc. Its title is this section's heading. */}
      <LifeGallery />

      <div className="mx-auto mt-20 w-full max-w-[1100px] px-5 sm:mt-28 sm:px-6">
        <p className="mb-6 font-mono text-xs tracking-[0.12em] text-glow uppercase">A bit more about me</p>
        <ScrollLitStatement />
        <div className="mt-10 sm:mt-12">
          <Facts />
        </div>
      </div>

      <div className="mx-auto mt-14 w-full max-w-[1200px] sm:mt-20">
        <StackMarquee />
      </div>
    </section>
  );
}
