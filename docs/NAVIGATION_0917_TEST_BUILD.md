# RoadGlow 0.9.17 navigation test build

Local-only worktree: `/workspace/roadglow-navfix`, branch `fix/nav-position-reroute`, base `c4dc83b` (main / v0.9.16). No push, PR, merge or release. Existing worktrees were not modified.

## Confirmed code defects (baseline line numbers)

- `web/src/nav.js:69–71`: marker target = GPS fix + speed × elapsed, capped at 1.5 s. The real module, run with a synthetic fix 10 m before a turn at 20 m/s and no next fix, moved the arrow 29.966 m beyond that fix. At 100 km/h the theoretical cap is 41.7 m. It could draw beyond an unmade turn. This is a reproduced software defect, not proof of the exact device GPS error.
- `web/src/nav.js:90–93`: route snapping and the previous rendered position were also used as authoritative `S.me`, dropping accuracy/speed metadata. Display, camera, route trimming and authoritative location were conflated.
- `web/src/nav.js:97`: departure was only distance-to-line > 30 + min(20,accuracy). A good 5 m fix needed >35 m deviation. Reproduced: a parallel path 25 m away did not recalculate. Driving in reverse on the same route has zero lateral distance, so also did not recalculate.
- `web/src/nav.js:99`: merely coming within 18 m of a turn advanced the instruction before passing it. Reproduced at 10 m before the junction.
- `web/src/nav.js:161`: the bridge's GPS timestamp was discarded. Stale and out-of-order fixes could move the arrow; duplicate fixes could count as two departure observations.
- `web/src/nav.js:126–141`: reroute errors were swallowed and the UI continued showing the old route without explaining failure. There was already an off-route reroute implementation; it was not wholly missing. The underlying HTTP call already had a 15 s timeout (`services.js:125`), so this report does not claim a demonstrated permanent HTTP lock.
- `web/src/nav.js:128`: an asynchronous response could mutate an ended navigation session; reproduced with a delayed mock response.

## Changes (current file line numbers)

- `web/src/nav.js:67–78,101–117,218`: remove forward dead-reckoning and route snapping of the position marker, carry raw coordinates/accuracy/timestamp into S.me; reject >10 s old, duplicate or out-of-order fixes. Keep heading and camera animation. Only measured GPS positions drive marker position; positional movement is now fix-rate rather than predicted smoothing.
- `web/src/nav.js:118–133`: accuracy-aware 18–35 m departure threshold, suppress departure decisions when accuracy >50 m; detect sustained reverse direction using GPS heading or measured movement (not the handset compass). Two qualifying departure observations request a new route. Step progression uses route distance past the manoeuvre, not proximity before it.
- `web/src/nav.js:160–199,224`: central route installation/reset, timeout/finally release, validated responses, per-request sequencing, ignore responses after end, stale-origin guard, visible failure notice, 5–30 s retry backoff on fresh fixes and retry on network online events. Periodic service-duration comparison is now 60 s rather than 150 s; avoid flapping and choose the returned candidate with the lowest estimated duration.
- `web/src/style.css`: remove navigation-only 1.25× arrow enlargement, add a centre position dot and wrapping status notice. The centre dot is the measured position; the decorative arrow tip is not a geographical point. No rendered UI screenshot or visual assertion was made.
- Version: embedded web 0.9.17, Android 0.9.17 / versionCode 9170. Unrelated generated pack files were restored; downloaded hunter data remains download-only, excluded from the native manifest before Capacitor sync.

## Verification

- New deterministic `web/tools/nav-regression.test.mjs` executes the actual nav module in a Node VM with explicitly stubbed DOM, map, GPS, clocks and HTTP. This is NOT a browser/device simulation or real-world drive.
- Minimal original six reproductions: 0/6 baseline pass. Expanded suite: baseline 3/21 pass; fixed 21/21 pass. Output: `artifacts/baseline-tests.txt`, `artifacts/baseline-full-tests.txt`, `artifacts/fixed-tests.txt`.
- Existing suites: navgeo OK; geoaddr 13 parse + 6 match cases OK; island placement cases OK; search0914 and typo cases OK.
- `git diff --check` and `node --check web/src/nav.js` pass.
- Public routing endpoint smoke test from the box: HTTP 200 / OSRM Ok; Lethbridge fixture returned 1,891.7 m, 176.8 s, 48 vertices / 7 steps, ~453 ms. Not a mobile network test, and not a live-traffic measurement.
- Build: `npm ci`; full asset generators once, restore unrelated generated pack changes; `npx vite build`; remove generated `dist/hunt` download-only data; regenerate manifest; `npx cap sync android`; JDK21 / SDK36 `./gradlew assembleStandardRelease`. `artifacts/final-android-build.log`: BUILD SUCCESSFUL, 519 actionable tasks. The preexisting missing optional fonts/fonts.css warning and Gradle deprecation warnings remain.
- `apksigner verify` succeeds. Certificate matches the exact downloaded official v0.9.16 APK. Every one of 1,282 manifest-listed embedded files has the expected SHA-256. Native applicationId is unchanged; arm64-v8a standard flavor.

## Artifact

- APK: `/workspace/roadglow-navfix/artifacts/RoadGlow-0.9.17-navfix.apk`
- Size: 37,274,969 bytes
- APK SHA-256: `0e0859212458d845d077a21b30bebd83a8071f5b419e19d2d20d80409b87e82b`
- Navigation chunk: `assets/nav-BltDu98h.js`
- Chunk SHA-256: `2391efc6e42caf115daa1eee3675d0e72ffc575a1f5a5dba67dc0a3eba89afd5`
- Certificate SHA-256: `7d6bebe13b0e93078b5877b1f0c1e886d076db35df355495bf2f20110ed7dcc0`
- Detailed metadata: `artifacts/apk-verification.json`, `artifacts/apk-metadata.txt`.

## Limits / field validation still needed

No physical phone, driving session, Android WebView rendering, Android Auto screen, or mobile/background GPS/network behavior was tested. Browser/desktop subagent tools were not available in this executor; no screenshot was produced and none is fabricated. The DOM/map are stubs, so CSS and real map rendering still need review. With prediction removed, motion may look less smooth at ~1 Hz, intentionally avoiding forward overshoot. Raw GPS may jitter and cannot reliably distinguish tightly adjacent/stacked roads or all self-overlapping route geometries. There is no live traffic feed: OSRM's estimated fastest returned route is not a guarantee of real-time traffic-optimal or globally shortest routing. The user's exact road/phone issue still needs a real-world confirmation, preferably by a passenger or safely parked.

## Single-file compact delivery build (after the 25 MB attachment rejection)

The original APK was already arm64-only; further ABI filtering alone could not solve the size limit. Built a new APK from Gradle with `assembleStandardRelease -PcompactApk=true`, not by editing a signed archive. This opt-in profile enables compressed native-library packaging plus R8 code/unused-resource shrinking. All app entry points/bridges remain kept; MapLibre uses its vendor JNI consumer rules and @Keep annotations. Explicit resource keep rules retain the dynamically looked-up background GPS notification icon/channel strings. No feature asset or web file was removed.

Compact APK: `/workspace/roadglow-navfix/artifacts/RoadGlow-0.9.17-arm64-compact.apk`

Exact size: **24,902,288 bytes**, 24.902288 decimal MB / 23.748672 MiB; below even a strict 25,000,000-byte limit. Version 0.9.17 / 9170, arm64-v8a only; certificate still matches official 0.9.16. SHA-256: `79f7d66f7dfa50fe240cf930d72f014bc49daa0e88b2fedecbb0a0058dee1cb1`.

Verified all 1,282 embedded web-manifest hashes and byte-identical contents of all 1,301 original app assets (excluding the two generated dex optimisation profiles, which correctly change with R8). The MapLibre .so is byte-identical but compressed; permissions, declared Android components and package identity are unchanged. Critical native/plugin/JS entry points survive shrinking. Build succeeds and the 21/21 navigation tests remain passing. Evidence: `artifacts/compact-verification.json`, `compact-certificate.txt`, `compact-metadata.txt`, `compact-manifest.xml`, `compact-android-build.log`, `compact-nav-tests.txt`; R8 mapping/seeds/usage copied to artifacts.

No upload, push, PR or release. No installation or launch on a vivo X90s or another physical device; runtime behavior under R8 still requires field testing. Compressed native libraries are extracted during installation (`extractNativeLibs=true`), so download size is reduced but installed disk usage is not reduced proportionally.
