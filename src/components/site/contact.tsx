"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { ArrowUp, ArrowUpRight, Check, Copy, FileText, Mail } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "@/components/icons";
import { Constellation, ShootingStars } from "@/components/site/night-sky-effects";
import { site } from "@/lib/site";

/*
 * Contact: the night-sky finale of the "journey through the sky".
 * Your initials draw themselves as a constellation as you scroll in, shooting stars streak
 * past now and then, and the contact options sit below. Email and résumé cards only appear
 * once they're set in src/lib/site.ts.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

function Card({
  href,
  icon,
  label,
  value,
  external,
  download,
  index,
  children,
}: {
  href?: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  external?: boolean;
  download?: boolean;
  index: number;
  children?: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const body = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-glow transition-colors duration-300 group-hover:border-glow/60">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">{label}</span>
        <span className="mt-0.5 block truncate text-foreground">{value}</span>
      </span>
      {children ?? <ArrowUpRight className="size-4 text-muted-foreground transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-glow" />}
    </>
  );
  const cls =
    "group flex items-center gap-4 rounded-2xl border border-border bg-card/70 p-4 backdrop-blur-md transition-colors duration-300 hover:border-glow/40 sm:p-5";
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay: index * 0.07, ease: EASE }}
    >
      {href ? (
        <a
          href={href}
          className={cls}
          {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
          {...(download ? { download: "" } : {})}
        >
          {body}
        </a>
      ) : (
        <div className={cls}>{body}</div>
      )}
    </motion.div>
  );
}

function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async (e) => {
        e.preventDefault();
        try {
          await navigator.clipboard.writeText(email);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        } catch {
          window.location.href = `mailto:${email}`;
        }
      }}
      className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors duration-200 hover:border-glow hover:text-glow"
      aria-live="polite"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function Contact() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end end"] }); // fully drawn at the bottom of the page
  const drawn = useSpring(scrollYProgress, { stiffness: 80, damping: 22, restDelta: 0.001 });
  const full = useTransform(drawn, () => 1);
  const progress = reduce ? full : drawn;

  const cards: { key: string; el: (i: number) => React.ReactNode }[] = [
    site.email && {
      key: "email",
      el: (i: number) => (
        <Card index={i} href={`mailto:${site.email}`} icon={<Mail className="size-4" />} label="Email" value={site.email}>
          <CopyEmail email={site.email} />
        </Card>
      ),
    },
    {
      key: "linkedin",
      el: (i: number) => (
        <Card
          index={i}
          href={site.links.linkedin}
          external
          icon={<LinkedInIcon className="size-4" />}
          label="LinkedIn"
          value="andrew-nguyenn18"
        />
      ),
    },
    {
      key: "github",
      el: (i: number) => (
        <Card index={i} href={site.links.github} external icon={<GitHubIcon className="size-4" />} label="GitHub" value="Andrew126111" />
      ),
    },
    site.resume && {
      key: "resume",
      el: (i: number) => (
        <Card index={i} href={site.resume} download icon={<FileText className="size-4" />} label="Résumé" value="Download PDF" />
      ),
    },
  ].filter(Boolean) as { key: string; el: (i: number) => React.ReactNode }[];

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
            intersection of AI and real products. The fastest way to reach me is LinkedIn.
          </motion.p>
        </div>

        {/* your initials as a constellation, drawn as you scroll in */}
        <Constellation progress={progress} className="mx-auto w-full max-w-[420px] drop-shadow-[0_0_20px_rgb(94_224_255/0.15)]" />
      </div>

      <div className="relative mx-auto mt-14 grid w-full max-w-[1200px] gap-3 sm:gap-4 md:grid-cols-2">
        {cards.map((c, i) => (
          <div key={c.key}>{c.el(i)}</div>
        ))}
      </div>

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
