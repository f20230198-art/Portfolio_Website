"""
Prepare the generated scene art for the descent.

For each scene (scenes-src/scene-0N-*.png):
  * background = the "b" plate (scene without its foreground)
  * foreground = the "a" plate with the green screen keyed out
Both are kept at full resolution (normalised to exactly SRC_W x SRC_H so the
scenes line up), then written to public/descent/.

Run:  python scripts/prepare-scenes.py [source-folder]
      (default: scenes-src-upscaled if present, else scenes-src)
"""
from pathlib import Path
from PIL import Image
import numpy as np
import sys

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else (ROOT / "scenes-src-upscaled" if (ROOT / "scenes-src-upscaled").exists() else ROOT / "scenes-src")
OUT = ROOT / "public" / "descent"
SRC_W, SRC_H = 1880, 3344      # every scene is normalised to this size (2x the generated art)
# rows at the top of each scene that blend into the scene above (keep in sync with OVERLAPS in src/descent/main.ts)
FADES = {1: 0, 2: 420, 3: 900, 4: 900, 5: 420, 6: 420}
BLOCK = 6                      # the dissolve works in blocks the size of the art's pixel clusters

OUT.mkdir(parents=True, exist_ok=True)


def find(n, *must, exclude=()):
    for f in sorted(SRC.rglob(f"scene-0{n}*.png")):
        name = f.name
        if all(m in name for m in must) and not any(e in name for e in exclude):
            return f
    raise FileNotFoundError(f"scene {n} {must}")


def fit(img: Image.Image) -> Image.Image:
    """Normalise the odd 941x1671-style sizes to exactly SRC_W x SRC_H."""
    return img if img.size == (SRC_W, SRC_H) else img.resize((SRC_W, SRC_H), Image.LANCZOS)


def key_green(path: Path) -> Image.Image:
    """Turn the #00FF00 screen transparent, de-spill green fringes, return RGBA."""
    a = np.asarray(Image.open(path).convert("RGB")).astype(np.int16)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    green = (g > 120) & (g > r * 1.35) & (g > b * 1.35)
    # soft edge: pixels that are greenish but not pure screen
    near = (g > r * 1.1) & (g > b * 1.1) & ~green
    alpha = np.where(green, 0, 255).astype(np.uint8)
    rgb = a.copy()
    # de-spill: clamp green to the brighter of red/blue on edge pixels
    cap = np.maximum(r, b)
    rgb[..., 1] = np.where(near, np.minimum(g, cap + 10), g)
    out = np.dstack([rgb.clip(0, 255).astype(np.uint8), alpha])
    return Image.fromarray(out, "RGBA")


def fade_mask(n):
    """A pixel-block dissolve: a soft ramp broken up by blocky noise, so the join looks painted, not cut."""
    fade = FADES[n]
    if not fade:
        return None
    ramp = np.clip(np.arange(SRC_H) / fade, 0, 1)[:, None]
    rng = np.random.default_rng(n)
    noise = rng.random((SRC_H // BLOCK + 1, SRC_W // BLOCK + 1)).repeat(BLOCK, 0).repeat(BLOCK, 1)[:SRC_H, :SRC_W]
    a = np.clip((ramp * 1.35 - noise * 0.35) / 1.0, 0, 1)
    return a * a * (3 - 2 * a)


def apply(img, mask):
    if mask is None:
        return img
    px = np.asarray(img).copy()
    px[..., 3] = (px[..., 3] * mask).astype(np.uint8)
    return Image.fromarray(px, "RGBA")


for n in range(1, 7):
    mask = fade_mask(n)
    bg = apply(fit(Image.open(find(n, "background", exclude=("green",))).convert("RGB")).convert("RGBA"), mask)
    bg.save(OUT / f"s{n}-bg.webp", quality=92, method=6)
    fg = key_green(find(n, "green"))
    fg = fg if fg.size == (SRC_W, SRC_H) else fg.resize((SRC_W, SRC_H), Image.NEAREST)
    fg = apply(fg, mask)
    fg.save(OUT / f"s{n}-fg.webp", quality=92, method=6)
    print(f"scene {n}: bg + fg -> {SRC_W}x{SRC_H}")
