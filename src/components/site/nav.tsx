"use client";

import { useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { site } from "@/lib/site";

/**
 * Sticky site nav. Hidden while the hero is on screen (the hero has its own tab nav),
 * then slides down once you've scrolled past it.
 */
export function Nav() {
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setVisible(y > window.innerHeight * 0.85));

  return (
    <motion.header
      initial={false}
      animate={{ y: visible ? 0 : "-110%" }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50 border-b border-border bg-ink/70 backdrop-blur-md"
      aria-hidden={!visible}
    >
      <nav className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <a href="#top" tabIndex={visible ? 0 : -1} className="font-heading text-[15px] font-medium tracking-tight">
          {site.handle}
          <span className="text-lime">.</span>
        </a>
        <ul className="flex items-center gap-1 text-sm text-muted-foreground">
          {site.nav
            .filter((item) => item.href !== "#contact")
            .map((item) => (
              <li key={item.href} className="hidden sm:block">
                <a
                  href={item.href}
                  tabIndex={visible ? 0 : -1}
                  className="rounded-full px-3 py-1.5 transition-colors duration-200 hover:text-foreground"
                >
                  {item.label}
                </a>
              </li>
            ))}
          <li>
            <a
              href="#contact"
              tabIndex={visible ? 0 : -1}
              className="ml-2 rounded-full border border-border px-4 py-1.5 text-foreground transition-colors duration-200 hover:border-lime hover:text-lime"
            >
              Say hi
            </a>
          </li>
        </ul>
      </nav>
    </motion.header>
  );
}
