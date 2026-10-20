# Original RoadGlow app icons + iOS splash screens (procedural, PIL).
from PIL import Image, ImageDraw, ImageFont
import os, json
OUT = os.path.join(os.path.dirname(__file__), '../public/pwa'); os.makedirs(OUT, exist_ok=True)
def icon(n, pad=0.0):
    im = Image.new('RGB', (n, n), '#101521'); d = ImageDraw.Draw(im); s = n / 100
    for i in range(40):  # soft radial glow
        r = (50 - i) * s; c = int(16 + i * 1.1); d.ellipse([50 * s - r, 52 * s - r, 50 * s + r, 52 * s + r], fill=(c, c + 6, c + 18))
    k = 1 - pad * 2; o = lambda x, y: (50 * s + (x - 50) * s * k, 50 * s + (y - 50) * s * k)
    d.polygon([o(50, 14), o(80, 80), o(50, 64), o(20, 80)], fill='#ffd25a', outline='#2fd3e6')
    d.line([o(50, 14), o(80, 80), o(50, 64), o(20, 80), o(50, 14)], fill='#2fd3e6', width=max(2, int(3 * s * k)))
    return im
for n in (180, 192, 512): icon(n).save(f'{OUT}/icon-{n}.png', optimize=True)
icon(512, pad=0.1).save(f'{OUT}/icon-512-maskable.png', optimize=True)
SPL = [(1290, 2796, 430, 932, 3), (1179, 2556, 393, 852, 3), (1284, 2778, 428, 926, 3), (1170, 2532, 390, 844, 3), (1125, 2436, 375, 812, 3),
       (1242, 2688, 414, 896, 3), (828, 1792, 414, 896, 2), (750, 1334, 375, 667, 2), (1242, 2208, 414, 736, 3), (640, 1136, 320, 568, 2), (1206, 2622, 402, 874, 3), (1320, 2868, 440, 956, 3)]
links = []
for w, h, dw, dh, r in SPL:
    im = Image.new('RGB', (w, h), '#101521'); ic = icon(w // 3); im.paste(ic, ((w - ic.width) // 2, (h - ic.height) // 2 - h // 12))
    d = ImageDraw.Draw(im)
    try: f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', w // 14)
    except Exception: f = ImageFont.load_default()
    t = 'RoadGlow'; tw = d.textlength(t, font=f); d.text(((w - tw) / 2, h / 2 + w / 5), t, fill='#e8f6ff', font=f)
    fn = f'splash-{w}x{h}.png'; im.save(f'{OUT}/{fn}', optimize=True)
    links.append(f'<link rel="apple-touch-startup-image" media="(device-width: {dw}px) and (device-height: {dh}px) and (-webkit-device-pixel-ratio: {r}) and (orientation: portrait)" href="./pwa/{fn}">')
open(f'{OUT}/splash-links.html', 'w').write('\n'.join(links))
print(len(links))
