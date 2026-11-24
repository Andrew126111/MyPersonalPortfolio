"use client";

import { useState } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";
import { GitHubIcon, LinkedInIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";

/**
 * The one site nav, always on screen. Over the hero it's transparent so the video shows
 * through; once you scroll past the hero it picks up a frosted navy background.
 */
export function Nav() {
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setSolid(y > window.innerHeight * 0.85));

  const iconCls =
    "flex size-9 items-center justify-center rounded-full text-white/80 transition-colors duration-200 hover:bg-white/10 hover:text-white";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-500",
        solid ? "border-border bg-ink/70 backdrop-blur-md" : "border-transparent bg-transparent",
      )}
    >
      <nav
        aria-label="Primary"
        className={cn(
          "mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6",
          !solid && "[text-shadow:0_1px_12px_rgb(0_0_0/0.45)]",
        )}
      >
        <a href="#top" className="font-heading text-base font-medium tracking-tight text-white">
          {site.handle}
          <span className="text-glow">.</span>
        </a>
        <ul className="flex items-center gap-1 text-sm text-white/80">
          {site.nav
            .filter((item) => item.href !== "#contact")
            .map((item) => (
              <li key={item.href} className="hidden sm:block">
                <a href={item.href} className="rounded-full px-3 py-1.5 transition-colors duration-200 hover:text-white">
                  {item.label}
                </a>
              </li>
            ))}
          <li className="sm:ml-2">
            <a href={site.links.github} target="_blank" rel="noreferrer" aria-label="GitHub" className={iconCls}>
              <GitHubIcon className="size-4" />
            </a>
          </li>
          <li>
            <a href={site.links.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className={iconCls}>
              <LinkedInIcon className="size-4" />
            </a>
          </li>
          <li>
            <a
              href="#contact"
              className="ml-2 rounded-full border border-white/25 px-4 py-1.5 text-white transition-colors duration-200 hover:border-glow hover:text-glow"
            >
              Say hi
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
