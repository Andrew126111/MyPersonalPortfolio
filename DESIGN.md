# Design System — "Ink"

The single source of truth for how the portfolio looks and moves. Every section and every 21st.dev component gets adapted to these tokens. When something here conflicts with a component's defaults, this file wins.

**Mood:** dark, techy, calm, confident. Sleek, not overdone.
**Rule of thumb:** one standout effect per section; everything else stays quiet.

---

## Colour

Dark-only for v1 (no light/dark toggle).

| Token | Hex | Use | Contrast on bg |
|---|---|---|---|
| `--bg` | `#0A0A0B` | Page background | — |
| `--surface` | `#141416` | Cards, nav bar, raised panels | — |
| `--surface-2` | `#1C1C1F` | Hover state of cards, inputs | — |
| `--border` | `#26262A` | Hairlines, card outlines (decorative) | 1.3 |
| `--fg` | `#EDEDED` | Headings and body text | 16.9 ✅ |
| `--muted` | `#8A8A8F` | Secondary text, captions, nav links | 5.8 ✅ |
| `--subtle` | `#5C5C61` | **Decorative only** (dot grids, dividers) — never text | 3.0 |
| `--accent` | `#C8F560` | The *one* accent: primary CTA, highlights, focus ring, active states | 15.7 ✅ |
| `--accent-fg` | `#0A0A0B` | Text on accent backgrounds | 15.7 ✅ |

**Accent discipline:** lime appears in small doses — the main CTA, a word or tag in the hero, focus rings, link underlines on hover. Never as a large fill, never as a gradient. No purple/pink "AI" gradients anywhere.

## Typography

| Role | Font | Weights | Notes |
|---|---|---|---|
| Display / headings | **Space Grotesk** | 500, 700 | `letter-spacing: -0.02em`, `line-height: 1.05` on large sizes |
| Body / UI | **Inter** | 400, 500 | `line-height: 1.6`, max ~68ch per line |
| Labels / tags / dates | **JetBrains Mono** | 400, 500 | Uppercase, `letter-spacing: 0.12em`, small sizes |

Load via `next/font/google` (self-hosted, no layout shift).

**Scale (desktop → mobile):** hero 72 → 40px · h2 44 → 30px · h3 24 → 20px · body 17 → 16px · label 12px.

## Layout & spacing

- Max content width **1200px**, side gutters 24px (mobile 16px).
- 8px spacing grid. Sections get generous vertical space (128px desktop / 80px mobile).
- Radius: **12px** cards, **999px** pill buttons, **8px** small controls.
- Breakpoints to verify: **375, 768, 1024, 1440px**.

## Motion

Built with **Framer Motion** (`useScroll` / `useTransform`) so all motion shares one system.

- **Parallax:** max **3 layers** per scene. Background moves slowest (≈ −8% y), mid layers ≈ −16%, foreground stays put. Linear, scroll-scrubbed.
- **Pointer parallax** (hero only): layers shift ≤ 20px following the cursor.
- **Reveals:** fade + 16px rise, 400–600ms, ease-out, staggered 60ms. Once per element.
- **Hovers:** 150–250ms. Lift cards 2–4px, brighten border to `--muted`, no big scale jumps.
- **`prefers-reduced-motion: reduce`** → disable parallax and reveals entirely; render final state immediately. Non-negotiable.
- Animate only `transform` and `opacity` (keeps it 60fps).
- **Canvas/WebGL effects** pause when off-screen or in a hidden tab, cap pixel density (1.5x desktop, 1x phones), drop to 30fps on phones/touch, and render one still frame under reduced motion.

## Section map (draft)

1. **Hero** — "caustics" background: soft grey pool-floor light (WebGL shader, `components/backgrounds/caustics.tsx`); the cursor acts as a lens that magnifies it and tints it lime. Plus scroll + pointer parallax, floating stack chips (lg+), text-scramble headline, lime CTA.
2. **About / skills** — bento grid: Queen's AI, current focus, stack icons.
3. **Experience** — CoTriplyy, Wayfair (via Extern). Timeline with scroll reveal.
4. **Projects** — Façade, HeuristX. Interactive cards (flip or tilt) with stack on the back.
5. **Contact** — email, LinkedIn, GitHub, résumé download.

## Pre-ship checklist

- [ ] No emojis as icons — use Lucide (SVG)
- [ ] `cursor-pointer` + visible `:focus-visible` (lime ring) on everything clickable
- [ ] Text contrast ≥ 4.5:1 (only `--fg`, `--muted`, `--accent` used for text)
- [ ] Reduced motion respected
- [ ] Responsive at 375 / 768 / 1024 / 1440
- [ ] Lighthouse performance & accessibility ≥ 90
