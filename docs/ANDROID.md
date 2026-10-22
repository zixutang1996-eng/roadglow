# RoadGlow Android app (v0.9.4)

The Android app is the same web app, wrapped in a **Capacitor 8** shell (`web/android`).
iOS can be added later in the same project with `npx cap add ios`. Every native feature lives behind standard Web APIs (`src/native.js`), so the web code is shared.

## Build
```bash
cd web
npm ci
npm run build          # sprites + skins + vite + dist/bundle/manifest.json
npx cap sync android
cd android && ./gradlew assembleStandardRelease   # signs with ../../keys/roadglow-release.jks if present (never commit keys/)
```
- Needs Node 22+, JDK 21 and Android SDK 36.
- `versionCode = 9040` for 0.9.4 (9020 for 0.9.2). The scheme is major·10000 + minor·1000 + patch·10, which is above 0.1.4's 2005, so it installs as an upgrade.

## Native features
| Feature | How |
|---|---|
| GPS one-shot | `@capacitor/geolocation` (asks for permission at runtime) |
| Navigation in background / with the screen locked | `@capacitor-community/background-geolocation`: a foreground service (type `location`) with a persistent "Navigating" notification while a route is active |
| Keep screen on | `@capacitor-community/keep-awake`, exposed to the app as `navigator.wakeLock` |
| Voice | Android TextToSpeech via `@capacitor-community/text-to-speech`. The Android WebView has no Web Speech; the browser build still uses it |
| Back button | Closes, in order: the drawer, dialogs, the layers popup, search suggestions, the place/route panel. Otherwise it minimises the app, so navigation keeps running |
| Insets | Edge-to-edge drawing; status/nav bar insets come in as `--safe-area-inset-*` (Capacitor SystemBars) |
| Language | Follows the system zh/en unless set in the menu |

## Updates
**v0.9.4 update channel (drawer → 检查更新 / Check for updates).** Shows the installed APK version and the web-content version, checks
`api.github.com/repos/zixutang1996-eng/roadglow/releases/latest` on demand, and shows the release notes. **下载并安装** downloads
`releases/latest/download/RoadGlow.apk` inside the app (native `ApkUpdater` plugin: HTTPS, github.com/*.githubusercontent.com only, progress bar,
cancel), checks the file is this package with a higher versionCode, then opens the system installer via FileProvider
(`REQUEST_INSTALL_PACKAGES`). If "Install unknown apps" isn't allowed, the screen offers **去设置** (opens that permission page) and **安装** again.
APKs older than 0.9.4 that receive this screen via a live web update have no plugin and fall back to a browser download.
Publishing: create a GitHub release `vX.Y.Z`, asset named exactly `RoadGlow.apk`, marked *latest*; Beijing releases must use `--latest=false`.

1. **APK updates:** when the app starts (at most every 6 h), it checks `api.github.com/repos/zixutang1996-eng/roadglow/releases/latest`.
   - If the tag is newer, a card offers **Download**: `https://github.com/zixutang1996-eng/roadglow/releases/latest/download/RoadGlow.apk`.
   - Android installs it over the old app because the signature is the same.
2. **Live web updates (no reinstall):** every Pages deploy publishes `bundle/manifest.json`, which lists the SHA-256 of every web file and a `minNative` version.
   - The app compares it with the manifest inside the APK. Unchanged files are copied locally; changed files are downloaded from the same Pages site (pinned host, HTTPS).
   - Each file's SHA-256 is verified. The new bundle goes to app storage and becomes active at the **next launch** (`MainActivity`).
   - If a live bundle doesn't report healthy for 3 launches in a row, the app falls back to the bundled assets and never retries that build.
   - Installing a new APK always resets to its own bundled assets.
   - Web changes that need new native plugins raise `minNative`, so older APKs ignore them.
   - Free; no third-party live-update service.
   - Limit: integrity comes from HTTPS + GitHub; the manifest is not separately signed.

To publish a web update, push to `main`. The Pages workflow rebuilds and publishes the manifest.

## RoadGlow 北京 (offline Beijing edition)
`web/tools/beijing/build.sh` builds `dist/RoadGlow-Beijing-<ver>.apk`. It uses the `beijing` flavour: applicationId `com.personal.nav.roadglow.beijing`, app name "RoadGlow 北京", same signing key.
- **Data** (kept out of git):
  - `dl_tiles.py` → OpenFreeMap OpenMapTiles vector tiles z0–14 for the Beijing bbox (z15+ overzoom).
  - `osm2bj.py` on the Geofabrik `beijing-latest.osm.pbf` → search index (zh + pinyin + en), reverse-geocoding grid + districts, and the pedestrian graph for Chaoyang/Dongcheng/Xicheng.
- **Code:** `src/bj.js`, active only when `VITE_EDITION=beijing`.
  - Offline tiles, search, reverse geocoding and an A* walking router.
  - Known foreign hosts fail instantly; any other external request is aborted after 4 s.
  - The GitHub update checker and live update are disabled.
- **Test:** `node tools/beijing/test_offline.cjs` (serve `web/dist-bj` on 127.0.0.1:18795).

### v0.9.4 additions
- **Beijing build target:** `chrome89`/es2022 (top-level await needs Chrome 89) with an `AbortSignal.timeout` fallback for older system WebViews.
- **Beijing update channel:** disabled. GitHub (API, release downloads, Pages) is not reliably reachable in mainland China and no free, registration-free China-reachable host is set up. The 检查更新 screen says new versions arrive as an APK file sent by family.
- **Turn location on:** native `LocationEnabler` plugin. Standard flavour: Google Play services `SettingsClient` one-tap dialog (`standardImplementation play-services-location`). Beijing flavour (stub `GmsLocation`) and phones without GMS: opens `Settings.ACTION_LOCATION_SOURCE_SETTINGS` and resumes the locate automatically on return. Runtime permission is requested first.
- **Start view:** URL hash → last saved view → (Beijing: Chaoyang) → neutral world view; then, without blocking, a coarse fix (only if permission is already granted, never prompts) or a city-level IP lookup via `https://ipapi.co/json/` (no key; free tier ~1,000 requests/day, 30k/month, non-commercial; 1.5 s timeout; cached 7 days; bare GET, no cookies/referrer). Skipped in the Beijing edition. The map only eases there if the user hasn't moved it.
- **Splash:** hidden as soon as the map's first `load` (4 s cap); `android:hardwareAccelerated` set explicitly.
- **Icon:** concept B, `web/tools/icon/genicon.mjs` → adaptive background/foreground/monochrome layers, legacy + round mipmaps, splash and PWA icons.
