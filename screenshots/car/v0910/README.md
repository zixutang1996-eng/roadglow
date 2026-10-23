# v0.9.10 car-screen previews — MOCKUPS

**These are not Android Auto / DHU screenshots.** No car host or emulator could run on the build box (no KVM access).
Each image is MapLibre GL JS in headless Chrome rendering the **actual exported car style files**, produced by
`src/car.js carExport()` from the real built-in style / real `.rgpack` data and laid out exactly as `CarSkinStore`
stores them on the phone (`light.json`, `dark.json`, `sprite_<mode>[@2x].json/png`). `{CAR}/` and `{WEB}/`
placeholders are resolved the same way the native loader does (pack dir / bundled web assets).
The maneuver card, ETA pill and +/−/◎ strip are an HTML overlay approximating the NavigationTemplate chrome.
Route colour comes from the exported meta (pack `tokens.<mode>.route`).

Skins: synthb 1.0.0, synthc 1.0.0, sanguo 1.1.1 (ink; icons now present), neon (built-in). × light/dark × map/nav.
`render_log.txt`: per image, MapLibre `styleimagemissing` ids (all empty = every POI icon resolved from the exported sprite).
Regenerate: `cd web/tools/car/preview && node export_v0910.mjs && node shot2.cjs`.
