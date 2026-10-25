# Search audit: v0.9.15 (versionCode 9150)

Trigger: on the phone, typing `costco` near Lethbridge gave a sheet titled **COSTCO GAS** and showed 「搜索中…」 for about 6 s with no results, even though Costco was on screen.
Line numbers below refer to the **0.9.14** sources (commit 6a8275e).

## Pipeline (0.9.14)
- **Typing (`#q` input, main.js ~374–387):**
  - `AC.localSuggest` runs instantly (offline index plus tile POIs).
  - After a 180–220 ms debounce, `AC.suggest` sends Photon requests with a view box, a province box and the alias, plus geocoder.ca and Nominatim for addresses (ac.js / geoaddr.js).
  - `acPrefix()` puts a semantic or **chain entry** row ("显示所有「X」分店") at the top.
- **Enter (main.js:392):** picks `sugItems[0]` (or a semantic match), otherwise `nominatimSearch`.
- **Tapping a row:** goes through `pick()`, which opens `semanticSearch()` for sem/chain rows or `showPlace()` for a place.
- **`semanticSearch()` (main.js ~985–1024), when a category or chain is chosen:**
  1. Ease to zoom 13 when zoomed out further than 12.5.
  2. Run `Promise.all` over every Photon term (each with an 8 s timeout), **then** draw.
  3. Await Overpass: up to 3 mirrors, 8 s each, capped by an 11 s race.
  4. **Only if Overpass returned nothing**, wait for the Nominatim slot and query Nominatim.
  5. Final draw.

## Root causes
1. **The query was renamed from "costco" to "Costco Gas"** (main.js:411, the brand list at main.js:951).
   - `chainEntry()` took the *first* brand that equalled **or started with** the query, scanning brands in category order.
   - The gas category is listed before groceries, so `'Costco Gas'.startsWith('costco')` matched before the exact brand `'Costco'`.
   - The chain search then used the title "Costco Gas" and the name regex `/Costco Gas/`, which filtered out the warehouse, pharmacy, tire centre and food court.
   - Reproduced on the box with the 0.9.14 build: title `Costco Gas · 1`, a single row. Screenshot: `screenshots/v0915/before_0914_costco_enter.png`.
2. **Results were serialised, and the slowest source decided when anything appeared** (main.js:992–1020).
   - Nothing drew until *all* Photon terms finished. Each term has an 8 s timeout (services.js:8–19).
   - When Photon was empty or slow, the panel waited on Overpass.
   - Nominatim, which answers this query in about 0.35 s with all 5 Costco features, was only tried *after* Overpass failed.
3. **The Overpass mirrors are unreliable and were retried on every search** (services.js:61).
   - Probed from the box today: overpass-api.de returned **406**, and kumi.systems and private.coffee **hung for more than 15 s**.
   - Each search paid up to 8 s per mirror again, with no memory of which mirrors were dead.
   - This, together with cause 2, is the most likely source of the ~6 s 「搜索中…」 on the phone.
   - I could **not** reproduce the 6 s hang from the box, where Photon answers in about 0.5 s. The phone's network path wasn't measured.
4. **POIs already on screen were ignored until the network answered.** `semTiles()` (the features already rendered on the map) only ran inside `draw()`, which waited for Photon.
5. **Enter could act on a stale list** (main.js:392). Enter picked `sugItems[0]` from whatever dropdown was last painted, possibly for an earlier keystroke such as "cost". That raced the 180 ms debounce.

## Fixes in 0.9.15
- **`chainEntry`:**
  - An exact brand wins.
  - A prefix match is used only when all prefix hits share one family (`costc` → Costco, but `costco` is never → Costco Gas).
  - Aliases are honoured, e.g. superstore → Real Canadian Superstore.
  - Matching always uses **what the user typed**, as a word-start, case-insensitive regex. `costco`, `Costco` and `COSTCO` all list Costco, Costco Gasoline, Pharmacy, Tire Centre and Food Court.
- **`semanticSearch` is progressive:**
  - On-screen tile POIs paint at t≈0.
  - Each Photon term paints as it lands.
  - Chain searches add a nearby (≤60 km) Photon query, so a branch just off-screen is found.
  - Nominatim (bounded to the view) runs **in parallel**, not as a fallback.
  - Overpass is capped at 6 s.
  - A single 6 s abort signal bounds the whole search, and 「没有结果」 shows only after every source finished.
- **`overpass()`:**
  - Honours `totalMs` and an abort signal.
  - Skips mirrors that returned 4xx/5xx or timed out for 10 min. HTTP 429 doesn't mark a mirror dead.
  - Chain Overpass queries no longer use a JS-only `\b` regex (Overpass ERE doesn't support it).
- **Enter:** never answers from a list painted for a different query. Brand text runs the chain search; anything else runs a fresh search.

## Verification (box, headless Chrome, live APIs, zh UI, Frontier dark skin, view `#14/49.668/-112.80`)
Script: `web/tools/costco_e2e.cjs`.

| Query | Action | Title | First rows painted | Rows |
|---|---|---|---|---|
| costco | Enter | Costco · 5 | 129 ms | Gasoline, Tire Centre, Food Court, Pharmacy, Costco |
| Costco | tap row 1 | Costco · 5 | 136 ms | same |
| COSTCO | Enter | Costco · 5 | 148 ms | same |
| costc | Enter | Costco · 5 | 127 ms | same |
| superstore | Enter | Real Canadian Superstore · 2 | 268 ms | includes Real Canadian Superstore 1.3 km |
| 0.9.14 costco | Enter | **Costco Gas · 1** | n/a | Gasoline only |

The existing node tests pass: geoaddr, island, navgeo, search0914.

## Google Maps behaviour used as a checklist (behavioural reference only)
- "costco" zoomed on Lethbridge should list the warehouse plus its gas station and departments.
- The title should be the user's query or brand, never a sub-brand.
- Results should come from the view first, then nearby.
- Pins and the list should appear within about a second.
- Enter on free text should run a search, not open some stale suggestion.

## Remaining gaps / honest notes
- **Not tested on a phone or a real mobile network.** All timings above are from the box.
- The draw order isn't fully relevance-sorted: rows are sorted by distance, so Costco Gasoline is listed above the warehouse. Google would put the main warehouse first.
- The list still re-renders on every source arrival, which can cause a small scroll jump.
- Overpass is effectively down from here. Results depend on Photon and Nominatim (free, fair-use; Nominatim allows 1 request/s).
- Typeahead (`AC.suggest`) wasn't restructured in this pass; only its chain row and the Enter race were fixed.
