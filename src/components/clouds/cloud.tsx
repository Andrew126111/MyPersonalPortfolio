import { CLOUD_SPRITES } from "./sprites";

/**
 * One cloud image, tinted by the theme.
 *
 * The sprites (public/clouds, made by scripts/generate-clouds.py) are neutral grey with
 * transparency. Here the grey shading is multiplied by a gradient from --cloud-light (top)
 * to --cloud-shadow (bottom), and the sprite's own shape is used as a mask, so the same
 * images work for twilight now and daytime in a future light mode.
 */
export function Cloud({
  sprite,
  width,
  left,
  top,
  bottom,
  flip = false,
  opacity = 1,
}: {
  sprite: number; // 0..5
  width: string; // CSS length, e.g. "40vw"
  left?: string;
  top?: string;
  bottom?: string;
  flip?: boolean;
  opacity?: number;
}) {
  const s = CLOUD_SPRITES[sprite % CLOUD_SPRITES.length];
  const url = `url(${s.src})`;
  return (
    <div
      className="absolute"
      style={{
        left,
        top,
        bottom,
        width,
        aspectRatio: s.aspect,
        opacity,
        transform: flip ? "scaleX(-1)" : undefined,
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
