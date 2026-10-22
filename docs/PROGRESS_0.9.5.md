# RoadGlow 0.9.5 progress (branch wip/0.9.5, base d9b72b4 = v0.9.4)

## Done
- Item 1 chip shadows: cause = `#chips` is an `overflow-x:auto` scroller with 4px bottom padding, so every chip's
  box-shadow/drop-shadow was clipped into one flat band. Fix in `web/src/v095.css` (imported after v093.css in main.js):
  padding 6/14/20 + equal negative margins. Verified in 4 variants (Playwright, desktop Chrome, 461x1024):
  `screenshots/v095/item1_chip_shadows_4skins.png`.

- Item 4 Frontier S4 stitching + Y1: v095.css (generated block, SVG background layers so they don't scroll; UI chrome only,
  NO map stitching per user). body gets class `sk-<theme>` (main.js applyBodyClass). Y1 colours patched in
  web/public/styles/west_light.json + tools/genstyles.py + navcard MAPBASE0. Shots: screenshots/v095/frontier/.

- Item 3 new skins (mostly done, needs audit polish): THEMES/FAM in main.js (body class `west sk-<id>`), map styles from
  `web/tools/gennewskins.mjs` (+ newskin_pal.mjs) → public/styles/{space,nord,tac}_{light,dark}.json (tac has hidden `bld3d`
  extrusion toggled in nav.js with body.navon). UI in v095.css section 3 (tokens, shapes, close ✕, dividers, emblems
  public/orn/{emblem_space,emblem_nord,operator_tac}.svg, #skinfx overlay, #cbar compass bar). Fonts public/fonts/*-var/500..woff2
  (OFL, LICENSES-v095.txt), lazy via loadSkinFonts(). Puck per skin in puckSvg(). previews/*.png cropped from mockups.
  Shots: web/tools/shots095.py <skin_mode,...> <map,drawer,search,layers,place,nav> → screenshots/v095/<skin>/.

- Item 2 packs: web/src/packs.js (roadglow-pack/1, fflate zip, SHA-256, CSS sanitiser, voice store), skins.js
  (BUILTIN 5 themes, installObject, applyPackCss), voice.js (clips + pack phrases), main.js tools.packs screen + drawer
  entry + 'rgPackFile' event; Android VIEW/SEND intent filters + MainActivity.handlePack. Catalog generator
  web/tools/genpacks.mjs → public/packs/index.json + blueprint-1.1.0.rgpack + calm-1.0.0.rgpack. Doc docs/PACKS.md.
  Tested in desktop Chrome: catalog install (hash ok), CSS applied, switch w/o reload, voice select, remove.

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
