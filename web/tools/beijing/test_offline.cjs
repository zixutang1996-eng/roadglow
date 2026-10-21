// Offline test: every request outside 127.0.0.1 is aborted. node tools/beijing/test_offline.cjs [baseURL]
const puppeteer = require('/workspace/pixelnav/node_modules/puppeteer-core'); const sl = ms => new Promise(r => setTimeout(r, ms));
const BASE = process.argv[2] || 'http://127.0.0.1:18795/', OUT = '/workspace/gamenav/screenshots/beijing/';
(async () => { const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'], headless: 'new' });
 const p = await b.newPage(); await p.setViewport({ width: 390, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
 const blocked = new Set(); let errs = [];
 await p.setRequestInterception(true); p.on('request', r => { const u = new URL(r.url()); if (u.hostname === '127.0.0.1' || u.protocol === 'data:' || u.protocol === 'blob:') r.continue(); else { blocked.add(u.hostname); r.abort('internetdisconnected'); } });
 p.on('pageerror', e => errs.push(e.message));
 await p.evaluateOnNewDocument(() => { localStorage.setItem('a2hsSeen', '1'); const pos = { coords: { latitude: 39.9215, longitude: 116.4864, accuracy: 8, heading: null, speed: null } };
   Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition: s => setTimeout(() => s(pos), 10), watchPosition: s => { setTimeout(() => s(pos), 10); return 1; }, clearWatch() {} } }); });
 const t0 = Date.now(); await p.goto(BASE, { waitUntil: 'networkidle0', timeout: 60000 }).catch(() => {}); await sl(2500);
 console.log('boot ms', Date.now() - t0, 'center', await p.evaluate(() => { const c = _map.getCenter(); return [c.lng.toFixed(4), c.lat.toFixed(4), _map.getZoom().toFixed(1), document.documentElement.lang || '', document.querySelector('#q').placeholder]; }));
 // map across Beijing
 const views = [['chaoyang', 116.4864, 39.9215], ['guomao', 116.4607, 39.9087], ['tiananmen', 116.3975, 39.9087], ['haidian', 116.3107, 39.9928], ['shunyi', 116.6546, 40.1302], ['yanqing', 115.9747, 40.4565], ['miyun', 116.8432, 40.3762], ['fangshan', 116.1430, 39.7353]];
 for (const [n, x, y] of views) for (const z of (n === 'chaoyang' ? [10, 12, 14, 15, 16, 17] : n === 'guomao' || n === 'tiananmen' ? [16] : [11, 14])) {
   await p.evaluate((x, y, z) => _map.jumpTo({ center: [x, y], zoom: z }), x, y, z); await sl(400);
   await p.waitForFunction(() => _map.areTilesLoaded(), { timeout: 20000 }).catch(() => {}); await sl(600);
   const st = await p.evaluate(() => ({ f: _map.queryRenderedFeatures().length, lab: _map.queryRenderedFeatures().filter(f => f.layer.type === 'symbol' && /[\u3400-\u9fff]/.test(f.properties.name || '')).length }));
   console.log('map', n, 'z' + z, JSON.stringify(st)); if (['chaoyang', 'tiananmen', 'yanqing'].includes(n) || z === 16) await p.screenshot({ path: `${OUT}map_${n}_z${z}.png` }); }
 // search
 await p.evaluate(() => _map.jumpTo({ center: [116.4864, 39.9215], zoom: 14 })); await sl(1500);
 const qs = ['朝阳公园', '超市', '地铁站', '医院', '公园', '银行', 'chaoyang gongyuan', '三里屯', '国贸'];
 for (const q of qs) { await p.click('#q', { clickCount: 3 }); await p.keyboard.press('Backspace'); const ts = Date.now(); await p.type('#q', q); await sl(5200);
   const r = await p.evaluate(() => [...document.querySelectorAll('#suggest .sug')].slice(0, 5).map(e => e.innerText.replace(/\s+/g, ' ').slice(0, 60)));
   console.log('search', q, r.length, JSON.stringify(r)); if (['朝阳公园', '超市', '地铁站', '银行'].includes(q)) await p.screenshot({ path: `${OUT}search_${q.replace(/ /g, '_')}.png` }); }
 // pick 朝阳公园 → location card
 await p.click('#q', { clickCount: 3 }); await p.keyboard.press('Backspace'); await p.type('#q', '朝阳公园'); await sl(1500); await p.click('#suggest .sug'); await sl(3000);
 console.log('card', JSON.stringify(await p.evaluate(() => document.querySelector('#panel').innerText.replace(/\s+/g, ' ').slice(0, 160)))); await p.screenshot({ path: `${OUT}card_chaoyang_park.png` });
 // reverse geocode a map tap
 await p.evaluate(() => _map.jumpTo({ center: [116.4521, 39.9339], zoom: 16 })); await sl(2000); await p.evaluate(() => window._app?.dropAt?.({ lat: 39.9339, lng: 116.4521 }));
 const rv = await p.evaluate(async () => { const m = await import('./assets/' + [...performance.getEntriesByType('resource')].map(e => e.name).find(n => /services-.*\.js/.test(n)).split('/assets/')[1]); return [await m.reverseAddr({ lat: 39.9339, lng: 116.4521 }), await m.photonReverse({ lat: 39.9339, lng: 116.4521 })]; }).catch(e => 'ERR ' + e.message);
 console.log('reverse', JSON.stringify(rv));
 // walking route from the GPS position (朝阳 centre) to 朝阳公园
 const tr = Date.now(); const rt = await p.evaluate(async () => { const a = window._app; a.S.from = { name: '我的位置', lat: 39.9215, lng: 116.4864 }; a.S.travel = 'walk'; a.openDirections({ name: '朝阳公园', lat: 39.9419, lng: 116.4787 }, false); await new Promise(r => setTimeout(r, 6000)); return { alts: document.querySelector('#alts')?.innerText.replace(/\s+/g, ' ').slice(0, 120), n: a.S.routes?.[0]?.geometry.coordinates.length, d: Math.round(a.S.routes?.[0]?.distance || 0), steps: a.S.routes?.[0]?.steps.length }; });
 console.log('route', Date.now() - tr, 'ms', JSON.stringify(rt)); await p.screenshot({ path: `${OUT}route_walk_to_chaoyang_park.png` });
 const rd = await p.evaluate(async () => { const a = window._app; a.S.travel = 'drive'; a.openDirections({ name: '国贸', lat: 39.9087, lng: 116.4607 }, false); await new Promise(r => setTimeout(r, 8000)); return document.querySelector('#alts')?.innerText.replace(/\s+/g, ' ').slice(0, 140); });
 console.log('drive offline', JSON.stringify(rd)); await p.screenshot({ path: `${OUT}route_drive_offline_fallback.png` });
 console.log('blocked hosts', [...blocked].join(' ')); console.log('page errors', errs.length, errs.slice(0, 3).join(' | '));
 await b.close(); })();
