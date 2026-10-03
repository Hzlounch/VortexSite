#!/usr/bin/env python3
"""VORTEX CAPES — professional store preview renders (presentation fix).

Renders every active cape ON the project's blocky Minecraft-style player
mannequin in a consistent 3/4 REAR view, using the project's own software
renderer (scripts/render-cosmetics.py — no AI art, no screenshots, no
invented geometry). The cape DESIGNS are untouched: each preview samples
the cape's real texture pixel-for-pixel; only the presentation changed
(flat back-view figure -> true 3/4 rear product photography).

Per cape two assets (same /cosmetics/capes/ folder, same path system):
  <name>.png              actual Minecraft cape texture (raw, native res)
  <name>_preview.webp      store product render (1024px WebP, studio bg)

  Store (cards + detail) uses product.img  -> the _preview.webp file.
  Minecraft client uses product.texture    -> the .png file.
  The preview image is NEVER used as the client texture.

Run:  python scripts/render-cape-previews.py
Requires: Pillow (WebP support)
"""
import importlib.util
import math
import os
import sys

try:
    from PIL import Image, ImageDraw, ImageFilter
except ImportError:
    print("render-cape-previews: ERROR: Pillow not installed (pip install pillow)")
    sys.exit(1)

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
OUT_DIR = os.path.join(SITE, "cosmetics", "capes")


def load_mod(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


renderer = load_mod("mc_renderer", os.path.join(HERE, "render-cosmetics.py"))


def seed_of(cid):
    import hashlib as _hl
    return int(_hl.md5(cid.encode("utf-8")).hexdigest()[:8], 16)

SIZE = 1024  # store preview master (cards downscale it in the browser)

# DIRECT REAR camera (spec allows "3/4 rear view OR direct rear view"): the
# player faces away, back toward the lens, with only a hairline of side
# thickness for depth. Orthographic rear projection (x 1:1, z strongly
# foreshortened). Depth sorting uses the matching axis.
# (A 45-degree 3/4 lets the torso side swallow the cape middle and skews
# the emblem; rear view keeps every design fully readable.)
WZ = 0.08
COS30 = 0.8660254
SIN30 = 0.5

# Studio mannequin: deeper graphite than the neutral renderer default so the
# CAPE (the product) leads every shot and dark cloth still separates from
# the body. Same studio mannequin in every collection preview.
BODY = (30, 34, 45)
BODY_LT = (38, 43, 54)


def studio_body():
    figs = {}
    for name, spec in renderer.MAN_FULL.items():
        flat = tuple(BODY_LT if list(spec["flat"]) == list(renderer.GRAPHITE_LT)
                     else BODY)
        figs[name] = {"flat": flat,
                      "boxes": [dict(b) for b in spec["boxes"]]}
    return figs


def project(x, y, z):
    return ((WZ * z - x) * COS30, (x + z) * SIN30 - y)


def collect_rear(parts):
    faces = []
    for _name, spec in (parts or {}).items():
        for b in spec.get("boxes", []):
            f, t = b["from"], b["to"]
            box = (min(f[0], t[0]), min(f[1], t[1]), min(f[2], t[2]),
                   max(f[0], t[0]), max(f[1], t[1]), max(f[2], t[2]))
            x0, y0, z0, x1, y1, z1 = box
            quads = [
                ("py", [(x0, y1, z0), (x1, y1, z0), (x1, y1, z1), (x0, y1, z1)]),
                ("px", [(x1, y0, z0), (x1, y0, z1), (x1, y1, z1), (x1, y1, z0)]),
                ("pz", [(x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]),
            ]
            for fid, pts in quads:
                cx = sum(p[0] for p in pts) / 4.0
                cy = sum(p[1] for p in pts) / 4.0
                cz = sum(p[2] for p in pts) / 4.0
                depth = (0.08 * cx + 0.35 * cy + cz)
                faces.append((depth, fid, pts, "flat", tuple(spec["flat"])))
    faces.sort(key=lambda f: f[0])
    return faces


def fit_rear(faces, size, fill=0.80):
    pts2 = [project(*p) for _d, _f, ps, _k, _p in faces for p in ps]
    xs = [p[0] for p in pts2]
    ys = [p[1] for p in pts2]
    bw = max(1.0, max(xs) - min(xs))
    bh = max(1.0, max(ys) - min(ys))
    sc = min((size * fill) / bw, (size * fill) / bh)
    ox = (size - 1) / 2 - (min(xs) + max(xs)) / 2 * sc
    oy = (size - 1) / 2 - (min(ys) + max(ys)) / 2 * sc
    return sc, ox, oy

# Cape drape in model units: clasped just below the neck, hem at mid-shin
# so head + shoulders + full cape + lower legs all read in one frame.
# Bands are split into left/right halves so the painter sort orders the
# near cape edge correctly against the torso side (no false occlusion).
CAPE_Y0, CAPE_H = 21.0, 16.0
CAPE_Z = 2.2  # near side: worn OVER the back (rear view), never floating
CAPE_TOP_W, CAPE_HEM_W, CAPE_BANDS = 9.0, 13.0, 36


def render_cape_rear(tex):
    """3/4 rear product render sampling the REAL cape texture.

    The cloth is ONE continuous quad (no band slicing, so thin emblem
    lines survive pixel-perfect). It is drawn strictly after the body:
    at z=2.2 the cloth is the outermost layer over every body box
    (z<=2; the head never overlaps it on screen), so cape-on-top is the
    physically correct order everywhere — attached at the shoulders,
    hanging naturally, never clipping, never floating.
    """
    tw, th = tex.size
    s0 = math.sin(0.0) * 0.8
    s1 = math.sin(1.0 * 2.4) * 0.8
    w0, w1 = CAPE_TOP_W, CAPE_HEM_W
    quad = [(-w0 / 2 + s0, CAPE_Y0, CAPE_Z),
            (w0 / 2 + s0, CAPE_Y0, CAPE_Z),
            (w1 / 2 + s1, CAPE_Y0 - CAPE_H, CAPE_Z),
            (-w1 / 2 + s1, CAPE_Y0 - CAPE_H, CAPE_Z)]
    body = collect_rear(studio_body())
    cage = [(0.0, "cage", [p], "cage", None) for p in quad]
    sc, ox, oy = fit_rear(body + cage, SIZE, fill=0.94)
    im = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    add_shadow_rear(im, body, sc, ox, oy, SIZE)
    draw_faces_rear(im, body, sc, ox, oy)
    # Cloth last (outermost layer). Gentle top-down key falloff only —
    # smooth shading never slices emblem details.
    ghost = [(0.0, "pz", quad, "tex", (tex, (0, 0, tw, th), 1.0))]
    draw_cloth(im, ghost, sc, ox, oy)
    return im


def draw_cloth(im, faces, sc, ox, oy):
    def mp(p):
        return (ox + project(*p)[0] * sc, oy + project(*p)[1] * sc)

    for _d, fid, ps, kind, payload in faces:
        tex, (iu0, iv0, iu1, iv1), _pleat = payload
        poly = [mp(p) for p in ps]
        xs = [p[0] for p in poly]
        ys = [p[1] for p in poly]
        bx0, by0 = int(min(xs)), int(min(ys))
        bw = max(1, int(max(xs)) - bx0 + 1)
        bh = max(1, int(max(ys)) - by0 + 1)
        tile = tex.transform((bw, bh), Image.QUAD,
                             (iu0, iv0, iu0, iv1, iu1, iv1, iu1, iv0),
                             Image.NEAREST).convert("RGBA")
        # vertical key falloff: shoulders rest in soft shadow, hem at full
        # key. Smooth gradient — emblem-safe.
        shade = Image.new("L", (1, bh))
        spx = shade.load()
        for yy in range(bh):
            spx[0, yy] = int(255 * (0.90 + 0.10 * (yy / max(1, bh - 1))))
        shade = shade.resize((bw, bh))
        black = Image.new("RGBA", (bw, bh), (0, 0, 0, 255))
        tile = Image.composite(tile, black, shade)
        mask = Image.new("L", (bw, bh), 0)
        ImageDraw.Draw(mask).polygon(
            [(x - bx0, y - by0) for x, y in poly], fill=255)
        im.paste(tile, (bx0, by0), mask)


def draw_faces_rear(im, faces, sc, ox, oy):
    dr = ImageDraw.Draw(im)

    def mp(p):
        return (ox + project(*p)[0] * sc, oy + project(*p)[1] * sc)

    for _d, fid, ps, kind, payload in faces:
        poly = [mp(p) for p in ps]
        xs = [p[0] for p in poly]
        ys = [p[1] for p in poly]
        bx0, by0 = int(min(xs)), int(min(ys))
        bw = max(1, int(max(xs)) - bx0 + 1)
        bh = max(1, int(max(ys)) - by0 + 1)
        if kind == "tex":
            tex, (iu0, iv0, iu1, iv1), pleat = payload
            tile = tex.transform((bw, bh), Image.QUAD,
                                 (iu0, iv0, iu0, iv1, iu1, iv1, iu1, iv0),
                                 Image.NEAREST)
            # Studio key on the product with a pleat rhythm so the cloth
            # reads as draped fabric. (Body faces keep soft shading below.)
            tile = tile.convert("RGB").point(
                lambda v: max(0, min(255, int(v * pleat)))).convert("RGBA")
            mask = Image.new("L", (bw, bh), 0)
            ImageDraw.Draw(mask).polygon(
                [(x - bx0, y - by0) for x, y in poly], fill=255)
            im.paste(tile, (bx0, by0), mask)
            # No edge stroke on cloth: band borders would slice thin emblem
            # details (rings, rifts) into dashed fragments. Pleat shading
            # alone gives the drape read. Body faces keep edges below.
            continue
        col = renderer.shade(payload, renderer.SHADE[fid]) + (255,)
        dr.polygon(poly, fill=col)
        edge = tuple(max(0, c - 45) for c in col[:3]) + (255,)
        dr.line(poly + [poly[0]], fill=edge, width=max(2, int(sc * 0.07)))


def add_shadow_rear(im, faces, sc, ox, oy, size):
    pts2 = []
    for _d, _f, ps, _k, _p in faces:
        for p in ps:
            pts2.append((ox + project(*p)[0] * sc, oy + project(*p)[1] * sc))
    if not pts2:
        return
    xs = [p[0] for p in pts2]
    ys = [p[1] for p in pts2]
    cx = (min(xs) + max(xs)) / 2
    by = max(ys) + size * 0.03
    rx = max(8.0, (max(xs) - min(xs)) * 0.30)
    ry = max(4.0, rx * 0.30)
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(layer).ellipse([cx - rx, by - ry, cx + rx, by + ry],
                                 fill=(0, 0, 0, 95))
    im.alpha_composite(layer.filter(ImageFilter.GaussianBlur(12)))


def backdrop(accent):
    """Clean Vortex studio background: dark neutral gradient, subtle
    theme-tinted glow, faint dust. Never louder than the cape itself."""
    top, bottom = (13, 17, 34), (6, 8, 18)
    img = Image.new("RGB", (SIZE, SIZE))
    px = img.load()
    for y in range(SIZE):
        c = tuple(max(0, min(255, int(a + (b - a) * y / (SIZE - 1))))
                    for a, b in zip(top, bottom))
        for x in range(0, SIZE, 4):
            for k in range(4):
                if x + k < SIZE:
                    px[x + k, y] = c
    img = img.convert("RGBA")
    glow = Image.new("L", (SIZE, SIZE), 0)
    gp = glow.load()
    cx, cy, rmax = SIZE * 0.5, SIZE * 0.44, SIZE * 0.46
    for y in range(0, SIZE, 2):
        for x in range(0, SIZE, 2):
            d = math.hypot(x - cx, y - cy) / rmax
            if d < 1:
                v = int(70 * (1 - d) ** 2)
                for yy in (y, y + 1):
                    for xx in (x, x + 1):
                        if xx < SIZE and yy < SIZE and v > gp[xx, yy]:
                            gp[xx, yy] = v
    glow = glow.filter(ImageFilter.GaussianBlur(24))
    img = Image.composite(Image.new("RGBA", (SIZE, SIZE), accent + (255,)),
                          img, glow)
    return img


def dust(img, rnd, tint=(200, 210, 235)):
    import random as _r
    if not hasattr(rnd, "uniform"):
        rnd = _r.Random(rnd)
    dr = ImageDraw.Draw(img, "RGBA")
    for _ in range(46):
        x, y = rnd.uniform(0, SIZE), rnd.uniform(0, SIZE)
        r = rnd.uniform(1.0, 2.6)
        a = rnd.randint(14, 46)
        dr.ellipse([x - r, y - r, x + r, y + r], fill=tint + (a,))
    return img


# Link-Account Collection cape (the ONLY cape). The preview is always
# rendered FROM the real 64x32 client texture on disk — never painted
# separately, never AI art.
CAPES = [
    # (cape id, studio glow accent)
    ("vortex-signature-cape", (0, 200, 235)),
]

# Standard 64x32 cape UV: back panel (visible design face when worn).
BACK_PANEL = (12, 1, 10, 16)  # x, y, w, h


def load_design(cid):
    """The REAL cape texture worn by the client: back-panel crop of the
    64x32 file, NEAREST-upscaled for the cloth mapper. Hard gate: the
    source file must be a genuine 64x32 cape texture."""
    stem = cid.replace("-", "_")
    path = os.path.join(OUT_DIR, stem + ".png")
    src = Image.open(path).convert("RGB")
    if src.size != (64, 32):
        raise RuntimeError("%s is %s, must be 64x32" % (path, src.size))
    x, y, w, h = BACK_PANEL
    return src.crop((x, y, x + w, y + h)).resize((w * 4, h * 4), Image.NEAREST)


def nonblank(im):
    px = im.convert("RGBA").load()
    w, h = im.size
    seen, alpha = set(), 0
    for y in range(0, h, 6):
        for x in range(0, w, 6):
            p = px[x, y]
            if p[3] > 20:
                alpha += 1
                seen.add((p[0] // 48, p[1] // 48, p[2] // 48))
    return alpha > 400 and len(seen) >= 4


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    made, fails = 0, []
    for cid, accent in CAPES:
        stem = cid.replace("-", "_")
        tex_path = os.path.join(OUT_DIR, stem + ".png")
        prev_path = os.path.join(OUT_DIR, stem + "_preview.webp")
        if not os.path.isfile(tex_path):
            fails.append((cid, "missing client texture " + tex_path))
            continue
        try:
            tex = load_design(cid)  # preview FROM the real texture
            render = render_cape_rear(tex)
            if render is None or not nonblank(render):
                raise RuntimeError("blank render")
            photo = backdrop(accent)
            photo = dust(photo, seed_of(cid))
            photo.alpha_composite(render)
            photo.save(prev_path, "WEBP", quality=82, method=4)
        except Exception as e:
            fails.append((cid, str(e)))
            continue
        made += 1
        print("  [OK] %s (%d bytes) from %s" %
              (os.path.basename(prev_path), os.path.getsize(prev_path),
               os.path.basename(tex_path)))
    print("render-cape-previews: rendered=%d failed=%d" % (made, len(fails)))
    for cid, why in fails:
        print("FAIL: %s (%s)" % (cid, why))
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
