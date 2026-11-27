"use client";

import { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { useReducedMotion } from "motion/react";
import { Check, Mail } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "@/components/icons";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/*
 * Contact "playground": chunky pill stickers drop out of the night sky when the section
 * scrolls into view, pile up with real physics (matter-js), and can be grabbed and tossed.
 * Every pill is a real link or button: a quick click/tap (or Enter) does its action,
 * a drag just throws it around.
 *
 * The pills are normal DOM elements positioned from the physics bodies each frame, so they
 * stay focusable, readable by screen readers and crisp. Reduced motion: a still, wrapped pile.
 */

type Pill = {
  id: string;
  label: React.ReactNode;
  aria: string;
  shape: "pill" | "circle";
  className: string;
  href?: string;
  external?: boolean;
  action?: "message" | "copy";
};

const PILLS: Pill[] = [
  { id: "hi", label: "Say hi 👋", aria: "Say hi: open the message form", shape: "pill", action: "message", className: "bg-cream text-ink" },
  { id: "message", label: "Send a message", aria: "Send a message: open the message form", shape: "pill", action: "message", className: "bg-glow text-ink shadow-[0_0_30px_-6px_rgb(94_224_255/0.7)]" },
  { id: "email", label: "Email me", aria: `Email ${site.email}`, shape: "pill", href: `mailto:${site.email}`, className: "bg-sky-1 text-cream ring-1 ring-white/15" },
  { id: "linkedin", label: "LinkedIn", aria: "LinkedIn profile (opens in a new tab)", shape: "pill", href: site.links.linkedin, external: true, className: "bg-sky-3 text-white" },
  { id: "build", label: "Let's build", aria: "Let's build: open the message form", shape: "pill", action: "message", className: "bg-sky-4 text-ink" },
  { id: "github", label: "GitHub", aria: "GitHub profile (opens in a new tab)", shape: "pill", href: site.links.github, external: true, className: "bg-ink text-white ring-1 ring-white/25" },
  { id: "copy", label: "Copy email", aria: `Copy ${site.email} to the clipboard`, shape: "pill", action: "copy", className: "bg-white/90 text-ink" },
  { id: "i-mail", label: <Mail className="size-7" />, aria: `Email ${site.email}`, shape: "circle", href: `mailto:${site.email}`, className: "bg-glow text-ink" },
  { id: "i-in", label: <LinkedInIcon className="size-7" />, aria: "LinkedIn profile (opens in a new tab)", shape: "circle", href: site.links.linkedin, external: true, className: "bg-cream text-ink" },
  { id: "i-gh", label: <GitHubIcon className="size-7" />, aria: "GitHub profile (opens in a new tab)", shape: "circle", href: site.links.github, external: true, className: "bg-sky-2 text-white" },
];

const pillBase =
  "absolute top-0 left-0 flex cursor-grab touch-none items-center justify-center font-heading font-bold whitespace-nowrap select-none will-change-transform active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-glow";
const pillSize = "h-14 rounded-full px-6 text-xl sm:h-16 sm:px-8 sm:text-2xl";
const circleSize = "size-14 rounded-full sm:size-16";

export function ContactPills({ onMessage }: { onMessage: () => void }) {
  const reduce = useReducedMotion();
  const [copied, setCopied] = useState(false);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${site.email}`;
    }
  }

  return (
    <div className="relative">
      {reduce ? (
        <StaticPile onMessage={onMessage} onCopy={copyEmail} />
      ) : (
        <PhysicsPile onMessage={onMessage} onCopy={copyEmail} />
      )}
      {/* copy confirmation */}
      <div
        aria-live="polite"
        className={cn(
          "pointer-events-none absolute top-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm backdrop-blur-md transition-all duration-300",
          copied ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
        )}
      >
        {copied && (
          <>
            <Check className="size-4 text-glow" /> Email copied
          </>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── physics ───────────────────────── */

function PhysicsPile({ onMessage, onCopy }: { onMessage: () => void; onCopy: () => void }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const els = useRef<(HTMLElement | null)[]>([]);
  const dragged = useRef(false);
  const actions = useRef({ onMessage, onCopy });
  useEffect(() => {
    actions.current = { onMessage, onCopy };
  });

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const { Engine, Bodies, Body, Composite, Constraint, Sleeping } = Matter;

    const engine = Engine.create({ enableSleeping: true });
    engine.gravity.y = 1.1;
    const world = engine.world;

    let W = box.clientWidth;
    let H = box.clientHeight;
    const T = 200; // wall thickness
    const walls = {
      floor: Bodies.rectangle(W / 2, H + T / 2, W * 3, T, { isStatic: true }),
      left: Bodies.rectangle(-T / 2, H / 2 - 400, T, H * 3, { isStatic: true }),
      right: Bodies.rectangle(W + T / 2, H / 2 - 400, T, H * 3, { isStatic: true }),
      ceiling: Bodies.rectangle(W / 2, -900, W * 3, T, { isStatic: true }),
    };
    Composite.add(world, Object.values(walls));

    const bodies: (Matter.Body | null)[] = PILLS.map(() => null);
    let started = false;
    let raf = 0;
    let visible = false;
    const timers: number[] = [];

    // Drop the pills in one by one from above, at random spots and tilts.
    function start() {
      if (started) return;
      started = true;
      PILLS.forEach((p, i) => {
        timers.push(
          window.setTimeout(() => {
            const el = els.current[i];
            if (!el) return;
            const w = el.offsetWidth;
            const h = el.offsetHeight;
            const x = Math.min(W - w / 2 - 8, Math.max(w / 2 + 8, W * (0.15 + Math.random() * 0.7)));
            const opts = { restitution: 0.35, friction: 0.4, frictionAir: 0.012, density: 0.002 };
            const b =
              p.shape === "circle"
                ? Bodies.circle(x, -h - 20, w / 2, opts)
                : Bodies.rectangle(x, -h - 20, w, h, { ...opts, chamfer: { radius: h / 2 - 1 } });
            Body.setAngle(b, (Math.random() - 0.5) * 0.9);
            Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.08);
            bodies[i] = b;
            Composite.add(world, b);
            el.style.opacity = "1";
          }, 140 * i),
        );
      });
    }

    // Fixed 60 Hz physics steps driven by real elapsed time, so the pile falls at the same speed
    // on 120 Hz screens, slow phones, or a throttled tab (capped so a long pause can't explode).
    const STEP = 1000 / 60;
    let last = 0;
    let acc = 0;
    function frame(now: number) {
      acc += last ? Math.min(now - last, 250) : STEP;
      last = now;
      let n = 0;
      while (acc >= STEP && n < 15) {
        Engine.update(engine, STEP);
        acc -= STEP;
        n++;
      }
      if (n === 15) acc = 0;
      bodies.forEach((b, i) => {
        const el = els.current[i];
        if (!b || !el) return;
        // anything that escaped the box drops back in from the top
        if (b.position.x < -150 || b.position.x > W + 150 || b.position.y > H + 150 || b.position.y < -1200) {
          Body.setPosition(b, { x: W * (0.2 + Math.random() * 0.6), y: -el.offsetHeight - 20 });
          Body.setVelocity(b, { x: 0, y: 0 });
          Body.setAngularVelocity(b, 0);
        }
        el.style.transform = `translate(${b.position.x - el.offsetWidth / 2}px, ${b.position.y - el.offsetHeight / 2}px) rotate(${b.angle}rad)`;
      });
      if (visible) raf = requestAnimationFrame(frame);
      else {
        raf = 0;
        last = 0;
      }
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) {
          if (entry.intersectionRatio > 0.6) start(); // most of it on screen, so you see them fall
          if (!raf) raf = requestAnimationFrame(frame);
        }
      },
      { threshold: [0, 0.6] },
    );
    io.observe(box);

    // keep the walls at the box edges; nudge anything left outside back in
    const ro = new ResizeObserver(() => {
      W = box.clientWidth;
      H = box.clientHeight;
      Body.setPosition(walls.floor, { x: W / 2, y: H + T / 2 });
      Body.setPosition(walls.right, { x: W + T / 2, y: H / 2 - 400 });
      Body.setPosition(walls.ceiling, { x: W / 2, y: -900 });
      bodies.forEach((b) => {
        if (!b) return;
        Sleeping.set(b, false);
        if (b.position.x > W - 20) Body.setPosition(b, { x: W - 60, y: b.position.y - 40 });
      });
    });
    ro.observe(box);

    // ── grab and toss ──
    let grab: { i: number; c: Matter.Constraint; x0: number; y0: number; t0: number; id: number } | null = null;
    const local = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onDown = (i: number) => (e: PointerEvent) => {
      const b = bodies[i];
      if (!b || e.button > 0) return;
      const p = local(e);
      Sleeping.set(b, false);
      const offset = Matter.Vector.rotate({ x: p.x - b.position.x, y: p.y - b.position.y }, -b.angle);
      const c = Constraint.create({ pointA: p, bodyB: b, pointB: offset, stiffness: 0.15, damping: 0.1, length: 0 });
      Composite.add(world, c);
      grab = { i, c, x0: e.clientX, y0: e.clientY, t0: performance.now(), id: e.pointerId };
      dragged.current = false;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!grab || e.pointerId !== grab.id) return;
      grab.c.pointA = local(e);
      if (Math.hypot(e.clientX - grab.x0, e.clientY - grab.y0) > 6) dragged.current = true;
    };
    const MAX_SPEED = 28;
    const onUp = (e: PointerEvent) => {
      if (!grab || e.pointerId !== grab.id) return;
      Composite.remove(world, grab.c);
      if (performance.now() - grab.t0 > 350) dragged.current = true;
      // cap the throw so a hard flick can't punch through the walls
      const b = bodies[grab.i];
      if (b) {
        const v = b.velocity;
        const sp = Math.hypot(v.x, v.y);
        if (sp > MAX_SPEED) Body.setVelocity(b, { x: (v.x / sp) * MAX_SPEED, y: (v.y / sp) * MAX_SPEED });
      }
      grab = null;
      // the click (if any) fires right after pointerup; clear the flag after it so a drag that
      // ends off the pill can't swallow the next real click or Enter press
      window.setTimeout(() => (dragged.current = false), 0);
    };
    const cleanups = PILLS.map((_, i) => {
      const el = els.current[i];
      if (!el) return () => {};
      const down = onDown(i);
      el.addEventListener("pointerdown", down);
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerup", onUp);
      el.addEventListener("pointercancel", onUp);
      return () => {
        el.removeEventListener("pointerdown", down);
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerup", onUp);
        el.removeEventListener("pointercancel", onUp);
      };
    });

    return () => {
      io.disconnect();
      ro.disconnect();
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      cleanups.forEach((c) => c());
      Composite.clear(world, false);
      Engine.clear(engine);
    };
  }, []);

  // A drag shouldn't also count as a click.
  function guard(e: React.MouseEvent, run?: () => void) {
    if (dragged.current) {
      e.preventDefault();
      dragged.current = false;
      return;
    }
    if (run) {
      e.preventDefault();
      run();
    }
  }

  return (
    <div
      ref={boxRef}
      className="relative h-[420px] w-full overflow-hidden rounded-3xl sm:h-[440px]"
      role="group"
      aria-label="Ways to reach me (you can also drag them around)"
    >
      {PILLS.map((p, i) => {
        const cls = cn(pillBase, p.shape === "circle" ? circleSize : pillSize, p.className);
        const style = { opacity: 0, transform: "translate(-999px, -999px)" };
        const ref = (el: HTMLElement | null) => {
          els.current[i] = el;
        };
        const run = p.action === "message" ? () => actions.current.onMessage() : p.action === "copy" ? () => actions.current.onCopy() : undefined;
        return p.href ? (
          <a
            key={p.id}
            ref={ref}
            href={p.href}
            aria-label={p.aria}
            draggable={false}
            {...(p.external ? { target: "_blank", rel: "noreferrer" } : {})}
            onClick={(e) => guard(e)}
            className={cls}
            style={style}
          >
            {p.label}
          </a>
        ) : (
          <button key={p.id} ref={ref} type="button" aria-label={p.aria} onClick={(e) => guard(e, run)} className={cls} style={style}>
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

/* ───────────────────────── reduced motion ───────────────────────── */

function StaticPile({ onMessage, onCopy }: { onMessage: () => void; onCopy: () => void }) {
  const tilt = ["-rotate-6", "rotate-3", "-rotate-2", "rotate-6", "-rotate-3", "rotate-2", "-rotate-6", "rotate-0", "rotate-3", "-rotate-2"];
  return (
    <div className="flex flex-wrap items-end justify-center gap-3 py-10" role="group" aria-label="Ways to reach me">
      {PILLS.map((p, i) => {
        const cls = cn(
          "flex items-center justify-center font-heading font-bold whitespace-nowrap",
          p.shape === "circle" ? circleSize : pillSize,
          p.className,
          tilt[i % tilt.length],
        );
        return p.href ? (
          <a key={p.id} href={p.href} aria-label={p.aria} {...(p.external ? { target: "_blank", rel: "noreferrer" } : {})} className={cls}>
            {p.label}
          </a>
        ) : (
          <button key={p.id} type="button" aria-label={p.aria} onClick={p.action === "copy" ? onCopy : onMessage} className={cls}>
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
