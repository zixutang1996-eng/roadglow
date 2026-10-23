// Offline test for a province edition: every request outside 127.0.0.1 is aborted. node tools/beijing/test_province.cjs <shandong|shaanxi> [baseURL]
const puppeteer = require('/workspace/pixelnav/node_modules/puppeteer-core'); const sl = ms => new Promise(r => setTimeout(r, ms));
const ED = process.argv[2], BASE = process.argv[3] || 'http://127.0.0.1:18795/', OUT = `/workspace/gamenav/screenshots/${ED}/`;
require('fs').mkdirSync(OUT, { recursive: true });
const R = {
  shandong: { me: [117.0204, 36.6683], views: [['jinan', 117.0204, 36.6683], ['qingdao', 120.3826, 36.0671], ['yantai', 121.4479, 37.4638], ['heze', 115.4807, 35.2336], ['taishan', 117.1006, 36.2560]], qs: ['趵突泉', '泉城广场', '超市', '医院', '火车站', '青岛', '泰山', 'baotuquan'], dest: '泉城广场', rev: [117.0215, 36.6610], drive: [120.3826, 36.0671] },
  shaanxi: { me: [108.9480, 34.2635], views: [['xian', 108.9480, 34.2635], ['baoji', 107.2375, 34.3619], ['yanan', 109.4897, 36.5853], ['hanzhong', 107.0230, 33.0676], ['yulin', 109.7346, 38.2852]], qs: ['钟楼', '大雁塔', '超市', '医院', '火车站', '兵马俑', '延安', 'zhonglou'], dest: '大雁塔', rev: [108.9430, 34.2610], drive: [107.2375, 34.3619] },
}[ED];
(async () => { const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'], headless: 'new' });
 const p = await b.newPage(); await p.setViewport({ width: 390, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
 const blocked = new Set(); let errs = [];
 await p.setRequestInterception(true); p.on('request', r => { const u = new URL(r.url()); if (u.hostname === '127.0.0.1' || u.protocol === 'data:' || u.protocol === 'blob:') r.continue(); else { blocked.add(u.hostname); r.abort('internetdisconnected'); } });
 p.on('pageerror', e => errs.push(e.message));
 await p.evaluateOnNewDocument(me => { localStorage.setItem('a2hsSeen', '1'); const pos = { coords: { latitude: me[1], longitude: me[0], accuracy: 8, heading: null, speed: null } };
   Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition: s => setTimeout(() => s(pos), 10), watchPosition: s => { setTimeout(() => s(pos), 10); return 1; }, clearWatch() {} } }); }, R.me);
 const t0 = Date.now(); await p.goto(BASE, { waitUntil: 'networkidle0', timeout: 60000 }).catch(() => {}); await sl(2500);
 console.log('boot ms', Date.now() - t0, 'center', await p.evaluate(() => { const c = _map.getCenter(); return [c.lng.toFixed(4), c.lat.toFixed(4), _map.getZoom().toFixed(1), document.querySelector('#q').placeholder]; }));
 for (const [n, x, y] of R.views) for (const z of (n === R.views[0][0] ? [8, 11, 14, 16] : [11, 14])) {
   await p.evaluate((x, y, z) => _map.jumpTo({ center: [x, y], zoom: z }), x, y, z); await sl(400);
   await p.waitForFunction(() => _map.areTilesLoaded(), { timeout: 20000 }).catch(() => {}); await sl(700);
   const st = await p.evaluate(() => ({ f: _map.queryRenderedFeatures().length, lab: _map.queryRenderedFeatures().filter(f => f.layer.type === 'symbol' && /[\u3400-\u9fff]/.test(f.properties.name || '')).length }));
   console.log('map', n, 'z' + z, JSON.stringify(st)); await p.screenshot({ path: `${OUT}map_${n}_z${z}.png` }); }
 await p.evaluate(me => _map.jumpTo({ center: me, zoom: 14 }), R.me); await sl(1500);
 for (const q of R.qs) { await p.click('#q', { clickCount: 3 }); await p.keyboard.press('Backspace'); await p.type('#q', q); await sl(5200);
   const r = await p.evaluate(() => [...document.querySelectorAll('#suggest .sug')].slice(0, 4).map(e => e.innerText.replace(/\s+/g, ' ').slice(0, 50)));
   console.log('search', q, r.length, JSON.stringify(r)); if (q === R.qs[0] || q === '超市') await p.screenshot({ path: `${OUT}search_${q}.png` }); }
 await p.click('#q', { clickCount: 3 }); await p.keyboard.press('Backspace'); await p.type('#q', R.dest); await sl(1500); await p.click('#suggest .sug'); await sl(3000);
 console.log('card', JSON.stringify(await p.evaluate(() => document.querySelector('#panel').innerText.replace(/\s+/g, ' ').slice(0, 140)))); await p.screenshot({ path: `${OUT}card.png` });
 const rv = await p.evaluate(async ll => { const m = await import('./assets/' + [...performance.getEntriesByType('resource')].map(e => e.name).find(n => /services-.*\.js/.test(n)).split('/assets/')[1]); return [await m.reverseAddr({ lat: ll[1], lng: ll[0] }), await m.photonReverse({ lat: ll[1], lng: ll[0] })]; }, R.rev).catch(e => 'ERR ' + e.message);
 console.log('reverse', JSON.stringify(rv));
 const dest = await p.evaluate(() => { const f = window._app.S.place; return f && { name: f.name, lat: f.lat, lng: f.lng }; });
 const tr = Date.now(); const rt = await p.evaluate(async (me, d) => { const a = window._app; a.S.from = { name: '我的位置', lat: me[1], lng: me[0] }; a.S.travel = 'walk'; a.openDirections(d, false); await new Promise(r => setTimeout(r, 7000)); return { alts: document.querySelector('#alts')?.innerText.replace(/\s+/g, ' ').slice(0, 120), d: Math.round(a.S.routes?.[0]?.distance || 0), steps: a.S.routes?.[0]?.steps.length }; }, R.me, dest);
 console.log('route walk', Date.now() - tr, 'ms', JSON.stringify(rt)); await p.screenshot({ path: `${OUT}route_walk.png` });
 const rd = await p.evaluate(async d => { const a = window._app; a.S.travel = 'drive'; a.openDirections({ name: 'far', lat: d[1], lng: d[0] }, false); await new Promise(r => setTimeout(r, 8000)); return document.querySelector('#alts')?.innerText.replace(/\s+/g, ' ').slice(0, 140) || document.querySelector('#toast')?.innerText; }, R.drive);
 console.log('drive offline', JSON.stringify(rd));
 console.log('blocked hosts', [...blocked].join(' ')); console.log('page errors', errs.length, errs.slice(0, 3).join(' | '));
 await b.close(); })();
