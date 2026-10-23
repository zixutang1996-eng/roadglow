#!/usr/bin/env bash
# Builds a province offline edition: ED=shandong|shaanxi → ../dist/RoadGlow-<Province>-<ver>.apk
# Data (not in git): $PDATA/$ED/tiles/{z}/{x}/{y}.pbf (dl.py over tiles.json from the Geofabrik .poly) and $PDATA/$ED/out/*.json (osm2bj.py, WB=walk bbox)
set -euo pipefail
ED=${1:?shandong|shaanxi}; cd "$(dirname "$0")/../.."            # web/
PDATA=${PDATA:-/workspace/provdata}; VER=$(node -p "require('./package.json').version"); NAME=${ED^}
OUT=dist-$ED
node tools/gensprites.mjs && node tools/genskins.mjs && node tools/gennewskins.mjs && node tools/genpacks.mjs
VITE_EDITION=$ED npx vite build --outDir $OUT --emptyOutDir
rm -rf $OUT/addr $OUT/pois_yeg.geojson $OUT/important_yeg.geojson $OUT/sidequests_ca.json $OUT/sw.js
cp -r "$PDATA/$ED/tiles" $OUT/tiles && python3 tools/beijing/bundle_tiles.py $OUT/tiles
cp "$PDATA/$ED"/out/{pois_bj.geojson,bj_imp.geojson,bj_rev.json,bj_walk.json} $OUT/
[ "${NOAPK:-}" ] && exit 0
npx cap copy android >/dev/null
rm -rf android/app/src/main/assets/public && cp -r $OUT android/app/src/main/assets/public
(cd android && ./gradlew assemble${NAME}Release -q)
mkdir -p ../dist && cp android/app/build/outputs/apk/$ED/release/app-$ED-release.apk "../dist/RoadGlow-$NAME-$VER.apk"
npx cap copy android >/dev/null   # restore the normal edition's assets
ls -l "../dist/RoadGlow-$NAME-$VER.apk"; sha256sum "../dist/RoadGlow-$NAME-$VER.apk"
