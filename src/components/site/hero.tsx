"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowRight } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "@/components/icons";
import { CloudBank } from "@/components/site/cloud-bank";
import { VideoRipple } from "@/components/video-ripple";
import { WordsPullUp } from "@/components/words-pull-up";
import { site } from "@/lib/site";

/*
 * Hero: calm, centred layout over the full-bleed twilight video (with its cursor ripples).
 *
 *   - frosted-glass nav pill floating at the top
 *   - name, role, one line of intro, and actions centred in the sky, above the person in
 *     the video, so the scene (and the ripples around it) stays visible
 *   - a strip of fog along the bottom that rises progressively as you scroll (CloudBank)
 *
 * Scroll: the video zooms and drifts gently, the text lifts and fades, and the fog climbs
 * over everything and hands off to About.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

function FadeUp({ delay, children, className }: { delay: number; children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.9, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.12]);
  const videoY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "10%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0vh", reduce ? "0vh" : "-10vh"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.45], [1, reduce ? 1 : 0]);

  return (
    // z-20 so the fog bank (which overhangs into About) draws above the next section.
    <section id="top" ref={ref} className="relative z-20 h-svh w-full">
      {/* full-bleed video layer. The outer box clips; the inner one zooms, so the zoom can
          never make the page wider than the screen. */}
      <div className="absolute inset-0 overflow-hidden bg-ink">
        <motion.div style={{ scale: videoScale }} className="absolute inset-0">
          {/* video with cursor ripples, oversized so drifting never reveals an edge */}
          <motion.div
            style={{ y: videoY }}
            className="absolute inset-x-0 -top-[22%] h-[135%] sm:-top-[15%] sm:h-[130%]"
          >
            <VideoRipple src={site.heroVideo} poster={site.heroPoster} className="absolute inset-0" />
          </motion.div>
          {/* film grain + a darker sky at the top so the centred text reads clearly */}
          <div className="noise-overlay pointer-events-none absolute inset-0 opacity-60 mix-blend-overlay" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 via-45% to-black/30" />
        </motion.div>
      </div>

      {/* frosted-glass nav pill */}
      <nav aria-label="Primary" className="absolute top-5 left-1/2 z-20 -translate-x-1/2">
        <FadeUp delay={0.1}>
          <ul className="flex items-center gap-1 rounded-full border border-white/15 bg-white/10 p-1 shadow-[0_8px_30px_-12px_rgb(0_0_0/0.6)] backdrop-blur-md">
            {site.nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="block rounded-full px-3 py-1.5 text-xs text-cream/80 transition-colors duration-200 hover:bg-white/10 hover:text-cream sm:px-4 sm:text-sm"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </FadeUp>
      </nav>

      {/* centred intro, sitting in the sky above the person */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="absolute inset-x-0 top-[11vh] flex flex-col items-center px-5 text-center [text-shadow:0_2px_24px_rgb(0_0_0/0.45)] sm:top-[10vh]"
      >
        <FadeUp delay={0.25}>
          <p className="font-mono text-[11px] tracking-[0.22em] text-cream/80 uppercase">
            Software Engineer · Queen&apos;s<span className="hidden sm:inline"> University</span> &apos;28
          </p>
        </FadeUp>

        <h1 className="mt-3 font-heading text-[13vw] leading-[0.95] font-medium tracking-[-0.045em] text-cream sm:text-[8vw] lg:text-[6.6vw]">
          <span className="sr-only">Andrew Nguyen, Software Engineer</span>
          <span aria-hidden="true">
            <WordsPullUp text="Andrew Nguyen" className="justify-center" delay={0.3} />
          </span>
        </h1>

        {/* hidden on phones so the actions stay clear of the person in the video */}
        <FadeUp delay={0.6} className="hidden sm:block">
          <p className="mt-4 max-w-[46ch] text-sm leading-relaxed text-cream/85 sm:max-w-[64ch] sm:text-base">
            Computing student building AI products that actually ship: flight booking and
            payment flows, multi-model automation pipelines, and generative media tools.
          </p>
        </FadeUp>

        <FadeUp delay={0.75} className="mt-6 flex items-center gap-3">
          <a
            href="#projects"
            className="group inline-flex items-center gap-2 rounded-full bg-cream py-1 pr-1 pl-5 text-sm font-medium text-black transition-all duration-300 hover:gap-3"
          >
            See my work
            <span className="flex size-9 items-center justify-center rounded-full bg-black transition-transform duration-300 group-hover:scale-110">
              <ArrowRight className="size-4 text-cream" />
            </span>
          </a>
          <a
            href={site.links.github}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-cream/85 backdrop-blur-md transition-colors duration-200 hover:bg-white/20 hover:text-cream"
          >
            <GitHubIcon className="size-4" />
          </a>
          <a
            href={site.links.linkedin}
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
            className="flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-cream/85 backdrop-blur-md transition-colors duration-200 hover:bg-white/20 hover:text-cream"
          >
            <LinkedInIcon className="size-4" />
          </a>
        </FadeUp>
      </motion.div>

      {/* fog: a strip at rest, rising progressively as you scroll, handing off to About */}
      <CloudBank progress={scrollYProgress} />
    </section>
  );
}
