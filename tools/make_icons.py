"""Regenerate the PWA icon set (pure stdlib — no Pillow needed).

Draws the rectangle dumbbell glyph on the app's dark background and emits:
  icons/icon-192.png, icon-512.png          (purpose "any")
  icons/icon-maskable-192.png, -512.png     (purpose "maskable" — glyph shrunk
                                             into the central 80% safe circle)
  icons/apple-touch-icon.png                (180x180, opaque, for iOS)

Run from anywhere: python tools/make_icons.py
"""
import os
import struct
import zlib

BG = (15, 17, 21)        # --bg  #0f1115
PLATE = (34, 197, 94)    # --accent  #22c55e
BAR = (229, 231, 235)    # --text  #e5e7eb

ICONS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'icons')


def chunk(tag, data):
    return (struct.pack('>I', len(data)) + tag + data
            + struct.pack('>I', zlib.crc32(tag + data) & 0xFFFFFFFF))


def write_png(path, size, rows):
    ihdr = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)  # 8-bit RGB
    raw = b''.join(b'\x00' + bytes(r) for r in rows)
    png = (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr)
           + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))
    with open(path, 'wb') as f:
        f.write(png)


def make_icon(path, size, glyph_scale):
    rows = [bytearray(BG * size) for _ in range(size)]

    def rect(x0, x1, y0, y1, color):
        px = bytes(color)
        xa, xb = int(round(x0 * size)), int(round(x1 * size))
        for y in range(int(round(y0 * size)), int(round(y1 * size))):
            rows[y][xa * 3:xb * 3] = px * (xb - xa)

    g = glyph_scale

    def centered(half_w, half_h, color, offset=0.0):
        # offset = distance of the rect's outer edge from center, as a fraction
        for sign in (-1, 1):
            far = 0.5 + sign * offset * g
            near = 0.5 + sign * (offset - 2 * half_w) * g
            x0, x1 = min(far, near), max(far, near)
            rect(x0, x1, 0.5 - half_h * g, 0.5 + half_h * g, color)

    centered(0.0425, 0.18, PLATE, offset=0.33)    # outer plates
    centered(0.0275, 0.12, PLATE, offset=0.225)   # inner plates
    bar_half = (0.225 - 0.055) * g                # bar spans between inner plates
    rect(0.5 - bar_half, 0.5 + bar_half, 0.5 - 0.05 * g, 0.5 + 0.05 * g, BAR)

    write_png(path, size, rows)
    print(f'wrote {os.path.relpath(path)} ({size}x{size}, glyph {g:.2f})')


def main():
    os.makedirs(ICONS_DIR, exist_ok=True)
    out = lambda name: os.path.join(ICONS_DIR, name)
    make_icon(out('icon-192.png'), 192, 1.0)
    make_icon(out('icon-512.png'), 512, 1.0)
    # Maskable: launchers crop to a circle/squircle; keep the glyph inside the
    # central safe zone (radius 40% of the icon) with room to spare.
    make_icon(out('icon-maskable-192.png'), 192, 0.78)
    make_icon(out('icon-maskable-512.png'), 512, 0.78)
    make_icon(out('apple-touch-icon.png'), 180, 1.0)


if __name__ == '__main__':
    main()
