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
