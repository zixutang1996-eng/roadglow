# RoadGlow 0.9.5 progress (branch wip/0.9.5, base d9b72b4 = v0.9.4)

## Done
- Item 1 chip shadows: cause = `#chips` is an `overflow-x:auto` scroller with 4px bottom padding, so every chip's
  box-shadow/drop-shadow was clipped into one flat band. Fix in `web/src/v095.css` (imported after v093.css in main.js):
  padding 6/14/20 + equal negative margins. Verified in 4 variants (Playwright, desktop Chrome, 461x1024):
  `screenshots/v095/item1_chip_shadows_4skins.png`.

- Item 4 Frontier S4 stitching + Y1: v095.css (generated block, SVG background layers so they don't scroll; UI chrome only,
  NO map stitching per user). body gets class `sk-<theme>` (main.js applyBodyClass). Y1 colours patched in
  web/public/styles/west_light.json + tools/genstyles.py + navcard MAPBASE0. Shots: screenshots/v095/frontier/.

## Next (not started)
- 2 pack system: extend `web/src/skins.js` (existing roadglow-skin/1, IndexedDB) → roadglow-pack/2 with type skin|voice,
  minAppVersion, sha256, css theme, zip (fflate), catalog `public/packs/index.json`, screen 皮肤与语音包, share intent.
- 3 new skins space/nord/tac: plan = derive map styles from neon_*.json layer ids recoloured with PAL in
  `screenshots/newskins/src/style.js`; UI via body class family `west` + `sk-<id>` token overrides in v095.css;
  UI fonts subset with pyftsubset from /usr/share/fonts/truetype/sand-box/google (OFL), lazy FontFace per skin.
  Map label glyphs: Rajdhani (space/tac) and IM FELL (nord) — same as mockup generator; CJK via localIdeographFontFamily.
- 4 Frontier stitching S4 + Y1 light palette.
- 5 audit (tools/audit093.py pattern), 6 perf (tools/perf093.py; baseline 0.9.4 not yet measured), 7 release v0.9.5 + Beijing.

## Notes
- Dev server: `npx vite --port 18785 --strictPort` in web/ (18781/18782 are used by other agents' servers).
