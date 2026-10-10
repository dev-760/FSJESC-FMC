"""Regenerate the deployable brand assets from Branding/.

Run with `pnpm brand:assets` after replacing anything in Branding/.

WHY THIS EXISTS
---------------
`Branding/*.svg` are Image Trace output of a raster: no `viewBox`, a fixed
1254x1254, ~800 paths and ~300 near-identical fills from anti-aliasing. They
cannot scale and cannot be recoloured, so they do not ship. The PNGs are the
real artwork and are fine, but they are unusable as-is: the artwork floats in a
1254x1254 canvas with ~400px of dead margin top and bottom, and the light and
dark variants are drawn at different scales (878px vs 925px of content).

So each PNG is trimmed to its own content bounding box, downsampled to a sane
retina size, and re-encoded. The header mark drops from 126 KB to ~27 KB.

A square favicon is produced by centring the mark on a transparent square, since
the lockup is ~1.94:1 and would otherwise letterbox to nothing in a tab.

Standard library only — no Pillow. The images are palette (colour type 3) or
truecolor+alpha (type 6) at 8 bits per channel; anything else raises.
"""

import base64
import os
import struct
import sys
import zlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRANDING = os.path.join(ROOT, "Branding")
APPS = ["apps/landing", "apps/simulator", "apps/ams"]

# source file -> output basename
SOURCES = [
    ("icon (light) no bg.png", "mark-light"),
    ("icon (dark) no bg.png", "mark-dark"),
    ("logo (light) no bg.png", "wordmark-light"),
    ("logo (dark) no bg.png", "wordmark-dark"),
]

# Output width in px. ~2x the largest on-screen render.
WIDTHS = {"mark": 264, "wordmark": 360}

# Favicons are the mark only, never the wordmark. Tabs render at 16-32px and
# some at 64px, so 128 covers 2x the largest real case while keeping the themed
# `icon.svg` (which embeds two PNGs) small enough to be worth caching.
FAVICON_PX = 128


def _chunks(data):
    pos, ihdr, idat, plte, trns = 8, None, b"", b"", b""
    while pos < len(data):
        (ln,) = struct.unpack(">I", data[pos:pos + 4])
        typ, body = data[pos + 4:pos + 8], data[pos + 8:pos + 8 + ln]
        if typ == b"IHDR":
            ihdr = body
        elif typ == b"IDAT":
            idat += body
        elif typ == b"PLTE":
            plte += body
        elif typ == b"tRNS":
            trns += body
        pos += 12 + ln
    return ihdr, idat, plte, trns


def _unfilter(raw, width, height, bpp):
    stride, out, prev, i = width * bpp, bytearray(), bytearray(width * bpp), 0
    for _ in range(height):
        ft = raw[i]
        i += 1
        line = bytearray(raw[i:i + stride])
        i += stride
        for x in range(stride):
            a = line[x - bpp] if x >= bpp else 0
            b = prev[x]
            c = prev[x - bpp] if x >= bpp else 0
            if ft == 1:
                line[x] = (line[x] + a) & 255
            elif ft == 2:
                line[x] = (line[x] + b) & 255
            elif ft == 3:
                line[x] = (line[x] + (a + b) // 2) & 255
            elif ft == 4:
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[x] = (line[x] + pr) & 255
        out += line
        prev = line
    return out


def read_rgba(path):
    """Decode a PNG to a flat RGBA bytearray. Supports palette and RGBA input."""
    ihdr, idat, plte, trns = _chunks(open(path, "rb").read())
    w, h, depth, ctype = struct.unpack(">IIBB", ihdr[:10])
    if depth != 8 or ctype not in (3, 6):
        raise SystemExit("%s: unsupported PNG (depth %d, colour type %d)" % (path, depth, ctype))

    if ctype == 3:
        pal = [tuple(plte[i * 3:i * 3 + 3]) for i in range(len(plte) // 3)]
        alpha = [trns[i] if i < len(trns) else 255 for i in range(len(pal))]
        px = _unfilter(zlib.decompress(idat), w, h, 1)
        rgba = bytearray()
        for v in px:
            r, g, b = pal[v]
            rgba += bytes((r, g, b, alpha[v]))
    else:
        rgba = _unfilter(zlib.decompress(idat), w, h, 4)
    return w, h, rgba


def write_png(path, w, h, rgba):
    raw = b"".join(b"\x00" + bytes(rgba[y * w * 4:(y + 1) * w * 4]) for y in range(h))

    def chunk(typ, data):
        return struct.pack(">I", len(data)) + typ + data + struct.pack(
            ">I", zlib.crc32(typ + data) & 0xFFFFFFFF)

    with open(path, "wb") as fh:
        fh.write(b"\x89PNG\r\n\x1a\n"
                 + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
                 + chunk(b"IDAT", zlib.compress(raw, 9))
                 + chunk(b"IEND", b""))


def bbox(w, h, px, alpha_cutoff=16):
    min_x, min_y, max_x, max_y = w, h, -1, -1
    for y in range(h):
        row = y * w * 4
        for x in range(w):
            if px[row + x * 4 + 3] > alpha_cutoff:
                if x < min_x:
                    min_x = x
                if x > max_x:
                    max_x = x
                if y < min_y:
                    min_y = y
                if y > max_y:
                    max_y = y
    return min_x, min_y, max_x, max_y


def crop(w, h, px, box):
    min_x, min_y, max_x, max_y = box
    cw, ch = max_x - min_x + 1, max_y - min_y + 1
    out = bytearray()
    for y in range(min_y, min_y + ch):
        out += px[(y * w + min_x) * 4:(y * w + min_x + cw) * 4]
    return cw, ch, out


def resize(w, h, px, target_w):
    target_h = max(1, round(h * target_w / w))
    out = bytearray()
    for y in range(target_h):
        y0, y1 = y * h // target_h, max(y * h // target_h + 1, (y + 1) * h // target_h)
        for x in range(target_w):
            x0, x1 = x * w // target_w, max(x * w // target_w + 1, (x + 1) * w // target_w)
            acc, n = [0, 0, 0, 0], 0
            for yy in range(y0, y1):
                base = yy * w * 4
                for xx in range(x0, x1):
                    o = base + xx * 4
                    acc[0] += px[o]
                    acc[1] += px[o + 1]
                    acc[2] += px[o + 2]
                    acc[3] += px[o + 3]
                    n += 1
            out += bytes((acc[0] // n, acc[1] // n, acc[2] // n, acc[3] // n))
    return target_w, target_h, out


def pad_square(w, h, px, size, inset=0.82):
    """Centre the mark on a transparent square so it reads in a browser tab."""
    scale = (size * inset) / max(w, h)
    nw, nh = max(1, round(w * scale)), max(1, round(h * scale))
    _, _, small = resize(w, h, px, nw) if nw != w else (w, h, px)
    canvas = bytearray(size * size * 4)
    ox, oy = (size - nw) // 2, (size - nh) // 2
    for y in range(nh):
        dst = ((y + oy) * size + ox) * 4
        canvas[dst:dst + nw * 4] = small[y * nw * 4:(y + 1) * nw * 4]
    return size, size, canvas


def main():
    for app in APPS:
        brand_dir = os.path.join(ROOT, app, "public", "brand")
        os.makedirs(brand_dir, exist_ok=True)
        app_dir = os.path.join(ROOT, app, "src", "app")
        squares = {}

        for src_name, out_name in SOURCES:
            src = os.path.join(BRANDING, src_name)
            if not os.path.exists(src):
                sys.exit("missing source: %s" % src)

            w, h, px = read_rgba(src)
            cw, ch, cropped = crop(w, h, px, bbox(w, h, px))
            base, variant = out_name.split("-")
            tw, th, small = resize(cw, ch, cropped, WIDTHS[base])
            dest = os.path.join(brand_dir, out_name + ".png")
            write_png(dest, tw, th, small)
            print("  %-14s %3dx%-3d %6.1f KB  (was %dx%d)" % (
                out_name + ".png", tw, th, os.path.getsize(dest) / 1024, w, h))

            if base == "mark":
                squares[variant] = pad_square(cw, ch, cropped, FAVICON_PX)

        if not os.path.isdir(app_dir):
            continue

        # Next's `icon.png` convention takes one file and cannot theme, so it gets
        # the light mark. The themed version is `icon.svg` below, which Next also
        # picks up and which every current browser honours.
        light_png = os.path.join(app_dir, "icon.png")
        write_png(light_png, *squares["light"][:1], squares["light"][1],
                  squares["light"][2])
        print("  %-14s %3dx%-3d %6.1f KB" % (
            "icon.png", FAVICON_PX, FAVICON_PX, os.path.getsize(light_png) / 1024))

        parts = [
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d">'
            % (FAVICON_PX, FAVICON_PX),
            "<style>.dark{display:none}"
            "@media (prefers-color-scheme:dark){"
            ".light{display:none}.dark{display:block}}</style>",
        ]
        for variant in ("light", "dark"):
            _, _, square = squares[variant]
            png_path = os.path.join(brand_dir, "favicon-%s.png" % variant)
            write_png(png_path, FAVICON_PX, FAVICON_PX, square)
            b64 = base64.b64encode(open(png_path, "rb").read()).decode()
            parts.append(
                '<image class="%s" x="0" y="0" width="%d" height="%d" '
                'href="data:image/png;base64,%s"/>' % (variant, FAVICON_PX, FAVICON_PX, b64))
            parts.append("</svg>")

        icon_svg = os.path.join(app_dir, "icon.svg")
        with open(icon_svg, "w", encoding="utf-8") as fh:
            fh.write("\n".join(parts))
        print("  %-14s %6.1f KB" % (
            "icon.svg", os.path.getsize(icon_svg) / 1024))


if __name__ == "__main__":
    main()