"use client";

import { useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

export function Nav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  return (
    <motion.header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled
          ? "border-b border-border bg-ink/70 backdrop-blur-md"
          : "border-b border-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <a href="#top" className="font-heading text-[15px] font-medium tracking-tight">
          {site.handle}
          <span className="text-lime">.</span>
        </a>
        <ul className="flex items-center gap-1 text-sm text-muted-foreground">
          {site.nav.map((item) => (
            <li key={item.href} className="hidden sm:block">
              <a
                href={item.href}
                className="rounded-full px-3 py-1.5 transition-colors duration-200 hover:text-foreground"
              >
                {item.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href="#contact"
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
