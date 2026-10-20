# RoadGlow

A personal, Google-Maps-style map & navigation app built only on free and open data, with two original map styles (neon city / frontier ink), each in light and dark.

- **Web** (`web/`): Vite + MapLibre GL JS. Live: GitHub Pages (see repo About).
- **Mobile** (`lib/`, `android/`, `ios/`): Flutter + MapLibre Native (paused while the web version is iterated).
- Feature plan and free data sources: [ROADMAP.md](ROADMAP.md).

## Develop
```
cd web && npm ci && npm run dev      # http://127.0.0.1:18780
npm run build                        # -> web/dist (static, relative base)
python3 tools/genstyles.py           # regenerate style JSONs (assets/styles -> copy to web/public/styles)
```

## Data & attribution
- Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, ODbL 1.0
- Vector tiles: [OpenFreeMap](https://openfreemap.org) (OpenMapTiles schema, © OpenMapTiles)
- Search: [Photon](https://photon.komoot.io) by komoot; [Nominatim](https://nominatim.org) (usage policy: ≤1 req/s)
- Place details / nearby: Nominatim lookup, [Overpass API](https://overpass-api.de) (and kumi.systems, private.coffee mirrors)
- Routing: [FOSSGIS OSRM](https://routing.openstreetmap.de)
- Photos: [Wikimedia Commons](https://commons.wikimedia.org) (per-file licences) via Wikidata
- Fonts: Rajdhani (Indian Type Foundry) and IM FELL English (Igino Marini), SIL Open Font License 1.1 (`fonts/`)
- POI icons, paper texture and map styles: original work for this project

All services are free, keyless and fair-use without SLA; this is a low-traffic personal project.

## License
Code: MIT (see LICENSE). Fonts: OFL 1.1. Map data: ODbL (OpenStreetMap).
