#!/usr/bin/env bash
# Builds "RoadGlow 北京" (offline Beijing edition) → ../dist/RoadGlow-Beijing-<ver>.apk
# Data (not in git): $BJDATA/tiles/{z}/{x}/{y}.pbf (dl_tiles.py) and $BJDATA/out/*.json (osm2bj.py on Geofabrik beijing-latest.osm.pbf)
set -euo pipefail
cd "$(dirname "$0")/../.."            # web/
BJDATA=${BJDATA:-/workspace/bjdata}; VER=$(node -p "require('./package.json').version")
node tools/gensprites.mjs && node tools/genskins.mjs && node tools/gennewskins.mjs && node tools/genpacks.mjs
VITE_EDITION=beijing npx vite build --outDir dist-bj --emptyOutDir
rm -rf dist-bj/addr dist-bj/pois_yeg.geojson dist-bj/important_yeg.geojson dist-bj/sidequests_ca.json dist-bj/sw.js
cp -r "$BJDATA/tiles" dist-bj/tiles
cp "$BJDATA"/out/{pois_bj.geojson,bj_imp.geojson,bj_rev.json,bj_walk.json} dist-bj/
# Android: same project, "beijing" product flavour (different applicationId + name); web assets swapped in for this build only
npx cap copy android >/dev/null   # ensure plugin config is current
rm -rf android/app/src/main/assets/public && cp -r dist-bj android/app/src/main/assets/public
(cd android && ./gradlew assembleBeijingRelease -q)
mkdir -p ../dist && cp android/app/build/outputs/apk/beijing/release/app-beijing-release.apk "../dist/RoadGlow-Beijing-$VER.apk"
npx cap copy android >/dev/null   # restore the normal edition's assets
ls -l "../dist/RoadGlow-Beijing-$VER.apk"; sha256sum "../dist/RoadGlow-Beijing-$VER.apk"
