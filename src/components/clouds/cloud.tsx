import { CLOUD_SPRITES, FOG_SPRITES } from "./sprites";

/**
 * One cloud or fog image, tinted by the theme.
 *
 * The sprites (public/clouds, made by scripts/generate-clouds.py) are neutral grey with
 * transparency. Here the grey shading is multiplied by a gradient from --cloud-light (top)
 * to --cloud-shadow (bottom), and the sprite's own shape is used as a mask, so the same
 * images work for twilight now and daytime in a future light mode.
 */
export function Cloud({
  kind = "cloud",
  sprite,
  width,
  left,
  top,
  flip = false,
  opacity = 1,
  blur = 0,
}: {
  kind?: "cloud" | "fog";
  sprite: number;
  width: string; // CSS length, e.g. "40vw"
  left?: string;
  top?: string;
  flip?: boolean;
  opacity?: number;
  blur?: number; // px, for far-away clouds
}) {
  const list = kind === "fog" ? FOG_SPRITES : CLOUD_SPRITES;
  const s = list[((sprite % list.length) + list.length) % list.length]; // wraps negatives too
  const url = `url(${s.src})`;
  return (
    <div
      className="absolute"
      style={{
        left,
        top,
        width,
        aspectRatio: s.aspect,
        opacity,
        transform: flip ? "scaleX(-1)" : undefined,
        filter: blur ? `blur(${blur}px)` : undefined,
        backgroundImage: `${url}, linear-gradient(to bottom, var(--cloud-light), var(--cloud-shadow))`,
        backgroundSize: "100% 100%",
        backgroundBlendMode: "multiply",
        maskImage: url,
        maskSize: "100% 100%",
        WebkitMaskImage: url,
        WebkitMaskSize: "100% 100%",
      }}
    />
  );
}

/**
 * A continuous row of overlapping fog banks across the full width, plus a soft haze
 * underneath to fill any gaps, so it reads as one bank of fog.
 *
 * Sizes are in "fog units": 1 unit = 1vw × the --fog-scale CSS variable (set on a parent).
 * Phones use a larger scale so the banks aren't thin stripes on a narrow screen.
 */
const fu = (n: number) => `calc(${n}vw * var(--fog-scale, 1))`;

export function FogRow({
  top,
  width = 50,
  step = 24,
  offset = 0,
  opacity = 1,
  blur = 0,
  haze = true,
  span = 100,
}: {
  top: string; // CSS top of the row
  width?: number; // fog units per bank
  step?: number; // fog units between banks (less than width = overlap)
  offset?: number; // fog units shift so rows don't line up
  opacity?: number;
  blur?: number;
  haze?: boolean;
  span?: number; // fog units to fill (200 for a drifting, looping layer)
}) {
  const xs: number[] = [];
  for (let x = -width / 2 + offset; x < span; x += step) xs.push(x);
  // phones (scale > 1) need extra banks to still reach the right edge; the extras are
  // harmless off-screen on desktop
  for (let x = xs[xs.length - 1] + step; x < span * 2.4; x += step) xs.push(x);
  return (
    <div className="absolute inset-x-0" style={{ top, opacity }}>
      {haze && (
        // haze band under the bank tops, in the fog's own colour
        <div
          className="absolute inset-x-0"
          style={{
            top: fu(width * 0.09),
            height: fu(width * 0.16),
            background: "color-mix(in srgb, var(--cloud-light) 45%, var(--cloud-shadow))",
            filter: "blur(18px)",
            maskImage: "linear-gradient(to bottom, transparent, black 30%, black 60%, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent, black 30%, black 60%, transparent)",
          }}
        />
      )}
      {xs.map((x, i) => (
        <Cloud
          key={i}
          kind="fog"
          sprite={i + Math.round(offset)}
          width={fu(width)}
          left={fu(x)}
          top="0"
          flip={i % 2 === 1}
          blur={blur}
        />
      ))}
    </div>
  );
}
