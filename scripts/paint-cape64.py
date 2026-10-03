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


# ---------------------------------------------------------------------------
# DESIGN FIRST — complete concept per cape, defined BEFORE any pixel is set.
# Palette discipline: PRIMARY 60-70% / SECONDARY 20-30% / ACCENT 5-10%.
# Every painter below implements exactly its concept (no random gradients,
# no recolors: motif, composition and color identity are all unique).
# ---------------------------------------------------------------------------
DESIGNS = {
    "eclipse-cape": {
        "concept": "Solar eclipse with a dark celestial core; strong circular focal point.",
        "primary": "near-black navy (base field)",
        "secondary": "deep navy gradient + sparse stars",
        "accent": "restrained gold corona ring + dark disc (only gold on the cape)",
        "motif": "thin gold corona circle, black disc center, lower-center placement",
        "edges": "dark trim; thin gold hem line echoes the corona",
        "composition": "center-weighted circle; dark outer field keeps focus inside",
        "transitions": "flat dark top into starfield, ring, dark hem",
        "readability": "gold circle reads at any distance on black",
        "dimensional": "ring sits low-center so it survives shoulder fold and hem swing",
    },
    "galaxy-rift-cape": {
        "concept": "Dimensional tear through space; depth via layered shapes, not gradient wash.",
        "primary": "dark cosmic violet-black base",
        "secondary": "purple/pink/blue nebula clusters, full-width but dim",
        "accent": "starlight-white diagonal rift with violet edge light (~5%)",
        "motif": "single bright diagonal dimensional rift with concentrated stars along it",
        "edges": "dark violet trim; rift never touches the border",
        "composition": "diagonal energy crossing a balanced field; visual weight left-right even",
        "transitions": "nebula density rises toward the rift, falls to dark corners",
        "readability": "one bright slash = instant theme read at distance",
        "dimensional": "rift runs full height so folding never hides it entirely",
    },
    "inferno-cape": {
        "concept": "Controlled supernatural fire climbing a charred base; hot center, dark edges.",
        "primary": "charred near-black brown base, darker at edges and shoulders",
        "secondary": "deep red-orange mid flame bodies",
        "accent": "pale yellow cores on the tallest central tongues + embers",
        "motif": "four flame tongues rising from the hem, tallest in the center",
        "edges": "charred trim darker than the field; no bright edge pixels",
        "composition": "bottom-weighted fire, dark calm top; bilateral tongue rhythm",
        "transitions": "char -> red -> orange -> yellow core, strictly bottom-up",
        "readability": "tall yellow cores carry the silhouette at distance",
        "dimensional": "tongues anchored at the hem so swing stretches, never detaches them",
    },
    "frostbite-cape": {
        "concept": "Frozen crystal energy: deep ice base, geometric facets, snowflake sigil.",
        "primary": "icy blue gradient, darker shoulders to pale hem",
        "secondary": "white frost creep + thin geometric facet lines, upper field",
        "accent": "white snowflake sigil center (~6%)",
        "motif": "symmetric snowflake medallion over climbing frost and cut facets",
        "edges": "steel-blue trim; frost reaches but never crosses the border",
        "composition": "medallion center, frost rising from hem, facets framing top",
        "transitions": "deep blue shoulders melting to near-white hem frost",
        "readability": "white medallion on blue = readable at any range",
        "dimensional": "sigil centered clear of folds; facets avoid the center seam",
    },
    "void-cape": {
        "concept": "Abstract cosmic void: near-black cloth split by one purple wound of light.",
        "primary": "near-black violet base (~85%, deliberately quiet)",
        "secondary": "dim indigo speckle, barely above black",
        "accent": "violet rift core with pale edge light (~8%, the only bright element)",
        "motif": "single jagged vertical rift, full height, slight wander",
        "edges": "black-violet trim; rift kept clear of borders",
        "composition": "center vertical event on an empty field; maximal contrast",
        "transitions": "no gradient wash; speckle density flat, rift constant",
        "readability": "one glowing crack on black reads from any distance",
        "dimensional": "full-height motif cannot fold out of view",
    },
    "cyber-pulse-cape": {
        "concept": "Futuristic energy system: symmetric circuit board converging on a pulse core.",
        "primary": "dark teal-tech base (~80%)",
        "secondary": "cyan orthogonal traces, strictly mirrored left/right",
        "accent": "pale pulse-core diamond + bright node dots (~6%)",
        "motif": "mirrored circuit traces feeding a central diamond core",
        "edges": "dark tech trim; traces terminate before borders with node caps",
        "composition": "bilateral symmetry around the core; calm top, active middle",
        "transitions": "traces descend from shoulders, converge, resolve into the core",
        "readability": "bright diamond + symmetric lines read instantly at range",
        "dimensional": "symmetry survives center fold; core sits clear of the hem",
    },
    "aurora-cape": {
        "concept": "Northern lights: vertical curtains breathing over a dark sky, never a rainbow wash.",
        "primary": "dark atmospheric teal-black sky (~70%)",
        "secondary": "three vertical aurora curtains: green, violet, pink",
        "accent": "pale star pixels scattered in the dark gaps (~4%)",
        "motif": "three wavy vertical light curtains, staggered phases",
        "edges": "dark trim; curtains fade before borders",
        "composition": "vertical movement in three columns; dark breathing room between",
        "transitions": "curtains run top to hem with sine wander; no horizontal banding",
        "readability": "tall colored columns read at distance where thin diagonals would not",
        "dimensional": "vertical motifs align with the hang direction, fold-proof",
    },
    "crystal-nova-cape": {
        "concept": "Crystal explosion: bright core detonating upward into rising shards.",
        "primary": "deep sapphire base (~70%)",
        "secondary": "pale blue radial arms + rising crystal shards",
        "accent": "white-hot 2x2 nova heart (~4%)",
        "motif": "central nova cross with three faceted shards rising from the hem",
        "edges": "dark sapphire trim; shard tips stop short of the hem line",
        "composition": "radial burst centered slightly below middle; shards balance the base",
        "transitions": "white core -> pale arms -> shard blue -> dark field",
        "readability": "white burst + vertical shards = unmistakable at range",
        "dimensional": "burst centered on the panel; arms reach toward folds, never into them",
    },
    "stormcaller-cape": {
        "concept": "Supernatural storm: cloud mass discharging one bolt down the spine.",
        "primary": "dark slate storm base, cloud bank across the shoulders",
        "secondary": "mid-blue rain streaks scattered full-field",
        "accent": "pale lightning bolt with white-hot core segments (~7%)",
        "motif": "single zigzag bolt down the center over diagonal rain",
        "edges": "storm-dark trim; bolt grounded before the hem",
        "composition": "heavy cloud top, single vertical discharge, rain texture throughout",
        "transitions": "cloud -> charged air -> strike -> dissipated hem",
        "readability": "one bright zigzag on slate reads from any distance",
        "dimensional": "bolt follows the spine where the cloth moves least",
    },
    "royal-obsidian-cape": {
        "concept": "Luxury dark fantasy: obsidian cloth, one crown seal, gold used sparingly.",
        "primary": "obsidian black-violet (~70%)",
        "secondary": "dim violet speckle + dark antique-gold edge trim (functional, not decor)",
        "accent": "bright gold compact crown + ruby center (~10%, mostly the seal)",
        "motif": "small centered crown seal with ruby; trim frames, never competes",
        "edges": "antique-gold trim defines the silhouette in 3D; hem line thin",
        "composition": "seal below center on an empty royal field; restraint is the luxury",
        "transitions": "flat dark field; all energy concentrated in the seal",
        "readability": "gold crown + red gem focal point reads instantly at range",
        "dimensional": "seal sits low-center, clear of shoulder fold and hem swing",
    },
    "vortex-signature-cape": {
        "concept": "VORTEX ENERGY: the real Vortex mark (triangle frame + swirl, from vortex-logo.jpg) on void navy. Restrained hero cosmetic: frame + swirl + sparks, nothing else.",
        "primary": "void-navy black base (~75%)",
        "secondary": "mid/deep cyan frame geometry + graded side energy (~18%)",
        "accent": "hot near-white cyan swirl core (~6%, brand glow only)",
        "motif": "logo triangle silhouette framing a tight 3-arm swirl heart",
        "edges": "energy-graded side pixels (bright mid, dark ends) pull the eye to center; dark collar, cyan-exit hem",
        "composition": "triangle frames, swirl ignites the center; dark field breathes around both",
        "transitions": "dark shoulders -> glowing center -> dark hem with energy exit",
        "readability": "triangle + bright core reads as VORTEX at any distance",
        "dimensional": "emblem centered clear of folds; no thin lines to fragment",
    },
}


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
    for u, v in [(1, 2), (2, 3), (3, 4), (8, 2), (7, 3), (6, 4),  # cut facets
                 (1, 4), (2, 4), (7, 4), (8, 4)]:
        c.back(u, v, (193, 222, 245))


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
    # Bilateral circuit symmetry: every left trace mirrors right.
    for x, y, ln in [(1, 3, 4), (2, 11, 2)]:
        for (xa, xb, d) in ((x, x + 2, 1), (9 - x, 9 - x - 2, -1)):
            for k in range(ln):
                c.back(xa, y + k, (34, 211, 238))
            for k in range(3):
                c.back(min(9, max(0, xb + d * k)), y + ln - 1, (34, 211, 238))
            c.back(min(9, max(0, xb + d * 2)), y + ln - 1, (165, 243, 252))
    for u, v in [(4, 7), (3, 8), (4, 8), (5, 8), (4, 9), (4, 10)]:  # pulse core
        c.back(u, v, (34, 211, 238))
    c.back(4, 8, (207, 250, 254))


@painter("aurora-cape")
def p_aurora(c, r):
    import math as _m
    c.base((8, 38, 32), (10, 15, 42), (8, 26, 28))
    # Vertical curtains (hang direction): three staggered wavy columns.
    for col, cu, ph in [((52, 211, 153), 1, 0.0),
                        ((110, 120, 250), 4, 2.1),
                        ((240, 120, 200), 7, 4.2)]:
        for v in range(2, 15):
            x = cu + int(round(_m.sin(v * 0.55 + ph) * 1.1))
            c.back(min(9, max(0, x)), v, col)
            c.back(min(9, max(0, x + 1)), v, col)
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
    antique = (150, 115, 60)  # trim: darker antique gold (edge definition)
    c.base((18, 12, 28), (8, 6, 15), (100, 80, 45))
    for v in range(16):  # side trim frames the silhouette
        c.back(0, v, antique)
        c.back(9, v, antique)
    for _ in range(10):
        c.back(r.randint(1, 8), r.randint(0, 15), (70, 50, 120))
    for u in range(3, 7):  # compact crown seal: band + points + ruby
        c.back(u, 9, (180, 140, 80))
        c.back(u, 10, (180, 140, 80))
        c.back(u, 8, GOLD)
    for u in (3, 6):
        c.back(u, 7, GOLD)
    c.back(4, 9, (190, 40, 60))  # ruby
    c.back(5, 9, (190, 40, 60))
    for u in range(10):  # gold hem
        c.px(11 + u, 0, GOLD)


@painter("vortex-signature-cape")
def p_signature(c, r):
    # Brand palette sampled from the real vortex-logo.jpg: glowing cyan
    # mark (triangle frame + 3-arm swirl) on near-black navy.
    # RESTRAINT governs everything: triangle + swirl + 4 sparks, else dark.
    VOID_TOP, VOID_BOT = (10, 14, 30), (5, 6, 16)
    CYAN, DEEP = (0, 200, 230), (0, 130, 175)
    HOT = (175, 255, 255)
    c.base(VOID_TOP, VOID_BOT, (8, 12, 24))
    for _ in range(4):  # four dim sparks, kept clear of the emblem
        for _try in range(12):
            u, v = r.randint(0, 9), r.randint(0, 15)
            if abs(u - 4.5) + abs(v - 8) > 7:
                c.back(u, v, (0, 150, 185))
                break
    for v in range(2, 14):  # logo blades: open bladed frame, dark interior
        lx = round(1 + (v - 2) * (3.0 / 11))
        rx = round(8 - (v - 2) * (3.0 / 11))
        edge = CYAN if v < 8 else DEEP
        c.back(min(9, max(0, lx)), v, edge)
        c.back(min(9, max(0, rx)), v, edge)
    c.back(4, 13, CYAN)  # apex
    c.back(5, 13, CYAN)
    for u, v in [(4, 7), (5, 7), (4, 8)]:  # swirl heart (logo center)
        c.back(u, v, HOT)
    for u, v in [(3, 7), (5, 8)]:  # inner glow
        c.back(u, v, (0, 220, 255))
    for u, v in [(3, 5), (6, 6), (4, 10)]:  # 3 short swirl arms
        c.back(u, v, CYAN)
    for v in range(1, 17):  # energy-graded sides: dimmer now, frame leads
        k = max(0.0, 1.0 - abs(v - 8) / 8.0)
        col = (0, int(70 + 70 * k), int(95 + 50 * k))
        c.px(0, v, col)
        c.px(11, v, col)
    for u in range(10):  # hem: dark with cyan energy exit at center
        c.px(11 + u, 0, (8, 12, 24))
    c.px(15, 0, CYAN)
    c.px(16, 0, CYAN)
    for u, v in [(4, 7), (3, 9), (5, 9)]:  # dim mark echo on inner face
        c.front(u, v, (0, 140, 180))


COLLECTION = [
    "eclipse-cape", "galaxy-rift-cape", "inferno-cape", "frostbite-cape",
    "void-cape", "cyber-pulse-cape", "aurora-cape", "crystal-nova-cape",
    "stormcaller-cape", "royal-obsidian-cape", "vortex-signature-cape",
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
