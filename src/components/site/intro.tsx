"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Signature } from "@/components/signature";
import { INTRO_SEEN_KEY, finishIntro } from "@/lib/intro";

/*
 * Opening intro, "Signed, Andrew": the site opens like a letter being signed.
 *
 *   1. A night sky (deep navy, faint twinkling stars, a soft cyan glow) covers the page.
 *   2. My signature writes itself in the middle; a name line and a hairline progress bar sit
 *      under it while the page finishes loading.
 *   3. Hand-off: the signature shrinks and flies into the nav logo's exact spot while the sky
 *      fades away, revealing the hero, whose entrance starts at that moment.
 *
 * First visit per browser session only. Skipped (decided before first paint by a script in
 * layout.tsx) for return visits, deep links (#contact), reduced motion, and no-JS. It waits for
 * the page to load but never longer than MAX_WAIT, and a CSS failsafe hides it regardless.
 */

const WRITE_DELAY = 0.35; // s before the pen starts
const WRITE = 2.0; // s to write the signature
const MIN_WAIT = 2700; // ms: let the signature finish
const MAX_WAIT = 4500; // ms: never hold the page longer than this
const FLY = 0.95; // s for the hand-off to the nav

// Deterministic star field (same on server and client, so no hydration mismatch).
const STARS = (() => {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: 70 }, () => ({
    x: Math.round(rnd() * 1000) / 10,
    y: Math.round(rnd() * 1000) / 10,
    r: Math.round((0.5 + rnd() * 1.3) * 10) / 10,
    d: Math.round(rnd() * 40) / 10,
  }));
})();

type Fly = { x: number; y: number; scale: number };

export function Intro() {
  const sigRef = useRef<HTMLDivElement>(null);
  const [fly, setFly] = useState<Fly | null>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    if (html.dataset.intro !== "play") {
      finishIntro(); // skipped: CSS already hides the overlay, so just let the hero go
      return;
    }
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {
      /* private mode: it'll just play again next time */
    }
    document.body.style.overflow = "hidden";

    const loaded = new Promise<void>((res) =>
      document.readyState === "complete" ? res() : window.addEventListener("load", () => res(), { once: true }),
    );
    const wait = (ms: number) => new Promise<void>((res) => window.setTimeout(res, ms));
    let cancelled = false;

    Promise.race([Promise.all([loaded, wait(MIN_WAIT)]), wait(MAX_WAIT)]).then(() => {
      if (cancelled) return;
      // measure where the nav logo sits and fly the signature there
      const logo = document.querySelector("[data-logo] svg")?.getBoundingClientRect();
      const sig = sigRef.current?.getBoundingClientRect();
      if (logo && sig && sig.width > 0) {
        setFly({
          x: logo.left + logo.width / 2 - (sig.left + sig.width / 2),
          y: logo.top + logo.height / 2 - (sig.top + sig.height / 2),
          scale: logo.width / sig.width,
        });
      } else {
        setFly({ x: 0, y: -40, scale: 0.6 });
      }
      document.body.style.overflow = "";
      finishIntro(); // the hero starts its entrance as the sky fades
    });

    return () => {
      cancelled = true;
      document.body.style.overflow = "";
    };
  }, []);

  function done() {
    document.documentElement.dataset.intro = "done"; // reveals the real nav logo
    setGone(true);
  }

  if (gone) return null;
  const leaving = fly !== null;

  return (
    <div id="intro" aria-hidden="true" className="fixed inset-0 z-[100]">
      {/* the sky, which fades away on hand-off */}
      <motion.div
        className="absolute inset-0 overflow-hidden bg-[radial-gradient(120%_80%_at_50%_45%,#123055_0%,#0a1a30_45%,#050d19_100%)]"
        initial={false}
        animate={{ opacity: leaving ? 0 : 1 }}
        transition={{ duration: FLY * 0.85, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
      >
        {STARS.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white motion-safe:animate-[twinkle_4s_ease-in-out_infinite]"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.r, height: s.r, animationDelay: `${s.d}s`, opacity: 0.5 }}
          />
        ))}
        <div className="absolute top-1/2 left-1/2 size-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(94_224_255/0.14),transparent)] blur-2xl" />
      </motion.div>

      {/* signature + caption, centred */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
        <motion.div
          ref={sigRef}
          className="w-[min(78vw,520px)] text-white"
          initial={false}
          animate={leaving ? { x: fly.x, y: fly.y, scale: fly.scale } : { x: 0, y: 0, scale: 1 }}
          transition={{ duration: FLY, ease: [0.65, 0, 0.35, 1] }}
          onAnimationComplete={() => leaving && done()}
        >
          <Signature
            title=""
            delay={WRITE_DELAY}
            duration={WRITE}
            className="w-full drop-shadow-[0_0_24px_rgb(94_224_255/0.35)]"
          />
        </motion.div>

        <motion.div
          className="mt-8 flex w-[min(84vw,300px)] flex-col items-center gap-3"
          initial={{ opacity: 0, y: 6 }}
          animate={leaving ? { opacity: 0, y: 6 } : { opacity: 1, y: 0 }}
          transition={{ duration: leaving ? 0.25 : 0.8, delay: leaving ? 0 : 0.5 }}
        >
          <p className="font-mono text-xs tracking-[0.26em] whitespace-nowrap text-white/75 uppercase">Andrew Nguyen · Portfolio</p>
          <span className="relative h-px w-full overflow-hidden bg-white/12">
            <motion.span
              className="absolute inset-y-0 left-0 bg-glow shadow-[0_0_8px_rgb(94_224_255/0.8)]"
              initial={{ width: "0%" }}
              animate={{ width: leaving ? "100%" : "85%" }}
              transition={{ duration: leaving ? 0.3 : WRITE + WRITE_DELAY, ease: "easeOut" }}
            />
          </span>
        </motion.div>
      </div>
    </div>
  );
}
