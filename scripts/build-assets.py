"""Turn the source art in art/ into game files.

    python scripts/build-assets.py

Truck (art/mail-truck-1.webp):
  assets/mail-truck-1.png        body, white background and wheels removed
  assets/mail-truck-1-wheel.png  one wheel, drawn spinning at each physics wheel

Each level picture (see LEVELS below):
  assets/levels/<id>-map.png     small copy for the HUD minimap
  src/levels/<id>.heights.ts     road heights traced from the picture, plus the
                                 picture-to-world scale so the level file can place
                                 coins and scenery by picture pixel
"""
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / "art"

# ---------------------------------------------------------------- levels
# road:      "gray"     = Track 1 style (gray band, dark edges)
#            "outlined" = rural style (tan band between two dark outlines)
# x_m:       horizontal meters per picture pixel. Higher = longer level
# y_m:       vertical meters per picture pixel, OR
# max_slope: steepest slope in degrees; y_m is worked out from it
# wall_px:   picture x of the post office's front wall (world x = -5.5)
LEVELS = [
    dict(id="track-1", src="track-1.webp", road="gray", x_m=0.17, y_m=0.06, start_px=230, road_px=377),
    dict(id="rural-1", src="rural-level-1.png", road="outlined", x_m=0.075, max_slope=18, wall_px=245),
    dict(id="rural-2", src="rural-level-2.png", road="outlined", x_m=0.075, max_slope=20, wall_px=245),
    dict(id="rural-3", src="rural-level-3.png", road="outlined", x_m=0.075, max_slope=28, wall_px=245),
]
WALL_X = -5.5  # world x of the post office wall (matches the level files)


def runs(ys):
    """Group sorted pixel rows into (first, last) runs of neighbours."""
    out, start = [], ys[0]
    for i in range(1, len(ys) + 1):
        if i == len(ys) or ys[i] - ys[i - 1] > 2:
            out.append((start, ys[i - 1]))
            if i < len(ys):
                start = ys[i]
    return out


def trace_gray(px):
    """Track 1: the road is the lowest gray band; its top minus the outline is the surface."""
    r, g, b = px[..., 0], px[..., 1], px[..., 2]
    band = (r >= 75) & (r <= 98) & (g >= 85) & (g <= 106) & (b >= 96) & (b <= 115)
    top = np.full(px.shape[1], np.nan)
    for x in range(px.shape[1]):
        ys = np.nonzero(band[150:, x])[0] + 150
        if len(ys) >= 3:
            rr = [(s, e) for s, e in runs(ys) if e - s >= 2]
            if rr:
                top[x] = rr[-1][0] - 3
    return top


def trace_outlined(px):
    """Rural: walk up from the bottom through the dirt, the road's lower outline,
    the tan band, and stop at the top of the upper outline: that's the surface."""
    r, g, b = px[..., 0], px[..., 1], px[..., 2]
    outline = (r < 55) & (g < 60) & (b < 75) & (b >= r)
    # Road tan in every lighting (morning, afternoon, dusk). Hay is too yellow, the can too red
    tan = (r >= 140) & (r <= 205) & (r - g >= 25) & (r - g <= 55) & (g - b >= 25) & (g - b <= 55)
    h, w = outline.shape
    top = np.full(w, np.nan)
    for x in range(w):
        col = outline[:, x]
        y = h - 1
        while y > 0 and not col[y]:  # dirt
            y -= 1
        bottom = y
        while y > 0 and col[y]:  # lower outline
            y -= 1
        band_bottom = y
        gap = 0
        while y > 0 and not col[y] and gap < 30:  # road band
            y -= 1
            gap += 1
        if gap >= 30 or y <= 0:
            continue
        band = tan[y + 1:band_bottom + 1, x]
        if len(band) == 0 or band.mean() < 0.5:  # something other than road is sitting here
            continue
        # Upper outline: road outlines are ~3 px thick. Don't follow a longer dark run:
        # that's the edge of something standing on the road (hay bale, post)
        y -= 2
        if 8 <= bottom - y <= 30:
            top[x] = y

    # Ignore columns where a hay bale or gas can stands on the road (+10 px each side);
    # clean() fills them in from the road on either side
    hay = (r > 215) & (g > 170) & (g < 205) & (b > 60) & (b < 120)
    can = (r > 170) & (g < 70) & (b < 70)
    covered = np.convolve((hay | can).sum(axis=0) > 20, np.ones(21), mode="same") > 0
    top[covered] = np.nan
    return top


def clean(top):
    """Drop columns where an object (hay bale, mailbox, sign) fooled the tracer, fill, smooth."""
    w = len(top)
    xs = np.arange(w)
    med = np.array([np.nanmedian(top[max(0, x - 15):x + 16]) for x in range(w)])
    top = np.where(np.abs(top - med) > 8, np.nan, top)
    ok = ~np.isnan(top)
    top = np.interp(xs, xs[ok], top[ok])
    return np.convolve(np.pad(top, 3, mode="edge"), np.ones(7) / 7, mode="valid"), int((~ok).sum())


def build_level(cfg):
    pic = Image.open(ART / cfg["src"]).convert("RGB")
    px = np.asarray(pic).astype(int)
    W, H = pic.size
    top, filled = clean(trace_gray(px) if cfg["road"] == "gray" else trace_outlined(px))

    x_m = cfg["x_m"]
    start_px = cfg.get("start_px") or cfg["wall_px"] - WALL_X / x_m
    road_px = cfg.get("road_px") or float(np.interp(start_px, np.arange(W), top))
    if "y_m" in cfg:
        y_m = cfg["y_m"]
    else:
        # steepest picture slope over ~1 m of road, then scale to the target angle
        step = max(1, round(1 / x_m))
        steep = np.max(np.abs(top[step:] - top[:-step])) / step
        y_m = x_m * math.tan(math.radians(cfg["max_slope"])) / steep

    heights, x = [], -30.0
    while True:
        p = start_px + x / x_m
        if p > W - 1:
            break
        heights.append(round((road_px - float(np.interp(max(0.0, p), np.arange(W), top))) * y_m, 3))
        x += 1.0

    # Minimap: 64 px tall keeps it sharp on the HUD
    mh = 64
    pic.resize((round(W * mh / H), mh), Image.LANCZOS).save(ROOT / "assets" / "levels" / f"{cfg['id']}-map.png", optimize=True)

    rows = ",\n  ".join(", ".join(str(v) for v in heights[i:i + 12]) for i in range(0, len(heights), 12))
    (ROOT / "src" / "levels" / f"{cfg['id']}.heights.ts").write_text(
        f"""// GENERATED by scripts/build-assets.py from art/{cfg['src']}. Don't edit; re-run the script.
/** How the picture maps to the world: world x = (pictureX - startPx) * xMPerPx */
export const PICTURE = {{ xMPerPx: {x_m}, yMPerPx: {round(y_m, 5)}, startPx: {round(start_px, 2)}, width: {W}, height: {H} }};
/** Road height (meters) every 1 m, starting at world x = -30 */
export const HEIGHTS: number[] = [
  {rows},
];
""",
        encoding="utf-8",
    )
    steepest = max(abs(math.degrees(math.atan(heights[i + 1] - heights[i]))) for i in range(len(heights) - 1))
    print(f"{cfg['id']:8} {W}x{H}  length {len(heights) - 30} m  rise {max(heights) - min(heights):.1f} m  "
          f"steepest {steepest:.0f}deg  y_m {y_m:.4f}  columns fixed {filled}")


# ---------------------------------------------------------------- truck
def build_truck():
    WHEELS = [(474, 640), (902, 640)]  # wheel centers in the source picture (px)
    TIRE_R = 76                         # tire radius incl. outline (px)
    CROP = (290, 235, 1080, 720)        # left, top, right, bottom

    im = Image.open(ART / "mail-truck-1.webp").convert("RGBA")
    MAGIC = (255, 0, 255, 255)
    w, h = im.size
    for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, h - 1), (680, 700)]:
        if im.getpixel(seed)[:3] != MAGIC[:3]:
            ImageDraw.floodfill(im, seed, MAGIC, thresh=60)
    a = np.asarray(im).copy()
    a[(a[..., 0] == 255) & (a[..., 1] == 0) & (a[..., 2] == 255)] = (0, 0, 0, 0)

    yy, xx = np.mgrid[0:h, 0:w]
    cx, cy = WHEELS[0]
    wheel = a.copy()
    wheel[np.hypot(xx - cx, yy - cy) > TIRE_R] = (0, 0, 0, 0)
    Image.fromarray(wheel).crop((cx - TIRE_R, cy - TIRE_R, cx + TIRE_R, cy + TIRE_R)).save(
        ROOT / "assets" / "mail-truck-1-wheel.png", optimize=True)
    for cx, cy in WHEELS:
        a[np.hypot(xx - cx, yy - cy) <= TIRE_R] = (0, 0, 0, 0)
    Image.fromarray(a).crop(CROP).save(ROOT / "assets" / "mail-truck-1.png", optimize=True)

    # The mail carrier's portrait for story cards: the driver seen through the cab window
    Image.open(ART / "mail-truck-1.webp").convert("RGB").crop((742, 312, 862, 432)).resize(
        (240, 240), Image.LANCZOS).save(ROOT / "assets" / "mail-carrier.png", optimize=True)
    print("truck sprites and mail carrier portrait written")


if __name__ == "__main__":
    (ROOT / "assets" / "levels").mkdir(exist_ok=True)
    (ROOT / "src" / "levels").mkdir(exist_ok=True)
    build_truck()
    for level in LEVELS:
        build_level(level)
