#!/usr/bin/env python3
"""VORTEX LINK-ACCOUNT COLLECTION — real cosmetic asset authoring.

Builds the ONLY collection from zero (no preserved cosmetics):
  1. vortex-signature-cape ... 64x32 cape texture (redesigned per brief:
     logo center + controlled rotation ring + dark dimensional base)
  2. vortex-signature-hat .... model JSON + 32x32 texture (energy circlet)
  3. vortexling-pet .......... model JSON + 32x32 texture + idle anim data

No AI artwork anywhere: every pixel/box is authored data below, and the
DESIGNS table defines each concept before any pixel is set.

Model format ("vortex-model-v1", the contract scripts/render-cosmetics.py
and scripts/render-collection.py consume):
  {"id","slot","texture","parts":{name:{"flat":[r,g,b] | "tex":path,
   "uv":[u,v], "boxes":[{"from":[x,y,z],"to":[x,y,z]}]}}, ...extra meta...}
Flat parts are first-class (the renderer shades them); textured faces
sample explicit UV rects. Unknown keys ("_doc", "follow", "anim") are
ignored by the renderer and document intent for the client implementer.

Run:  python scripts/paint-collection.py
Requires: Pillow
"""
import hashlib
import json
import os
import random
import sys

try:
    from PIL import Image, ImageDraw
except ImportError:
    print("paint-collection: ERROR: Pillow not installed (pip install pillow)")
    sys.exit(1)

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
COS = os.path.join(SITE, "cosmetics")


def seed_of(s):
    return int(hashlib.md5(s.encode("utf-8")).hexdigest()[:8], 16)


def clamp(v):
    return max(0, min(255, int(v)))


def lerp(a, b, t):
    return a + (b - a) * t


def grad(top, bot, t):
    return tuple(clamp(lerp(a, b, t)) for a, b in zip(top, bot))


# ---------------------------------------------------------------------------
# DESIGNS — concept first, pixels second. Shared language: void-navy base,
# cyan brand energy (hot core -> mid glow -> deep edge), dark premium field.
# ---------------------------------------------------------------------------
DESIGNS = {
    "vortex-signature-cape": {
        "concept": "VORTEX ENERGY hero: real logo geometry (triangle frame + swirl, from vortex-logo.jpg) as the source of a controlled rotation ring on void navy.",
        "primary": "void-navy black base (~70%)",
        "secondary": "mid/deep cyan frame + thin broken rotation ring (~20%)",
        "accent": "hot near-white cyan swirl core (~7%)",
        "motif": "logo triangle + tight swirl heart + thin orbiting ring + descending motion ticks",
        "edges": "energy-graded sides; dark collar; cyan-exit hem",
        "composition": "frame contains, ring orbits, core ignites; motion continues down the hem",
        "readability": "triangle + bright core reads VORTEX at any distance",
    },
    "vortex-signature-hat": {
        "concept": "Energy circlet: dark tech band ringing the upper head, cyan rim light, small triangle mark on the brow, glowing temple nodes. A visor, never a crown.",
        "primary": "dark navy band structure (~75%)",
        "secondary": "cyan rim trim tracing the band top edge (~15%)",
        "accent": "hot brow emblem core + temple node glow (~8%)",
        "motif": "open ring band + centered mini triangle mark + twin nodes",
        "edges": "band fully rings the head; nothing floats, nothing covers the face",
        "composition": "symmetric brow emblem; nodes balance left/right",
        "readability": "cyan brow mark + nodes read at distance; band reads as techwear",
    },
    "vortexling-pet": {
        "concept": "Hovering dimensional wisp: compact crystal body around a hot energy core, orbit ring, glowing eyes, shard tail. Original creature, no vanilla animal.",
        "primary": "deep navy crystal body (~65%)",
        "secondary": "cyan orbit ring + shard tail (~20%)",
        "accent": "white-hot core + glowing eyes (~10%)",
        "motif": "core-centered body, square orbit ring, twin eyes, tapering shard",
        "edges": "ring floats clear of the body; shard tapers to a point",
        "composition": "core as visual anchor; ring gives motion; shard gives direction (down)",
        "readability": "bright core + eyes on dark body reads at any distance",
    },
}


class Canvas:
    def __init__(self, w, h):
        self.im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        self.dr = ImageDraw.Draw(self.im)
        self.w, self.h = w, h

    def px(self, x, y, col):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.dr.point((x, y), fill=tuple(col) + (255,))


# ------------------------------------------------------------- 64x32 cape
CAPE_W, CAPE_H = 64, 32
BACK_X, BACK_Y = 12, 1  # visible design face 10x16


def cape_base(c):
    for v in range(16):
        g = grad((10, 14, 30), (5, 6, 16), v / 15)
        for u in range(10):
            c.px(BACK_X + u, BACK_Y + v, g)
            c.px(1 + u, 1 + v, tuple(clamp(x * 0.55) for x in g))
    for y in range(1, 17):
        c.px(0, y, (8, 12, 24))
        c.px(11, y, (8, 12, 24))
    for u in range(10):
        c.px(1 + u, 0, (8, 12, 24))
        c.px(11 + u, 0, (8, 12, 24))


def paint_signature_cape():
    r = random.Random(seed_of("vortex-signature-cape"))
    c = Canvas(CAPE_W, CAPE_H)
    CYAN, DEEP, HOT = (0, 200, 230), (0, 130, 175), (175, 255, 255)
    cape_base(c)
    B = lambda u, v, col: c.px(BACK_X + u, BACK_Y + v, col)
    for _ in range(4):
        for _try in range(12):
            u, v = r.randint(0, 9), r.randint(0, 15)
            if abs(u - 4.5) + abs(v - 8) > 7:
                B(u, v, (0, 150, 185))
                break
    import math as _m
    cx, cy = 4.5, 7.0
    for v in range(16):  # thin broken rotation ring around the mark
        for u in range(10):
            d = ((u - cx) ** 2 + (v - cy) ** 2) ** 0.5
            if 3.6 < d < 4.4:
                ang = (_m.degrees(_m.atan2(v - cy, u - cx)) + 360) % 360
                if (ang % 120) > 28:
                    B(u, v, DEEP)
    import math as _m
    cx, cy = 4.5, 7.0
    for v in range(16):  # thin broken rotation ring (deep, frame stays dominant)
        for u in range(10):
            d = ((u - cx) ** 2 + (v - cy) ** 2) ** 0.5
            if 3.7 < d < 4.5 and (round((_m.degrees(_m.atan2(v - cy, u - cx)) + 360) % 360) % 120) > 30:
                c.px(BACK_X + u, BACK_Y + v, (0, 140, 190))
    for u, v in [(4, 14), (5, 14), (4, 15)]:  # descending motion ticks
        c.px(BACK_X + u, BACK_Y + v, (0, 140, 190))
    for v in range(2, 14):  # logo blades: open frame, dark interior
        lx = round(1 + (v - 2) * (3.0 / 11))
        rx = round(8 - (v - 2) * (3.0 / 11))
        edge = CYAN if v < 8 else DEEP
        B(min(9, max(0, lx)), v, edge)
        B(min(9, max(0, rx)), v, edge)
    B(4, 13, CYAN)
    B(5, 13, CYAN)
    for u, v in [(4, 7), (5, 7), (4, 8)]:
        B(u, v, HOT)
    for u, v in [(3, 7), (5, 8)]:
        B(u, v, (0, 220, 255))
    for u, v in [(3, 5), (6, 6), (4, 10)]:
        B(u, v, CYAN)
    for v in range(1, 17):  # graded sides
        k = max(0.0, 1.0 - abs(v - 8) / 8.0)
        col = (0, int(70 + 70 * k), int(95 + 50 * k))
        c.px(0, v, col)
        c.px(11, v, col)
    for u in range(10):  # hem with cyan exit
        c.px(11 + u, 0, (8, 12, 24))
    c.px(15, 0, CYAN)
    c.px(16, 0, CYAN)
    for u, v in [(4, 7), (3, 9), (5, 9)]:
        c.px(1 + u, 1 + v, (0, 140, 180))
    return c.im


# ------------------------------------------------------- hat model+texture
HAT_DIR = os.path.join(COS, "hats")
HAT_TEX = "cosmetics/hats/vortex_signature_hat.png"


def paint_hat_texture():
    c = Canvas(32, 32)
    for y in range(32):
        for x in range(32):
            c.px(x, y, (8, 12, 24))
    CYAN, HOT = (0, 200, 230), (175, 255, 255)
    # brow emblem 4x3 at (12,1): mini triangle notch + hot core
    art = {(12, 1): CYAN, (13, 1): CYAN, (14, 1): CYAN, (15, 1): CYAN,
           (12, 2): CYAN, (15, 2): CYAN, (13, 2): HOT,
           (13, 3): CYAN, (14, 3): CYAN}
    for (x, y), col in art.items():
        c.px(x, y, col)
    return c.im


def hat_model():
    navy, trim = [10, 14, 30], [0, 150, 190]
    return {
        "id": "vortex-signature-hat",
        "slot": "HEAD",
        "type": "HAT",
        "texture": HAT_TEX,
        "_doc": {
            "texture": "32x32; brow emblem art lives at x12..15,y1..3 (4x3); base opaque navy",
            "fit": "slim ring band y27..28.5 around upper head; face (y<27) fully clear; small emblem plates front+back so the mark reads from both sides",
        },
        "parts": {
            "bandF": {"flat": navy, "boxes": [{"from": [-4, 27, 4], "to": [4, 28.5, 5]}]},
            "bandB": {"flat": navy, "boxes": [{"from": [-4, 27, -5], "to": [4, 28.5, -4]}]},
            "bandL": {"flat": navy, "boxes": [{"from": [-5, 27, -4], "to": [-4, 28.5, 4]}]},
            "bandR": {"flat": navy, "boxes": [{"from": [4, 27, -4], "to": [5, 28.5, 4]}]},
            "trimF": {"flat": trim, "boxes": [{"from": [-4, 28.5, 4], "to": [4, 29, 5]}]},
            "trimB": {"flat": trim, "boxes": [{"from": [-4, 28.5, -5], "to": [4, 29, -4]}]},
            "trimL": {"flat": trim, "boxes": [{"from": [-5, 28.5, -4], "to": [-4, 29, 4]}]},
            "trimR": {"flat": trim, "boxes": [{"from": [4, 28.5, -4], "to": [5, 29, 4]}]},
            "emblem": {"tex": HAT_TEX, "uv": [12, 1],
                       "boxes": [{"from": [-2, 26.5, 4], "to": [2, 29.5, 5.2]}]},
            "emblemB": {"tex": HAT_TEX, "uv": [12, 1],
                        "boxes": [{"from": [-2, 26.5, -5.2], "to": [2, 29.5, -4]}]},
            "nodeL": {"flat": [0, 220, 255],
                      "boxes": [{"from": [-5.5, 27.2, 0.3], "to": [-4.7, 28.0, 1.1]}]},
            "nodeR": {"flat": [0, 220, 255],
                      "boxes": [{"from": [4.7, 27.2, 0.3], "to": [5.5, 28.0, 1.1]}]},
        },
    }


# ------------------------------------------------------- pet model+texture
PET_DIR = os.path.join(COS, "pets")
PET_TEX = "cosmetics/pets/vortexling.png"


def paint_pet_texture():
    c = Canvas(32, 32)
    for y in range(32):
        for x in range(32):
            c.px(x, y, (10, 14, 30))
    core = {(4, 4): (235, 255, 255), (5, 4): (0, 220, 255),
            (4, 5): (0, 220, 255), (5, 5): (0, 150, 200)}
    for (x, y), col in core.items():
        c.px(x, y, col)
    return c.im


def pet_model():
    return {
        "id": "vortexling-pet",
        "slot": "PET",
        "type": "PET",
        "texture": PET_TEX,
        "anim": "cosmetics/pets/vortexling-anim.json",
        "follow": {"offset": [10, 2, 4],
                   "note": "hovers beside/behind the player; never inside the body, never at the hand"},
        "_doc": {
            "texture": "32x32 opaque; core glowface art at x4..5,y4..5 (2x2); rest is base",
            "anim": "intended idle motion (bob/sway); honored when the client implements pet animation",
        },
        "parts": {
            "body": {"flat": [16, 20, 38], "boxes": [
                {"from": [-1.5, 12, -1.5], "to": [1.5, 15, 1.5]}]},
            "core": {"tex": PET_TEX, "uv": [4, 4], "boxes": [
                {"from": [-1, 12.3, 1.2], "to": [1, 14.3, 2.0]}]},
            "socketL": {"flat": [8, 10, 18], "boxes": [
                {"from": [-1.4, 14.4, 1.35], "to": [-0.8, 15.0, 1.55]}]},
            "socketR": {"flat": [8, 10, 18], "boxes": [
                {"from": [0.8, 14.4, 1.35], "to": [1.4, 15.0, 1.55]}]},
            "eyeL": {"flat": [220, 250, 255], "boxes": [
                {"from": [-1.25, 14.5, 1.5], "to": [-0.95, 14.75, 1.7]}]},
            "eyeR": {"flat": [220, 250, 255], "boxes": [
                {"from": [0.95, 14.5, 1.5], "to": [1.25, 14.75, 1.7]}]},
            "ringF": {"flat": [0, 200, 230], "boxes": [
                {"from": [-2.6, 13.3, 2.1], "to": [2.6, 13.6, 2.4]}]},
            "ringB": {"flat": [0, 200, 230], "boxes": [
                {"from": [-2.6, 13.3, -2.4], "to": [2.6, 13.6, -2.1]}]},
            "ringL": {"flat": [0, 200, 230], "boxes": [
                {"from": [-2.6, 13.3, -2.1], "to": [-2.3, 13.6, 2.1]}]},
            "ringR": {"flat": [0, 200, 230], "boxes": [
                {"from": [2.3, 13.3, -2.1], "to": [2.6, 13.6, 2.1]}]},
            "shard": {"flat": [0, 150, 200], "boxes": [
                {"from": [-0.7, 11.0, -0.7], "to": [0.7, 12.0, 0.7]}]},
            "shardTip": {"flat": [0, 200, 230], "boxes": [
                {"from": [-0.35, 10.0, -0.35], "to": [0.35, 11.0, 0.35]}]},
        },
    }


def pet_anim():
    return {"bob": 0.8, "sway": 0.3,
            "note": "intended idle hover motion; honored when the client implements pet animation"}


# ------------------------------------------------------------------ build
def write_json(path, obj):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2)
        f.write("\n")


def check_model(path):
    d = json.load(open(path, encoding="utf-8"))
    assert isinstance(d.get("parts"), dict) and d["parts"], "no parts"
    for name, spec in d["parts"].items():
        assert "flat" in spec or "tex" in spec, name + ": no flat/tex"
        for b in spec.get("boxes", []):
            f, t = b["from"], b["to"]
            assert len(f) == 3 and len(t) == 3, name + ": bad box"
            assert all(t[i] > f[i] for i in range(3)), name + ": inverted box"
            assert all(-8 <= v <= 34 for v in f + t), name + ": box out of range"
    tex = d.get("texture")
    if tex:
        assert os.path.isfile(os.path.join(SITE, *tex.split("/"))), "missing " + tex
    return True


def check_cape64(path):
    im = Image.open(path)
    assert im.size == (64, 32), "must be 64x32"
    px = im.convert("RGBA").load()

    def used(x, y):
        if y == 0:
            return 1 <= x <= 20
        return 1 <= y <= 16 and (x == 0 or 1 <= x <= 11 or 12 <= x <= 21)

    for y in range(32):
        for x in range(64):
            a = px[x, y][3]
            if used(x, y):
                assert a == 255, "hole at %d,%d" % (x, y)
            else:
                assert a == 0, "stray at %d,%d" % (x, y)
    return True


def main():
    for d in (os.path.join(COS, "capes"), HAT_DIR, PET_DIR,
              os.path.join(COS, "collections", "link-account")):
        os.makedirs(d, exist_ok=True)
    fails = []

    def ok(msg):
        print("  [OK] " + msg)

    try:
        p = os.path.join(COS, "capes", "vortex_signature_cape.png")
        paint_signature_cape().save(p, "PNG")
        check_cape64(p)
        ok("vortex_signature_cape.png (real 64x32)")
    except Exception as e:
        fails.append(("cape texture", str(e)))
    try:
        p = os.path.join(COS, "hats", "vortex_signature_hat.png")
        paint_hat_texture().save(p, "PNG")
        m = os.path.join(COS, "hats", "vortex_signature_hat.json")
        write_json(m, hat_model())
        check_model(m)
        ok("vortex_signature_hat.png + .json (model valid)")
    except Exception as e:
        fails.append(("hat", str(e)))
    try:
        p = os.path.join(COS, "pets", "vortexling.png")
        paint_pet_texture().save(p, "PNG")
        m = os.path.join(COS, "pets", "vortexling.json")
        write_json(m, pet_model())
        check_model(m)
        a = os.path.join(COS, "pets", "vortexling-anim.json")
        write_json(a, pet_anim())
        ok("vortexling.png + .json + -anim.json (model valid)")
    except Exception as e:
        fails.append(("pet", str(e)))
    print("paint-collection: failed=%d" % len(fails))
    for name, why in fails:
        print("FAIL: %s (%s)" % (name, why))
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
