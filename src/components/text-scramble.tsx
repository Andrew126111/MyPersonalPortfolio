"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

const GLYPHS = "abcdefghijklmnopqrstuvwxyz";

type Props = {
  text: string;
  className?: string;
  /** ms per frame; lower = faster */
  speed?: number;
};

/**
 * Text that "decodes" itself from random letters on mount, and again on hover.
 *
 * Layout never shifts: each word renders its real text invisibly to reserve space,
 * with the scrambling copy laid over it. Screen readers only get the real text.
 */
export function TextScramble({ text, className, speed = 32 }: Props) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(text);
  const frame = useRef<number | null>(null);

  const run = useCallback(() => {
    if (reduce || frame.current) return;
    // Background tabs pause animation frames; don't leave the headline half-scrambled.
    if (document.hidden) {
      setDisplay(text);
      return;
    }
    let tick = 0;
    let last = 0;
    const step = (t: number) => {
      if (t - last >= speed) {
        last = t;
        tick++;
        const revealed = Math.floor(tick * 0.8);
        if (revealed >= text.length) {
          setDisplay(text);
          frame.current = null;
          return;
        }
        setDisplay(
          text
            .split("")
            .map((ch, i) =>
              ch === " " || i < revealed
                ? ch
                : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
            )
            .join(""),
        );
      }
      frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
  }, [text, speed, reduce]);

  useEffect(() => {
    run();
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, [run]);

  const realWords = text.split(" ");
  const shownWords = display.split(" ");

  return (
    <span className={className} onMouseEnter={run}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {realWords.map((word, i) => (
          <Fragment key={i}>
            <span className="relative inline-block whitespace-nowrap">
              <span className="invisible">{word}</span>
              <span className="absolute inset-0">{shownWords[i]}</span>
            </span>
            {i < realWords.length - 1 && " "}
          </Fragment>
        ))}
      </span>
    </span>
  );
}
