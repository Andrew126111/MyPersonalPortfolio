"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";
import { Check, CreditCard, Database, FileSpreadsheet, Mail, Plane, Presentation, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Scroll-driven illustrations for each role. Both take `progress` (0 → 1 as the role
 * scrolls through the screen) and play their story forward/backward with it.
 *
 * No panels: they're drawn straight onto the page's sky (dusk turning to night here), so the
 * flight crosses the actual sky and the pipeline reads like the first stars coming out.
 */

const stage = "relative h-full w-full";

/** Re-render only when `progress` crosses a threshold (cheap way to toggle pop-ins). */
function useStep(progress: MotionValue<number>, thresholds: number[]) {
  const count = (v: number) => thresholds.filter((t) => v >= t).length;
  const [step, setStep] = useState(() => count(progress.get()));
  useMotionValueEvent(progress, "change", (v) => {
    const s = count(v);
    if (s !== step) setStep(s);
  });
  return step;
}

function Toast({
  show,
  className,
  children,
}: {
  show: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "absolute flex items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.06] px-3.5 py-2 text-xs text-foreground/90 shadow-[0_12px_32px_-16px_rgb(0_0_0/0.8)] backdrop-blur-md",
            className,
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ───────────────────────── CoTriplyy: flight path ───────────────────────── */

// Kept in the upper part of the visual so the chips along the bottom never cover it.
const FLIGHT_PATH = "M 70 150 C 170 0, 360 -10, 450 100";

export function FlightVisual({ progress }: { progress: MotionValue<number> }) {
  const pathRef = useRef<SVGPathElement>(null);
  const planeRef = useRef<SVGGElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const step = useStep(progress, [0.08, 0.55, 0.82]);

  // Fly the plane along the path and count airlines as it goes.
  const apply = (p: number) => {
    const path = pathRef.current;
    const plane = planeRef.current;
    if (path && plane) {
      const len = path.getTotalLength();
      const t = Math.min(Math.max(p, 0), 1);
      const a = path.getPointAtLength(t * len);
      const b = path.getPointAtLength(Math.min(len, t * len + 1));
      const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      plane.setAttribute("transform", `translate(${a.x} ${a.y}) rotate(${angle + 45})`);
    }
    if (counterRef.current) {
      counterRef.current.textContent = String(Math.round(Math.min(1, p / 0.5) * 300));
    }
  };
  useMotionValueEvent(progress, "change", apply);
  // Also place things on mount (page loaded mid-scroll, or reduced motion where progress is fixed).
  useEffect(() => apply(progress.get()));
  const trail = useTransform(progress, [0, 1], [0, 1]);

  return (
    <div className={stage} aria-hidden="true">
      <svg viewBox="0 0 520 300" className="absolute inset-0 h-full w-full">
        {/* dashed route + the part already flown */}
        <defs>
          <filter id="flight-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
        <path ref={pathRef} d={FLIGHT_PATH} fill="none" stroke="white" strokeOpacity="0.18" strokeWidth="1.5" strokeDasharray="3 7" />
        {/* contrail: a soft glow under a crisp line */}
        <motion.path d={FLIGHT_PATH} fill="none" stroke="var(--glow)" strokeOpacity="0.5" strokeWidth="6" filter="url(#flight-glow)" style={{ pathLength: trail }} />
        <motion.path d={FLIGHT_PATH} fill="none" stroke="var(--glow)" strokeWidth="2" strokeLinecap="round" style={{ pathLength: trail }} />
        {/* airports */}
        {[
          { x: 70, y: 150, code: "YYZ", city: "Toronto" },
          { x: 450, y: 100, code: "LIS", city: "Lisbon" },
        ].map((a) => (
          <g key={a.code}>
            <circle cx={a.x} cy={a.y} r="14" fill="var(--glow)" opacity="0.12" />
            <circle cx={a.x} cy={a.y} r="3.5" fill="white" />
            <text x={a.x} y={a.y + 26} textAnchor="middle" fill="var(--foreground)" fontSize="14" fontFamily="var(--font-mono)">
              {a.code}
            </text>
            <text x={a.x} y={a.y + 42} textAnchor="middle" fill="var(--muted-foreground)" fontSize="10">
              {a.city}
            </text>
          </g>
        ))}
        {/* plane (Lucide icon path, drawn at the current point) */}
        <g ref={planeRef} transform="translate(70 150)">
          <g transform="translate(-12 -12)">
            <circle cx="12" cy="12" r="16" fill="var(--glow)" opacity="0.14" />
            <Plane x={0} y={0} width={24} height={24} color="white" strokeWidth={1.75} />
          </g>
        </g>
      </svg>

      <Toast show={step >= 1} className="top-4 left-4">
        <Sparkles className="size-4 text-glow" />
        <span>
          Searching <span ref={counterRef} className="font-mono text-glow tabular-nums">300</span> airlines
          <span className="text-muted-foreground"> · Duffel</span>
        </span>
      </Toast>
      {/* checkout + confirmation stack along the bottom */}
      <div className="absolute inset-x-4 bottom-4 flex flex-col items-start gap-2">
        <Toast show={step >= 2} className="relative">
          <CreditCard className="size-4 text-glow" />
          <span>
            Checkout <span className="font-mono">CAD ⇄ USD</span>
            <span className="text-muted-foreground"> · Stripe</span>
          </span>
          <Check className="size-3.5 text-glow" />
        </Toast>
        <Toast show={step >= 3} className="relative">
          <Mail className="size-4 text-glow" />
          <span>
            Booking confirmed, email sent<span className="text-muted-foreground"> · Resend</span>
          </span>
        </Toast>
      </div>
    </div>
  );
}

/* ───────────────────────── Wayfair: AI pipeline ───────────────────────── */

// Node positions in a 100 × 60 coordinate space (x%, y in sixtieths of the height).
// Zig-zag over two rows so every label has room.
const NODES = [
  { id: "amazon", label: "Amazon", icon: Database, x: 14, y: 20 },
  { id: "trends", label: "Trends", icon: TrendingUp, x: 14, y: 44 },
  { id: "n8n", label: "n8n · Docker", icon: Sparkles, x: 38, y: 32 },
  { id: "llm", label: "Gemini + Mistral", icon: Sparkles, x: 62, y: 20 },
  { id: "validate", label: "Validate", icon: ShieldCheck, x: 85, y: 32 },
  { id: "agent", label: "Dashboard agent", icon: Sparkles, x: 62, y: 46 },
] as const;
const EDGES = [
  ["amazon", "n8n"],
  ["trends", "n8n"],
  ["n8n", "llm"],
  ["llm", "validate"],
  ["validate", "agent"],
] as const;
// The data pulse travels this route; node i lights up as it passes.
const ROUTE = "M 14 20 L 38 32 L 62 20 L 85 32 L 62 46";
// Fraction of the route at which the pulse reaches each node (segments are ~equal length).
const LIGHT_AT = { amazon: 0, trends: 0, n8n: 0.25, llm: 0.5, validate: 0.74, agent: 0.96 } as const;

const pos = (id: string) => NODES.find((n) => n.id === id)!;

export function PipelineVisual({ progress }: { progress: MotionValue<number> }) {
  const routeRef = useRef<SVGPathElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);
  const step = useStep(progress, [0.05, 0.25, 0.5, 0.74, 0.96, 0.98]);

  const apply = (p: number) => {
    const route = routeRef.current;
    const pulse = pulseRef.current;
    if (!route || !pulse) return;
    const t = Math.min(Math.max(p, 0), 1);
    const pt = route.getPointAtLength(t * route.getTotalLength());
    pulse.style.left = `${pt.x}%`;
    pulse.style.top = `${(pt.y / 60) * 100}%`;
    pulse.style.opacity = t > 0.02 && t < 0.98 ? "1" : "0";
  };
  useMotionValueEvent(progress, "change", apply);
  useEffect(() => apply(progress.get()));
  const trail = useTransform(progress, [0, 1], [0, 1]);
  const lit = (id: keyof typeof LIGHT_AT) => step >= 1 && progress.get() >= LIGHT_AT[id];

  return (
    <div className={stage} aria-hidden="true">
      <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {EDGES.map(([a, b]) => (
          <line
            key={`${a}-${b}`}
            x1={pos(a).x}
            y1={pos(a).y}
            x2={pos(b).x}
            y2={pos(b).y}
            stroke="white"
            strokeOpacity="0.14"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <path ref={routeRef} d={ROUTE} fill="none" stroke="none" />
        <motion.path
          d={ROUTE}
          fill="none"
          stroke="var(--glow)"
          strokeOpacity="0.8"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          style={{ pathLength: trail }}
        />
      </svg>

      {/* travelling data pulse */}
      <div
        ref={pulseRef}
        className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-glow opacity-0 shadow-[0_0_18px_5px_rgb(94_224_255/0.6)]"
      />

      {/* nodes: points of light with a label, brightening as the data reaches them */}
      {NODES.map((n) => {
        const on = lit(n.id);
        const Icon = n.icon;
        return (
          <div
            key={n.id}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
            style={{ left: `${n.x}%`, top: `${(n.y / 60) * 100}%` }}
          >
            <span
              className={cn(
                "relative flex size-3 items-center justify-center rounded-full transition-all duration-500",
                on ? "bg-white shadow-[0_0_16px_4px_rgb(94_224_255/0.55)]" : "bg-white/35",
              )}
            />
            <span
              className={cn(
                "absolute top-5 flex items-center gap-1 font-mono text-[10px] whitespace-nowrap transition-colors duration-500 sm:text-[11px]",
                on ? "text-foreground" : "text-muted-foreground/70",
              )}
            >
              <Icon className={cn("size-3", on ? "text-glow" : "opacity-60")} />
              {n.label}
            </span>
          </div>
        );
      })}

      {/* outputs + the time saved */}
      <Toast show={step >= 5} className="right-4 bottom-4">
        <FileSpreadsheet className="size-4 text-glow" /> Sheets
        <Presentation className="ml-1 size-4 text-glow" /> Slides
        <Check className="size-3.5 text-glow" />
      </Toast>
      <Toast show={step >= 6} className="top-4 right-4">
        <span className="text-muted-foreground line-through">hours</span>
        <span className="font-mono text-glow">→ &lt;1 min</span>
        <span className="text-muted-foreground">insight report</span>
      </Toast>
    </div>
  );
}
