"""
Turn a hand-drawn signature PDF (vector pen strokes, e.g. exported from Notes/Freeform)
into src/components/signature-paths.ts:

  - `ink`:   a calligraphic version: a broad-nib pen (thick going one way,
             hairline the other) plus long tapered starts and ends
  - `guide`: the original centre lines, used as an animated mask so the signature draws
             itself in pen order

Usage:  python3 scripts/generate-signature.py path/to/signature.pdf
Needs only the Python standard library.
"""

import json
import math
import re
import sys
import zlib
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "src/components/signature-paths.ts"

NIB_ANGLE = math.radians(-40)  # pen held at ~40°: strokes along this angle are thinnest
MAX_W = 3.6  # widest stroke (viewBox units)
MIN_W = 0.8  # hairline
TAPER = 0.18  # fraction of a stroke's length spent swelling in / thinning out
SLANT = 0.08  # extra forward lean (x shear)
PAD = 6
BUCKET = 0.15  # width step between ink layers


def read_strokes(pdf: Path):
    data = pdf.read_bytes()
    stream = next(re.finditer(rb"stream\r?\n(.*?)\r?\nendstream", data, re.S)).group(1)
    toks = zlib.decompress(stream).decode("latin1").split()
    strokes, cur, nums = [], [], []
    for t in toks:
        if re.fullmatch(r"-?[\d.]+", t):
            nums.append(float(t))
            continue
        if t == "m":
            cur = [("M", nums[-2:])]
        elif t == "l":
            cur.append(("L", nums[-2:]))
        elif t == "c":
            cur.append(("C", nums[-6:]))
        elif t in ("S", "s") and cur:
            strokes.append(cur)
            cur = []
        nums = []
    return strokes


def sample(stroke, per_seg=8):
    """Flatten a stroke's béziers into points."""
    pts = [tuple(stroke[0][1])]
    for cmd, a in stroke[1:]:
        p0 = pts[-1]
        if cmd == "L":
            pts.append(tuple(a))
            continue
        p1, p2, p3 = (a[0], a[1]), (a[2], a[3]), (a[4], a[5])
        for i in range(1, per_seg + 1):
            t = i / per_seg
            mt = 1 - t
            pts.append(
                (
                    mt**3 * p0[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t**3 * p3[0],
                    mt**3 * p0[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t**3 * p3[1],
                )
            )
    # drop near-duplicates
    out = [pts[0]]
    for p in pts[1:]:
        if math.dist(p, out[-1]) > 0.6:
            out.append(p)
    return out


def widths_for(pts):
    """Pen width at each point: broad nib (by stroke direction) times a taper at both ends."""
    n = len(pts)
    seg = [math.dist(pts[i], pts[i + 1]) for i in range(n - 1)]
    total = sum(seg) or 1
    acc = [0.0]
    for s in seg:
        acc.append(acc[-1] + s)
    out = []
    for i in range(n):
        a, b = pts[max(i - 1, 0)], pts[min(i + 1, n - 1)]
        ang = math.atan2(b[1] - a[1], b[0] - a[0])
        nib = abs(math.sin(ang - NIB_ANGLE))  # 0 along the nib, 1 across it
        u = acc[i] / total
        taper = max(0.0, min(1.0, u / TAPER, (1 - u) / TAPER))
        taper = math.sin(taper * math.pi / 2) ** 1.4
        out.append(((MIN_W + (MAX_W - MIN_W) * nib**1.3), 0.15 + 0.85 * taper))
    # smooth the nib width along the stroke so sharp turns don't leave ink blobs
    k = 4
    nibs = [w for w, _ in out]
    sm = [sum(nibs[max(0, i - k) : i + k + 1]) / len(nibs[max(0, i - k) : i + k + 1]) for i in range(n)]
    return [sm[i] * out[i][1] for i in range(n)]


def ink_layers(polys):
    """
    Variable width without outline artifacts: every short segment is a round-capped line,
    grouped into width buckets, so each bucket is one <path> with a fixed stroke width.
    Round caps make sharp turns and overlaps clean.
    """
    buckets = {}
    for pts in polys:
        if len(pts) < 3:  # a dot
            (x, y) = pts[0]
            key = round(MAX_W * 0.9, 1)
            buckets.setdefault(key, []).append(f"M{x:.2f} {y:.2f}h0.01")
            continue
        ws = widths_for(pts)
        for i in range(len(pts) - 1):
            w = (ws[i] + ws[i + 1]) / 2
            key = round(round(w / BUCKET) * BUCKET, 2) or BUCKET
            (x1, y1), (x2, y2) = pts[i], pts[i + 1]
            buckets.setdefault(key, []).append(f"M{x1:.1f} {y1:.1f}L{x2:.1f} {y2:.1f}")
    return [{"w": w, "d": "".join(ds)} for w, ds in sorted(buckets.items())]


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    strokes = read_strokes(Path(sys.argv[1]))
    polys = [sample(s) for s in strokes]

    allp = [p for poly in polys for p in poly]
    min_x, min_y = min(p[0] for p in allp), min(p[1] for p in allp)
    max_y = max(p[1] for p in allp)

    def tf(p):  # shift to the origin and lean forward a touch
        x, y = p[0] - min_x, p[1] - min_y
        return (x + (max_y - min_y - y) * SLANT + PAD, y + PAD)

    polys = [[tf(p) for p in poly] for poly in polys]
    allp = [p for poly in polys for p in poly]
    w = math.ceil(max(p[0] for p in allp) + PAD)
    h = math.ceil(max(p[1] for p in allp) + PAD)

    ink = ink_layers(polys)
    guide = ["M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in poly[::2] + [poly[-1]]) for poly in polys]

    OUT.write_text(
        "// Generated by scripts/generate-signature.py from Andrew's hand-drawn signature. Don't edit.\n"
        f"export const SIGNATURE_VIEWBOX = \"0 0 {w} {h}\";\n"
        "// calligraphic ink: round-capped segments grouped by pen width (stroke-width = w)\n"
        f"export const SIGNATURE_INK = {json.dumps(ink)};\n"
        + "// centre lines in pen order, animated as a mask so the signature writes itself\n"
        + f"export const SIGNATURE_GUIDE = {guide!r};\n".replace("'", '"')
        + "// length of each guide stroke, so each one gets draw time in proportion\n"
        + f"export const SIGNATURE_GUIDE_LENGTHS = {[round(sum(math.dist(p[i], p[i + 1]) for i in range(len(p) - 1)), 1) for p in polys]};\n"
    )
    print(f"wrote {OUT} ({w}x{h}, {len(strokes)} strokes, {len(ink)} ink layers)")


if __name__ == "__main__":
    main()
