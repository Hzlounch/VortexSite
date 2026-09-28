#!/usr/bin/env python3
"""Vortex cosmetic render pipeline: game model -> software renderer -> WebP.

Reads the REAL game assets (vortex-menu-mod model JSON + texture PNGs),
rasterizes them with a dimetric software renderer (Pillow only, no deps),
and writes transparent store previews:

  VortexSite/assets/cosmetics/<cat>/<id>/preview.webp   (512px, q88)
  VortexSite/assets/cosmetics/<cat>/<id>/thumb.webp     (256px, q80)

Per type:
  WINGS/PET/HAT : all model boxes, dimetric 3/4 view, texture-true flat
                  shading, painter-sorted faces.
  CAPE          : "vanilla":"cloak" sentinel -> tapered cloak quad whose
                  vertical gradient is sampled from the REAL cape texture.
  AURA          : particle ring using the particle named in the anim JSON
                  (portal/flame/soul_fire_flame/...) mapped to colors.
  SUIT          : renders the outfit's BACK piece (or first outfit piece).

Self-checks: every render must be non-blank; wings renders must be
horizontally symmetric (validates projection + mirror handling).

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
OUT = os.path.join(SITE, "assets", "cosmetics")

COS30 = math.cos(math.radians(30))
SIN30 = 0.5

SLOT_CAT = {"CAPE": "cloaks", "HEAD": "headwear", "BACK": "wings",
            "PET": "pets", "AURA": "auras", "SUIT": "bundles"}

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


def render_parts(parts, tex, size=512):
    """Rasterize model parts -> transparent RGBA image."""
    faces = []
    for _name, spec in parts.items():
        mirror = bool(spec.get("mirror"))
        for b in spec.get("boxes", []):
            uv = b.get("uv", [0, 0])
            f, t = b["from"], b["to"]
            x0, y0, z0 = f
            x1, y1, z1 = t
            if mirror:
                x0, x1 = -x1, -x0
            col = tex_avg(tex, uv[0], uv[1], abs(x1 - x0), abs(y1 - y0))
            box = (min(x0, x1), min(y0, y1), min(z0, z1),
                   max(x0, x1), max(y0, y1), max(z0, z1))
            for fid, pts, _n in box_faces(box):
                cx = sum(p[0] for p in pts) / 4.0
                cy = sum(p[1] for p in pts) / 4.0
                cz = sum(p[2] for p in pts) / 4.0
                depth = (cx + cz) - cy * 0.5
                faces.append((depth, fid, pts, shade(col, SHADE[fid])))
    faces.sort(key=lambda f: f[0])
    if not faces:
        return None
    pts2 = [project(*p) for _d, _f, ps, _c in faces for p in ps]
    xs = [p[0] for p in pts2]
    ys = [p[1] for p in pts2]
    bw = max(1.0, max(xs) - min(xs))
    bh = max(1.0, max(ys) - min(ys))
    sc = min((size * 0.84) / bw, (size * 0.84) / bh)
    # center on the pixel grid ((size-1)/2), otherwise mirrored renders
    # come out half a pixel off and fail the symmetry check
    ox = (size - 1) / 2 - (min(xs) + max(xs)) / 2 * sc
    oy = (size - 1) / 2 - (min(ys) + max(ys)) / 2 * sc

    def mp(p):
        return (ox + p[0] * sc, oy + p[1] * sc)

    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    dr = ImageDraw.Draw(im)
    for _d, _f, ps, col in faces:
        poly = [mp(project(*p)) for p in ps]
        dr.polygon(poly, fill=col + (255,))
        edge = tuple(max(0, c - 45) for c in col) + (255,)
        dr.line(poly + [poly[0]], fill=edge, width=max(2, int(sc * 0.09)))
    return im


def render_cape(tex, size=512):
    """Tapered cloak quad with gradient sampled from the real texture."""
    tw, th = tex.size
    bands = 24
    cols = []
    for i in range(bands):
        v = int(i * th / bands)
        cols.append(tex_avg(tex, 0, v, tw, max(1, th // bands)))
    top_w, hem_w, h = 9.0, 12.5, 21.0
    y0 = 10.0
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    dr = ImageDraw.Draw(im)
    quads = []
    for i in range(bands):
        t0, t1 = i / bands, (i + 1) / bands
        w0 = top_w + (hem_w - top_w) * t0
        w1 = top_w + (hem_w - top_w) * t1
        sway = math.sin(t1 * 2.4) * 1.2
        p3 = [(-w0 / 2, y0 - h * t0, 0), (w0 / 2, y0 - h * t0, 0),
              (w1 / 2 + sway, y0 - h * t1, 0), (-w1 / 2 + sway, y0 - h * t1, 0)]
        fold = 0.92 if (i % 3 == 1) else 1.0
        quads.append((p3, shade(cols[i], 0.9 * fold)))
    pts2 = [project(*p) for q, _c in quads for p in q]
    xs = [p[0] for p in pts2]
    ys = [p[1] for p in pts2]
    sc = min((size * 0.8) / max(1.0, max(xs) - min(xs)),
             (size * 0.8) / max(1.0, max(ys) - min(ys)))
    ox = size / 2 - (min(xs) + max(xs)) / 2 * sc
    oy = size / 2 - (min(ys) + max(ys)) / 2 * sc
    for q, col in quads:
        poly = [(ox + project(*p)[0] * sc, oy + project(*p)[1] * sc) for p in q]
        dr.polygon(poly, fill=col + (255,))
    return im


def render_aura(color, size=512, seed=""):
    """Particle ring motif. Geometry varies deterministically per cosmetic id
    (same particle color = same effect family, but every product card is
    visually distinct)."""
    import hashlib as _hl
    h = int(_hl.md5(seed.encode("utf-8")).hexdigest()[:8], 16) if seed else 0
    tilt = 0.11 + (h % 100) / 100 * 0.08
    phase = ((h >> 8) % 100) / 100 * 2 * math.pi
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    dr = ImageDraw.Draw(im)
    cx = cy = size / 2
    rx, ry = size * 0.30, size * 0.30 * tilt / 0.13
    glow = color + (255,)
    rings = 2 + (h % 3 == 0)
    for ring in range(rings):
        rr = 1.0 - ring * (0.24 + ((h >> (4 + ring)) % 10) / 100)
        n = 26 - ring * 6 + ((h >> (8 + ring * 3)) % 7) - 3
        dot = 13 - ring * 3
        for i in range(max(8, n)):
            a = 2 * math.pi * i / n + phase + ring * 0.35
            x = cx + math.cos(a) * rx * rr
            y = cy + math.sin(a) * ry * rr - size * 0.03 * ring
            r = dot * (0.8 + 0.2 * math.sin(a * 3))
            fade = (200, 200, 200, 110)
            dr.ellipse([x - r * 1.9, y - r * 1.9, x + r * 1.9, y + r * 1.9], fill=fade)
            dr.ellipse([x - r, y - r, x + r, y + r], fill=glow)
    dr.ellipse([cx - 26, cy - 66, cx + 26, cy - 14], fill=glow)
    return im


def render_piece(by_id, oid):
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
        return render_parts(m["parts"], Image.open(tp).convert("RGB"))
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
    produce false failures on renders that are visibly perfectly mirrored.)"""
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
        ddir = os.path.join(OUT, cat, cid)
        prev = os.path.join(ddir, "preview.webp")
        thumb = os.path.join(ddir, "thumb.webp")
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
            if os.path.exists(prev) and os.path.exists(thumb) and \
                    os.path.getmtime(prev) >= max(srcs):
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
                im = render_aura(PARTICLE_COL.get(particle.lower(), (251, 146, 60)), seed=cid)
            elif ctype == "CAPE":
                tp = resolve(c.get("texture") or "")
                if not tp:
                    raise RuntimeError("no texture")
                im = render_cape(Image.open(tp).convert("RGB"))
            else:
                # SUIT: composite of the real outfit members (lead + row).
                # Falls back to any single renderable piece, never blank.
                outfit = c.get("outfit") or {}
                ordered = []
                if outfit.get("BACK"):
                    ordered.append(outfit["BACK"])
                ordered += [v for v in outfit.values() if v not in ordered]
                if cid not in ordered:
                    ordered.append(cid)
                renders = []
                for oid in ordered:
                    r = render_piece(by_id, oid)
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
        if ctype == "WINGS" and not symmetric(im):
            fails.append((cid, "asymmetric wings render"))
            continue
        im.save(prev, "WEBP", quality=88, method=4)
        im.resize((256, 256), Image.LANCZOS).save(thumb, "WEBP", quality=80, method=4)
        made += 1
        if made % 10 == 0:
            print("  ...%d done" % made, flush=True)
    print("render-cosmetics: rendered=%d skipped=%d failed=%d" % (made, skipped, len(fails)), flush=True)
    for cid, why in fails:
        print("FAIL: %s (%s)" % (cid, why))
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
