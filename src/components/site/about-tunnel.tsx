"use client";

import Image from "next/image";
import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";
import type { LifePhoto } from "@/content/life";

/*
 * 3D perspective tunnel, adapted from 21st.dev's perspective-tunnel-hero.
 *
 * Photos are spread around the centre (golden-angle spiral) and fly from far away
 * (-z) toward and past the viewer as `progress` goes 0 → 1. The big title scales up
 * behind them. Near the end, the whole layer fades out so the photo circle/arc in
 * LifeGallery can take over.
 *
 * Changes from the original: driven by page scroll (passed in as `progress`) instead of
 * hijacking the mouse wheel, uses your own life photos, Ink colours instead of indigo.
 */

type Stage = { w: number; h: number };
type Pointer = { x: MotionValue<number>; y: MotionValue<number> };

const SPRING = { stiffness: 60, damping: 25, mass: 0.5 };
const round = (v: number) => Math.round(v * 100) / 100; // keep SSR and client identical

/** Camera pans gently with the mouse (-1..1 on each axis). */
function useCameraPan(): Pointer {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, SPRING);
  const y = useSpring(rawY, SPRING);
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      rawX.set((e.clientX / window.innerWidth - 0.5) * 2);
      rawY.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [rawX, rawY]);
  return { x, y };
}

function TunnelCard({
  photo,
  index,
  total,
  progress,
  pointer,
  stage,
}: {
  photo: LifePhoto;
  index: number;
  total: number;
  progress: MotionValue<number>;
  pointer: Pointer;
  stage: Stage;
}) {
  const mobile = stage.w < 768;

  // Each card gets a staggered slice of the overall progress.
  const span = 0.55;
  const start = (index / total) * (1 - span);
  const local = useTransform(progress, [start, start + span], [0, 1]);
  const z = useTransform(local, [0, 1], [mobile ? -1200 : -1700, mobile ? 350 : 500]);
  const opacity = useTransform(local, [0, 0.18, 0.82, 0.98], [0, 1, 1, 0]);

  // Golden-angle spiral placement around the centre.
  const angle = index * 137.5 * (Math.PI / 180);
  const rx = 0.28 + (index % 3) * 0.08;
  const ry = 0.26 + (index % 2) * 0.09;
  const baseX = round(Math.cos(angle) * stage.w * rx);
  const baseY = round(Math.sin(angle) * stage.h * ry);
  const rotZ = (index % 2 === 0 ? 1 : -1) * (3 + (index % 5) * 2);
  const pan = mobile ? 20 : 45;
  const width = mobile
    ? Math.max(130, Math.min(180, stage.w * 0.38))
    : Math.max(180, Math.min(270, stage.w * 0.18));

  const transform = useTransform([z, pointer.x, pointer.y], ([cz, px, py]: number[]) => {
    const x = round(baseX - px * pan);
    const y = round(baseY - py * pan);
    return `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), ${round(cz)}px) rotateZ(${rotZ}deg)`;
  });

  return (
    <motion.div
      style={{ width, transform, opacity, zIndex: index + 1 }}
      className="absolute top-1/2 left-1/2 aspect-[4/5] will-change-transform"
    >
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-surface shadow-2xl shadow-black/90 ring-1 ring-white/15">
        <Image src={photo.src} alt="" fill sizes="270px" className="object-cover" style={{ objectPosition: photo.focus }} />
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-black/10 to-transparent p-4">
          <span className="font-mono text-xs tracking-widest text-white/95 uppercase drop-shadow-md">
            {photo.title}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function TunnelLayer({
  progress,
  stage,
  photos,
}: {
  progress: MotionValue<number>;
  stage: Stage;
  photos: LifePhoto[];
}) {
  const pointer = useCameraPan();
  const mobile = stage.w < 768;

  const titleScale = useTransform(progress, [0, 0.5, 1], [0.7, 1, 1.35]);
  // Title leaves first, then the remaining photos, so the hand-off to the circle is clean.
  const titleOpacity = useTransform(progress, [0, 0.12, 0.64, 0.78], [0.25, 1, 1, 0]);
  const promptOpacity = useTransform(progress, [0, 0.12], [1, 0]);
  const layerOpacity = useTransform(progress, [0.8, 0.95], [1, 0]);

  return (
    <motion.div
      style={{ opacity: layerOpacity }}
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
    >
      {/* depth rings (the cloud sky behind the section is the background) */}
      <div className="absolute size-[48vmin] rounded-full border border-white/15" />
      <div className="absolute size-[76vmin] rounded-full border border-dashed border-white/10" />

      {/* title (this is the About section's heading) */}
      <motion.div
        style={{ scale: titleScale, opacity: titleOpacity }}
        className="z-0 flex max-w-xl flex-col items-center px-6 text-center"
      >
        <p className="mb-4 font-mono text-xs tracking-[0.4em] text-glow uppercase">01 · About</p>
        <h2
          id="about-title"
          className="bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-5xl leading-[0.9] font-bold tracking-tighter text-transparent sm:text-7xl md:text-8xl"
        >
          HI, I&apos;M
          <br />
          ANDREW.
        </h2>
        <p className="mt-4 max-w-[36ch] text-sm text-muted-foreground sm:text-base">
          Keep scrolling to fly through a few snapshots of my life.
        </p>
      </motion.div>

      {/* scroll prompt */}
      <motion.div
        style={{ opacity: promptOpacity }}
        className="absolute bottom-8 z-20 flex flex-col items-center gap-2 font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase"
      >
        <span>Scroll to explore</span>
        <div className="h-6 w-px bg-gradient-to-b from-glow to-transparent" />
      </motion.div>

      {/* 3D space */}
      <div
        className="absolute inset-0"
        style={{ perspective: mobile ? 900 : 1200, transformStyle: "preserve-3d" }}
      >
        <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
          {photos.map((photo, i) => (
            <TunnelCard
              key={photo.src}
              photo={photo}
              index={i}
              total={photos.length}
              progress={progress}
              pointer={pointer}
              stage={stage}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
