# 分久必合 / Three Kingdoms skin pack — progress (branch wip/ink → main)

Design source: screenshots/mockups/ink/v4 (+ src4). Pack id `sanguo` 1.0.0, needs web app 0.9.6 (no native change; minNative stays 9020).

## Done
- Engine 0.9.6 (web bundle only): pack string table (`strings.zh.{t,L,dir,units}`; classical units 步/里/刻/时辰), pack puck image,
  `skin.fx:["scroll"]` + src/scrollfx.js (open → unroll, close → roll back), html[data-lang], pack sprites added up front
  (background-pattern), `_app.installPackBytes` test hook.
- Assets: web/packsrc/sanguo/genink.py → out/ (scroll nine-slice from the user's reference with alpha-cut end-caps so no pale
  strips, solid mounting band, black lacquer scroll in dark, rods, ink blobs from the v4 set, rider luminance→alpha, dark rider
  #a89e8a @75%, top-down ink horse puck with halo, ink-blob POI sprite + warm paper pattern).
- theme.src.css → buildcss.py → theme.css; strings.json (one table, ~185 inline strings + ~68 keys); fonts subset (Ma Shan Zheng
  UI chars, LXGW WenKai UI + GB2312 level 1) with OFL texts; map styles light (A palette) / dark (dusk) built in tools/genpacks.mjs.
- Drawer: vertical unroll (clip edge = registered `--rgcut` transitioned; bottom rod rides the edge with transform), 0.32–0.34 s.
- Screenshots: screenshots/ink_pack/ (light/dark × zh/en, plus light ×1.4 text), overlap_*.json from tools/ink/overlap.js.
- Perf: screenshots/perf_ink_base.json (west_light, no pack) vs perf_ink_pack.json.

## Rebuild
cd web/packsrc/sanguo && python3 genink.py && python3 buildcss.py   # fonts: see pyftsubset commands in PROGRESS notes below
cd web && node tools/genpacks.mjs   (also part of npm run build)
Shots: python3 tools/ink/shot.py <dev-url> ../screenshots/ink_pack light,dark zh,en [scale]
Fonts: pyftsubset MaShanZheng-Regular.ttf --text-file=<UI chars> ; LXGWWenKai-Medium.ttf --text-file=<UI chars + GB2312 L1>, --flavor=woff2

## Known gaps
- Map labels still use the bundled glyph fonts (IM FELL / system CJK), not the brush fonts.
- Not tested on a phone. Beijing edition not rebuilt (no native change; it does not live-update).

## Checkpoint 2026-10-22: pack sanguo 1.1.0 / web 0.9.7
- Rebuilt the drawer, search, place, skin switcher and nav to match the 7 targets (`screenshots/ink_pack_v11/compare_*.png` puts each target on the left and our build on the right; `compare_before_*` shows the v1.0 state).
- Thick baked ink rings; no live SVG filters. POI blobs are black with white glyphs. Quick buttons and the compass are black/white. The "me" marker is an ink arrowhead puck with a halo.
- Poems: 世间无限丹青手 sits under the title, and 一片伤心画不成 runs vertically above the rider, in both zh and en.
- scrollfx rewrite: open 320 ms and close 280 ms. A reversal mid-animation continues from its current position. Animations are filtered by target and have a timeout fallback, and `--rh` is re-measured on resize.
- Stress test (headless Chromium, `web/tools/ink/anim11.py`, data in `anim_timings.json`):
  - Rapid toggles, open during close, close during open, resize during open and the back button all end in the correct state. No stuck states.
  - Chip tap to the next frame: 11–17 ms. It was about 130 ms before, caused by the filters.
  - Frames on a warm open/close stay at about 16.7 ms. The first (cold) opens drop 2–3 frames (100–133 ms), which is image decode on first paint.
  - The place card open drops 2 frames even when warm (re-render on each open).
- Overlap check: 0 on every screen, except search with 1 hit (a list icon in a clipped, scrolled-off row against the 茶寮 chip). Visually there is no overlap, and it is believed to be a false positive.
- NOT tested on a real phone. Known gaps: a faint rectangle remains around the rider; the chips have no icon discs; the English drawer title wraps to two lines; no 1.4× font-scale shots were taken.
