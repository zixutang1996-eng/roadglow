# Android Auto (v0.9.8) — progress checkpoint
- [x] Car App Library 1.7.0 service (navigation category), NavScreen (NavigationTemplate), Search → PlaceListNavigationTemplate, map action strip (zoom ±, recenter, pan)
- [x] Map on the car Surface: VirtualDisplay + Presentation + MapLibre Native 13.7.1, style pushed from the phone (active skin, light/dark)
- [x] Bridge: CarBridgePlugin / CarState ⇄ web/src/car.js (style, position, nav step/ETA/route, car destination → phone starts navigation)
- [x] Text: system language; ink skin uses classical Chinese (CarText.java)
- [x] Builds: standard release 0.9.8 (9080), aaos debug (emulator test flavour)
- [ ] Emulator test + screenshots (screenshots/car/)
- [ ] Publish 0.9.8 as latest, merge to main

## Checkpoint 2026-10-22 20:55 (America/Regina)
- AAOS emulator (aaos34, -accel off/TCG) boot-loops: CarServiceHelper did not connect -> system_server restarts. KVM hangs. No emulator test possible on this box.
- wip/car merged to main (e8940f1); release v0.9.8 published as latest (RoadGlow.apk, 32,340,990 B, HTTP 200).
- Remaining: browser-rendered car-layout preview screenshots (clearly labelled mock), docs.
- 21:05: 16 preview mocks in screenshots/car/ (see README there). Status: shipped in 0.9.8; car UI unverified on real hardware.

## Installing on Android Auto (sideloaded APK)
1. Install RoadGlow.apk from the v0.9.8 release.
2. Android Auto settings → tap "Version" 10× → developer mode on.
3. ⋮ → Developer settings → enable "Unknown sources".
4. Connect to the car / DHU; RoadGlow appears in the launcher. Start nav on the phone (or search in the car).

## 0.9.10 — car screen follows any skin incl. downloaded packs (2026-10-23)
- Web `src/car.js`: `carExport()` builds light+dark car styles via `main.js carStyleFor(mode)` (pack `modes.<m>.car` if present,
  else the pack's map style; built-ins: their own style). Page URLs → `{WEB}/`, embedded pack sprite → `{CAR}/sprite_<m>` +
  exported json/png (root cause of the missing ink icons in 0.9.8: pack sprites only lived in a JS cache). Sent with
  `CarBridge.setSkin` on style.load (deduped). `setStyle` (legacy) still sent → 0.9.8/0.9.9 natives keep working;
  if `setSkin` is unimplemented the web stops calling it. minNative unchanged.
- Native `CarSkinStore`: validates (v8, sources, every layer source exists), writes atomically to `files/car/skin/`,
  resolves `{CAR}`/`{WEB}` (live-update dir if active, else `asset://public/`). CarMap: file style → legacy in-memory → `car_default.json`.
  Day/night: phone mode light/dark, or the car's own `isDarkMode()` when the phone is on auto (Session.onCarConfigurationChanged → restyle).
  Meta (skin, ink, route colours) persisted → car works without opening the phone UI.
- Tests: `node --test web/tools/car/test_export.mjs` (6 pass), JVM `CarSkinStoreTest` (2 pass). Previews: `screenshots/car/v0910/` (MOCK).
- Not tested: real Android Auto/DHU (emulator: no KVM permission on the box), on-device file writes.
- 0.9.10 / versionCode 9100.

## 0.9.11 — skinned car panel + split/narrow layouts (2026-10-23)
- Nav card / floating map actions use per-skin CarColor + CarIcon tints; skinned turn-by-turn panel drawn on the map Surface (pack `modes.<m>.carPanel`, phone toggle falls back to standard card).
- Layouts: full-width, split (Coolwalk ~2/3) and narrow via CarLayout; route ahead kept clear of the panel.
- Fixes: CarSkinStore crash on API 24–25 (Files.readAllBytes), MapLibre touched off UI thread in setPins, Photon UTF-8 split decoding, cssVars data-URL truncation (sanguo frame), permission/notification prompts, offline/timeout message in search.
- Tested: 20 JVM unit tests, 27 node tests, lint 0 errors (standard variant), 48 mockup PNGs (screenshots/car/v0911, mockups not real AA).
- NOT tested: DHU (fails to start on box), real car, Robolectric, aaos lint. Known gap: no native route preview (pick → start on phone).
