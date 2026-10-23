# iOS + CarPlay guide (for @95chang)

Welcome! This doc explains how RoadGlow is laid out and what's needed to ship
an iOS build and, later, CarPlay navigation. Tracking issue: "iOS + CarPlay
compatibility".

## Repo layout
| Path | What |
|---|---|
| `web/` | **The main app.** Vite + MapLibre GL JS. All features (search, place details, routing incl. ferries, turn-by-turn, offline packs, skins) live in `web/src`. |
| `web/android/` | Capacitor 8 Android shell that wraps `web/dist`. This is what ships as the APK. Native bits are small plugins; web code talks to them through `web/src/native.js`. |
| `web/packsrc/`, `web/tools/` | Skin/voice pack sources and build scripts (sprites, skins, packs, manifest). |
| `web/dist-*` | Province/city offline editions (Beijing, Shandong, Shaanxi). |
| `lib/`, `android/`, `ios/` (repo root) | Older **Flutter + MapLibre Native** prototype. Paused; not what ships. |
| `docs/` | Android notes (`ANDROID.md`), packs (`PACKS.md`, `SKIN_PLUGINS.md`), progress/release notes. |
| `tools/` | Style generator (`genstyles.py`) and misc scripts. |

## Build & run
```bash
cd web
npm ci
npm run dev        # http://127.0.0.1:18780 in a desktop browser
npm run build      # sprites + skins + packs + vite -> web/dist
npx cap sync android && (cd android && ./gradlew assembleStandardDebug)
```
Needs Node 22+. Android needs JDK 21 + Android SDK 36. See `docs/ANDROID.md`.

## iOS options
### A. Capacitor wrapper of the web app (recommended first step)
- `cd web && npm i @capacitor/ios && npx cap add ios` creates `web/ios/` (Xcode project). Commit it.
- Same web code as Android; most plugins we use (`geolocation`, `filesystem`,
  `preferences`, `local-notifications`, `text-to-speech`, `keep-awake`,
  `background-geolocation`) have iOS implementations. Check each one.
- Things to handle on iOS: `Info.plist` location strings
  (`NSLocationWhenInUseUsageDescription`, `NSLocationAlwaysAndWhenInUseUsageDescription`),
  `UIBackgroundModes` = `location` + `audio` for background navigation and voice,
  WKWebView storage limits for offline packs (use the Filesystem plugin, not IndexedDB, for big packs),
  safe-area insets, and the Android-only native plugins (`ApkUpdater`, `LocationEnabler`)
  which must be no-ops on iOS. The in-app APK updater must be hidden on iOS.
- Pros: fast, one codebase. Cons: CarPlay templates are native, so CarPlay still needs Swift code.

### B. MapLibre Native iOS (native rewrite)
- Native Swift/SwiftUI app using [MapLibre Native iOS](https://github.com/maplibre/maplibre-native).
  Same style JSONs (`web/public/styles`) and tile sources can be reused.
- Pros: best performance, natural fit for CarPlay. Cons: re-implementing search,
  routing, navigation, packs and skins — large effort.

A hybrid is fine: Capacitor app for the phone UI, plus a native Swift CarPlay
scene (`CPTemplateApplicationScene`) that renders a MapLibre Native map and
reads route state from the JS side through a small Capacitor plugin.

## CarPlay
- Navigation apps need the **CarPlay Navigation entitlement**
  (`com.apple.developer.carplay-maps`). Request it from Apple via the CarPlay
  entitlement request form on developer.apple.com (requires a paid Apple
  Developer Program account). Approval isn't guaranteed and can take a while.
- Until approved you can develop with the CarPlay Simulator / Xcode's CarPlay
  window using a development profile once the entitlement is granted to the team.
- Use the CarPlay framework templates (`CPMapTemplate`, `CPNavigationSession`,
  `CPManeuver`, `CPSearchTemplate`, `CPListTemplate`). The map itself is drawn
  in the CarPlay window by the app (MapLibre Native), templates provide the controls.
- Keep CarPlay UI simple: Apple's guidelines limit custom UI; skins can only
  affect the map style, not the template chrome.
- Android Auto (Car App Library) is planned in parallel on the Android side; keep
  route/maneuver state in a shared, platform-neutral format (see `web/src`).

## Legal rules for the homage skins (must follow)
- Skins are **original homage styles** only. Never add any game's actual assets,
  screenshots, icons, logos, trademarks, proprietary fonts, or the game names
  in app names, UI text, store listings or file names visible to users.
- Only use open, commercially usable fonts (OFL etc.) and original artwork.
- Keep all data attributions in `NOTICE.md` visible in the app (OSM ODbL,
  Wikimedia per-file credits, City of Edmonton OGL, etc.).

## Secrets & signing
- **Never commit signing keys, certificates, provisioning profiles, keystore
  passwords or API tokens.** `keys/` is git-ignored; keep iOS certs/profiles
  in your own Keychain / Xcode account, not in the repo.
- If a token is needed (e.g. Mapillary), read it from a local, ignored config file.
