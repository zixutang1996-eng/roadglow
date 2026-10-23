# Province offline editions (v0.9.7) — download links

| Edition | APK | Size | SHA-256 |
|---|---|---|---|
| 山东 Shandong | https://github.com/zixutang1996-eng/roadglow/releases/download/v0.9.7-shandong/RoadGlow-Shandong-0.9.7.apk | 158.3 MB (151 MiB) | 8adae91d5590f0ff6ef39534239cebac99cb649781198cd7058fd00e996deab6 |
| 陕西 Shaanxi | https://github.com/zixutang1996-eng/roadglow/releases/download/v0.9.7-shaanxi/RoadGlow-Shaanxi-0.9.7.apk | 162.5 MB (155 MiB) | fa145f44b05616446ebe0bc41176fe97b6c9823fea14bb9c4e4800b7ffed4397 |

Release pages: `v0.9.7-shandong`, `v0.9.7-shaanxi` (not marked latest). Both URLs returned HTTP 200 (2026-10-22).

- Base: main @ web 0.9.7, all skins. Signed with the same release key (cert SHA-256 7d6bebe1…). Package ids
  `com.personal.nav.roadglow.shandong` / `.shaanxi` (install side by side with the normal app).
- Coverage: the **whole province**, vector tiles z0–14 clipped to the Geofabrik province boundary (+0.01°);
  z15+ is overzoomed. Shandong 78,914 tiles, Shaanxi 73,668 tiles (OpenFreeMap planet 2026-10-18).
  z13–14 are packed into per-z10 bundles (APK zip limit is 65,535 entries).
- Offline search: OSM POIs for the whole province (Shandong ≈88k, Shaanxi ≈40k), offline approximate addresses
  (district / city / province).
- Offline walking routes: Jinan centre (116.85–117.20 E, 36.58–36.75 N) and Xi'an centre (108.82–109.10 E, 34.17–34.36 N) only.
- Driving routes need the online OSRM service (4 s timeout; may be unreachable in mainland China).
- No in-app update checker / live updates in these editions.
- Attribution: © OpenStreetMap contributors (ODbL) · OpenMapTiles · OpenFreeMap (shown on the map and in release notes).

Tested: web build in headless Chrome with all foreign hosts blocked (map at z8–16 in several cities, search, place
card, walking route, no page errors) — `web/tools/beijing/test_province.cjs`. See the emulator note in PROGRESS_CAR.md.
