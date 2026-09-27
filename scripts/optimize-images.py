#!/usr/bin/env python3
"""VortexSite image pipeline (idempotent).

What it does, and why each step is display-size driven:
  - scene-<n>.webp      : backdrop variant, max 1920w, q80.
                          Displayed as full-viewport `cover` backdrop, so 1920w
                          covers 1080p screens 1:1 (the common case).
  - scene-<n>-960.webp  : content variant, 960w, q75.
                          Displayed in .feature-img columns (~560px) at 16/10,
                          so 960w is retina-crisp with headroom.
  - scene-<n>.png       : legacy fallback (old browsers without image-set/WebP).
                          Downscaled in place to max 1600w + PNG-optimized.
  - vortex-logo.jpg     : displayed at 36x36 (manifest declares 512). Rebuilt
                          in place at max 512w, q75, progressive.
  - cosmetics/*.png     : pixel-art thumbs, already 150B-3KB. Verified only;
                          never upscaled, never blurred.

Run: npm run optimize-images   (requires Pillow: pip install pillow)
"""
import os
import sys

try:
    from PIL import Image
except ImportError:
    print("optimize-images: ERROR: Pillow not installed (pip install pillow)")
    sys.exit(1)

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGINALS = os.path.normpath(os.path.join(SITE, "..", "VortexSite-originals"))


def src_dir():
    """Originals backup (never pushed) preferred; site root as fallback."""
    try:
        names = os.listdir(ORIGINALS)
        if any(n.startswith("scene-") and n.endswith(".png") for n in names):
            return ORIGINALS
    except OSError:
        pass
    return SITE
BACKDROP_W = 1920
CONTENT_W = 960
FALLBACK_W = 1600
LOGO_W = 512


def fresh(dst, *srcs):
    return os.path.exists(dst) and all(
        os.path.getmtime(dst) >= os.path.getmtime(s) for s in srcs)


def resize(im, width):
    if im.size[0] <= width:
        return im
    return im.resize((width, int(im.size[1] * width / im.size[0])), Image.LANCZOS)


def kb(p):
    return os.path.getsize(p) // 1024


def main():
    made, skipped, saved = 0, 0, 0
    SRC = src_dir()
    in_repo = os.path.normcase(SRC) == os.path.normcase(SITE)
    print("optimize-images: source=%s" % SRC)
    for name in sorted(os.listdir(SRC)):
        if not (name.startswith("scene-") and name.endswith(".png")):
            continue
        base = name[:-4]
        src = os.path.join(SRC, name)
        im = Image.open(src)
        im.load()

        # 1. backdrop webp (1920w)
        dst = os.path.join(SITE, base + ".webp")
        if not fresh(dst, src):
            before = kb(dst) if os.path.exists(dst) else None
            out = resize(im, BACKDROP_W)
            if out.mode in ("RGBA", "LA"):
                out.save(dst, "WEBP", quality=80, method=6)
            else:
                out.convert("RGB").save(dst, "WEBP", quality=80, method=6)
            after = kb(dst)
            saved += (before - after) if before else 0
            print("%s -> %s.webp: %dKB%s" %
                  (name, base, after, " (was %dKB)" % before if before else ""))
            made += 1
        else:
            skipped += 1

        # 2. content webp (960w)
        dst960 = os.path.join(SITE, base + "-960.webp")
        if not fresh(dst960, src):
            out = resize(im.copy(), CONTENT_W)
            if out.mode in ("RGBA", "LA"):
                out.save(dst960, "WEBP", quality=75, method=6)
            else:
                out.convert("RGB").save(dst960, "WEBP", quality=75, method=6)
            print("%s -> %s-960.webp: %dKB" % (name, base, kb(dst960)))
            made += 1
        else:
            skipped += 1

        # 3. PNG fallback downscale (only while PNGs still live in the repo;
        #    webp-only policy keeps them in ../VortexSite-originals instead)
        if in_repo and im.size[0] > FALLBACK_W:
            out = resize(im, FALLBACK_W)
            out.save(src, "PNG", optimize=True)
            print("%s fallback downscaled to %dw: %dKB" % (name, FALLBACK_W, kb(src)))
            made += 1
        else:
            skipped += 1

    # 4. logo (in place, same name -> paths never break)
    logo = os.path.join(SITE, "vortex-logo.jpg")
    if os.path.exists(logo):
        im = Image.open(logo)
        im.load()
        if im.size[0] > LOGO_W or os.path.getsize(logo) > 120 * 1024:
            before = kb(logo)
            out = resize(im, LOGO_W).convert("RGB")
            out.save(logo, "JPEG", quality=75, progressive=True, optimize=True)
            print("vortex-logo.jpg: %dKB -> %dKB (512w q75 progressive)" % (before, kb(logo)))
            made += 1
        else:
            skipped += 1

    # 5. cosmetics audit (verify-only)
    cos = os.path.join(SITE, "cosmetics")
    big = []
    if os.path.isdir(cos):
        for n in sorted(os.listdir(cos)):
            p = os.path.join(cos, n)
            if os.path.isfile(p) and os.path.getsize(p) > 8 * 1024:
                big.append((n, kb(p)))
    if big:
        print("WARN: oversized cosmetic thumbs (>8KB): %s" % big)
    else:
        print("cosmetics/: all thumbs <= 8KB, untouched")

    print("optimize-images: made=%d skipped=%d" % (made, skipped))


if __name__ == "__main__":
    main()
