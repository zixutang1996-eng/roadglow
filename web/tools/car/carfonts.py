#!/usr/bin/env python3
"""v0.9.11: convert the panel fonts (woff2 → ttf; Android Typeface can't read woff2) into the car source set's assets.
Run from web/: python3 tools/car/carfonts.py  (needs fontTools + brotli). Pack fonts are read from the bundled packs."""
import io, json, os, zipfile
from fontTools.ttLib import TTFont
OUT = 'android/app/src/car/assets/carfonts'
SRC = {  # family (as used in CSS / car.js BUILTIN_PANEL) -> (source, file)
    'Rajdhani': ('public/fonts/Rajdhani-700n.woff2', None),
    'IM Fell English': ('public/fonts/IMFellEnglish-400n.woff2', None),
    'Alegreya': ('public/fonts/Alegreya-700.woff2', None),
    'Space Grotesk': ('public/fonts/SpaceGrotesk-var.woff2', None),
    'Cinzel': ('public/fonts/Cinzel-var.woff2', None),
    'Barlow Condensed': ('public/fonts/BarlowCondensed-700.woff2', None),
    'RG Brush': ('public/packs/sanguo-1.1.1.rgpack', 'fonts/MaShanZheng-sub.woff2'),
    'RG Synth Script': ('public/packs/synthb-1.0.1.rgpack', 'fonts/synth-script.woff2'),
    'RG Synth Round': ('public/packs/synthb-1.0.1.rgpack', 'fonts/synth-round.woff2'),
    'RG Synth Wide': ('public/packs/synthb-1.0.1.rgpack', 'fonts/synth-wide.woff2'),
}
os.makedirs(OUT, exist_ok=True); idx = {}
for fam, (src, inner) in SRC.items():
    data = zipfile.ZipFile(src).read(inner) if inner else open(src, 'rb').read()
    f = TTFont(io.BytesIO(data)); f.flavor = None
    name = fam.lower().replace(' ', '_') + '.ttf'; f.save(os.path.join(OUT, name)); idx[fam.lower()] = name
    print(fam, '->', name, os.path.getsize(os.path.join(OUT, name)))
json.dump(idx, open(os.path.join(OUT, 'index.json'), 'w'), indent=1)
open(os.path.join(OUT, 'LICENSES.txt'), 'w').write('All fonts here are SIL Open Font License 1.1 (converted woff2 → ttf, unmodified glyphs): Rajdhani, IM Fell English, Alegreya, Space Grotesk, Cinzel, Barlow Condensed (see public/fonts/LICENSES-*.txt); Ma Shan Zheng (sanguo pack); synth fonts = Kaushan Script, Righteous, Orbitron (synthb pack fonts/OFL-*.txt).\n')
