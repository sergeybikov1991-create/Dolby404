#!/usr/bin/env python3
"""Build Android launcher resources from the preserved FLOUSTREAM source screenshot.

The source image is an exact base64 copy of the user's original file from
 design/author-banner-library. The original in that branch is never modified.
"""
from base64 import b64decode
from pathlib import Path
from PIL import Image, ImageChops, ImageEnhance, ImageFilter
import io
import math

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "design-assets" / "floustream-icon-source.jpg.b64"
RES = ROOT / "app" / "src" / "main" / "res"

raw = b64decode("".join(SOURCE.read_text(encoding="ascii").split()))
source = Image.open(io.BytesIO(raw)).convert("RGB")
w, h = source.size
# The source is a phone screenshot. Extract only the original square icon's
# central lowercase neon-f artwork; ignore all screenshot chrome and margins.
# Coordinates are normalized against the verified 832 x 1856 source screenshot.
def px(v, total):
    return int(round(v * total))
square = source.crop((px(80/832, w), px(594/1856, h),
                      px(751/832, w), px(1265/1856, h)))
# Keep the original drawn f and its light trails, removing the dark icon field.
glyph = square.crop((px(155/671, square.width), px(120/671, square.height),
                     px(505/671, square.width), px(525/671, square.height)))
r, g, b = glyph.split()
bright = ImageChops.lighter(ImageChops.lighter(r, g), b)
# A soft luminance key retains the neon bloom while making the dark field transparent.
alpha = bright.point(lambda p: max(0, min(255, int((p - 13) * 1.85))))
# Suppress residual dark-background noise, then gently smooth the glow.
alpha = alpha.filter(ImageFilter.GaussianBlur(0.55))
rgba = glyph.convert("RGBA")
rgba.putalpha(alpha)
bbox = rgba.getbbox()
if not bbox:
    raise SystemExit("Could not isolate the neon lowercase f from the source image")
rgba = rgba.crop(bbox)
# Keep the glyph safely inside Android's adaptive-icon mask area.
max_w, max_h = 258, 282
scale = min(max_w / rgba.width, max_h / rgba.height)
glyph_size = (max(1, round(rgba.width * scale)), max(1, round(rgba.height * scale)))
rgba = rgba.resize(glyph_size, Image.Resampling.LANCZOS)
foreground = Image.new("RGBA", (432, 432), (0, 0, 0, 0))
# Add a restrained dimensional glow behind the source light trails.
mask = rgba.getchannel("A")
glow = mask.filter(ImageFilter.GaussianBlur(13))
x = (432 - rgba.width) // 2
y = (432 - rgba.height) // 2
glow_layer = Image.new("RGBA", (432, 432), (100, 30, 255, 0))
glow_alpha = Image.new("L", (432, 432), 0)
glow_alpha.paste(glow.point(lambda p: int(p * 0.22)), (x, y))
glow_layer.putalpha(glow_alpha)
foreground.alpha_composite(glow_layer, (0, 0))
foreground.alpha_composite(rgba, (x, y))
# A subtle highlight pass gives the existing neon tubing a glass-like finish.
highlight = rgba.filter(ImageFilter.GaussianBlur(1.2))
highlight.putalpha(highlight.getchannel("A").point(lambda p: int(p * 0.12)))
foreground.alpha_composite(highlight, (x, max(0, y - 1)))

(RES / "drawable").mkdir(parents=True, exist_ok=True)
foreground.save(RES / "drawable" / "ic_launcher_foreground.png", optimize=True)

# Generate legacy density icons from the same original-derived artwork.
for density, size in [("mdpi",48),("hdpi",72),("xhdpi",96),("xxhdpi",144),("xxxhdpi",192)]:
    d = RES / f"mipmap-{density}"
    d.mkdir(parents=True, exist_ok=True)
    # Dark midnight-violet radial background; the foreground remains the exact f.
    bg = Image.new("RGBA", (size, size), (10, 3, 24, 255))
    pxs = bg.load()
    for yy in range(size):
        for xx in range(size):
            dist = math.sqrt((xx-size*.5)**2 + (yy-size*.48)**2) / (size*.72)
            glowv = max(0.0, 1.0-dist)
            pxs[xx,yy] = (int(10+18*glowv), int(3+2*glowv), int(24+42*glowv), 255)
    fg = foreground.resize((size,size), Image.Resampling.LANCZOS)
    icon = Image.alpha_composite(bg, fg).convert("RGB")
    icon.save(d / "ic_launcher.png", optimize=True)
    icon.save(d / "ic_launcher_round.png", optimize=True)

(RES / "mipmap-anydpi-v26").mkdir(parents=True, exist_ok=True)
for name in ("ic_launcher.xml", "ic_launcher_round.xml"):
    (RES / "mipmap-anydpi-v26" / name).write_text(
        '<?xml version="1.0" encoding="utf-8"?>\\n'
        '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\\n'
        '    <background android:drawable="@drawable/ic_launcher_background" />\\n'
        '    <foreground android:drawable="@drawable/ic_launcher_foreground" />\\n'
        '</adaptive-icon>\\n', encoding="utf-8")

(RES / "drawable" / "ic_launcher_background.xml").write_text(
    '<?xml version="1.0" encoding="utf-8"?>\\n'
    '<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">\\n'
    '    <gradient android:type="radial" android:gradientRadius="220dp" '
    'android:centerColor="#1A0A35" android:endColor="#080214" android:startColor="#16082C" />\\n'
    '</shape>\\n', encoding="utf-8")
print(f"Generated FLOUSTREAM launcher icons from original source ({w}x{h}); "
      f"glyph {glyph.width}x{glyph.height}, adaptive foreground 432x432.")
