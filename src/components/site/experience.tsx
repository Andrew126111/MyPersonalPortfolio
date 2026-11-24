"use client";

import { useRef, useSyncExternalStore } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { MapPin } from "lucide-react";
import { CountUp } from "@/components/count-up";
import { FlightVisual, PipelineVisual } from "@/components/site/experience-visuals";
import { SectionHeading } from "@/components/site/section-heading";
import { ROLES, type Role } from "@/content/experience";

/*
 * Experience: a glowing timeline down the left that fills as you scroll, and for each role
 * the details on one side and a scroll-driven illustration of what was built on the other.
 */

const VISUALS = { flight: FlightVisual, pipeline: PipelineVisual } as const;
const EASE = [0.16, 1, 0.3, 1] as const;

// True on large screens (where the visual sits beside the text). Server/first render: false.
function useIsDesktop() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(min-width: 1024px)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(min-width: 1024px)").matches,
    () => false,
  );
}

function RoleRow({ role, index }: { role: Role; index: number }) {
  const ref = useRef<HTMLElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const desktop = useIsDesktop();

  // Desktop: the story plays while you read the whole row (the visual is sticky beside it).
  // Phones: the visual sits under the text, so the story plays as the visual itself scrolls by.
  const { scrollYProgress: rowP } = useScroll({ target: ref, offset: ["start 0.85", "end 0.55"] });
  const { scrollYProgress: visualP } = useScroll({ target: visualRef, offset: ["start 0.9", "end 0.45"] });
  const smooth = useSpring(desktop ? rowP : visualP, { stiffness: 90, damping: 24, restDelta: 0.0005 });
  const done = useTransform(smooth, () => 1);
  const progress: MotionValue<number> = reduce ? done : smooth;
  const Visual = VISUALS[role.visual];

  return (
    <article ref={ref} aria-labelledby={`role-${index}`} className="relative pl-8 sm:pl-14">
      {/* timeline node */}
      <span
        aria-hidden="true"
        className="absolute top-1.5 left-0 flex size-[15px] -translate-x-1/2 items-center justify-center rounded-full border border-glow/60 bg-ink sm:left-0"
      >
        <span className="size-1.5 rounded-full bg-glow" />
      </span>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <p className="font-mono text-xs text-muted-foreground">
            <span className="text-glow">{role.dates}</span>
            <span className="mx-2">·</span>
            <MapPin className="mr-1 inline size-3 -translate-y-px" aria-hidden="true" />
            {role.location}
          </p>
          <h3 id={`role-${index}`} className="mt-3 text-3xl font-bold sm:text-4xl">
            {role.company}
            {role.via && <span className="ml-2 text-lg font-medium text-muted-foreground">{role.via}</span>}
          </h3>
          <p className="mt-1 text-lg text-cream/90">{role.title}</p>
          <p className="mt-4 text-[17px] leading-relaxed text-muted-foreground">{role.summary}</p>

          {/* stats */}
          <dl className="mt-6 grid grid-cols-3 gap-3">
            {role.stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-surface/60 p-3">
                <dt className="sr-only">{s.label}</dt>
                <dd className="font-heading text-xl font-bold whitespace-nowrap text-glow sm:text-3xl">
                  <CountUp to={s.value} prefix={s.prefix} suffix={s.suffix} />
                </dd>
                <dd className="mt-1 text-[11px] leading-snug text-muted-foreground sm:text-xs">{s.label}</dd>
              </div>
            ))}
          </dl>

          <ul className="mt-6 space-y-3">
            {role.points.map((p) => (
              <li key={p} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-glow" aria-hidden="true" />
                {p}
              </li>
            ))}
          </ul>

          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Tools used">
            {role.stack.map((t) => (
              <li key={t} className="rounded-full border border-border bg-surface px-3 py-1 font-mono text-[11px] text-muted-foreground">
                {t}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* scroll-driven illustration; sticks beside the text on desktop while you read */}
        <div ref={visualRef} className="h-[300px] sm:h-[360px] lg:sticky lg:top-28">
          <Visual progress={progress} />
        </div>
      </div>
    </article>
  );
}

export function Experience() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.7", "end 0.7"] });
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return (
    <section
      ref={ref}
      id="experience"
      aria-labelledby="experience-title"
      className="mx-auto w-full max-w-[1200px] scroll-mt-16 px-4 py-20 sm:px-6 sm:py-32"
    >
      <SectionHeading
        id="experience-title"
        eyebrow="02 · Experience"
        title={
          <>
            Where I&apos;ve shipped. <span className="text-muted-foreground">Scroll to watch it run.</span>
          </>
        }
      />

      <div className="relative">
        {/* timeline track + glowing fill that grows as you scroll */}
        <div aria-hidden="true" className="absolute top-2 bottom-0 left-0 w-px bg-border" />
        <motion.div
          aria-hidden="true"
          style={{ scaleY: reduce ? 1 : fill }}
          className="absolute top-2 bottom-0 left-0 w-px origin-top bg-glow shadow-[0_0_12px_1px_rgb(200_245_96/0.6)]"
        />

        <div className="space-y-24 sm:space-y-32">
          {ROLES.map((role, i) => (
            <RoleRow key={role.company} role={role} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
