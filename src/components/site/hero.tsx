"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { CloudBank } from "@/components/site/cloud-bank";
import { VideoRipple } from "@/components/video-ripple";
import { WordsPullUp } from "@/components/words-pull-up";
import { site } from "@/lib/site";

/*
 * Hero: calm, centred layout over the full-bleed twilight video (with its cursor ripples).
 *
 *   - big, bright name, role and one line of intro centred in the sky, above the person in
 *     the video, so the scene (and the ripples around it) stays visible
 *   - a calm scroll cue (outlined mouse, slow rolling wheel, gentle float); the site nav (with GitHub/LinkedIn) lives in <Nav>
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

      {/* centred intro, sitting in the sky above the person */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="absolute inset-x-0 top-[12vh] flex flex-col items-center px-5 text-center [text-shadow:0_2px_30px_rgb(0_0_0/0.55)] sm:top-[13vh]"
      >
        <FadeUp delay={0.25}>
          <p className="font-mono text-xs tracking-[0.24em] text-white/90 uppercase sm:text-sm">
            Software Engineer · Queen&apos;s<span className="hidden sm:inline"> University</span> &apos;28
          </p>
        </FadeUp>

        <h1 className="mt-4 font-heading text-[16vw] leading-[0.9] font-bold tracking-[-0.05em] text-hero-ink drop-shadow-[0_0_40px_rgb(94_224_255/0.25)] sm:text-[10vw] lg:text-[8.6vw]">
          <span className="sr-only">Andrew Nguyen, Software Engineer</span>
          <span aria-hidden="true">
            <WordsPullUp text="Andrew Nguyen" className="justify-center" delay={0.3} />
          </span>
        </h1>

        {/* hidden on phones so the text stays clear of the person in the video */}
        <FadeUp delay={0.6} className="hidden sm:block">
          <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-white/90 lg:text-xl">
            Computing student building AI products that actually ship: flight booking and
            payment flows, multi-model automation pipelines, and generative media tools.
          </p>
        </FadeUp>
      </motion.div>

      {/* scroll cue: understated but easy to spot. A plain white "mouse" whose wheel slowly
          rolls down, and the whole thing drifts gently up and down. */}
      <motion.div
        style={{ opacity: contentOpacity }}
        className="absolute bottom-[10vh] left-1/2 z-30 -translate-x-1/2 sm:bottom-[11vh]"
      >
        <FadeUp delay={1.1}>
          <a
            href="#about"
            aria-label="Scroll to About"
            className="group flex flex-col items-center gap-3 text-white/85 transition-colors duration-300 hover:text-white motion-safe:animate-[cue-float_3.2s_ease-in-out_infinite]"
          >
            <span className="flex h-14 w-9 justify-center rounded-full border-[1.5px] border-current pt-2.5 drop-shadow-[0_1px_10px_rgb(0_0_0/0.45)]">
              <span className="h-2.5 w-[3px] rounded-full bg-current motion-safe:animate-[cue-wheel_2.6s_ease-in-out_infinite]" />
            </span>
            <span className="font-mono text-xs tracking-[0.3em] uppercase [text-shadow:0_1px_12px_rgb(0_0_0/0.6)] sm:text-[13px]">
              Scroll
            </span>
          </a>
        </FadeUp>
      </motion.div>

      {/* fog: a strip at rest, rising progressively as you scroll, handing off to About */}
      <CloudBank progress={scrollYProgress} />
    </section>
  );
}
