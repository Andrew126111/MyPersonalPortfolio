"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { ArrowUp } from "lucide-react";
import { ContactForm, type ContactFormHandle } from "@/components/site/contact-form";
import { ContactPills } from "@/components/site/contact-pills";
import { ShootingStars } from "@/components/site/night-sky-effects";
import { Signature } from "@/components/signature";
import { site } from "@/lib/site";

/*
 * Contact: the night-sky finale of the "journey through the sky".
 * My signature writes itself as you scroll in (like signing off a letter), shooting stars
 * streak past now and then, and below, the contact options fall out of the sky as chunky
 * pills you can grab and toss (contact-pills.tsx); the message pills open a form.
 * A résumé link appears once `site.resume` is set in src/lib/site.ts.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

export function Contact() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end end"] }); // signature finishes at the bottom of the page
  const drawn = useSpring(scrollYProgress, { stiffness: 80, damping: 22, restDelta: 0.001 });
  const full = useTransform(drawn, () => 1);
  const progress = reduce ? full : drawn;

  const form = useRef<ContactFormHandle>(null);

  return (
    <section
      ref={ref}
      id="contact"
      aria-labelledby="contact-title"
      className="relative scroll-mt-16 overflow-hidden px-4 pt-24 pb-10 sm:px-6 sm:pt-36"
    >
      <ShootingStars className="pointer-events-none absolute inset-0" />

      <div className="relative mx-auto grid w-full max-w-[1200px] items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
            className="font-mono text-xs tracking-[0.12em] text-glow uppercase"
          >
            04 · Contact
          </motion.p>
          <motion.h2
            id="contact-title"
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.05, ease: EASE }}
            className="mt-4 font-heading text-[12vw] leading-[0.95] font-medium tracking-[-0.045em] text-cream sm:text-6xl lg:text-7xl"
          >
            Let&apos;s build
            <br />
            something <span className="text-glow">together.</span>
          </motion.h2>
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.12, ease: EASE }}
            className="mt-6 max-w-[46ch] text-[17px] leading-relaxed text-muted-foreground"
          >
            I&apos;m open to internships and interesting projects, especially anything at the
            intersection of AI and real products. Pick a way to reach me below.
          </motion.p>
        </div>

        {/* sign-off: the journey ends like a letter, my signature written as you scroll in */}
        <div className="mx-auto w-full max-w-[460px]">
          <p className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">Talk soon,</p>
          <Signature
            progress={progress}
            className="mt-2 w-full text-cream drop-shadow-[0_0_18px_rgb(94_224_255/0.3)]"
          />
        </div>
      </div>

      {/* the playground: contact pills that fall from the sky; grab, toss, or click them */}
      <div className="relative mx-auto mt-16 w-full max-w-[1200px] sm:mt-20">
        <p className="mb-3 text-center font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          Grab one, toss it, or click to reach out
        </p>
        <ContactPills onMessage={() => form.current?.open()} />
        {site.resume && (
          <p className="mt-4 text-center text-sm">
            <a href={site.resume} download className="text-muted-foreground underline-offset-4 hover:text-glow hover:underline">
              Download my résumé (PDF)
            </a>
          </p>
        )}
      </div>
      <ContactForm ref={form} />

      {/* footer */}
      <footer className="relative mx-auto mt-24 flex w-full max-w-[1200px] flex-col items-start justify-between gap-4 border-t border-border/70 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
        <p>
          © {site.year} {site.name}. Built with Next.js under a blue-hour sky.
        </p>
        <a href="#top" className="inline-flex items-center gap-1.5 transition-colors duration-200 hover:text-glow">
          Back to the top <ArrowUp className="size-3.5" />
        </a>
      </footer>
    </section>
  );
}
