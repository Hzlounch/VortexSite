#!/usr/bin/env python3
"""VORTEX LINK-ACCOUNT COLLECTION — store preview renders.

Renders the 3 collection previews + the collection group shot with the
SAME camera, lighting, mannequin and backdrop as the cape previews
(scripts/render-cape-previews.py machinery, reused — never reinvented):
  hats/vortex_signature_hat_preview.webp ... hat worn on the player
  pets/vortexling_preview.webp ............ the Vortexling model
  collections/link-account/preview.webp ... player in cape+hat, pet beside

Every preview is rendered FROM the real asset files (model JSON +
textures). No AI art, no screenshots, no invented geometry.

Run:  python scripts/render-collection.py
Requires: Pillow (WebP support)
"""
import importlib.util
import json
import os
import sys

try:
    from PIL import Image
except ImportError:
    print("render-collection: ERROR: Pillow not installed (pip install pillow)")
    sys.exit(1)

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
COS = os.path.join(SITE, "cosmetics")


def load_mod(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


prev = load_mod("cape_previews", os.path.join(HERE, "render-cape-previews.py"))
mc = load_mod("mc_renderer", os.path.join(HERE, "render-cosmetics.py"))

SIZE = 1024
HAT_ACCENT = (0, 200, 235)
PET_ACCENT = (0, 220, 255)
GROUP_ACCENT = (0, 200, 235)

_tex_cache = {}


def tex_of(path):
    if path not in _tex_cache:
        _tex_cache[path] = Image.open(
            os.path.join(SITE, *path.split("/"))).convert("RGB")
    return _tex_cache[path]


def model_faces(model, dx=0.0, dy=0.0, dz=0.0):
    """Model parts -> painter faces (same depth/camera as cape previews).
    Flat parts shade like the mannequin; textured faces sample explicit
    UV rects from the model's real texture file."""
    faces = []
    for _name, spec in (model.get("parts") or {}).items():
        for b in spec.get("boxes", []):
            f, t = b["from"], b["to"]
            f = [f[0] + dx, f[1] + dy, f[2] + dz]
            t = [t[0] + dx, t[1] + dy, t[2] + dz]
            box = (min(f[0], t[0]), min(f[1], t[1]), min(f[2], t[2]),
                   max(f[0], t[0]), max(f[1], t[1]), max(f[2], t[2]))
            x0, y0, z0, x1, y1, z1 = box
            ddx, ddy, ddz = x1 - x0, y1 - y0, z1 - z0
            if ddx <= 0 or ddy <= 0 or ddz <= 0:
                continue
            quads = [
                ("py", [(x0, y1, z0), (x1, y1, z0),
                        (x1, y1, z1), (x0, y1, z1)]),
                ("px", [(x1, y0, z0), (x1, y0, z1),
                        (x1, y1, z1), (x1, y1, z0)]),
                ("pz", [(x0, y0, z1), (x1, y0, z1),
                        (x1, y1, z1), (x0, y1, z1)]),
            ]
            for fid, pts in quads:
                cx = sum(p[0] for p in pts) / 4.0
                cy = sum(p[1] for p in pts) / 4.0
                cz = sum(p[2] for p in pts) / 4.0
                depth = (0.08 * cx + 0.35 * cy + cz)
                if "flat" in spec:
                    faces.append((depth, fid, pts, "flat",
                                  tuple(spec["flat"])))
                else:
                    img = tex_of(spec["tex"])
                    tw, th = img.size
                    uv = spec.get("uv", [0, 0])
                    ur = mc.uv_rect(fid, uv[0], uv[1],
                                    ddx, ddy, ddz, tw, th)
                    faces.append((depth, fid, pts, "tex",
                                  (img, ur, 1.0)))
    faces.sort(key=lambda f: f[0])
    return faces


def compose(faces, accent, seed, cloth_tex=None):
    """Full studio product shot for one face set (+ optional cape cloth)."""
    sc, ox, oy = prev.fit_rear(faces, SIZE, fill=0.88)
    im = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    prev.add_shadow_rear(im, faces, sc, ox, oy, SIZE)
    prev.draw_faces_rear(im, faces, sc, ox, oy)
    if cloth_tex is not None:
        tw, th = cloth_tex.size
        s1 = 0.8 * __import__("math").sin(2.4)
        w0, w1, y0, h, z = 9.0, 13.0, 21.0, 16.0, 2.2
        quad = [(-w0 / 2, y0, z), (w0 / 2, y0, z),
                (w1 / 2 + s1, y0 - h, z), (-w1 / 2 + s1, y0 - h, z)]
        prev.draw_cloth(im, [(0.0, "pz", quad, "tex",
                              (cloth_tex, (0, 0, tw, th), 1.0))],
                        sc, ox, oy)
    photo = prev.backdrop(accent)
    photo = prev.dust(photo, seed)
    photo.alpha_composite(im)
    return photo


def load_json(rel):
    with open(os.path.join(SITE, *rel.split("/")), encoding="utf-8") as f:
        return json.load(f)


def back_panel():
    src = Image.open(
        os.path.join(COS, "capes", "vortex_signature_cape.png")).convert("RGB")
    assert src.size == (64, 32), "cape texture must be 64x32"
    return src.crop((12, 1, 22, 17)).resize((40, 64), Image.NEAREST)


def main():
    hat = load_json("cosmetics/hats/vortex_signature_hat.json")
    pet = load_json("cosmetics/pets/vortexling.json")
    body = prev.collect_rear(prev.studio_body())
    fails = []

    def ok(msg):
        print("  [OK] " + msg)

    # 1. hat worn (full player, no cape — hat is the product)
    try:
        faces = body + model_faces(hat)
        img = compose(faces, HAT_ACCENT, prev.seed_of("vortex-signature-hat"))
        if not prev.nonblank(img):
            raise RuntimeError("blank render")
        img.save(os.path.join(COS, "hats", "vortex_signature_hat_preview.webp"),
                 "WEBP", quality=82, method=4)
        ok("vortex_signature_hat_preview.webp (hat worn on player)")
    except Exception as e:
        fails.append(("hat preview", str(e)))
    # 2. pet solo (the actual model, centered, hover shadow beneath)
    try:
        faces = model_faces(pet)
        img = compose(faces, PET_ACCENT, prev.seed_of("vortexling-pet"))
        if not prev.nonblank(img):
            raise RuntimeError("blank render")
        img.save(os.path.join(COS, "pets", "vortexling_preview.webp"),
                 "WEBP", quality=82, method=4)
        ok("vortexling_preview.webp (pet model)")
    except Exception as e:
        fails.append(("pet preview", str(e)))
    # 3. collection group: player in cape+hat, Vortexling at follow offset
    try:
        off = (pet.get("follow") or {}).get("offset", [10, 2, 4])
        faces = body + model_faces(hat) + model_faces(
            pet, dx=off[0], dy=off[1], dz=off[2])
        img = compose(faces, GROUP_ACCENT,
                      prev.seed_of("link-account"), cloth_tex=back_panel())
        if not prev.nonblank(img):
            raise RuntimeError("blank render")
        img.save(os.path.join(COS, "collections", "link-account",
                              "preview.webp"), "WEBP", quality=82, method=4)
        ok("collections/link-account/preview.webp (cape+hat worn, pet beside)")
    except Exception as e:
        fails.append(("collection preview", str(e)))
    print("render-collection: failed=%d" % len(fails))
    for name, why in fails:
        print("FAIL: %s (%s)" % (name, why))
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
