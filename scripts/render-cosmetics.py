#!/usr/bin/env python3
"""Vortex cosmetic render pipeline: game model -> software renderer -> WebP.

Reads the REAL game assets (vortex-menu-mod model JSON + texture PNGs),
rasterizes them with a dimetric software renderer (Pillow only, no deps),
and writes one flat transparent store render per cosmetic:

  VortexSite/cosmetics/<cat>/<id>.webp   (512px, q88)

Per type:
  WINGS/PET/HAT : all model boxes, dimetric 3/4 view, texture-true flat
                  shading, painter-sorted faces.
  CAPE          : "vanilla":"cloak" sentinel -> tapered cloak quad whose
                  vertical gradient is sampled from the REAL cape texture.
  AURA          : particle ring using the particle named in the anim JSON
                  (portal/flame/soul_fire_flame/...) mapped to colors.
  SUIT          : composite of the real outfit members (lead + row).

Self-checks: every render must be non-blank; wings renders must be
structurally symmetric (mirrored mass + centered bbox).

Run:  python scripts/render-cosmetics.py
Requires: Pillow
"""
import json
import math
import os
import sys

try:
    from PIL import Image, ImageDraw
except ImportError:
    print("render-cosmetics: ERROR: Pillow not installed (pip install pillow)")
    sys.exit(1)

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
MOD = os.path.normpath(os.path.join(
    SITE, "..", "MinecraftLauncher", "vortex-menu-mod", "src", "main",
    "resources", "assets", "vortex_menu"))
INDEX = os.path.join(MOD, "cosmetics", "index.json")
OUT = os.path.join(SITE, "cosmetics")

COS30 = math.cos(math.radians(30))
SIN30 = 0.5

SLOT_CAT = {"CAPE": "cloaks", "HEAD": "headwear", "BACK": "wings",
            "PET": "pets", "AURA": "auras", "SUIT": "suits"}

PARTICLE_COL = {
    "portal": (168, 85, 247), "enchant": (74, 222, 128),
    "flame": (251, 146, 60), "soul_fire_flame": (56, 189, 248),
    "heart": (244, 114, 182), "smoke": (156, 163, 175),
    "note": (250, 204, 21), "glow": (253, 224, 71),
    "dust": (216, 180, 254), "dragon_breath": (192, 132, 252),
    "electric_spark": (125, 211, 252), "snowflake": (186, 230, 253),
    "end_rod": (240, 240, 255),
}


def asset(rel):
    p = os.path.join(MOD, rel.replace("/", os.sep))
    return p if os.path.isfile(p) else None


def candidates(rel):
    out = [rel]
    if rel.startswith("cosmetics/") and not rel.startswith("cosmetics/cosmetics/"):
        out.append("cosmetics/" + rel)
    if rel.startswith("cosmetics/cosmetics/"):
        out.append(rel[len("cosmetics/"):])
    return out


def resolve(rel):
    for c in candidates(rel or ""):
        p = asset(c)
        if p:
            return p
    return None


def load_json(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def tex_avg(tex, u, v, w, h):
    """Average color of a texture region (clamped)."""
    tw, th = tex.size
    px = tex.load()
    u0 = max(0, min(tw - 1, int(u)))
    v0 = max(0, min(th - 1, int(v)))
    u1 = max(u0 + 1, min(tw, int(u + max(1, w))))
    v1 = max(v0 + 1, min(th, int(v + max(1, h))))
    r = g = b = n = 0
    for yy in range(v0, v1):
        for xx in range(u0, u1):
            p = px[xx, yy]
            r += p[0]
            g += p[1]
            b += p[2]
            n += 1
    if not n:
        return (200, 200, 200)
    return (r // n, g // n, b // n)


def project(x, y, z):
    return ((z - x) * COS30, (x + z) * SIN30 - y)


def box_faces(b):
    """Yield (face_id, 3d_pts, normal) for the camera-visible faces (+X,+Y,+Z)."""
    x0, y0, z0, x1, y1, z1 = b
    yield ("py", [(x0, y1, z0), (x1, y1, z0), (x1, y1, z1), (x0, y1, z1)], (0, 1, 0))
    yield ("px", [(x1, y0, z0), (x1, y0, z1), (x1, y1, z1), (x1, y1, z0)], (1, 0, 0))
    yield ("pz", [(x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)], (0, 0, 1))


SHADE = {"py": 1.0, "px": 0.72, "pz": 0.88}


def shade(col, k):
    return tuple(max(0, min(255, int(c * k))) for c in col)


# Consistent studio mannequin (same geometry/colors/pose for every product
# that is worn on the body — never a random character, never AI).
GRAPHITE = (38, 43, 54)
GRAPHITE_LT = (47, 52, 64)
MAN_FULL = {
    "torso": {"flat": GRAPHITE, "boxes": [{"from": [-4, 10, -2], "to": [4, 22, 2]}]},
    "head": {"flat": GRAPHITE_LT, "boxes": [{"from": [-4, 22, -4], "to": [4, 30, 4]}]},
    "armL": {"flat": GRAPHITE, "boxes": [{"from": [4, 10, -2], "to": [7, 21, 2]}]},
    "armR": {"flat": GRAPHITE, "boxes": [{"from": [-7, 10, -2], "to": [-4, 21, 2]}]},
    "legL": {"flat": GRAPHITE, "boxes": [{"from": [0.5, 0, -2], "to": [3.5, 10, 2]}]},
    "legR": {"flat": GRAPHITE, "boxes": [{"from": [-3.5, 0, -2], "to": [-0.5, 10, 2]}]},
}
MAN_HEAD = {"head": MAN_FULL["head"]}
MAN_TORSO = {"torso": MAN_FULL["torso"], "head": MAN_FULL["head"]}


def uv_rect(fid, u, v, dx, dy, dz, tw, th):
    """Per-face UV rect (documented approximation of the vanilla cuboid
    unfolding). Only +X/+Y/+Z faces are ever drawn by our camera."""
    if fid == "pz":
        r = (u, v, dx, dy)
    elif fid == "px":
        r = (u + dx, v, dz, dy)
    else:
        r = (u + dx + dz, v, dx, dz)
    x0 = max(0, min(tw - 1, int(r[0])))
    y0 = max(0, min(th - 1, int(r[1])))
    x1 = max(x0 + 1, min(tw, int(r[0] + max(1, r[2]))))
    y1 = max(y0 + 1, min(th, int(r[1] + max(1, r[3]))))
    return (x0, y0, x1, y1)


def collect_faces(parts, tex=None):
    """parts: model-style {name: {mirror?, flat?, boxes:[{uv?,from,to}]}}.
    Returns [(depth, fid, pts3d, kind, payload)] where kind is 'tex' with
    (tex_img, uvrect) or 'flat' with an (r,g,b) color."""
    faces = []
    for _name, spec in (parts or {}).items():
        mirror = bool(spec.get("mirror"))
        flat = spec.get("flat")
        for b in spec.get("boxes", []):
            uv = b.get("uv", [0, 0])
            f, t = b["from"], b["to"]
            x0, y0, z0 = f
            x1, y1, z1 = t
            if mirror:
                x0, x1 = -x1, -x0
            box = (min(x0, x1), min(y0, y1), min(z0, z1),
                   max(x0, x1), max(y0, y1), max(z0, z1))
            dx = box[3] - box[0]
            dy = box[4] - box[1]
            dz = box[5] - box[2]
            if dx <= 0 or dy <= 0 or dz <= 0:
                continue
            for fid, pts, _n in box_faces(box):
                cx = sum(p[0] for p in pts) / 4.0
                cy = sum(p[1] for p in pts) / 4.0
                cz = sum(p[2] for p in pts) / 4.0
                depth = (cx + cz) - cy * 0.5
                if flat is not None:
                    faces.append((depth, fid, pts, "flat", tuple(flat)))
                elif tex is not None:
                    tw, th = tex.size
                    ur = uv_rect(fid, uv[0], uv[1], dx, dy, dz, tw, th)
                    faces.append((depth, fid, pts, "tex", (tex, ur)))
    faces.sort(key=lambda f: f[0])
    return faces


def fit_faces(faces, size, fill=0.84):
    pts2 = [project(*p) for _d, _f, ps, _k, _p in faces for p in ps]
    xs = [p[0] for p in pts2]
    ys = [p[1] for p in pts2]
    bw = max(1.0, max(xs) - min(xs))
    bh = max(1.0, max(ys) - min(ys))
    sc = min((size * fill) / bw, (size * fill) / bh)
    ox = (size - 1) / 2 - (min(xs) + max(xs)) / 2 * sc
    oy = (size - 1) / 2 - (min(ys) + max(ys)) / 2 * sc
    return sc, ox, oy


def draw_faces(im, faces, sc, ox, oy):
    from PIL import Image as _I
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
            tex, (iu0, iv0, iu1, iv1) = payload
            tile = tex.transform((bw, bh), _I.QUAD,
                                 (iu0, iv0, iu0, iv1, iu1, iv1, iu1, iv0),
                                 _I.NEAREST)
            k = SHADE[fid]
            tile = tile.convert("RGB").point(lambda v: int(v * k)).convert("RGBA")
            mask = _I.new("L", (bw, bh), 0)
            ImageDraw.Draw(mask).polygon([(x - bx0, y - by0) for x, y in poly], fill=255)
            im.paste(tile, (bx0, by0), mask)
            edge = None
        else:
            col = shade(payload, SHADE[fid]) + (255,)
            dr.polygon(poly, fill=col)
            edge = tuple(max(0, c - 45) for c in col[:3]) + (255,)
        if edge is None:
            # dark crisp edge sampled from the face itself
            edge = (10, 12, 18, 255)
        dr.line(poly + [poly[0]], fill=edge, width=max(2, int(sc * 0.07)))


def add_shadow(im, faces, sc, ox, oy, size):
    from PIL import Image as _I, ImageFilter as _F
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
    layer = _I.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(layer).ellipse([cx - rx, by - ry, cx + rx, by + ry], fill=(0, 0, 0, 95))
    layer = layer.filter(_F.GaussianBlur(12))
    im.alpha_composite(layer)


def render_parts(parts, tex, size=512, figures=None):
    """Rasterize model parts (+ optional mannequin figures) -> RGBA image."""
    faces = collect_faces(figures) + collect_faces(parts, tex)
    if not faces:
        return None
    sc, ox, oy = fit_faces(faces, size)
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    add_shadow(im, faces, sc, ox, oy, size)
    draw_faces(im, faces, sc, ox, oy)
    return im


def render_cape(tex, size=512, figures=None):
    """Cloak worn behind the torso: 24 textured bands sampling the REAL cape
    texture (creeper faces, starfields and all), draped behind the body."""
    tw, th = tex.size
    bands = 24
    top_w, hem_w, h = 9.0, 12.5, 21.0
    y0 = 10.0
    faces = collect_faces(figures)
    for i in range(bands):
        t0, t1 = i / bands, (i + 1) / bands
        w0 = top_w + (hem_w - top_w) * t0
        w1 = top_w + (hem_w - top_w) * t1
        sway = math.sin(t1 * 2.4) * 1.2
        z = -2.2
        p3 = [(-w0 / 2, y0 - h * t0, z), (w0 / 2, y0 - h * t0, z),
              (w1 / 2 + sway, y0 - h * t1, z), (-w1 / 2 + sway, y0 - h * t1, z)]
        v0 = max(0, min(th - 1, int(t0 * th)))
        v1 = max(v0 + 1, min(th, int(t1 * th) + 1))
        depth = (0 + z) - (y0 - h * (t0 + t1) / 2) * 0.5
        faces.append((depth, "pz", p3, "tex", (tex, (0, v0, tw, v1))))
    faces.sort(key=lambda f: f[0])
    if not faces:
        return None
    sc, ox, oy = fit_faces(faces, size, fill=0.80)
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    add_shadow(im, faces, sc, ox, oy, size)
    draw_faces(im, faces, sc, ox, oy)
    return im


def render_aura(color, size=512, seed="", figures=None):
    """Particle ring motif around the mannequin torso. Geometry varies
    deterministically per cosmetic id (same particle color = same effect
    family, but every product card is visually distinct)."""
    import hashlib as _hl
    h = int(_hl.md5(seed.encode("utf-8")).hexdigest()[:8], 16) if seed else 0
    tilt = 0.11 + (h % 100) / 100 * 0.08
    phase = ((h >> 8) % 100) / 100 * 2 * math.pi
    faces = collect_faces(figures)
    if not faces:
        return None
    sc, ox, oy = fit_faces(faces, size)
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    add_shadow(im, faces, sc, ox, oy, size)
    draw_faces(im, faces, sc, ox, oy)

    def mp(p):
        return (ox + project(*p)[0] * sc, oy + project(*p)[1] * sc)

    dr = ImageDraw.Draw(im)
    ccx, ccy = mp((0, 13, 0))
    trx, _try = mp((7, 13, 0))
    rx = abs(trx - ccx) * 1.35
    ry = rx * (0.32 + (h % 50) / 100 * 0.2)
    glow = color + (255,)
    rings = 2 + (h % 3 == 0)
    for ring in range(rings):
        rr = 1.0 - ring * (0.24 + ((h >> (4 + ring)) % 10) / 100)
        n = 26 - ring * 6 + ((h >> (8 + ring * 3)) % 7) - 3
        dot = max(4, size / 512 * (13 - ring * 3) * (rx / (size * 0.3)))
        for i in range(max(8, n)):
            a = 2 * math.pi * i / n + phase + ring * 0.35
            x = ccx + math.cos(a) * rx * rr
            y = ccy + math.sin(a) * ry * rr - ring * size * 0.02
            r = dot * (0.8 + 0.2 * math.sin(a * 3))
            fade = (200, 200, 200, 110)
            dr.ellipse([x - r * 1.9, y - r * 1.9, x + r * 1.9, y + r * 1.9], fill=fade)
            dr.ellipse([x - r, y - r, x + r, y + r], fill=glow)
    return im


def render_piece(by_id, oid, figures=None):
    """Render one catalog item's model -> RGBA image, or None."""
    ref = by_id.get(oid, {})
    mp = resolve(ref.get("model") or "")
    tp = resolve(ref.get("texture") or "")
    if not mp or not tp:
        return None
    try:
        m = load_json(mp)
    except Exception:
        return None
    if not isinstance(m.get("parts"), dict):
        return None
    try:
        return render_parts(m["parts"], Image.open(tp).convert("RGB"), figures=figures)
    except Exception:
        return None


def composite_suit(lead, comps, size=512):
    """Bundle presentation: lead piece large + companion pieces in a row.
    Every pasted tile is a real render of an outfit member — no invented art."""
    base = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    lw = int(size * 0.70)
    lead_r = lead.resize((lw, lw), Image.LANCZOS)
    base.paste(lead_r, ((size - lw) // 2, 4), lead_r)
    comps = [c for c in comps if c is not None][:3]
    if comps:
        cw = size // (len(comps) + 1)
        y = size - cw - 8
        for i, c in enumerate(comps):
            r = c.resize((cw, cw), Image.LANCZOS)
            x = (size - cw * len(comps)) // 2 + i * cw
            base.paste(r, (x, y), r)
    return base


def nonblank(im):
    px = im.load()
    w, h = im.size
    colors = set()
    alpha = 0
    for y in range(0, h, 4):
        for x in range(0, w, 4):
            p = px[x, y]
            if p[3] > 20:
                alpha += 1
                colors.add((p[0] // 32, p[1] // 32, p[2] // 32))
    # dark-but-present renders (void/shadow, single-color hats) legitimately
    # have few colors; coverage is the real signal
    return alpha > 150 and (len(colors) >= 2 or alpha > 2000)


def symmetric(im, tol=0.03):
    """Structural left/right symmetry: mirrored alpha mass + centered bbox.
    (Pixel-diff checks are too fragile: sub-pixel centering + bilinear edges
    produce false failures on renders that are visibly perfectly mirrored.)
    NOTE: worn renders (wings + mannequin) use a larger tol on purpose — a
    correct 3/4 camera puts the +x wing nearer, so it covers more of the
    torso than its mirror. That is right, not a bug."""
    w, h = im.size
    px = im.load()
    left = right = 0
    minx, maxx = w, -1
    for y in range(h):
        for x in range(w):
            if px[x, y][3] > 20:
                if x < w // 2:
                    left += 1
                else:
                    right += 1
                if x < minx:
                    minx = x
                if x > maxx:
                    maxx = x
    tot = left + right
    if tot < 500:
        return False
    if abs(left - right) / tot > tol:
        return False
    center = (minx + maxx) / 2
    return abs(center - (w - 1) / 2) / w <= 0.015


def main():
    idx = load_json(INDEX)
    by_id = {c["id"]: c for c in idx.get("cosmetics", [])}
    self_mtime = os.path.getmtime(os.path.abspath(__file__))
    made = skipped = 0
    fails = []
    for cid, c in sorted(by_id.items()):
        ctype = c.get("type", "")
        slot = c.get("slot", "")
        cat = SLOT_CAT.get(slot, "misc")
        ddir = os.path.join(OUT, cat)
        out = os.path.join(ddir, cid + ".webp")
        os.makedirs(ddir, exist_ok=True)
        # freshness: skip unless a source changed
        try:
            srcs = [self_mtime]
            for rel in (c.get("model") or "", c.get("texture") or "", c.get("anim") or ""):
                p = resolve(rel)
                if p:
                    srcs.append(os.path.getmtime(p))
            if ctype == "SUIT":
                for _k, oid in (c.get("outfit") or {}).items():
                    ref = by_id.get(oid, {})
                    for rel in (ref.get("model") or "", ref.get("texture") or ""):
                        p = resolve(rel)
                        if p:
                            srcs.append(os.path.getmtime(p))
            if os.path.exists(out) and os.path.getmtime(out) >= max(srcs):
                skipped += 1
                continue
        except Exception:
            pass
        im = None
        try:
            if ctype == "AURA":
                particle = "flame"
                ap = resolve(c.get("anim") or "")
                if ap:
                    try:
                        particle = str(load_json(ap).get("particle", "flame"))
                    except Exception:
                        pass
                im = render_aura(PARTICLE_COL.get(particle.lower(), (251, 146, 60)), seed=cid, figures=MAN_TORSO)
            elif ctype == "CAPE":
                tp = resolve(c.get("texture") or "")
                if not tp:
                    raise RuntimeError("no texture")
                im = render_cape(Image.open(tp).convert("RGB"), figures=MAN_TORSO)
            else:
                # SUIT: composite of the real outfit members (lead + row).
                # Falls back to any single renderable piece, never blank.
                # WINGS wear a full body, HATs sit on the head, PETs stand
                # alone — one consistent mannequin everywhere.
                figs = {"WINGS": MAN_FULL, "HAT": MAN_HEAD}.get(ctype)
                outfit = c.get("outfit") or {}
                ordered = []
                if outfit.get("BACK"):
                    ordered.append(outfit["BACK"])
                ordered += [v for v in outfit.values() if v not in ordered]
                if cid not in ordered:
                    ordered.append(cid)
                renders = []
                for oid in ordered:
                    r = render_piece(by_id, oid, figures=figs if ctype != "SUIT" else None)
                    if r is not None:
                        renders.append(r)
                if not renders:
                    raise RuntimeError("no renderable outfit piece")
                im = composite_suit(renders[0], renders[1:]) if len(renders) > 1 else renders[0]
        except Exception as e:
            fails.append((cid, str(e)))
            continue
        if im is None or not nonblank(im):
            fails.append((cid, "blank render"))
            continue
        if ctype == "WINGS" and not symmetric(im, tol=0.06):
            fails.append((cid, "asymmetric wings render"))
            continue
        im.save(out, "WEBP", quality=88, method=4)
        made += 1
        if made % 10 == 0:
            print("  ...%d done" % made, flush=True)
    print("render-cosmetics: rendered=%d skipped=%d failed=%d" % (made, skipped, len(fails)), flush=True)
    for cid, why in fails:
        print("FAIL: %s (%s)" % (cid, why))
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
