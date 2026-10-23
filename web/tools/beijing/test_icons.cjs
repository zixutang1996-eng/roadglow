// POI icon test for offline editions under China-like network: node test_icons.cjs <ed> <abort|hang> [baseURL] [shotPrefix]
// Every non-127.0.0.1 request is aborted (abort) or never answered (hang). For each skin × light/dark: counts rendered POI symbols with icons, missing images.
const puppeteer = require('/workspace/pptr/node_modules/puppeteer-core'); const sl = ms => new Promise(r => setTimeout(r, ms));
const [ED, MODE, BASE = 'http://127.0.0.1:18795/', SHOT = ''] = process.argv.slice(2);
const C = { shandong: [117.0204, 36.6683], shaanxi: [108.9480, 34.2635], beijing: [116.4551, 39.9219] }[ED];
const SKINS = [['neon'], ['west'], ['space'], ['nord'], ['tac'], ['nord', 'blueprint'], ['west', 'sanguo'], ['neon', 'calm']];
(async () => { const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'], headless: 'new' });
 let fail = 0;
 for (const [th, sk] of SKINS) for (const dark of [false, true]) {
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const ext = new Set(); await p.setRequestInterception(true);
  p.on('request', r => { const u = new URL(r.url()); if (u.hostname === '127.0.0.1' || /^(data|blob):/.test(u.protocol)) return r.continue(); ext.add(u.hostname); if (MODE === 'abort') r.abort('timedout'); /* hang: never respond */ });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.evaluateOnNewDocument((th, dark, c) => { if (!sessionStorage.getItem('init')) { sessionStorage.setItem('init', 1); localStorage.clear(); localStorage.setItem('a2hsSeen', '1'); localStorage.setItem('theme', JSON.stringify(th)); localStorage.setItem('mode', JSON.stringify(dark ? 'dark' : 'light')); localStorage.setItem('lang', JSON.stringify('zh')); localStorage.setItem('view', JSON.stringify({ c, z: 15.5, u: 1 })); } }, th, dark, C);
  await p.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await p.waitForFunction(() => window.__rgMapReady, { timeout: 60000 }).catch(() => {});
  if (sk) { await p.evaluate(async sk => { const buf = await (await fetch(`packs/${sk}-` + (await (await fetch('packs/index.json')).json()).packs.find(x => x.id === sk).version + '.rgpack')).arrayBuffer(); await window._app.installPackBytes(new Uint8Array(buf)); await window._skins.use(sk); }, sk).catch(e => errs.push('pack ' + e.message)); }
  await p.evaluate(c => _map.jumpTo({ center: c, zoom: 15.5 }), C); await sl(1500);
  await p.waitForFunction(() => _map.areTilesLoaded(), { timeout: 20000 }).catch(() => {}); await sl(3000);
  const r = await p.evaluate(() => { const st = _map.getStyle(); const ic = st.layers.filter(l => l.type === 'symbol' && l.layout?.['icon-image']).map(l => l.id);
    const F = _map.queryRenderedFeatures({ layers: ic.filter(id => _map.getLayer(id)) }); const by = {}; for (const f of F) { const k = f.layer.id.replace(/\d.*/, ''); by[k] = (by[k] || 0) + 1; }
    const imgs = new Set(_map.listImages()); const want = [...new Set(F.map(f => f.layer.layout?.['icon-image']).filter(x => typeof x === 'string'))];
    return { icons: F.length, by, images: imgs.size, sprite: typeof st.sprite === 'string' ? st.sprite.replace(location.origin, '') : JSON.stringify(st.sprite)?.slice(0, 80), glyphs: st.glyphs.replace(location.origin, ''), skin: localStorage.getItem('skin') }; });
  const name = `${sk || th}_${dark ? 'dark' : 'light'}`; const bad = r.icons < 25 || r.images < 10; fail += bad;
  console.log(bad ? 'FAIL' : 'ok  ', MODE, name.padEnd(16), JSON.stringify(r), 'ext:', [...ext].join(','), errs.length ? 'ERR ' + errs.slice(0, 2).join('|') : '');
  if (SHOT) await p.screenshot({ path: `${SHOT}${name}.png` });
  await p.close(); }
 console.log('failures', fail); await b.close(); process.exit(0); })();
