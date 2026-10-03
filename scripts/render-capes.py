#!/usr/bin/env python3
"""VORTEX CAPES-ONLY STORE — premium cape render pipeline.

Generates the starter cape collection product renders: one consistent,
original, Minecraft-style back-view product render per cape:

    cosmetics/capes/<file>.webp   (768px, WebP)

Visual system (identical for every cape):
  - dark studio backdrop: vertical gradient + theme-tinted radial glow,
    faint floor line, soft contact shadow, subtle dust (never louder
    than the cape itself)
  - blocky Minecraft-proportion player mannequin seen from the back
    (head / torso / arms / legs), graphite cloth, soft studio key light
    from the upper left + rim light
  - cape worn behind the shoulders with clasps, gentle A-line drape,
    fabric fold shading, hem trim; the cape texture is an ORIGINAL
    per-cape pixel-art design (40x56, NEAREST-scaled, crisp pixels)

No text, no watermarks, no AI art, no copied assets — every design is
procedural and deterministic (seeded per cape id).

Run:  python scripts/render-capes.py
Requires: Pillow (WebP support)
"""
import hashlib
import math
import os
import random
import sys

try:
    from PIL import Image, ImageDraw, ImageFilter
except ImportError:
    print("render-capes: ERROR: Pillow not installed (pip install pillow)")
    sys.exit(1)

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
OUT_DIR = os.path.join(SITE, "cosmetics", "capes")

SIZE = 768          # detail-grade master; cards downscale it in the browser
TW, TH = 40, 56     # cape pixel-art canvas (crisp NEAREST upscale)


def seed_of(cid):
    return int(hashlib.md5(cid.encode("utf-8")).hexdigest()[:8], 16)


def clamp(v, lo=0, hi=255):
    return max(lo, min(hi, int(v)))


def lerp(a, b, t):
    return a + (b - a) * t


def mix(c1, c2, t):
    return tuple(clamp(lerp(a, b, t)) for a, b in zip(c1, c2))


def shade(col, k):
    return tuple(clamp(c * k) for c in col)


# ---------------------------------------------------------------- backdrop
def backdrop(accent):
    """Dark studio backdrop + theme glow + floor + dust. Returns RGBA."""
    top = (13, 17, 34)
    bottom = (6, 8, 18)
    img = Image.new("RGB", (SIZE, SIZE))
    px = img.load()
    for y in range(SIZE):
        t = y / (SIZE - 1)
        c = tuple(clamp(lerp(a, b, t)) for a, b in zip(top, bottom))
        for x in range(0, SIZE, 4):
            for k in range(4):
                if x + k < SIZE:
                    px[x + k, y] = c
    img = img.convert("RGBA")
    # theme radial glow behind the subject
    glow = Image.new("L", (SIZE, SIZE), 0)
    gp = glow.load()
    cx, cy = SIZE * 0.5, SIZE * 0.44
    rmax = SIZE * 0.46
    for y in range(0, SIZE, 2):
        for x in range(0, SIZE, 2):
            d = math.hypot(x - cx, y - cy) / rmax
            if d < 1:
                v = int(70 * (1 - d) ** 2)
                for yy in (y, y + 1):
                    for xx in (x, x + 1):
                        if xx < SIZE and yy < SIZE:
                            gp[xx, yy] = max(gp[xx, yy], v)
    glow = glow.filter(ImageFilter.GaussianBlur(24))
    solid = Image.new("RGBA", (SIZE, SIZE), accent + (255,))
    img = Image.composite(solid, img, glow)
    dr = ImageDraw.Draw(img)
    # faint floor line + soft contact shadow
    dr.line([(SIZE * 0.12, SIZE * 0.872), (SIZE * 0.88, SIZE * 0.872)],
            fill=(255, 255, 255, 22), width=2)
    sh = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse(
        [SIZE * 0.5 - 150, SIZE * 0.872 - 26, SIZE * 0.5 + 150, SIZE * 0.872 + 26],
        fill=(0, 0, 0, 110))
    img = Image.alpha_composite(img, sh.filter(ImageFilter.GaussianBlur(14)))
    return img


def dust(img, rnd, tint=(200, 210, 235)):
    dr = ImageDraw.Draw(img, "RGBA")
    for _ in range(46):
        x = rnd.uniform(0, SIZE)
        y = rnd.uniform(0, SIZE)
        r = rnd.uniform(1.0, 2.6)
        a = rnd.randint(14, 46)
        dr.ellipse([x - r, y - r, x + r, y + r], fill=tint + (a,))
    return img


# ------------------------------------------------------- cape pixel designs
def base_vertical(dr, c_top, c_bot):
    for y in range(TH):
        c = tuple(clamp(lerp(a, b, y / (TH - 1))) for a, b in zip(c_top, c_bot))
        dr.line([(0, y), (TW - 1, y)], fill=c)


def speckle(dr, rnd, colors, n=90, area=None):
    x0, y0, x1, y1 = area or (0, 0, TW - 1, TH - 1)
    for _ in range(n):
        dr.point((rnd.randint(x0, x1), rnd.randint(y0, y1)),
                 fill=rnd.choice(colors))


def stars(dr, rnd, n=34, bright=(235, 240, 255)):
    for _ in range(n):
        x, y = rnd.randint(0, TW - 1), rnd.randint(0, TH - 1)
        dr.point((x, y), fill=bright)
        if rnd.random() < 0.25 and x + 1 < TW:
            dr.point((x + 1, y), fill=(150, 160, 200))


def ring(dr, cx, cy, r, col, w=2):
    dr.ellipse([cx - r, cy - r, cx + r, cy + r], outline=col, width=w)


def flame_tongues(dr, rnd, base_y, cols, n=5, hmax=26, seed_x=None):
    xs = seed_x or [4 + i * (TW - 8) // max(1, n - 1) for i in range(n)]
    for i, x in enumerate(xs):
        h = rnd.randint(hmax - 10, hmax) - abs(i - n // 2) * 2
        w = rnd.randint(4, 6)
        for layer, col in enumerate(cols):
            lh = h - layer * 5
            lw = max(2, w - layer * 2)
            if lh <= 2:
                continue
            dr.polygon([(x - lw, base_y), (x + lw, base_y),
                        (x + rnd.randint(-1, 1), base_y - lh)], fill=col)


def bolt(dr, x, y0, y1, col, w=3):
    pts = [(x, y0), (x - 4, (y0 + y1) // 2 + 3), (x - 1, (y0 + y1) // 2 + 3),
           (x - 3, y1), (x + 4, (y0 + y1) // 2 - 1), (x + 1, (y0 + y1) // 2 - 1)]
    dr.polygon(pts, fill=col)


def crystal(dr, x, y, w, h, cols):
    dr.polygon([(x, y - h), (x + w // 2, y - h // 3), (x, y),
                (x - w // 2, y - h // 3)], fill=cols[0])
    dr.line([(x, y - h), (x, y)], fill=cols[1], width=1)
    dr.line([(x - w // 2, y - h // 3), (x + w // 2, y - h // 3)],
            fill=cols[1], width=1)


def frost_branch(dr, x, y, ang, length, col, w=1):
    x2 = x + math.cos(ang) * length
    y2 = y + math.sin(ang) * length
    dr.line([(x, y), (x2, y2)], fill=col, width=w)
    if length > 4:
        for a in (ang + 0.5, ang - 0.5):
            frost_branch(dr, (x + x2) / 2, (y + y2) / 2, a, length * 0.55, col, w)


PAINTERS = {}


def painter(cid):
    def deco(fn):
        PAINTERS[cid] = fn
        return fn
    return deco


@painter("eclipse-cape")
def p_eclipse(dr, rnd):
    base_vertical(dr, (16, 17, 30), (5, 5, 12))
    stars(dr, rnd, 30)
    ring(dr, TW // 2, 40, 11, (232, 190, 110), 3)   # corona
    ring(dr, TW // 2, 40, 13, (120, 90, 50), 1)     # outer glow edge
    dr.ellipse([TW // 2 - 8, 32, TW // 2 + 8, 48], fill=(2, 2, 6))  # disc
    dr.arc([TW // 2 - 8, 32, TW // 2 + 8, 48], 200, 340, fill=(255, 225, 160), width=1)
    for y in range(50, TH):  # fading lower rays
        dr.line([(4, y), (TW - 5, y)], fill=(26, 22, 40))


@painter("vortex-eclipse-cape")
def p_veclipse(dr, rnd):
    base_vertical(dr, (20, 12, 44), (6, 4, 14))
    stars(dr, rnd, 26)
    ring(dr, TW // 2, 40, 11, (167, 139, 250), 3)   # violet corona
    ring(dr, TW // 2, 40, 14, (232, 190, 110), 1)   # gold outer thread
    dr.ellipse([TW // 2 - 8, 32, TW // 2 + 8, 48], fill=(3, 2, 8))
    dr.line([(2, 50), (TW - 3, 50)], fill=(232, 190, 110))  # gold hem
    dr.line([(2, 52), (TW - 3, 52)], fill=(120, 95, 55))


@painter("inferno-cape")
def p_inferno(dr, rnd):
    base_vertical(dr, (46, 14, 8), (12, 5, 4))
    flame_tongues(dr, rnd, TH - 4, [(124, 30, 10), (251, 146, 60), (254, 215, 130)], n=6, hmax=40)
    speckle(dr, rnd, [(255, 180, 90), (255, 120, 50)], 40,
            area=(0, TH - 20, TW - 1, TH - 1))
    dr.rectangle([0, 0, TW - 1, 5], fill=(20, 8, 6))  # charred shoulders


@painter("celestial-cape")
def p_celestial(dr, rnd):
    base_vertical(dr, (18, 26, 84), (8, 10, 38))
    stars(dr, rnd, 44)
    pts = [(6, 28), (14, 36), (24, 30), (31, 40), (22, 48), (12, 46)]
    for a, b in zip(pts, pts[1:]):
        dr.line([a, b], fill=(140, 170, 255), width=1)  # constellation
    for p in pts:
        dr.ellipse([p[0] - 1, p[1] - 1, p[0] + 1, p[1] + 1], fill=(220, 230, 255))
    dr.pieslice([TW - 13, 30, TW - 3, 40], 270, 90, fill=(235, 240, 255))  # moon
    dr.pieslice([TW - 11, 32, TW - 5, 38], 270, 90, fill=(18, 26, 84))


@painter("void-cape")
def p_void(dr, rnd):
    base_vertical(dr, (12, 8, 22), (4, 3, 10))
    speckle(dr, rnd, [(90, 60, 160), (50, 35, 110)], 70)
    x = TW // 2  # jagged rift
    pts = []
    y = 4
    while y < TH - 2:
        pts.append((x + rnd.randint(-3, 3), y))
        y += rnd.randint(3, 5)
    for (ax, ay), (bx, by) in zip(pts, pts[1:]):
        dr.line([(ax, ay), (bx, by)], fill=(124, 58, 237), width=2)
        dr.line([(ax, ay), (bx, by)], fill=(196, 141, 255), width=1)
    for _ in range(8):
        dr.point((rnd.randint(0, TW - 1), rnd.randint(0, TH - 1)),
                 fill=(196, 141, 255))


@painter("frostbite-cape")
def p_frost(dr, rnd):
    base_vertical(dr, (30, 90, 140), (160, 205, 235))
    for i in range(5):  # frost creeping up from the hem
        frost_branch(dr, 4 + i * 8 + rnd.randint(-2, 2), TH - 2,
                     -math.pi / 2 + rnd.uniform(-0.3, 0.3),
                     rnd.randint(10, 20), (235, 246, 255), 1)
    cx, cy = TW // 2, 40  # snowflake emblem
    for k in range(6):
        a = k * math.pi / 3
        dr.line([(cx - 8 * math.cos(a), cy - 8 * math.sin(a)),
                 (cx + 8 * math.cos(a), cy + 8 * math.sin(a))],
                fill=(245, 250, 255), width=1)
    dr.ellipse([cx - 2, cy - 2, cx + 2, cy + 2], fill=(255, 255, 255))


@painter("cyber-pulse-cape")
def p_cyber(dr, rnd):
    base_vertical(dr, (8, 20, 34), (4, 10, 20))
    for _ in range(9):  # circuit traces
        x, y = rnd.randint(2, TW - 3), rnd.randint(6, TH - 6)
        dr.line([(x, y), (x, y + rnd.randint(4, 10))], fill=(34, 211, 238), width=1)
        nx = min(TW - 3, max(2, x + rnd.choice([-8, -6, 6, 8])))
        dr.line([(x, y + 4), (nx, y + 4)], fill=(34, 211, 238), width=1)
        dr.ellipse([nx - 1, y + 3, nx + 1, y + 5], fill=(165, 243, 252))
    cx, cy = TW // 2, 40  # pulse core
    dr.polygon([(cx, cy - 9), (cx + 6, cy), (cx, cy + 9), (cx - 6, cy)],
               fill=(34, 211, 238))
    dr.polygon([(cx, cy - 5), (cx + 3, cy), (cx, cy + 5), (cx - 3, cy)],
               fill=(207, 250, 254))


@painter("aurora-cape")
def p_aurora(dr, rnd):
    base_vertical(dr, (8, 40, 34), (10, 14, 40))
    bands = [((52, 211, 153), 28), ((110, 120, 250), 38), ((240, 120, 200), 48)]
    for col, yb in bands:  # flowing diagonal bands
        for x in range(TW):
            y = int(yb + math.sin(x * 0.35) * 4)
            for k in range(-2, 3):
                if 0 <= y + k < TH:
                    dr.point((x, y + k), fill=col)
    stars(dr, rnd, 26)


@painter("vortex-aurora-cape")
def p_vaurora(dr, rnd):
    base_vertical(dr, (10, 46, 40), (30, 16, 60))
    for col, yb in [((52, 211, 153), 28), ((167, 139, 250), 38), ((240, 180, 120), 48)]:
        for x in range(TW):
            y = int(yb + math.sin(x * 0.3 + 1) * 4)
            for k in range(-2, 3):
                if 0 <= y + k < TH:
                    dr.point((x, y + k), fill=col)
    stars(dr, rnd, 22)
    dr.line([(2, TH - 4), (TW - 3, TH - 4)], fill=(232, 190, 110))  # gold hem
    dr.line([(2, 2), (TW - 3, 2)], fill=(232, 190, 110))           # gold collar


@painter("shadow-flame-cape")
def p_shadowflame(dr, rnd):
    base_vertical(dr, (14, 10, 20), (5, 4, 10))
    flame_tongues(dr, rnd, TH - 4, [(60, 20, 110), (139, 92, 246), (216, 180, 254)],
                  n=6, hmax=38)
    speckle(dr, rnd, [(150, 100, 255)], 30, area=(0, TH - 22, TW - 1, TH - 1))


@painter("galaxy-rift-cape")
def p_galaxy(dr, rnd):
    base_vertical(dr, (30, 12, 70), (10, 6, 30))
    for _ in range(26):  # nebula blobs
        x, y = rnd.randint(0, TW - 1), rnd.randint(0, TH - 1)
        r = rnd.randint(2, 5)
        col = rnd.choice([(168, 85, 247), (236, 72, 153), (96, 165, 250)])
        dr.ellipse([x - r, y - r, x + r, y + r], fill=col)
    stars(dr, rnd, 40)
    for i in range(TH):  # bright diagonal rift
        x = int(6 + i * 0.55)
        if 0 <= x < TW:
            dr.point((x, i), fill=(240, 235, 255))
            if x + 1 < TW:
                dr.point((x + 1, i), fill=(168, 130, 255))


@painter("royal-obsidian-cape")
def p_royal(dr, rnd):
    base_vertical(dr, (18, 12, 28), (7, 5, 14))
    speckle(dr, rnd, [(70, 50, 120)], 60)
    for x in (1, 2, TW - 3, TW - 2):  # gold side trim
        dr.line([(x, 0), (x, TH - 1)], fill=(212, 175, 95) if x in (2, TW - 3) else (140, 110, 60))
    cx, cy = TW // 2, 38  # crown emblem
    dr.polygon([(cx - 9, cy + 6), (cx - 9, cy - 4), (cx - 4, cy + 1),
                (cx, cy - 7), (cx + 4, cy + 1), (cx + 9, cy - 4),
                (cx + 9, cy + 6)], fill=(232, 190, 110))
    dr.rectangle([cx - 9, cy + 6, cx + 9, cy + 9], fill=(180, 140, 80))
    dr.ellipse([cx - 2, cy, cx + 2, cy + 4], fill=(190, 40, 60))  # gem
    dr.line([(2, TH - 3), (TW - 3, TH - 3)], fill=(212, 175, 95))


@painter("stormcaller-cape")
def p_storm(dr, rnd):
    base_vertical(dr, (40, 55, 80), (16, 22, 36))
    for _ in range(30):  # rain streaks
        x, y = rnd.randint(0, TW - 1), rnd.randint(0, TH - 4)
        dr.line([(x, y), (x - 1, y + 3)], fill=(140, 170, 200), width=1)
    for _ in range(4):  # cloud shading up top
        x, y = rnd.randint(2, TW - 8), rnd.randint(2, 10)
        dr.ellipse([x, y, x + 9, y + 5], fill=(70, 85, 110))
    bolt(dr, TW // 2 + 1, 24, 52, (30, 60, 90), w=1)   # glow underlay
    bolt(dr, TW // 2, 24, 52, (186, 230, 253))
    bolt(dr, TW // 2, 30, 44, (255, 255, 255))


@painter("crystal-nova-cape")
def p_crystal(dr, rnd):
    base_vertical(dr, (16, 32, 80), (8, 14, 40))
    stars(dr, rnd, 20)
    cx, cy = TW // 2, 38  # nova burst
    for k in range(8):
        a = k * math.pi / 4
        dr.line([(cx, cy), (cx + 12 * math.cos(a), cy + 12 * math.sin(a))],
                fill=(186, 230, 253), width=1)
    dr.ellipse([cx - 4, cy - 4, cx + 4, cy + 4], fill=(240, 249, 255))
    for i, h in enumerate((14, 20, 17, 12, 18)):  # crystal shards from hem
        crystal(dr, 5 + i * 7 + rnd.randint(-1, 1), TH - 3, 7, h,
                [(147, 197, 253), (240, 249, 255)])


@painter("vortex-phantom-cape")
def p_phantom(dr, rnd):
    base_vertical(dr, (10, 30, 34), (4, 12, 16))
    for _ in range(7):  # rising wisp trails
        x = rnd.randint(3, TW - 4)
        for y in range(TH - 4, rnd.randint(8, 20), -1):
            xx = int(x + math.sin(y * 0.4) * 3)
            if 0 <= xx < TW:
                dr.point((xx, y), fill=(94, 200, 190))
    ex, ey = TW // 2, 38  # phantom eyes
    dr.polygon([(ex - 11, ey - 3), (ex - 3, ey - 3), (ex - 5, ey + 4),
                (ex - 10, ey + 4)], fill=(190, 242, 235))
    dr.polygon([(ex + 11, ey - 3), (ex + 3, ey - 3), (ex + 5, ey + 4),
                (ex + 10, ey + 4)], fill=(190, 242, 235))
    dr.line([(2, TH - 4), (TW - 3, TH - 4)], fill=(94, 200, 190))


# ------------------------------------------------------------- composition
MAN = {"cloth": (44, 49, 63), "cloth_dk": (30, 34, 45), "skin_edge": (88, 95, 112)}


def rect(dr, box, fill):
    dr.rectangle(box, fill=fill)


def compose(cid, accent):
    rnd = random.Random(seed_of(cid))
    img = backdrop(accent)
    img = dust(img, rnd)
    dr = ImageDraw.Draw(img, "RGBA")

    cx = SIZE // 2
    # proportions (Minecraft-like 8px head / slimmer torso so the CAPE —
    # the product — dominates the frame; back view, cape as the focus)
    head, torso_w, torso_h = 132, 112, 168
    head_y = 128
    shoulder_y = head_y + head + 8
    arm_w, arm_h = 44, 168
    leg_w, leg_h = 56, 120

    # legs (below the cape hem)
    hem_y = shoulder_y + 360
    for s in (-1, 1):
        x0 = cx + s * (leg_w + 6) - (leg_w if s < 0 else 0)
        rect(dr, [x0, hem_y - 40, x0 + leg_w, hem_y - 40 + leg_h],
             MAN["cloth_dk"] + (255,))
        rect(dr, [x0, hem_y - 40, x0 + 8, hem_y - 40 + leg_h],
             (22, 25, 34, 255))  # inner shading

    # cape texture -> trapezoid drape
    tex = Image.new("RGB", (TW, TH))
    tdr = ImageDraw.Draw(tex)
    PAINTERS[cid](tdr, rnd)
    big = tex.resize((288, 384), Image.NEAREST)
    inset = 26
    drape = big.transform((288, 384), Image.QUAD,
                          (inset, 0, 0, 384, 288, 384, 288 - inset, 0),
                          Image.NEAREST)
    # fabric fold shading baked directly (multiply vertical bands + hem falloff)
    drape = drape.convert("RGBA")
    dpx = drape.load()
    for y in range(384):
        for x in range(288):
            r, g, b, a = dpx[x, y]
            if a:
                k = 1 - (26 * abs(math.sin(x * 0.075 + 0.6)) + 12 * (y / 370)) / 255
                dpx[x, y] = (clamp(r * k), clamp(g * k), clamp(b * k), a)
    # edge piping
    edge = Image.new("RGBA", (288, 384), (0, 0, 0, 0))
    ed = ImageDraw.Draw(edge)
    ed.polygon([(inset, 0), (0, 384), (288, 384), (288 - inset, 0)],
               outline=(8, 8, 14, 220), width=3)
    drape = Image.alpha_composite(drape, edge)
    cape_x = cx - 144
    cape_y = shoulder_y + 6
    img.paste(drape, (cape_x, cape_y), drape)

    # torso over the cape top
    rect(dr, [cx - torso_w // 2, shoulder_y, cx + torso_w // 2,
              shoulder_y + torso_h], MAN["cloth"] + (255,))
    rect(dr, [cx - torso_w // 2, shoulder_y, cx - torso_w // 2 + 12,
              shoulder_y + torso_h], MAN["cloth_dk"] + (255,))
    rect(dr, [cx + torso_w // 2 - 12, shoulder_y, cx + torso_w // 2,
              shoulder_y + torso_h], MAN["cloth_dk"] + (255,))
    rect(dr, [cx - torso_w // 2, shoulder_y, cx + torso_w // 2,
              shoulder_y + 10], (58, 63, 78, 255))  # shoulder panel
    # clasps
    for s in (-1, 1):
        px0 = cx + s * (torso_w // 2 - 14) - 11
        dr.ellipse([px0, shoulder_y + 16, px0 + 22, shoulder_y + 38],
                   fill=(212, 175, 105, 255), outline=(120, 90, 50, 255), width=2)
    # arms
    for s in (-1, 1):
        ax = cx + s * (torso_w // 2 + 4) + (-arm_w if s < 0 else 0)
        rect(dr, [ax, shoulder_y + 4, ax + arm_w, shoulder_y + 4 + arm_h],
             MAN["cloth"] + (255,))
        rect(dr, [ax + (arm_w - 10 if s > 0 else 0), shoulder_y + 4,
                  ax + (arm_w if s > 0 else 10), shoulder_y + 4 + arm_h],
             MAN["cloth_dk"] + (255,))
    # head (back of head)
    rect(dr, [cx - head // 2, head_y, cx + head // 2, head_y + head],
         (52, 57, 70, 255))
    rect(dr, [cx - head // 2, head_y, cx + head // 2, head_y + 16],
         (66, 71, 86, 255))  # top light
    rect(dr, [cx - head // 2, head_y, cx - head // 2 + 12, head_y + head],
         MAN["cloth_dk"] + (255,))

    # studio rim light (theme-tinted, upper left)
    rim = mix((255, 255, 255), accent, 0.35)
    dr.line([(cx - head // 2, head_y), (cx + head // 2, head_y)],
            fill=rim + (200,), width=3)
    dr.line([(cx - torso_w // 2, shoulder_y), (cx - torso_w // 2,
              shoulder_y + torso_h)], fill=rim + (110,), width=3)
    return img


CAPES = [
    # (texture id, accent glow color)
    ("eclipse-cape", (232, 190, 110)),
    ("inferno-cape", (251, 146, 60)),
    ("celestial-cape", (140, 170, 255)),
    ("void-cape", (139, 92, 246)),
    ("frostbite-cape", (186, 230, 253)),
    ("cyber-pulse-cape", (34, 211, 238)),
    ("aurora-cape", (52, 211, 153)),
    ("shadow-flame-cape", (167, 139, 250)),
    ("galaxy-rift-cape", (192, 132, 252)),
    ("royal-obsidian-cape", (212, 175, 105)),
    ("stormcaller-cape", (147, 197, 253)),
    ("crystal-nova-cape", (125, 211, 252)),
    ("vortex-eclipse-cape", (196, 141, 255)),
    ("vortex-phantom-cape", (94, 200, 190)),
    ("vortex-aurora-cape", (110, 220, 170)),
]

FILE = {cid: cid.replace("-", "_") + ".webp" for cid, _ in CAPES}


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
    missing = [c for c in CAPES if c[0] not in PAINTERS]
    if missing:
        print("render-capes: ERROR: no painter for %s" % missing)
        return 1
    made, fails = 0, []
    for cid, accent in CAPES:
        try:
            im = compose(cid, accent)
        except Exception as e:  # never ship a broken render
            fails.append((cid, "compose: %s" % e))
            continue
        if not nonblank(im):
            fails.append((cid, "blank render"))
            continue
        out = os.path.join(OUT_DIR, FILE[cid])
        im.save(out, "WEBP", quality=82, method=4)
        made += 1
        print("  [OK] %s (%d bytes)" % (FILE[cid], os.path.getsize(out)))
    print("render-capes: rendered=%d failed=%d" % (made, len(fails)))
    for cid, why in fails:
        print("FAIL: %s (%s)" % (cid, why))
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
