# v0.9.11 car-screen mockups — NOT Android Auto screenshots

These are **browser mockups**, not captures from Android Auto, the DHU or a car (no DHU/emulator could run on the build box:
no `/dev/kvm` permission, DHU binary lacks `libc++.so.1`, no phone attached).

How they are made (`web/tools/car/preview/`):
- **Map**: the real exported car style (`export_v0910.mjs` → `carex/<skin>/<mode>.json`, same `src/car.js carExport` the app uses)
  rendered by MapLibre GL JS 4.7.1 in headless Chrome (SwiftShader).
- **Panel geometry**: `layouts.json`, produced by the real `CarLayout.java` (`DumpLayouts.java`) — panel rect, text sizes,
  camera padding, "me" position. Camera padding is applied to the browser map, the dot is drawn at `meX/meY`.
- **Panel look**: `panels.json` from the real `carPanelSpec()` on the real packs (`export_v0911.mjs`), fonts = the bundled
  car TTFs (`android/app/src/car/assets/carfonts`), drawn on a canvas with the same steps as `PanelView.java`.
  The maneuver arrow is an approximation of `Icons.arrow("right")`.
- **Host chrome** (round buttons top-right = action strip, bottom-right = map buttons; striped area = media/messages
  card in the split layout) is a neutral placeholder; Android Auto draws those itself.

Files: `<layout>_<skin>_<light|dark>_<map|nav>.png`
- `full`  1920×720, density 2, whole surface visible → WIDE layout
- `split` 1920×720 surface, visible area 1280 px (Coolwalk: right third = host cards) → SPLIT layout
- `small` 800×480, density 1 → SPLIT (an 800×480 at density 2 is NARROW: panel on top — covered by unit tests, not rendered)

`render_log.txt`: per image, timeouts, missing sprite images, text running into the panel padding, "me" under panel (all 0).
