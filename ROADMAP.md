# RoadGlow roadmap — Google-Maps-like features with legally free data

Status: ✅ done (web v0.2) · 🟡 partial · ⏳ planned · ❌ not feasible free. No ratings/reviews (by design).

| Feature | Free data / service | Status | Limits / notes |
|---|---|---|---|
| Vector basemap, 2 original styles × light/dark | OpenFreeMap (OpenMapTiles schema) | ✅ | Free, no key, no SLA |
| POI icons + clickable POIs | OSM via OpenFreeMap `poi` layer, own SVG sprites | ✅ | Tile POIs ranked/thinned by tile generator |
| Place card: address, hours (open now), phone, website, wheelchair | Overpass (overpass-api.de → kumi → private.coffee) | ✅ | ~10k req/day, 1–2 concurrent per IP per server |
| Photos | Wikimedia Commons via `wikimedia_commons`/`wikidata`/`image` tags | 🟡 | Only where tagged |
| Search / autocomplete / addresses | Photon (komoot) + Nominatim fallback | ✅ | Photon fair use; Nominatim ≤1 req/s, no autocomplete use |
| City of Edmonton address points (fallback) | data.edmonton.ca "Address Points" (Open Government Licence – Edmonton) | ⏳ | Only if OSM gaps found; would need own index (e.g. static Pagefind/Photon import) |
| Category chips / explore nearby | Overpass | ✅ | Same as Overpass |
| What's here / dropped pin / reverse geocode | Photon reverse | ✅ | |
| Share place link | URL params | ✅ | |
| Saved places, recents, lists, labels | localStorage (later: export/import JSON, optional WebDAV) | 🟡 | lists/labels ⏳ |
| Driving / walking directions, alternatives, turn list | FOSSGIS OSRM (routing.openstreetmap.de) | ✅ | Fair use, no SLA, no traffic |
| Turn-by-turn nav, voice, reroute, follow/heading-up, recenter | Browser Geolocation + SpeechSynthesis | ✅ web (foreground tab only) | Background on web impossible; native app for lock-screen |
| Cycling | OSRM `routed-bike`, BRouter, Valhalla (public demo) | ⏳ | Valhalla demo is fair-use |
| Multi-stop, avoid tolls/highways/ferries | Valhalla / GraphHopper (self-host) or OSRM `exclude` (where enabled) | ⏳ | FOSSGIS OSRM has limited excludes |
| Departure/arrival time, ETA | ETA from route ✅; time-dependent only for transit | 🟡 | |
| Transit (incl. ETS Edmonton), realtime | Transitous (MOTIS) API; ETS GTFS + GTFS-RT (City of Edmonton open data) | ⏳ | Transitous fair use; check ETS feed licence (OGL-Edmonton) |
| Ferries | OSM `route=ferry` in OSRM car/foot; Transitous for scheduled | 🟡 | |
| Live traffic | — | ❌ | No free legal live-traffic source in Canada; OSM has none |
| Speed limits | OSM `maxspeed` (OSRM annotations / Overpass) | ⏳ | Coverage varies |
| Lane guidance | OSM `turn:lanes` (OSRM returns `intersections.lanes`) | ⏳ | |
| Terrain / hillshade / 3D buildings | Mapterhorn / AWS Terrain Tiles (Terrarium, open); building heights from OMT | ⏳ | |
| Satellite imagery | EOX Sentinel-2 cloudless (CC BY-NC-SA 4.0, OK for personal non-commercial); Esri World Imagery (ToS restrictive — avoid) | ⏳ | Non-commercial only |
| Street-level imagery | Panoramax (open), Mapillary (CC-BY-SA, free API key) | ⏳ | |
| Indoor maps | OSM indoor= (sparse) | ⏳ low priority | |
| Measure distance, coordinates, plus codes, compass | Client-side (open-location-code lib, Apache-2.0) | 🟡 compass/coords ✅ | |
| Elevation profile | Open-Meteo Elevation API / terrain tiles | ⏳ | Open-Meteo: 10k calls/day non-commercial |
| Weather / air quality | Open-Meteo (forecast + air-quality) | ⏳ | 10k/day non-commercial |
| EV charging | OSM `amenity=charging_station` ✅ chip; Open Charge Map API (free key) | 🟡 | |
| Parking | OSM `amenity=parking` | ✅ chip | |
| Wheelchair accessibility | OSM `wheelchair=*` | 🟡 shown in card | |
| Timeline (location history) | Local-only (IndexedDB / on-device) | ⏳ | never uploaded |
| Share live location / ETA | Needs relay (self-host or ntfy.sh) | ⏳ | |
| Offline maps | Protomaps PMTiles extracts per region + offline glyphs/sprites | ⏳ (menu placeholder) | Build extracts from planet (ODbL) |
| Android/iOS apps, Android Auto/CarPlay | Flutter + MapLibre Native (code in /lib, paused) | 🟡 | Phase after web review |
