// Count rendered POI icons at zoom steps (mobile viewport) and save frames for a zoom-in GIF.
const puppeteer = require('/workspace/pixelnav/node_modules/puppeteer-core'); const sleep = ms => new Promise(r => setTimeout(r, ms));
const BASE = process.env.URL || 'http://127.0.0.1:18781/'; const out = '/workspace/gamenav/screenshots/' + (process.env.OUTV || 'v07') + '/series/'; require('fs').mkdirSync(out, { recursive: true });
const th = process.env.TH || 'west', md = process.env.MD || 'light';
(async () => { const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'], headless: 'new' });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true }); p.on('pageerror', e => console.log('ERR', e.message));
  await p.evaluateOnNewDocument((th, md) => { localStorage.setItem('theme', JSON.stringify(th)); localStorage.setItem('mode', JSON.stringify(md)); localStorage.setItem('a2hsSeen', '1'); }, th, md);
  await p.goto(BASE + '#' + (process.env.Z0 || '10.5') + '/' + (process.env.C || '53.5418/-113.4935') + '', { waitUntil: 'networkidle0', timeout: 90000 }); await sleep(3000);
  const res = []; let i = 0;
  for (let z = +(process.env.Z0 || 10.5); z <= 17.001; z += 0.25) {
    await p.evaluate(z => window._map.jumpTo({ zoom: z }), z);
    await p.waitForFunction(() => window._map.loaded() && window._map.areTilesLoaded(), { timeout: 30000 }).catch(() => {}); await sleep(900);
    const r = await p.evaluate(() => { const m = window._map; const L = m.getStyle().layers.filter(l => /^rp/.test(l.id)).map(l => l.id);
      const a = m.queryRenderedFeatures({ layers: L }); const t = m.getLayer('poi') ? m.queryRenderedFeatures({ layers: ['poi'] }).length : 0;
      return { n: new Set(a.map(f => f.properties.osm)).size, tile: t, scale: document.querySelector('#scale span').textContent, layers: L.length }; });
    res.push({ z: +z.toFixed(2), ...r }); await p.screenshot({ path: `${out}f${String(i++).padStart(2, '0')}_z${z.toFixed(2)}.png` });
  }
  let prev = 0; for (const r of res) { r.growth = prev ? +((r.n - prev) / prev * 100).toFixed(0) : null; prev = r.n; }
  console.log(JSON.stringify(res)); await b.close(); })();
