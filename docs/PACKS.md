# RoadGlow packs (`roadglow-pack/1`, app 0.9.5+)

Skin packs and voice packs install at runtime: no APK update and no restart. They are **data only**: MapLibre
style JSON, sanitised CSS, images, audio and TTS parameters. No script ever runs.

## Container
- `.rgpack` is a zip holding `pack.json` plus the files it references, **or**
- a single `pack.json` with everything inlined.
- Limit: 12 MB. Voice packs are stored in localStorage, so recorded clips should total about 4 MB or less.

## pack.json
```jsonc
{
  "format": "roadglow-pack/1",
  "type": "skin",                      // "skin" | "voice"
  "id": "blueprint",                   // a-z 0-9 -, 2–40 chars; unique per type
  "name": { "zh": "蓝图", "en": "Blueprint" },
  "version": "1.1.0",                  // semver; a higher catalog version shows 更新
  "minAppVersion": "0.9.5",            // older apps refuse to install it
  "author": "…", "license": "CC0-1.0",
  "description": { "zh": "…", "en": "…" },
  "files": { "light.json": "<sha256 hex>", "theme.css": "<sha256 hex>" },   // every zip member is hash-checked
  "skin": {
    "base": "neon",                    // UI chrome family: neon | west | space | nord | tac
    "modes": {
      "light": { "style": "light.json", "sprite": "icons_light", "css": "light.css" },  // sprite → icons_light.json + .png
      "dark":  { "style": "dark.json" } // a missing style falls back to the base skin's own map style
    },
    "css": "theme.css",                // optional theme CSS; scope it to body.pk-<id>
    "tokens": { "light": { "route": "#d9480f", "themeColor": "#16407a", "accent": "#16407a",
                           "navCard": { "bg": "#16407a", "fg": "#ffffff" } }, "dark": { } }
  },
  "voice": {                           // type "voice"
    "tts": { "rate": 0.92, "pitch": 0.96 },              // device TTS parameters (0.5–2)
    "phrases": { "zh": { "left": ["左转"], "in": "{dist}后，{what}" }, "en": { } },  // keys as in src/voice.js
    "clips": { "zh.arrive": "clips/arrive_zh.mp3", "left": "clips/left.mp3" }        // optional recorded audio
  }
}
```

### Rules
- **CSS** is sanitised at install. These are removed: `@import`, `expression()`, `javascript:`, and any `url()`
  that isn't a file inside the pack or an image/font `data:` URI.
- **Map sources** must use https. Label fonts must be bundled glyph stacks; any other font is replaced.
- **Text contrast** below 4.5:1 is corrected automatically.

## Catalog: `packs/index.json`
The catalog is served next to the web app on GitHub Pages, so it arrives through the live-update path.
```json
{ "format": "roadglow-catalog/1", "packs": [
  { "type": "skin", "id": "blueprint", "name": {"zh":"蓝图","en":"Blueprint"}, "version": "1.1.0",
    "minAppVersion": "0.9.5", "url": "blueprint-1.1.0.rgpack", "sha256": "<sha256 of the .rgpack>", "size": 12345 },
  { "type": "skin", "id": "builtin-space", "base": "space", "builtin": true, "name": {"zh":"深空","en":"Deep Space"}, "version": "0.9.5" }
] }
```
- The built-in skins are listed in the same catalog, so the 皮肤与语音包 screen shows one list.
- The app refuses a download whose SHA-256 doesn't match the catalog.
- To publish a pack:
  1. Add it to `web/tools/genpacks.mjs`, or drop the file into `web/public/packs/` and add an entry.
  2. Push to main. Pages deploys it, and every app sees it the next time 皮肤与语音包 is opened.

## Installing
- **In the app:** Menu → 皮肤与语音包. The screen has install, update, use and remove, plus 从文件安装 for a local `.rgpack` or `.json` file.
- **Android:** open or share a `.rgpack`, `.zip` or `.json` file with RoadGlow. The file goes through the same validation and hash checks.
- **The older `roadglow-skin/1` format** (0.9.2) is still accepted.

## 0.9.6 additions (used by 分久必合 / Three Kingdoms)
- `strings` (top level, file or object): Chinese UI wording overrides, applied only when the UI language is Chinese.
  `{"zh": {"t": {<i18n key>: "…"}, "L": {"<original Chinese string>": "…"}, "dir": {"left": "左折", …, "cont": "前行"}, "units": "classical"}}`.
  Values are plain text (only `<p>` is kept); `units:"classical"` shows distances in 步/里 and durations in 刻/时辰.
- `skin.puck`: `{ "light": "horse_light.png", "dark": "horse_dark.png" }` replaces the "me" marker (64 css px, rotates with heading).
- `skin.fx: ["scroll"]`: sets `<html class="fx-scroll">`; the engine (src/scrollfx.js) then measures a window once when it opens
  (`--rh`) and adds `.rg-unroll` / `.rg-rollup` so pack CSS can animate open and close (transform/opacity/clip-path only).
  `prefers-reduced-motion` disables it.
- `html[data-lang=zh|en]` is available to pack CSS. Background-pattern images from a pack sprite now load.
- Packs with these fields should set `"minAppVersion": "0.9.6"`.

## Car screen (Android Auto, app 0.9.10+)
The car map follows the phone's active skin automatically, downloaded packs included: on every skin / day-night change
the app exports the pack's light + dark styles **and its sprite sheet** to app storage, and the car loads them from there
(offline; glyphs/base sprites come from the bundled web assets). Nothing is required from pack authors.

Optional: `skin.modes.<mode>.car` — a separate MapLibre v8 style file (same rules as `style`: https sources, bundled
fonts only) used only on the car screen, e.g. bigger labels or fewer POIs for a 7–12" head unit:
```json
"modes": { "light": { "style": "light.json", "sprite": "icons_light", "car": "car_light.json" } }
```
Invalid `car` styles are dropped at install with a warning (the map style is used). Route line colour = `tokens.<mode>.route`.
