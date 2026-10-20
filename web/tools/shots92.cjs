const puppeteer = require('/workspace/pixelnav/node_modules/puppeteer-core'); const sl = ms => new Promise(r => setTimeout(r, ms)); const fs = require('fs');
const BASE = process.env.URL || 'http://127.0.0.1:18782/'; const out = '/workspace/gamenav/screenshots/v092/' + (process.env.SUB || '') ; fs.mkdirSync(out, { recursive: true });
const PART = process.env.PART || 'reveal,icons,shadow,search';
const R = { reveal: [], search: [] };
(async () => { const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'], headless: 'new' });
  const page = async (v, hash) => { const [th, md] = v.split('_'); const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    p.on('pageerror', e => console.log(v, 'pageerror', e.message));
    await p.evaluateOnNewDocument((th, md) => { localStorage.setItem('theme', JSON.stringify(th)); localStorage.setItem('mode', JSON.stringify(md)); localStorage.setItem('a2hsSeen', '1'); localStorage.setItem('lang', 'en'); }, th, md);
    await p.goto(BASE + hash, { waitUntil: 'networkidle0', timeout: 90000 }).catch(() => {}); await sl(2500); return p; };
  const count = p => p.evaluate(() => { const m = window._map, ls = m.getStyle().layers.map(l => l.id).filter(id => /^(rp|tp|poi$)/.test(id)); return m.queryRenderedFeatures({ layers: ls }).length; });
  const idle = p => p.evaluate(() => new Promise(r => { const m = window._map; if (m.loaded() && m.areTilesLoaded()) setTimeout(r, 600); else m.once('idle', () => setTimeout(r, 600)); setTimeout(r, 25000); })).then(() => new Promise(r => setTimeout(r, 2500)));
  if (PART.includes('reveal')) for (const [city, c] of [['calgary', [-114.07, 51.045]], ['vancouver', [-123.12, 49.28]], ['toronto', [-79.38, 43.65]]]) {
    const p = await page('west_light', `#9.75/${c[1]}/${c[0]}`);
    for (const z of [9.75, 10.5, 11, 11.5, 12, 12.5, 13, 14, 15]) { await p.evaluate((c, z) => window._map.jumpTo({ center: c, zoom: z }), c, z); await idle(p); const n = await count(p); R.reveal.push([city, z, n]); console.log(city, z, n);
      if ([9.75, 11, 12, 12.5, 13, 14].includes(z)) await p.screenshot({ path: out + `reveal_${city}_z${z}.png` }); }
    await p.close(); }
  if (PART.includes('icons')) for (const v of ['west_light', 'west_dark']) { const p = await page(v, '#15/51.0447/-114.0631'); await idle(p); await p.screenshot({ path: out + `icons_calgary_${v}.png` });
    await p.evaluate(() => window._map.jumpTo({ center: [-113.4935, 53.5418], zoom: 15 })); await idle(p); await p.screenshot({ path: out + `icons_edmonton_${v}.png` }); await p.close(); }
  if (PART.includes('shadow')) for (const v of ['west_light', 'west_dark', 'neon_light', 'neon_dark']) { const p = await page(v, '#14/53.5418/-113.4935'); await idle(p);
    await p.click('#menuBtn'); await sl(600); await p.screenshot({ path: out + `shadow_drawer_${v}.png` }); await p.click('#scrim').catch(() => {}); await sl(400);
    await p.click('#layersBtn'); await sl(600); await p.screenshot({ path: out + `shadow_layers_${v}.png` }); await p.click('#layersBtn'); await sl(300);
    await p.click('#q'); await p.type('#q', 'airport', { delay: 60 }); await sl(5000); await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await sl(5000);
    await p.screenshot({ path: out + `shadow_panel_${v}.png` }); await p.close(); }
  if (PART.includes('search')) {
    const regions = (process.env.REG || 'edmonton:-113.4935,53.5418;calgary:-114.0631,51.0447;vancouver:-123.1207,49.2827;toronto:-79.3832,43.6532;seattle:-122.3321,47.6062').split(';').map(s => { const [n, c] = s.split(':'); return [n, c.split(',').map(Number)]; });
    const Q = (process.env.Q || 'airport|gas station|hospital|Walmart|Costco|Tim Hortons|coffee|pharmacy|grocery|train station|bus station|ferry terminal|university|park|hotel|parking|机场|加油站|医院|超市').split('|');
    for (const [rn, c] of regions) { const p = await page('neon_light', `#13/${c[1]}/${c[0]}`); await idle(p);
      for (const q of Q) { await p.evaluate(() => { window._acLat = []; const e = document.querySelector('#q'); e.value = ''; e.dispatchEvent(new Event('input')); }); await p.click('#q');
        const t0 = Date.now(); await p.type('#q', q, { delay: 70 });
        const local = await p.evaluate(() => window._sug().filter(x => !x.sem).slice(0, 3));
        await p.waitForFunction(q => window._acLat.some(x => x.q === q && x.phase === 'remote'), { timeout: 9000 }, q).catch(() => {});
        await sl(300); const ms = Date.now() - t0; const timedOut = !(await p.evaluate(q => window._acLat.some(x => x.q === q && x.phase === 'remote'), q));
        const top = await p.evaluate(c => window._sug().filter(x => !x.sem).slice(0, 5).map(x => ({ ...x, km: x.lat != null ? +(Math.hypot((x.lat - c[1]) * 111, (x.lng - c[0]) * 111 * Math.cos(c[1] * Math.PI / 180))).toFixed(1) : null })), c);
        R.search.push({ region: rn, q, localTop: local[0]?.name || null, top, timedOut, ms }); console.log(rn, q, timedOut ? 'TIMEOUT' : '', '|', top.slice(0, 3).map(x => `${x.name} (${x.km}km)`).join(' ; '));
        if (q === 'airport' || q === '机场') await p.screenshot({ path: out + `search_${q === '机场' ? 'jichang' : 'airport'}_${rn}.png` }); }
      await p.close(); } }
  fs.writeFileSync(out + `results_${PART.replace(/,/g, '_')}.json`, JSON.stringify(R, null, 1)); await b.close(); })();
