# For Hunters / 猎人模式 — v0.9.16

## What shipped
- Drawer → 地图 / Map → **猎人模式 For Hunters** (separate row from 地图皮肤; skins untouched). UI follows system language (zh / en).
- Downloadable pack **Alberta Hunters v1.0.0** (`alberta-hunters-1.0.0.json.gz`, 2.0 MB gzip / 8.9 MB JSON, SHA-256 `c3bde4e6…caab61`).
  - Hosted on GitHub Pages (`/roadglow/hunt/`, CORS `*`) and attached to the v0.9.16 release. **Not bundled in the APK** (`npm run android` strips `dist/hunt`).
  - Stored in IndexedDB (`rg-hunt`), SHA-256 verified, works offline after download. Delete button in the panel.
- Overlays: MapLibre GeoJSON sources (geojson-vt in the worker) under the label layers; re-applied after every skin / day-night style switch.
- Tap the map (no POI hit) with the mode on → "此处所在区域 / Zones here" panel listing every zone at that point.
- Disclaimer (not legal advice; WMU ≠ permission; private land / reserves / DND / parks) + "Contains information licensed under the Open Government Licence – Alberta" with link, in the panel and in every identify popup.

## Layers (all Government of Alberta, geospatial.alberta.ca, OGL–Alberta)
| id | layer | features | default |
|---|---|---|---|
| wmu | Wildlife Management Units (code + name) | 199 | on |
| gwa | Green Area / White Area | 39 | on |
| pluz | Public Land Use Zones | 61 | on |
| plra | Public Land Recreation Areas | 64 | off |
| rmfr | Rocky Mountains Forest Reserve | 4 | off |
| eslu | Eastern Slopes land-use zoning | 1015 | off |
| parks | Parks & protected areas | 469 | on |
| ir / metis | First Nations reserves / Métis Settlements (recaccess) | 728 / 10 | on |
| dnd + dndb | DND Air Weapons Range + military bases (recaccess) | 1 + 27 | on |
| graze | Recreational-access grazing leases | 7053 | off |

Geometry simplified server-side (`maxAllowableOffset` 0.0002–0.0015°, ≈20–150 m) and rounded to 5 decimals. Rebuild: `python3 tools/hunters/build_pack.py 1.0.1` (≈3 min), then update `PACK` in `web/src/hunters.js`.

## Verified on the box (headless Chrome, swiftshader, 390×844) — `web/tools/hunters_e2e.cjs`
- Drawer entry → panel → Download: download + gunzip + parse ≈ 0.35 s (local file served via interception, not over the network).
- Lethbridge z9 (49.67, -112.83): WMU 108/110/130 boundaries + labels, Blood reserve, White Area visible; rAF 60/s while idle.
- Tap → "WMU 110 · Brocket / White Area". zh and en both checked. Screenshots: `screenshots/v0916/`.
- APK 0.9.16 (versionCode 9160) signed with the same cert as 0.9.15 (SHA-256 7d6bebe1…dcc0); APK contains no hunt data.

## Not tested
- Not on a phone: real download over mobile data, pan/zoom smoothness on device GPU, the Android WebView with all 12 layers on.
- Car screen (Android Auto) does not show the overlays.

## Gaps / follow-ups
- No complete "all Crown Land parcels" layer exists as open data; Green Area is the closest proxy. White Area still contains Crown parcels that aren't drawn.
- AltaLIS Base Features (needs registration) not used. Crown reservations (`cadastre/crownland_reservation`) left out: reservations ≠ access.
- Hunting seasons / draw / regs per WMU not included (only boundaries). Other provinces not included.
