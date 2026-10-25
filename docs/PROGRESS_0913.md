# RoadGlow 0.9.13 (versionCode 9130): progress and honest status

## Address search is now systemic, not a Coalbanks special case
**Root cause.** OpenStreetMap is missing many Canadian house numbers, and Photon matches fuzzily. The old pipeline returned street-level results, or the wrong numbered street ("7 st s" → 5 Street S).

**New pipeline** (`web/src/geoaddr.js`, `ac.js`, `addr.js`). Steps run in order until one gives an exact hit:
1. Offline municipal index (Edmonton plus a new Lethbridge index).
2. Photon, with the raw and the expanded query.
3. Nominatim structured search.
4. geocoder.ca, only as a last resort.
5. If none of these finds the house number, the result is honestly labelled **"street only"**.

**Parser.** Handles house number, unit (`12-345`, `Apt 4`), N/S/E/W/NW…, abbreviations, ordinals, city, province and postcode. Matching is strict: the name, street type and direction must all agree.

### Before/after (same machine, real search box, final ranking 3 s after the last key)
| Query | 0.9.12 | 0.9.13 |
|---|---|---|
| 1581 coalbanks blvd w, lethbridge | street only | exact, ~125 ms |
| Superstore | Real Canadian Superstore at #6 | #1 |
| Superstore Lethbridge AB | Flooring Superstore #1 | Real Canadian Superstore #1 |
| timmies | no result | Tim Hortons |
| 8770 170 st nw edmonton | fail | exact, ~340 ms |
| 800 robson st vancouver | fail | exact, ~340 ms |
| 1 dundas st w toronto | fail | still fails in the browser (geocoder.ca returned HTTP 429 after heavy testing; the Node live test found it before the throttle) |

### Tests
- `tools/geoaddr.test.mjs`: 13 parse cases and 6 match cases.
- `tools/geoaddr.live.mjs`: live, 9 addresses. 6 were exact (Coalbanks within 5 m, Edmonton, Toronto, Vancouver, Montréal, Ottawa). 3 were street-only (301 7 St S, Kensington Rd Calgary, Regina).
- `tools/addrtest_yql.cjs`: Lethbridge offline index, 46/46, including reverse lookup within 2.4 m.
- `tools/searche2e.cjs`: end-to-end ranking test.

**Known limits.** geocoder.ca is free but throttled (about 2 requests per second, HTTP 429). Addresses missing from all open data stay street-only.

## Item 10: draggable quick-button island (`web/src/island.js`)
- Long-press about 0.9 s, then drag. A short press does nothing.
- The position is saved as fractions of the screen and restored after reload.
- It avoids the nav banner and footer, the top bar, the place panel, the layers popup and the area pill. It re-solves on resize and DOM changes.
- When nothing fits, for example with the nav card at 1.5×, it takes the tallest free gap and shrinks (`#controls` scrolls).
- It respects safe-area insets.
- It is shared UI, so it applies to every skin and pack.

**Tests.**
- `tools/island.test.mjs`: 4 cases on the pure `solve()` function.
- `tools/island_e2e.py` (headless Chrome), real results:
  - Start position: [336,150].
  - A short press didn't move it.
  - Hold-and-drag moved it to [86,400], and the position was stored.
  - After reload it was still at [86,400].
  - Screenshot: `screenshots/v0913/island_dragged.png`.

## UI audit (`tools/audit0913.py`)
Covered west and sanguo, dark and light, at nav-card scales 1 and 1.5, across these surfaces: home, history, address search, layers, place card, 4 drawer views and nav.
- **Island overlap:** none.
- **Weather icon clipped in the place card row:** fixed with `min-width: max-content`.
- **Remaining flags are expected:**
  - `#chips` is a horizontal scroller with an edge bleed.
  - The closed drawer sits offscreen.
- **Not covered:** the full audit of every theme and pack was not finished in this pass.

## Builds
- APK: `RoadGlow-0.9.13.apk`, standard flavor. Signed with the same certificate as 0.9.11 (SHA-256 7d6bebe1…), so it upgrades in place.
- Play AAB: `RoadGlow-0.9.13-play.aab`, versionCode 9130.
- `keys/` is git-ignored and not committed.

## Not done / not tested — honest
- **Nothing was tested on a real phone** (vivo X90s): no long-press feel, no GPS, no Android Auto.
- **Route-preview restyle not done.** The planned look was a thick white-cased selected route, muted alternatives and a time bubble on the line. It is deferred.
- **No full simulated-nav visual pass** in this release. The smooth-follow and route-trim code is covered by `navgeo.test.mjs` only.
- **No parity with Google Maps or Waze is claimed.** Search coverage depends on free open data. There is no traffic data, and lanes only show where OSRM has them.
