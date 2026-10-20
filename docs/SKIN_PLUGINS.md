# RoadGlow skin plugins / 皮肤插件 (`roadglow-skin/1`)

A skin pack is **pure data**: one MapLibre style per mode, an optional sprite sheet, and colour tokens.
No JavaScript or CSS from a pack is ever run, so a pack can't read your data or change app behaviour.
皮肤包只包含数据（地图样式 JSON、可选图标精灵图、颜色令牌），不会执行任何脚本或 CSS。

The built-in skins are packs too: `web/public/skins/neon/manifest.json` and `web/public/skins/west/manifest.json`.
The example pack **Blueprint** lives in `web/public/skins/blueprint/`. A single-file copy is in `blueprint.rgskin.json`.

## Install / 安装
Go to **Menu › Skin plugins & language › Skin plugins** (菜单 › 皮肤插件与语言), then pick one:
- **From URL** – paste an `https://…/manifest.json` (hosted pack, files relative to the manifest). Example:
  `https://zixutang1996-eng.github.io/roadglow/skins/blueprint/manifest.json`
- **From file** – pick a single-file pack (`*.rgskin.json`) where the styles (and sprites, if any) are inlined.

Every pack is validated before install. Installed packs are stored in IndexedDB on the device and work offline.
You can remove a pack with ✕. Choosing a built-in skin, or Neon / Frontier Ink in the style picker, switches back.

## Manifest
```jsonc
{
  "format": "roadglow-skin/1",          // required, exact
  "id": "blueprint",                    // required, 2–40 chars [a-z0-9-]; "neon"/"west" reserved
  "name": { "en": "Blueprint", "zh": "蓝图" },   // string or {en, zh}
  "version": "1.0.0",                   // semver
  "author": "Your name",
  "license": "CC0-1.0",                 // SPDX id
  "base": "neon",                       // UI chrome family: "neon" or "west" (buttons, panels, pins, fonts)
  "minApp": "0.9.2",                    // informative
  "description": { "en": "…", "zh": "…" },
  "modes": {
    "light": { "style": "light.json", "sprite": "sprite_light" },   // sprite optional
    "dark":  { "style": "dark.json" }                               // one mode may be missing → the other is used
  },
  "tokens": {
    "light": {
      "bg": "#f3e7cb", "fg": "#22160b", "muted": "#4a3520", "accent": "#7c2e22", "chip": "#f0e2c2", "line": "#b89d70",
      "route": "#d9480f",               // route line colour
      "themeColor": "#16407a",          // Android/browser bar colour
      "navCard": {                      // navigation card defaults for this skin ("Skin default" in settings)
        "bg": "#16407a", "fg": "#ffffff", // card background / text (text is auto-fixed to ≥ 4.5:1)
        "swapBg": "#ecf4ff",            // background used when the user picks "Swapped"
        "mapBase": "#9fb6d6",           // map colour under the card (contrast is checked on the blended colour)
        "opacity": 1, "scale": 1        // 0.6–1, 0.7–1.5 (the user's own settings override these)
      }
    },
    "dark": { "…": "same keys" }
  }
}
```
All colours must be `#rrggbb`. Every token is optional.

### Style (`modes.*.style`)
- A MapLibre **v8** style: `version: 8`, plus `sources` and `layers`.
- **Sources must be `https`.** The built-in styles use OpenFreeMap, which is free with no key; copy their `sources` block.
- **Fonts:** only the bundled glyph fonts work: `IM FELL English Italic`, `IM FELL English Regular`, `Rajdhani Bold`, `Rajdhani SemiBold`.
  Any other font gets replaced with a warning. Chinese labels use the system CJK font automatically.
- `glyphs` is set by the app. Label languages (zh/en) are applied by the app as well.
- The easiest start is to copy `web/public/styles/neon_dark.json` (or `west_light.json`) and recolour it.

### Sprite (optional)
- **Hosted pack:** `"sprite": "sprite_light"` loads `sprite_light.json` + `sprite_light.png`, the standard MapLibre sprite format.
- **Single-file pack:** `"sprite": { "json": {…}, "png": "data:image/png;base64,…" }`.
- No sprite → the icons of the `base` family are used, which is what Blueprint does. The icon names the app uses are the ones in `web/public/sprites/neon_dark.json`.

## Validation & safety
- Max 8 MB per pack.
- Reasons for rejection: wrong `format`, bad `id`/`version`, missing `name`/`author`/`license`, bad `base`, non-v8 style, non-https sources, malformed colours or sprite.
- Text colours with contrast below 4.5:1 against `bg` are auto-corrected, and you get a warning.
- No code or CSS is accepted. Pack textures are intentionally not supported in format 1.

## Navigation card settings (all skins)
Find these under **Menu › Navigation card**:
- **Size:** 70–150 %, multiplied by your text size and capped so the card never fills the screen.
- **Colour:** Skin default / Swapped / Parchment / Ink / Sepia / Night / Neon teal / Paper.
- **Opacity:** 60–100 %.

The text colour is picked automatically so it keeps ≥ 4.5:1 contrast against the card blended over the map.

## Making a pack quickly
`node web/tools/genskins.mjs` shows how Blueprint is generated: it recolours every `*-color` paint value of the Neon styles.
Host the folder anywhere with HTTPS and CORS (GitHub Pages works), then paste the manifest URL into the app.
