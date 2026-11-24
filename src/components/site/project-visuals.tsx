"use client";

import { Heart, MessageCircle, Send, ShieldAlert, Sparkles } from "lucide-react";
import { Depth } from "@/components/tilt-card";

/*
 * Illustrated mock-ups for each project, drawn with HTML/CSS/SVG (no screenshots needed).
 * Each piece sits on a <Depth> layer so it moves at its own speed when the card tilts.
 * Swap these for real screenshots later if you like.
 */

const dots = {
  backgroundImage: "radial-gradient(var(--subtle) 1px, transparent 1px)",
  backgroundSize: "22px 22px",
};

function Chip({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full border border-border bg-surface/90 px-3 py-1.5 font-mono text-[11px] text-muted-foreground shadow-[0_12px_30px_-12px_rgb(0_0_0/0.9)] backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

function LiveDot() {
  return (
    <span className="relative flex size-1.5" aria-hidden="true">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-glow opacity-60 motion-reduce:animate-none" />
      <span className="relative inline-flex size-1.5 rounded-full bg-glow" />
    </span>
  );
}

/* ───────────────────────── Façade ───────────────────────── */

export function FacadeVisual() {
  return (
    <div className="relative h-full w-full" aria-hidden="true">
      <Depth depth={6} className="absolute inset-0 opacity-40" style={dots}>
        <span />
      </Depth>

      {/* phone with an Instagram-style post */}
      <Depth depth={16} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-[176px] scale-[0.82] rounded-[28px] border border-border bg-ink p-2.5 shadow-[0_30px_60px_-24px_rgb(0_0_0/0.9)] sm:scale-100">
          <div className="flex items-center gap-2 px-1 pb-2">
            <span className="size-6 rounded-full border-2 border-glow bg-surface-2" />
            <div>
              <p className="text-[10px] font-medium text-foreground">nova.ai</p>
              <p className="text-[8px] text-muted-foreground">AI persona · auto-posted</p>
            </div>
          </div>
          {/* abstract "persona portrait" */}
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-surface-2">
            <div className="absolute top-[22%] left-1/2 size-14 -translate-x-1/2 rounded-full bg-[#1f3550]" />
            <div className="absolute -bottom-6 left-1/2 h-24 w-32 -translate-x-1/2 rounded-t-full bg-[#1f3550]" />
            <div className="absolute top-3 right-3 rounded-full bg-ink/70 px-1.5 py-0.5 font-mono text-[8px] text-glow">
              REEL
            </div>
          </div>
          <div className="flex gap-2.5 px-1 pt-2 text-foreground">
            <Heart className="size-3.5" />
            <MessageCircle className="size-3.5" />
            <Send className="size-3.5" />
          </div>
          <div className="space-y-1 px-1 pt-2 pb-1">
            <div className="h-1.5 w-[85%] rounded-full bg-surface-2" />
            <div className="h-1.5 w-[60%] rounded-full bg-surface-2" />
          </div>
        </div>
      </Depth>

      {/* floating pipeline status chips (closest layer) */}
      <Depth depth={34} className="absolute top-[5%] left-[5%] sm:left-[8%]">
        <Chip>
          <Sparkles className="size-3 text-glow" /> Gemini 2.5 Pro · persona image
        </Chip>
      </Depth>
      <Depth depth={28} className="absolute top-[46%] right-[4%] sm:right-[8%]">
        <div className="w-[150px] rounded-xl border border-border bg-surface/90 p-3 shadow-[0_12px_30px_-12px_rgb(0_0_0/0.9)] backdrop-blur-sm">
          <p className="font-mono text-[10px] text-muted-foreground">Veo 3 · rendering reel</p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full w-[68%] rounded-full bg-glow" />
          </div>
        </div>
      </Depth>
      <Depth depth={40} className="absolute bottom-[12%] left-[8%] sm:left-[14%]">
        <Chip>
          <LiveDot /> Scheduled · Tue 9:00 AM
        </Chip>
      </Depth>
    </div>
  );
}

/* ───────────────────────── HeuristX ───────────────────────── */

// Deterministic candlestick data (same on server and client).
const CANDLES = (() => {
  const out: { o: number; c: number; h: number; l: number }[] = [];
  let price = 60;
  for (let i = 0; i < 24; i++) {
    const r = (k: number) => {
      const s = Math.sin(i * 91.7 + k * 47.3) * 43758.5453;
      return s - Math.floor(s);
    };
    // drift down at the end: the moment HeuristX steps in
    const drift = i > 16 ? -2.2 : 0.4;
    // Round so server and browser render identical numbers (Math.sin can differ in the
    // last few digits between engines, which causes a hydration mismatch).
    const round = (v: number) => Math.round(v * 100) / 100;
    const o = price;
    const c = round(Math.max(8, Math.min(92, o + (r(1) - 0.5) * 10 + drift)));
    out.push({ o, c, h: round(Math.max(o, c) + r(2) * 5), l: round(Math.min(o, c) - r(3) * 5) });
    price = c;
  }
  // Rescale so the candles fill the chart height (8..92) instead of a thin band.
  const lo = Math.min(...out.map((k) => k.l));
  const hi = Math.max(...out.map((k) => k.h));
  const fit = (v: number) => Math.round((8 + ((v - lo) / (hi - lo)) * 84) * 100) / 100;
  return out.map((k) => ({ o: fit(k.o), c: fit(k.c), h: fit(k.h), l: fit(k.l) }));
})();

function Chart() {
  const w = 100 / CANDLES.length;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
      {[25, 50, 75].map((y) => (
        <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="var(--border)" strokeWidth="0.3" />
      ))}
      {CANDLES.map((k, i) => {
        const up = k.c >= k.o;
        const x = i * w + w / 2;
        const color = up ? "var(--glow)" : "var(--subtle)";
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={100 - k.h} y2={100 - k.l} stroke={color} strokeWidth="0.4" />
            <rect
              x={x - w * 0.3}
              width={w * 0.6}
              y={100 - Math.max(k.o, k.c)}
              height={Math.max(0.8, Math.abs(k.c - k.o))}
              fill={color}
              opacity={up ? 0.85 : 1}
            />
          </g>
        );
      })}
    </svg>
  );
}

export function HeuristXVisual() {
  return (
    <div className="relative h-full w-full" aria-hidden="true">
      <Depth depth={6} className="absolute inset-0 opacity-40" style={dots}>
        <span />
      </Depth>

      {/* browser window with a trading chart */}
      <Depth
        depth={12}
        className="absolute inset-x-[6%] top-[12%] bottom-[12%] sm:inset-x-[8%]"
      >
        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-ink shadow-[0_30px_60px_-24px_rgb(0_0_0/0.9)]">
          <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
            <span className="size-2 rounded-full bg-surface-2" />
            <span className="size-2 rounded-full bg-surface-2" />
            <span className="size-2 rounded-full bg-surface-2" />
            <span className="ml-2 truncate rounded-md bg-surface px-2 py-0.5 font-mono text-[9px] text-muted-foreground">
              trading-platform.app/BTC-USD
            </span>
            <span className="ml-auto flex size-4 items-center justify-center rounded bg-glow text-[8px] font-bold text-ink">
              H
            </span>
          </div>
          <div className="flex items-baseline gap-2 px-3 pt-2">
            <span className="font-mono text-[10px] text-foreground">BTC-USD</span>
            <span className="font-mono text-[10px] text-muted-foreground">−4.2% · 15m</span>
          </div>
          <div className="min-h-0 flex-1 px-2 pt-1 pb-2">
            <Chart />
          </div>
        </div>
      </Depth>

      {/* injected intervention overlay */}
      <Depth depth={30} className="absolute right-[3%] bottom-[6%] sm:right-[5%]">
        <div className="w-[210px] rounded-xl border border-glow/40 bg-surface/95 p-3 shadow-[0_20px_50px_-16px_rgb(0_0_0/0.95)] backdrop-blur-sm">
          <p className="flex items-center gap-1.5 font-mono text-[10px] text-glow">
            <ShieldAlert className="size-3" /> HeuristX
          </p>
          <p className="mt-1.5 text-[11px] leading-snug text-foreground">
            4th trade in 10 minutes, right after a loss. Want to pause before you buy?
          </p>
          <div className="mt-2.5 flex gap-1.5">
            <span className="rounded-full bg-glow px-2.5 py-1 text-[10px] font-medium text-ink">
              Take 5 min
            </span>
            <span className="rounded-full border border-border px-2.5 py-1 text-[10px] text-muted-foreground">
              Continue
            </span>
          </div>
        </div>
      </Depth>

      <Depth depth={40} className="absolute top-[5%] left-[4%] sm:left-[6%]">
        <Chip>
          <LiveDot /> Gemini · analysing pattern
        </Chip>
      </Depth>
    </div>
  );
}
