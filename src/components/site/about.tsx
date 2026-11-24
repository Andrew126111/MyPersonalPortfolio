"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, GraduationCap, MapPin, Sparkles, Wrench } from "lucide-react";
import { LifeGallery } from "@/components/site/life-gallery";
import { SectionHeading } from "@/components/site/section-heading";
import { cn } from "@/lib/utils";

/* ───────────────────────── content ───────────────────────── */

const STACK = [
  { group: "Languages", items: ["TypeScript", "Python", "Java", "C", "SQL"] },
  { group: "Frameworks", items: ["Next.js", "React", "FastAPI", "Node.js", "Tailwind"] },
  { group: "AI & tools", items: ["Gemini API", "HuggingFace", "n8n", "Docker", "GCP"] },
];

const BUILDS = ["LLM pipelines", "AI agents", "Full-stack apps", "Automation", "Chrome extensions"];

/* ───────────────────────── bento card ───────────────────────── */

/**
 * Card whose border lights up lime near the cursor. The glow position is set on every
 * card by the grid (see `onPointerMove` in About), so neighbouring cards light up together
 * as the cursor moves between them.
 */
function BentoCard({
  className,
  children,
  index,
}: {
  className?: string;
  children: React.ReactNode;
  index: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      data-bento
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: "easeOut" }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-transparent p-6",
        className,
      )}
      style={{
        // Two backgrounds: the card fill (inside the border) and a cursor-following
        // lime glow that only shows through the 1px transparent border.
        background:
          "linear-gradient(var(--card), var(--card)) padding-box, radial-gradient(260px circle at var(--x, -999px) var(--y, -999px), rgb(200 245 96 / 0.6), var(--border) 70%) border-box",
      }}
    >
      {/* faint inner glow following the cursor */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(320px circle at var(--x, -999px) var(--y, -999px), rgb(200 245 96 / 0.06), transparent 60%)",
        }}
      />
      <div className="relative h-full">{children}</div>
    </motion.div>
  );
}

function CardLabel({ icon: Icon, children }: { icon: typeof Sparkles; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
      <Icon className="size-3.5" aria-hidden="true" />
      {children}
    </p>
  );
}

/** Live local time in Toronto, ticking every second (rendered client-side only). */
function TorontoClock() {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Toronto",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    const tick = () => setTime(fmt.format(new Date()));
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  return (
    <span className="font-mono text-sm tabular-nums text-foreground">
      {time ?? "--:--:-- --"}
    </span>
  );
}

/* ───────────────────────── section ───────────────────────── */

export function About() {
  const gridRef = useRef<HTMLDivElement>(null);

  // Feed the cursor position to every card so their borders glow as one surface.
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    gridRef.current?.querySelectorAll<HTMLElement>("[data-bento]").forEach((card) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--x", `${e.clientX - r.left}px`);
      card.style.setProperty("--y", `${e.clientY - r.top}px`);
    });
  }
  function onPointerLeave() {
    gridRef.current?.querySelectorAll<HTMLElement>("[data-bento]").forEach((card) => {
      card.style.removeProperty("--x");
      card.style.removeProperty("--y");
    });
  }

  return (
    <section id="about" aria-labelledby="about-title" className="scroll-mt-16 py-20 sm:py-32">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
        <SectionHeading
          id="about-title"
          eyebrow="01 · About"
          title={
            <>
              Hi, I&apos;m Andrew.{" "}
              <span className="text-muted-foreground">Here&apos;s a bit of life outside the code.</span>
            </>
          }
        />
      </div>

      {/* Full-width photo gallery */}
      <LifeGallery />

      {/* The basics */}
      <div className="mx-auto mt-16 w-full max-w-[1200px] px-4 sm:mt-24 sm:px-6">
        <div
          ref={gridRef}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          className="grid auto-rows-[minmax(170px,auto)] grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          {/* Bio */}
          <BentoCard index={0} className="md:col-span-2 lg:row-span-2">
            <div className="flex h-full flex-col justify-between gap-8">
              <CardLabel icon={Sparkles}>Hello</CardLabel>
              <div className="space-y-4 text-[17px] leading-relaxed text-muted-foreground">
                <p>
                  I&apos;m <span className="text-foreground">Andrew</span>, a Computing student
                  specializing in Artificial Intelligence at Queen&apos;s University.
                </p>
                <p>
                  I like building things people actually use, from the LLM pipeline all the way to
                  the checkout button.
                </p>
              </div>
              <a
                href="#experience"
                className="inline-flex w-fit items-center gap-1 text-sm text-foreground transition-colors duration-200 hover:text-lime"
              >
                See my experience <ArrowUpRight className="size-3.5" />
              </a>
            </div>
          </BentoCard>

          {/* Education */}
          <BentoCard index={1} className="md:col-span-2">
            <div className="flex h-full flex-col justify-between gap-6">
              <CardLabel icon={GraduationCap}>Education</CardLabel>
              <div>
                <p className="font-heading text-2xl font-bold">Queen&apos;s University</p>
                <p className="mt-1 text-muted-foreground">
                  Bachelor of Computing (Honours), Artificial Intelligence
                </p>
                <p className="mt-3 font-mono text-xs text-muted-foreground">
                  Kingston, ON · Expected April 2028
                </p>
              </div>
            </div>
          </BentoCard>

          {/* What I build */}
          <BentoCard index={2}>
            <div className="flex h-full flex-col justify-between gap-6">
              <CardLabel icon={Wrench}>I build</CardLabel>
              <ul className="space-y-1.5">
                {BUILDS.map((b) => (
                  <li
                    key={b}
                    className="flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
                  >
                    <span className="size-1 rounded-full bg-lime" aria-hidden="true" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </BentoCard>

          {/* Location + live clock */}
          <BentoCard index={3}>
            <div className="flex h-full flex-col justify-between gap-6">
              <CardLabel icon={MapPin}>Based in</CardLabel>
              <div>
                <p className="flex items-center gap-2 font-heading text-2xl font-bold">
                  <span className="relative flex size-2.5" aria-hidden="true">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-lime opacity-60 motion-reduce:animate-none" />
                    <span className="relative inline-flex size-2.5 rounded-full bg-lime" />
                  </span>
                  Toronto, ON
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Local time <TorontoClock />
                </p>
              </div>
            </div>
          </BentoCard>

          {/* Stack */}
          <BentoCard index={4} className="md:col-span-2 lg:col-span-4">
            <div className="flex h-full flex-col gap-5">
              <CardLabel icon={Sparkles}>Stack</CardLabel>
              <div className="grid gap-4 lg:grid-cols-3">
                {STACK.map((row) => (
                  <div key={row.group}>
                    <p className="mb-2 font-mono text-[11px] text-muted-foreground">{row.group}</p>
                    <div className="flex flex-wrap gap-2">
                      {row.items.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs text-foreground transition-colors duration-200 hover:border-lime hover:text-lime"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </BentoCard>
        </div>
      </div>
    </section>
  );
}
