#!/usr/bin/env python3
"""VORTEX first collection — REAL Minecraft 64x32 cape textures.

Authors genuine 64x32 cape-format PNGs (not AI art, not screenshots):
pixel-precise, deterministic, editor-compatible output that can be opened
in browser cape editors (mctools.gg/cape-editor, minecraftmaps cape-maker,
mctoolbox, novaskin) and worn by the Minecraft client.

64x32 cape UV layout (0-based, standard template):
  Front panel  x  1..10, y  1..16   inner face (faces the player's back)
  Back panel   x 12..21, y  1..16   THE visible design face
  Top strip    x  1..10, y  0       collar edge
  Bottom strip x 11..20, y  0       hem edge
  Right side   x  0,     y  1..16   1px edge
  Left side    x 11,     y  1..16   1px edge
  Everything else: transparent (unused by the cape model).

Collection (10 only — quality over quantity):
  eclipse, galaxy-rift, inferno, frostbite, void,
  cyber-pulse, aurora, crystal-nova, stormcaller, royal-obsidian.

Run:  python scripts/paint-cape64.py
Requires: Pillow
"""
import hashlib
import os
import random
import sys

try:
    from PIL import Image, ImageDraw
except ImportError:
    print("paint-cape64: ERROR: Pillow not installed (pip install pillow)")
    sys.exit(1)

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
OUT_DIR = os.path.join(SITE, "cosmetics", "capes")

W, H = 64, 32
BACK_X, BACK_Y = 12, 1     # back panel origin (10x16 visible design face)
FRONT_X, FRONT_Y = 1, 1    # front panel origin (10x16 inner face)


def seed_of(cid):
    return int(hashlib.md5(cid.encode("utf-8")).hexdigest()[:8], 16)


def clamp(v):
    return max(0, min(255, int(v)))


def lerp(a, b, t):
    return a + (b - a) * t


def grad(top, bot, t):
    return tuple(clamp(lerp(a, b, t)) for a, b in zip(top, bot))


def dark(col, k=0.55):
    return tuple(clamp(c * k) for c in col)


class Cape:
    """Blank 64x32 canvas with region helpers. Unused area stays
    transparent; every used region is painted fully opaque."""

    def __init__(self):
        self.im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        self.dr = ImageDraw.Draw(self.im)

    def px(self, x, y, col):
        if 0 <= x < W and 0 <= y < H:
            self.dr.point((x, y), fill=tuple(col) + (255,))

    def back(self, u, v, col):
        self.px(BACK_X + u, BACK_Y + v, col)

    def front(self, u, v, col):
        self.px(FRONT_X + u, FRONT_Y + v, col)

    def base(self, top, bot, edge):
        """Full base: gradient on both panels, trim on all edges."""
        for v in range(16):
            c = grad(top, bot, v / 15)
            for u in range(10):
                self.back(u, v, c)
                self.front(u, v, dark(c))
        for y in range(1, 17):
            self.px(0, y, edge)    # right side strip
            self.px(11, y, edge)   # left side strip
        for u in range(10):
            self.px(1 + u, 0, edge)    # top strip (collar)
            self.px(11 + u, 0, edge)   # bottom strip (hem)


def stars(cape, rnd, n, bright=(235, 240, 255)):
    for _ in range(n):
        cape.back(rnd.randint(0, 9), rnd.randint(0, 15), bright)


def ring(cape, cu, cv, r, col):
    for v in range(16):
        for u in range(10):
            d = ((u - cu) ** 2 + (cv - v) ** 2) ** 0.5
            if abs(d - r) < 0.9:
                cape.back(u, v, col)


def disc(cape, cu, cv, r, col):
    for v in range(16):
        for u in range(10):
            if ((u - cu) ** 2 + (cv - v) ** 2) ** 0.5 < r:
                cape.back(u, v, col)


PAINTERS = {}


def painter(cid):
    def deco(fn):
        PAINTERS[cid] = fn
        return fn
    return deco


GOLD = (232, 190, 110)
GOLD_DK = (140, 110, 60)


@painter("eclipse-cape")
def p_eclipse(c, r):
    c.base((14, 15, 28), (6, 6, 14), (8, 8, 18))
    stars(c, r, 8)
    ring(c, 4.5, 9, 3.0, GOLD)
    disc(c, 4.5, 9, 2.0, (2, 2, 6))
    for u in range(10):  # gold hem
        c.px(11 + u, 0, GOLD_DK)


@painter("galaxy-rift-cape")
def p_galaxy(c, r):
    c.base((28, 12, 66), (10, 6, 30), (16, 8, 40))
    for _ in range(9):  # nebula clusters
        x, y = r.randint(0, 9), r.randint(0, 15)
        col = r.choice([(168, 85, 247), (236, 72, 153), (96, 165, 250)])
        c.back(x, y, col)
        if r.random() < 0.5:
            c.back(min(9, max(0, x + r.choice([-1, 1]))), y, col)
    for i in range(16):  # diagonal rift of starlight
        x = 1 + int(i * 0.45)
        c.back(x, i, (238, 232, 255))
        c.back(min(9, x + 1), i, (150, 120, 240))
    stars(c, r, 10)


@painter("inferno-cape")
def p_inferno(c, r):
    c.base((44, 13, 8), (12, 5, 4), (20, 8, 6))
    tongues = [(1, 6), (3, 10), (5, 9), (7, 6)]
    for x, h in tongues:
        for k in range(h):
            v = 15 - k
            if k < h - 6:
                col = (254, 215, 130)
            elif k < h - 3:
                col = (251, 146, 60)
            else:
                col = (124, 30, 10)
            c.back(x, v, col)
            if k > 1:
                c.back(x + (1 if x < 5 else -1), v + 1, (124, 30, 10))
    for _ in range(8):  # embers
        c.back(r.randint(0, 9), r.randint(10, 15), (255, 170, 80))


@painter("frostbite-cape")
def p_frost(c, r):
    c.base((34, 96, 148), (168, 208, 238), (90, 140, 180))
    for i in range(5):  # frost creeping from the hem
        x = 1 + i * 2
        for k in range(r.randint(3, 6)):
            c.back(min(9, max(0, x + (k // 2) * (1 if i % 2 else -1))),
                   15 - k, (235, 246, 255))
    cx, cy = 4, 8  # snowflake sigil
    for u in range(2, 8):
        c.back(u, cy, (245, 250, 255))
    for v in range(5, 12):
        c.back(cx, v, (245, 250, 255))
    for u, v in [(2, 6), (3, 7), (5, 9), (6, 10), (6, 6), (5, 7), (3, 9), (2, 10)]:
        c.back(u, v, (245, 250, 255))


@painter("void-cape")
def p_void(c, r):
    c.base((12, 8, 22), (5, 4, 11), (7, 5, 14))
    x = 4
    for v in range(1, 16):  # jagged void rift
        x = min(6, max(3, x + r.choice([-1, 0, 0, 1])))
        c.back(x, v, (124, 58, 237))
        c.back(x + 1, v, (196, 141, 255))
    for _ in range(12):
        c.back(r.randint(0, 9), r.randint(0, 15), (70, 50, 130))


@painter("cyber-pulse-cape")
def p_cyber(c, r):
    c.base((8, 20, 34), (5, 11, 22), (6, 14, 24))
    for x, y, ln in [(1, 3, 4), (7, 2, 5), (2, 11, 3)]:  # circuit traces
        for k in range(ln):
            c.back(x, y + k, (34, 211, 238))
        nx = min(8, x + 2)
        for k in range(3):
            c.back(min(9, x + k), y + ln - 1, (34, 211, 238))
        c.back(nx, y + ln - 1, (165, 243, 252))
    for u, v in [(4, 7), (3, 8), (4, 8), (5, 8), (4, 9), (4, 10)]:  # pulse core
        c.back(u, v, (34, 211, 238))
    c.back(4, 8, (207, 250, 254))


@painter("aurora-cape")
def p_aurora(c, r):
    c.base((8, 38, 32), (10, 15, 42), (8, 26, 28))
    for col, vb in [((52, 211, 153), 4), ((110, 120, 250), 8), ((240, 120, 200), 12)]:
        for u in range(10):
            v = vb + int((u - 4) * 0.4)
            c.back(u, v, col)
            if 0 <= v + 1 < 16:
                c.back(u, v + 1, col)
    stars(c, r, 8)


@painter("crystal-nova-cape")
def p_crystal(c, r):
    c.base((16, 32, 80), (8, 15, 42), (10, 20, 50))
    for u, v in [(4, 8), (5, 8), (4, 9), (5, 9)]:  # nova heart
        c.back(u, v, (240, 249, 255))
    for u, v in [(4, 5), (5, 5), (4, 6), (5, 6), (4, 10), (5, 10),
                 (4, 11), (5, 11), (1, 8), (2, 8), (3, 8),
                 (6, 8), (7, 8), (8, 8)]:
        c.back(u, v, (186, 230, 253))
    for x, h in [(1, 4), (4, 6), (7, 4)]:  # rising shards
        for k in range(h):
            c.back(x, 15 - k, (147, 197, 253))
        c.back(x, 15 - h, (240, 249, 255))
    stars(c, r, 6)


@painter("stormcaller-cape")
def p_storm(c, r):
    c.base((38, 52, 78), (16, 20, 34), (26, 34, 52))
    for x in range(2, 8):  # cloud bank up top
        c.back(x, 1, (60, 75, 100))
    bolt = [(5, 2), (4, 3), (4, 4), (3, 5), (4, 5), (4, 6),
            (3, 7), (3, 8), (4, 8), (4, 9), (3, 10), (3, 11),
            (4, 11), (4, 12), (3, 13)]
    for u, v in bolt:
        c.back(u, v, (186, 230, 253))
    for u, v in [(4, 6), (3, 8), (4, 9), (3, 11)]:
        c.back(u, v, (255, 255, 255))
    for _ in range(8):  # rain streaks
        c.back(r.randint(0, 9), r.randint(2, 14), (140, 170, 200))


@painter("royal-obsidian-cape")
def p_royal(c, r):
    c.base((18, 12, 28), (8, 6, 15), (100, 80, 45))
    for v in range(16):  # gold side trim
        c.back(0, v, GOLD)
        c.back(9, v, GOLD)
    for _ in range(10):
        c.back(r.randint(1, 8), r.randint(0, 15), (70, 50, 120))
    for u in range(2, 8):  # crown band
        c.back(u, 9, (180, 140, 80))
        c.back(u, 10, (180, 140, 80))
    for u in (2, 4, 6):  # crown points
        c.back(u, 7, GOLD)
        c.back(u, 8, GOLD)
    c.back(3, 8, GOLD)
    c.back(5, 8, GOLD)
    c.back(7, 8, GOLD)
    c.back(4, 9, (190, 40, 60))  # ruby
    for u in range(10):  # gold hem
        c.px(11 + u, 0, GOLD)


COLLECTION = [
    "eclipse-cape", "galaxy-rift-cape", "inferno-cape", "frostbite-cape",
    "void-cape", "cyber-pulse-cape", "aurora-cape", "crystal-nova-cape",
    "stormcaller-cape", "royal-obsidian-cape",
]

FILE = {cid: cid.replace("-", "_") + ".png" for cid in COLLECTION}


def in_use(x, y):
    """Pixels the standard cape model actually samples."""
    if y == 0:
        return 1 <= x <= 20  # top strip (1..10) + bottom strip (11..20)
    if 1 <= y <= 16:
        return x == 0 or 1 <= x <= 11 or 12 <= x <= 21
    return False


def validate(path, cid):
    """A real cape texture: exactly 64x32, used regions fully opaque,
    unused area fully transparent."""
    im = Image.open(path)
    if im.size != (W, H):
        return "size %s, must be 64x32" % (im.size,)
    im = im.convert("RGBA")
    px = im.load()
    for y in range(H):
        for x in range(W):
            a = px[x, y][3]
            if in_use(x, y):
                if a != 255:
                    return "hole at (%d,%d)" % (x, y)
            elif a != 0:
                return "stray pixel at (%d,%d)" % (x, y)
    return None


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    missing = [c for c in COLLECTION if c not in PAINTERS]
    if missing:
        print("paint-cape64: ERROR: no painter for %s" % missing)
        return 1
    made, fails = 0, []
    for cid in COLLECTION:
        cape = Cape()
        PAINTERS[cid](cape, random.Random(seed_of(cid)))
        out = os.path.join(OUT_DIR, FILE[cid])
        cape.im.save(out, "PNG")
        err = validate(out, cid)
        if err:
            fails.append((cid, err))
            continue
        made += 1
        print("  [OK] %s" % FILE[cid])
    print("paint-cape64: painted=%d failed=%d" % (made, len(fails)))
    for cid, why in fails:
        print("FAIL: %s (%s)" % (cid, why))
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
