"""
Generate realistic-ish cumulus cloud sprites for the site (public/clouds/*.webp).

Each cloud is built like a real cumulus:
  1. a cluster of big "puffs" (spheres) along a flat-ish base, mounding up in the middle,
  2. lots of small sub-puffs on the upper surface for the cauliflower texture,
  3. fractal noise to rough up the edges,
  4. lighting from above: bright tops, soft shaded undersides, brighter thin edges.

Output is neutral grey shading + alpha, so the site can tint it per theme with CSS
(twilight in dark mode, daytime in light mode).

Usage:  python3 scripts/generate-clouds.py
"""

from pathlib import Path

import numpy as np
from PIL import Image

OUT = Path(__file__).resolve().parent.parent / "public" / "clouds"
W, H = 1400, 700  # sprite size (2:1)


def box_blur(arr, r, passes=3):
    """Approximate Gaussian blur (3 box passes along each axis) using cumulative sums."""
    out = arr.astype(np.float32)
    for axis in (0, 1):
        for _ in range(passes):
            pad = [(0, 0), (0, 0)]
            pad[axis] = (r + 1, r)
            c = np.cumsum(np.pad(out, pad, mode="edge"), axis=axis)
            hi = np.take(c, np.arange(2 * r + 1, c.shape[axis]), axis=axis)
            lo = np.take(c, np.arange(0, c.shape[axis] - 2 * r - 1), axis=axis)
            out = (hi - lo) / (2 * r + 1)
    return out


def fbm(rng, w, h, octaves=6, base=4, billow=False):
    """Fractal noise in [0, 1]: float random noise blurred evenly in every direction at
    several scales (isotropic, so no streaks). Larger `base` = finer detail."""
    total = np.zeros((h, w), np.float32)
    amp, norm = 1.0, 0.0
    radius = max(w, h) / (base * 1.5)
    for _ in range(octaves):
        layer = box_blur(rng.random((h, w)).astype(np.float32), max(1, int(radius)))
        layer = (layer - layer.mean()) / (layer.std() + 1e-6) * 0.22 + 0.5  # normalise contrast
        layer = np.clip(layer, 0, 1)
        if billow:
            layer = 1.0 - np.abs(layer * 2 - 1)
        total += layer * amp
        norm += amp
        amp *= 0.5
        radius /= 2
    return total / norm


def make_cloud(seed, wide=1.0):
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    dens = np.zeros((H, W), np.float32)

    def puff(cx, cy, r, w=1.0, sig=0.5):
        # soft Gaussian puff (sums with its neighbours, so there are no hard seams)
        s = r * sig
        dens[:] += w * np.exp(-((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * s * s))

    base_y = H * 0.74
    span = W * 0.34 * wide
    # 1. main puffs along the base, bigger and higher toward the middle
    main = []
    n = rng.integers(7, 10)
    for i in range(n):
        t = i / (n - 1) * 2 - 1
        cx = W / 2 + t * span + rng.normal(0, W * 0.012)
        bulge = 1 - t * t
        r = H * (0.13 + 0.15 * bulge + rng.uniform(-0.015, 0.025))
        cy = base_y - r * 0.5 - bulge * H * 0.14 + rng.normal(0, H * 0.015)
        main.append((cx, cy, r))
        puff(cx, cy, r)
    for _ in range(rng.integers(2, 4)):  # towers
        cx = W / 2 + rng.uniform(-0.4, 0.4) * span
        r = H * rng.uniform(0.13, 0.19)
        cy = base_y - H * rng.uniform(0.34, 0.44)
        main.append((cx, cy, r))
        puff(cx, cy, r, 0.9)
    # 2. many small sub-puffs on the upper surface (cauliflower texture)
    for cx, cy, r in main:
        for _ in range(rng.integers(10, 16)):
            a = rng.uniform(np.pi * 1.0, np.pi * 2.0)
            sr = r * rng.uniform(0.2, 0.38)
            puff(cx + np.cos(a) * r * 0.9, cy + np.sin(a) * r * 0.85, sr, rng.uniform(0.9, 1.25), 0.36)

    # flat-ish base
    dens *= 1 - np.clip((yy - base_y) / (H * 0.07), 0, 1) * 0.9

    # 3. billowy noise breaks up the surface and frays the edges
    n_big = fbm(rng, W, H, octaves=4, base=5)
    n_fine = fbm(rng, W, H, octaves=7, base=18, billow=True)
    dens = dens * (0.45 + 0.8 * n_big) * (0.55 + 0.8 * n_fine)
    dens = np.clip(dens - 0.16, 0, None)

    # 4. lighting from above: how much cloud sits above each point (light comes from the
    #    top), heavily blurred so the shading is smooth with no streaks, plus a slight
    #    bias so the upper-left catches the most light.
    dh, dw = dens.shape
    depth = np.cumsum(dens, axis=0) / dh * 6.0

    depth = box_blur(depth, 30)
    side = np.clip((xx - xx.min()) / dw, 0, 1)  # 0 left .. 1 right
    trans = np.exp(-depth * (0.9 + 0.35 * side))
    alpha = 1 - np.exp(-dens * 7.0)             # thicker = more opaque, wispy edges
    # soft, hazy base instead of a hard flat edge (so overlapping clouds blend)
    base_fade = 1 - np.clip((yy - (base_y - H * 0.16)) / (H * 0.2), 0, 1)
    alpha = alpha * (0.15 + 0.85 * base_fade ** 1.5)
    powder = 1 - np.exp(-dens * 1.6)            # thin edges glow a bit less in the core
    top_light = 1 - np.clip((yy - H * 0.25) / (base_y - H * 0.25), 0, 1)  # skylight from above
    # billow detail: bumps (denser than their surroundings) catch light, crevices fall into shade
    detail = box_blur(dens, 6) - box_blur(dens, 26)  # broad billows only, no specks
    detail = np.clip(detail * 1.4, -1, 1)
    shade = 0.5 + 0.42 * trans * (0.65 + 0.35 * powder) + 0.1 * top_light + 0.05 * detail
    shade = np.clip(shade, 0, 1)

    rgb = (shade * 255).astype(np.uint8)
    a = (np.clip(alpha, 0, 1) * 255).astype(np.uint8)
    img = np.dstack([rgb, rgb, rgb, a])
    ys, xs = np.where(a > 3)
    m = 16
    img = img[max(0, ys.min() - m) : ys.max() + m, max(0, xs.min() - m) : xs.max() + m]
    return Image.fromarray(img, "RGBA")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    sizes = []
    specs = [(11, 1.0), (23, 0.8), (37, 1.15), (52, 0.7), (68, 1.05), (81, 0.9)]
    for i, (seed, wide) in enumerate(specs, start=1):
        img = make_cloud(seed, wide)
        path = OUT / f"cloud-{i}.webp"
        img.save(path, "WEBP", quality=82, method=6)
        print(path.name, img.size, f"{path.stat().st_size // 1024} KB")
        sizes.append((i, img.width, img.height))

    # Write the sprite list (with aspect ratios) for the site to import.
    ts = OUT.parent.parent / "src" / "components" / "clouds" / "sprites.ts"
    ts.parent.mkdir(parents=True, exist_ok=True)
    rows = "\n".join(f'  {{ src: "/clouds/cloud-{i}.webp", aspect: {w / h:.3f} }},' for i, w, h in sizes)
    ts.write_text(
        "// Generated by scripts/generate-clouds.py. Do not edit by hand.\n"
        "export const CLOUD_SPRITES = [\n" + rows + "\n] as const;\n"
    )
    print("wrote", ts.relative_to(OUT.parent.parent))


if __name__ == "__main__":
    main()
