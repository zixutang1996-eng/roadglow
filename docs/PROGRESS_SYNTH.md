# Synth packs B (Chrome & Neon Poster → `synthb`) and C (Night Drive → `synthc`)

- Downloadable `.rgpack` (base `neon`, minAppVersion 0.9.9), not bundled. Sources in `web/packsrc/synth/` (bake.py renders the art/icons/puck/compass from the v4 mockup code; buildcss.py makes theme.css; genpacks.mjs `synthPack`).
- Original art; OFL fonts are subset and renamed (RG Synth Script/Round/Wide/Cursive, because of the Reserved Font Name rule), with the OFL texts included.
- Comparison shots: `web/tools/synth/shoot.py` → map, drawer, skins, search, place, nav × dark/light × zh/en. Overlap audit: B 0 everywhere. C reports 2 items that are false positives/benign on inspection: a chip that sits behind the suggest panel, and the nav distance/instruction line boxes touching (visually clear).
- Visually compared against `screenshots/mockups/synth/{B,C}/contact_*_v4.png`: the drawer art, foot, slice buttons, chips, panels, fonts, titles and copy match. Differences: the live map shows real OSM POI density, and the mockup's route preview in the place card isn't reproduced (it shows when actually routing).
- Not tested on a real phone.

## Live (verified 2026-10-23 ~14:10 UTC-6)
- Live manifest at github.io/roadglow reports version 0.9.9. The catalog lists sanguo 1.1.1, synthb 1.0.0 and synthc 1.0.0.
- synthb/synthc were installed from the live site in headless Chrome; drawer, skins and nav screenshots are in screenshots/synth099/live_*.

## 1.0.1 — compass needle centred (2026-10-23)
- Bug: the neon base laid #needle out as an inline-block on the text baseline (font-size 0), so it sat about 14 px low. B's compass art was also 2 px (@2x) off-centre horizontally.
- Fix (pack only): #compassBtn is now flex-centred with padding 0, and #needle is display:block with transform-origin 50% 50%. centre_compass.py re-centres the compass PNGs and runs from buildcss.py.
- Test: tools/synth/needle.py (diffs screenshots with the needle shown and hidden, @3x).
  - Before: dy +11.5 to +16 px.
  - After: at 0/90/180/270°, both packs, light and dark, zh and en, the needle bbox centre is within 0.5 px of the button centre. The rotation pivot (midpoint of opposite diagonals) is within 0.0 px for B and 0.17 px for C.
  - B's arrow is asymmetric, so at diagonal angles its bounding box sits 2.33 px off while it still rotates exactly about the centre.
- Close-ups: screenshots/synth101/{before,after}.
