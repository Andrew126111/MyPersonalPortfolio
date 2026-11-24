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
 * Hero, inspired by 21st.dev's prisma-hero: full-bleed looping video inside a rounded
 * frame, film grain, a black tab nav hanging from the top, and a giant name across the bottom.
 *
 * Scroll parallax: as you scroll away, the frame shrinks slightly, the video drifts slower
 * than the page, and the text lifts and fades, handing off to the About tunnel.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.12]);
  const videoY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "10%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-12%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, reduce ? 1 : 0]);

  return (
    // z-20 so the cloud bank (which overhangs into About) draws above the next section.
    <section id="top" ref={ref} className="relative z-20 h-svh w-full">
      {/* full-bleed video layer: edge to edge, no frame. The outer box clips; the inner one
          zooms, so the zoom can never make the page wider than the screen. */}
      <div className="absolute inset-0 overflow-hidden bg-ink">
      <motion.div style={{ scale: videoScale }} className="absolute inset-0">
        {/* background video with cursor ripples (drifts slower than the page).
            Oversized and shifted up so drifting down never reveals an edge. On phones it's
            shifted further up so the person sits above the name instead of behind it. */}
        <motion.div
          style={{ y: videoY }}
          className="absolute inset-x-0 -top-[35%] h-[140%] sm:-top-[15%] sm:h-[130%]"
        >
          <VideoRipple src={site.heroVideo} poster={site.heroPoster} className="absolute inset-0" />
        </motion.div>

        {/* film grain + readability gradient */}
        <div className="noise-overlay pointer-events-none absolute inset-0 opacity-70 mix-blend-overlay" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />
      </motion.div>
      </div>

      {/* foreground: nav + text (outside the zooming video layer so text doesn't scale) */}
      <div className="absolute inset-0 overflow-hidden">
        {/* tab nav hanging from the top */}
        <nav aria-label="Primary" className="absolute top-0 left-1/2 z-20 -translate-x-1/2">
          <motion.ul
            initial={reduce ? false : { y: "-100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
            className="flex items-center gap-4 rounded-b-2xl bg-black px-5 py-2.5 sm:gap-8 md:gap-12 md:rounded-b-3xl md:px-8"
          >
            {site.nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="text-[11px] text-cream/75 transition-colors duration-200 hover:text-cream sm:text-xs md:text-sm"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </motion.ul>
        </nav>

        {/* bottom: giant name + intro */}
        <motion.div
          style={{ y: contentY, opacity: contentOpacity }}
          // lifted a little so the resting cloud tops along the bottom edge don't cover it
          className="absolute inset-x-0 bottom-[10vh] px-4 pb-2 sm:bottom-[6vh] sm:px-6 md:px-10"
        >
          <div className="grid grid-cols-12 items-end gap-4">
            <div className="col-span-12 lg:col-span-8">
              <h1 className="font-heading text-[26vw] leading-[0.85] font-medium tracking-[-0.07em] text-cream sm:text-[24vw] md:text-[22vw] lg:text-[17vw] xl:text-[16.5vw]">
                <span className="sr-only">Andrew Nguyen, Software Engineer</span>
                <span aria-hidden="true">
                  <WordsPullUp
                    text="Andrew"
                    asterisk={
                      <span className="absolute top-[0.62em] -right-[0.32em] text-[0.3em] text-lime">*</span>
                    }
                  />
                </span>
              </h1>
            </div>

            {/* text-shadow keeps small text readable over bright parts of the video */}
            <div className="col-span-12 flex flex-col gap-5 pb-6 [text-shadow:0_1px_14px_rgb(0_0_0/0.75)] lg:col-span-4 lg:pb-12">
              <motion.p
                initial={reduce ? false : { y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.45, ease: EASE }}
                className="font-mono text-[11px] tracking-[0.14em] text-cream/85 uppercase"
              >
                <span className="text-lime">*</span> Software Engineer · Queen&apos;s &apos;28
              </motion.p>
              <motion.p
                initial={reduce ? false : { y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.55, ease: EASE }}
                className="max-w-[42ch] text-sm leading-snug text-cream/90 sm:text-base"
              >
                Computing student building AI products that actually ship: flight booking and
                payment flows, multi-model automation pipelines, and generative media tools.
              </motion.p>

              <motion.div
                initial={reduce ? false : { y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.7, ease: EASE }}
                className="flex items-center gap-3"
              >
                <a
                  href="#projects"
                  className="group inline-flex items-center gap-2 rounded-full bg-cream py-1 pr-1 pl-5 text-sm font-medium text-black transition-all duration-300 hover:gap-3 sm:text-base"
                >
                  See my work
                  <span className="flex size-9 items-center justify-center rounded-full bg-black transition-transform duration-300 group-hover:scale-110 sm:size-10">
                    <ArrowRight className="size-4 text-cream" />
                  </span>
                </a>
                <a
                  href={site.links.github}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="GitHub"
                  className="flex size-10 items-center justify-center rounded-full border border-cream/25 text-cream/80 backdrop-blur-sm transition-colors duration-200 hover:border-cream hover:text-cream"
                >
                  <GitHubIcon className="size-4" />
                </a>
                <a
                  href={site.links.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                  className="flex size-10 items-center justify-center rounded-full border border-cream/25 text-cream/80 backdrop-blur-sm transition-colors duration-200 hover:border-cream hover:text-cream"
                >
                  <LinkedInIcon className="size-4" />
                </a>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* clouds billow up over the bottom of the hero (and its text) and carry you into About */}
      <CloudBank progress={scrollYProgress} />
    </section>
  );
}
