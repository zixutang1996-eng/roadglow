# 0.9.9 menu cleanup — progress

## Done (code)
- Skin choose/download/install/update/remove only in drawer → 地图皮肤 / Map skins.
- Layers quick sheet: draggable; only 昼/夜/卫星 (Day/Night/Satellite) + Frontier Ink dark palettes.
- All long menus/sheets scroll (drawer, settings, map skins, place, layers).
- Pack API: `@drawerSub`, `@skinsTitle`, `@skinsSub` string keys; per-language overrides; route glow tokens (`routeGlow`, `routeGlowOp`, `routeCore`, `routeWidth`).
- version 0.9.9 (web only, no APK needed).

## Verification (headless Chrome, SwiftShader software GL — NOT a real phone)
- Overlap/clip audit, 7 built-in/pack skins × light/dark × zh/en @412x915, views drawer, drawer_bottom, layers, layers_full, mapskins, place: **0 overlaps, 0 clipped** everywhere. Also 360x640 and 412x780 runs (en). Screens in `screenshots/menu099/`; every contact sheet was visually inspected.
- Pseudo-element glyphs are invisible to the audit → covered by visual inspection only.
- Perf (frame max after warm-up, ms; `perf_*.json`): drawer open/close and sheet open/close mostly 17 ms. Drawer scroll 50–250 ms, place open up to 267 ms, day/night switch 83–233 ms with one long task. Zoom/pan ~1.3 s in software GL, so those numbers don't mean anything. **The "no frame >50 ms" target is NOT demonstrated** in this environment; it needs testing on the vivo X90s.
- Known: the day/night toggle still causes one long task (style rebuild). Not fixed.

## Live (verified 2026-10-23 ~14:10 UTC-6)
- Live manifest at github.io/roadglow reports version 0.9.9. The catalog lists sanguo 1.1.1, synthb 1.0.0 and synthc 1.0.0.
- synthb/synthc were installed from the live site in headless Chrome; drawer, skins and nav screenshots are in screenshots/synth099/live_*.
