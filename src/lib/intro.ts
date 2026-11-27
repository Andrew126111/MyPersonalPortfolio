"use client";

import { useSyncExternalStore } from "react";

/*
 * Tiny shared flag for the opening "Signed, Andrew" intro (components/site/intro.tsx).
 * The hero waits on it so its entrance plays as the intro hands off, not hidden behind it.
 *
 * <html data-intro> tracks the same thing for CSS (set before first paint by a script in
 * layout.tsx): "play" while the intro runs, "skip" when it won't run, "done" after it.
 */

let done = false;
const listeners = new Set<() => void>();

export function finishIntro() {
  if (done) return;
  done = true;
  listeners.forEach((l) => l());
}

export function useIntroDone() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => done,
    () => false,
  );
}

/** Session flag so the intro only plays on the first visit in a browser session. */
export const INTRO_SEEN_KEY = "intro-seen";
