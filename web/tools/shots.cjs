const puppeteer = require('/workspace/pixelnav/node_modules/puppeteer-core');
const URL0 = 'http://127.0.0.1:18781/';
const out = require('path').join(__dirname, '../../screenshots/v02/');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const only = process.argv[2];
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--lang=zh-CN', '--ignore-gpu-blocklist'], headless: 'new' });
  async function page(vp, { theme = 'neon', mode = 'dark', hash = '#14/53.5440/-113.4950', search = '' } = {}) {
    const p = await b.newPage(); await p.setViewport(vp);
    p.on('pageerror', e => console.log('ERR', e.message));
    p.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text().slice(0, 200)); });
    await p.evaluateOnNewDocument((theme, mode) => {
      Object.defineProperty(navigator, 'language', { get: () => 'zh-CN' });
      localStorage.setItem('theme', JSON.stringify(theme)); localStorage.setItem('mode', JSON.stringify(mode));
    }, theme, mode);
    await p.goto(URL0 + search + hash, { waitUntil: 'networkidle0', timeout: 90000 });
    await p.waitForFunction(() => window._map && window._map.loaded() && window._map.areTilesLoaded(), { timeout: 60000 }).catch(() => console.log('tiles timeout'));
    await sleep(1500);
    return p;
  }
  const D = { width: 1280, height: 800 }, M = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
  const idle = async p => { await p.waitForFunction(() => window._map.loaded() && window._map.areTilesLoaded(), { timeout: 45000 }).catch(() => console.log('idle timeout')); await sleep(1200); };
  const tasks = {
    styles: async () => {
      for (const th of ['neon', 'west']) for (const md of ['light', 'dark']) for (const [vn, vp] of [['desktop', D], ['mobile', M]]) {
        const p = await page(vp, { theme: th, mode: md, hash: '#16/53.5418/-113.4935' }); await p.screenshot({ path: `${out}${vn}_${th}_${md}_main.png` }); await p.close(); console.log('ok', vn, th, md);
      }
    },
    zoom: async () => {
      const p = await page(D, { theme: 'neon', mode: 'dark', hash: '#2/40/-100' });
      for (const z of [2, 4, 6, 8, 10, 12, 14, 16, 18]) {
        const t0 = Date.now(); await p.evaluate(z => window._map.jumpTo({ zoom: z, center: z < 7 ? [-105, 50] : [-113.4935, 53.5418] }), z); await idle(p);
        const n = await p.evaluate(() => window._map.queryRenderedFeatures().length);
        console.log('zoom', z, 'loadms', Date.now() - t0, 'features', n);
        if ([2, 4, 8, 12, 18].includes(z)) await p.screenshot({ path: `${out}zoom_neon_dark_z${z}.png` });
      }
      await p.close();
      const p2 = await page(D, { theme: 'west', mode: 'light', hash: '#3/50/-100' }); await p2.screenshot({ path: `${out}zoom_west_light_z3.png` }); await p2.close();
    },
    ui: async () => {
      for (const [vn, vp] of [['desktop', D], ['mobile', M]]) {
        let p = await page(vp, { theme: 'neon', mode: 'light' });
        await p.evaluate(() => window._app.openDrawer()); await sleep(500); await p.screenshot({ path: `${out}${vn}_menu.png` });
        await p.evaluate(() => window._app.closeDrawer());
        await p.type('#q', '10230 Jasper Ave'); await sleep(2500); await p.screenshot({ path: `${out}${vn}_search.png` });
        console.log(vn, 'suggest:', await p.$$eval('.sug .t', els => els.slice(0, 4).map(e => e.textContent).join(' | ')));
        await p.close();
      }
    },
    place: async () => {
      for (const [vn, vp] of [['desktop', D], ['mobile', M]]) {
        const p = await page(vp, { theme: 'west', mode: 'light', hash: '#17/53.5183/-113.4977' });
        // click a rendered POI that has a name, through the real click handler
        const pt = await p.evaluate(() => { const m = window._map; const W = innerWidth, H = innerHeight; const fs = m.queryRenderedFeatures({ layers: ['poi'] }).filter(f => { const q = m.project(f.geometry.coordinates); return q.x > 60 && q.x < W - 60 && q.y > 160 && q.y < H - 100; }).filter(f => f.properties.name && ['cafe', 'restaurant', 'bar', 'shop', 'grocery'].includes(f.properties.class));
          if (!fs.length) return null; const pp = m.project(fs[0].geometry.coordinates); return { x: pp.x, y: pp.y, name: fs[0].properties.name, id: fs[0].id, n: fs.length }; });
        console.log(vn, 'poi', JSON.stringify(pt));
        if (pt) { await p.mouse.click(pt.x + 4, pt.y + 3); await sleep(9000); await p.screenshot({ path: `${out}${vn}_place_poi.png` }); console.log(vn, 'card:', (await p.$eval('#panelBody', e => e.innerText)).replace(/\n+/g, ' / ').slice(0, 300)); }
        await p.close();
      }
    },
    hours: async () => {
      const p = await page(D, { theme: 'neon', mode: 'dark', hash: '#15/53.5444/-113.4909' });
      await p.click('.chip[data-k="cafe"]'); await p.waitForFunction(() => window._app.S.catItems, { timeout: 40000 }).catch(() => {}); await sleep(1500); await p.screenshot({ path: `${out}desktop_chip_cafe.png` });
      console.log('chip list:', (await p.$eval('#panelBody', e => e.innerText)).replace(/\n+/g, ' / ').slice(0, 300));
      const idx = await p.evaluate(() => window._app.S.catItems.findIndex(i => i.tags.opening_hours));
      if (idx >= 0) { await p.evaluate(i => window._app.showPlace(window._app.S.catItems[i]), idx); await sleep(6000); await p.screenshot({ path: `${out}desktop_place_hours.png` });
        console.log('hours card:', (await p.$eval('#panelBody', e => e.innerText)).replace(/\n+/g, ' / ').slice(0, 400)); }
      await p.close();
      const m = await page(M, { theme: 'neon', mode: 'dark', hash: '#15/53.5444/-113.4909' });
      await m.click('.chip[data-k="cafe"]'); await m.waitForFunction(() => window._app.S.catItems, { timeout: 40000 }).catch(() => {});
      const i2 = await m.evaluate(() => window._app.S.catItems.findIndex(i => i.tags.opening_hours));
      if (i2 >= 0) { await m.evaluate(i => window._app.showPlace(window._app.S.catItems[i]), i2); await sleep(6000); await m.screenshot({ path: `${out}mobile_place_hours.png` }); }
      await m.close();
    },
    dir: async () => {
      for (const [vn, vp] of [['desktop', D], ['mobile', M]]) {
        const p = await page(vp, { theme: 'neon', mode: 'dark' });
        await p.evaluate(() => { window._app.S.from = { name: 'Edmonton City Hall', lat: 53.5444, lng: -113.4909 }; window._app.openDirections({ name: 'TELUS World of Science', lat: 53.5612, lng: -113.5644 }); });
        await sleep(6000); await idle(p); await p.screenshot({ path: `${out}${vn}_directions.png` });
        console.log(vn, 'dir:', (await p.$eval('#panelBody', e => e.innerText)).replace(/\n+/g, ' / ').slice(0, 250));
        await p.close();
      }
    },
    nav: async () => {
      for (const [vn, vp] of [['desktop', D], ['mobile', M]]) {
        const p = await page(vp, { theme: 'west', mode: 'dark', search: '?sim=1' });
        await p.evaluate(() => { window._app.S.from = { name: 'A', lat: 53.5444, lng: -113.4909 }; window._app.openDirections({ name: 'B', lat: 53.5232, lng: -113.5065 }, true); });
        await sleep(14000); await p.screenshot({ path: `${out}${vn}_nav_follow.png` });
        console.log(vn, 'nav bearing', await p.evaluate(() => [window._map.getBearing().toFixed(1), window._map.getPitch().toFixed(0), window._map.getZoom().toFixed(1)]));
        if (vn === 'desktop') { // user pan exits follow -> recenter button
          await p.mouse.move(640, 400); await p.mouse.down(); await p.mouse.move(500, 300, { steps: 8 }); await p.mouse.up(); await sleep(1500);
          await p.screenshot({ path: `${out}${vn}_nav_recenter.png` }); console.log('recenter visible', await p.$eval('#recenter', e => !e.classList.contains('hidden')));
          await p.click('#hdgBtn'); await sleep(2500); console.log('north-up bearing', await p.evaluate(() => window._map.getBearing().toFixed(1))); await p.screenshot({ path: `${out}${vn}_nav_northup.png` });
        }
        await p.close();
      }
    },
    addr: async () => {
      const p = await page(D, { theme: 'neon', mode: 'light' });
      for (const a of ['10230 Jasper Ave NW', '11211 142 St NW', '10050 82 Ave NW', '9930 Bellamy Hill Rd NW', '17004 111 Ave NW', '8882 170 St NW']) {
        await p.evaluate(() => { document.querySelector('#q').value = ''; }); await p.type('#q', a); await sleep(2600);
        console.log('ADDR', a, '=>', await p.$$eval('.sug', els => els.slice(0, 3).map(e => e.innerText.replace(/\n/g, ' ~ ')).join(' | ')));
      }
      await p.close();
    },
    perf: async () => {
      const p = await page(D, { theme: 'neon', mode: 'dark', hash: '#13/53.5440/-113.4950' });
      const tti = await p.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return { domInteractive: Math.round(n.domInteractive), loadEnd: Math.round(n.loadEventEnd) }; });
      const r = await p.evaluate(async () => {
        const m = window._map; let frames = [], last = performance.now(), run = true;
        const tick = t => { frames.push(t - last); last = t; if (run) requestAnimationFrame(tick); }; requestAnimationFrame(tick);
        for (let i = 0; i < 6; i++) { m.panBy([300 * (i % 2 ? -1 : 1), 150], { duration: 700 }); await new Promise(r => setTimeout(r, 750)); }
        m.easeTo({ zoom: 16, duration: 1500 }); await new Promise(r => setTimeout(r, 1600)); m.easeTo({ zoom: 11, duration: 1500 }); await new Promise(r => setTimeout(r, 1600));
        run = false; frames.shift(); const s = [...frames].sort((a, b) => a - b);
        return { frames: frames.length, avgFps: +(1000 / (frames.reduce((a, b) => a + b, 0) / frames.length)).toFixed(1), p95ms: +s[Math.floor(s.length * 0.95)].toFixed(1), maxms: +s[s.length - 1].toFixed(1) };
      });
      const mk = await p.evaluate(async () => { const t0 = performance.now(); window._app.openDrawer(); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); return +(performance.now() - t0).toFixed(1); });
      console.log('perf', JSON.stringify({ tti, ...r, drawerOpenToPaintMs: mk }));
      await p.close();
    },
  };
  for (const [k, f] of Object.entries(tasks)) if (!only || only.split(',').includes(k)) { try { await f(); } catch (e) { console.log('TASKFAIL', k, e.message); } }
  await b.close();
})();
