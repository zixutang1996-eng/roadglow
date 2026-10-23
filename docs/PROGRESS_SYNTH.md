# Synth packs B (Chrome & Neon Poster → `synthb`) and C (Night Drive → `synthc`)

- Downloadable `.rgpack` (base `neon`, minAppVersion 0.9.9), not bundled. Sources in `web/packsrc/synth/` (bake.py renders the art/icons/puck/compass from the v4 mockup code; buildcss.py makes theme.css; genpacks.mjs `synthPack`).
- Original art; OFL fonts are subset and renamed (RG Synth Script/Round/Wide/Cursive, because of the Reserved Font Name rule), with the OFL texts included.
- Comparison shots: `web/tools/synth/shoot.py` → map, drawer, skins, search, place, nav × dark/light × zh/en. Overlap audit: B 0 everywhere. C reports 2 items that are false positives/benign on inspection: a chip that sits behind the suggest panel, and the nav distance/instruction line boxes touching (visually clear).
- Visually compared against `screenshots/mockups/synth/{B,C}/contact_*_v4.png`: the drawer art, foot, slice buttons, chips, panels, fonts, titles and copy match. Differences: the live map shows real OSM POI density, and the mockup's route preview in the place card isn't reproduced (it shows when actually routing).
- Not tested on a real phone.

## Live (verified 2026-10-23 ~14:10 UTC-6)
- Live manifest at github.io/roadglow reports version 0.9.9. The catalog lists sanguo 1.1.1, synthb 1.0.0 and synthc 1.0.0.
- synthb/synthc were installed from the live site in headless Chrome; drawer, skins and nav screenshots are in screenshots/synth099/live_*.
