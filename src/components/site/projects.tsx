"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { GitHubIcon } from "@/components/icons";
import { FacadeVisual, HeuristXVisual } from "@/components/site/project-visuals";
import { SectionHeading } from "@/components/site/section-heading";
import { TiltCard } from "@/components/tilt-card";
import { PROJECTS, type Project } from "@/content/projects";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

const VISUALS = { facade: FacadeVisual, heuristx: HeuristXVisual } as const;

function ProjectRow({ project, index }: { project: Project; index: number }) {
  const reduce = useReducedMotion();
  const Visual = VISUALS[project.visual];
  const flip = index % 2 === 1; // alternate the visual left/right on desktop

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="grid items-center gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14"
      aria-labelledby={`project-${index}`}
    >
      <TiltCard className={cn("h-[340px] sm:h-[400px]", flip && "lg:order-2")}>
        <Visual />
      </TiltCard>

      <div className={cn(flip && "lg:order-1")}>
        <p className="font-mono text-xs text-muted-foreground">
          <span className="text-glow">{String(index + 1).padStart(2, "0")}</span> · {project.date}
        </p>
        <h3 id={`project-${index}`} className="mt-3 text-3xl font-bold sm:text-4xl">
          {project.name}
        </h3>
        <p className="mt-3 text-[17px] leading-relaxed text-foreground/90">{project.tagline}</p>

        <ul className="mt-6 space-y-3">
          {project.points.map((point) => (
            <li key={point} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
              <span className="mt-2 size-1 shrink-0 rounded-full bg-glow" aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>

        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Tech stack">
          {project.stack.map((tech) => (
            <li
              key={tech}
              className="rounded-full border border-border bg-surface px-3 py-1 font-mono text-[11px] text-muted-foreground"
            >
              {tech}
            </li>
          ))}
        </ul>

        {(project.links?.github || project.links?.demo) && (
          <div className="mt-7 flex flex-wrap gap-3">
            {project.links.demo && (
              <a
                href={project.links.demo}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-glow px-4 py-2 text-sm font-medium text-ink transition-transform duration-200 hover:-translate-y-0.5"
              >
                Live demo <ArrowUpRight className="size-4" />
              </a>
            )}
            {project.links.github && (
              <a
                href={project.links.github}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-foreground transition-colors duration-200 hover:border-glow hover:text-glow"
              >
                <GitHubIcon className="size-4" /> Source
              </a>
            )}
          </div>
        )}
      </div>
    </motion.article>
  );
}

export function Projects() {
  return (
    <section
      id="projects"
      aria-labelledby="projects-title"
      className="mx-auto w-full max-w-[1200px] scroll-mt-16 px-4 py-20 sm:px-6 sm:py-32"
    >
      <SectionHeading
        id="projects-title"
        eyebrow="03 · Projects"
        title={
          <>
            Things I&apos;ve built. <span className="text-muted-foreground">Hover to look around.</span>
          </>
        }
      />

      <div className="space-y-20 sm:space-y-28">
        {PROJECTS.map((project, i) => (
          <ProjectRow key={project.name} project={project} index={i} />
        ))}
      </div>

      <a
        href={site.links.github}
        target="_blank"
        rel="noreferrer"
        className="mt-20 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-200 hover:text-glow"
      >
        <GitHubIcon className="size-4" /> More on GitHub <ArrowUpRight className="size-3.5" />
      </a>
    </section>
  );
}
