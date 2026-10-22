# 分久必合 / Three Kingdoms skin pack — progress (branch wip/ink)

Resume from here if interrupted. Design source of truth: screenshots/mockups/ink/v4 (+ src4 generators).

## Plan / status
- [x] Engine 0.9.6 (web bundle only, no native change): pack string overrides (`strings.zh.{t,L,dir,units}`), classical units
      (步/里/刻/时辰), pack puck image (`skin.puck`), `skin.fx:["scroll"]` → html.fx-scroll + src/scrollfx.js (unroll/roll-up hook),
      html[data-lang].
- [x] Asset generator web/packsrc/sanguo/genink.py → out/ (scroll nine-slice w/o pale seams, rods, blobs, rider cut-out, horse puck, ink POI sprite)
- [ ] theme.css (all chrome), strings.json, map styles light/dark, fonts subset + OFL
- [ ] genpacks.mjs entry + catalog, version bump 0.9.6, build, deploy
- [ ] screenshots/ink_pack, perf, overlap check
