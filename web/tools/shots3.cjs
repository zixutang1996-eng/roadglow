const puppeteer = require('/workspace/pixelnav/node_modules/puppeteer-core');
const path = require('path'); const out = path.join(__dirname, '../../screenshots/v03/'); require('fs').mkdirSync(out, { recursive: true });
const BASE = process.env.URL || 'http://127.0.0.1:18781/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const only = process.argv[2];
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'], headless: 'new' });
  const D = { width: 1280, height: 800 }, M = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
  async function page(vp, { theme = 'neon', mode = 'dark', hash = '#16/53.5418/-113.4935', search = '', sat = false, saved = null } = {}) {
    const p = await b.newPage(); await p.setViewport(vp);
    p.on('pageerror', e => console.log('ERR', e.message));
    await p.evaluateOnNewDocument((theme, mode, sat, saved) => { Object.defineProperty(navigator, 'language', { get: () => 'zh-CN' });
      localStorage.setItem('theme', JSON.stringify(theme)); localStorage.setItem('mode', JSON.stringify(mode)); localStorage.setItem('sat', JSON.stringify(sat)); if (saved) localStorage.setItem('saved', JSON.stringify(saved)); }, theme, mode, sat, saved);
    await p.goto(BASE + search + hash, { waitUntil: 'networkidle0', timeout: 90000 });
    await idle(p); return p;
  }
  const idle = async p => { await p.waitForFunction(() => window._map && window._map.loaded() && window._map.areTilesLoaded(), { timeout: 45000 }).catch(() => console.log('idle timeout')); await sleep(1200); };
  const txt = async p => (await p.$eval('#panelBody', e => e.innerText)).replace(/\n+/g, ' / ').slice(0, 260);
  const T = {
    styles: async () => { for (const th of ['neon', 'west']) for (const md of ['light', 'dark']) for (const [vn, vp] of [['desktop', D], ['mobile', M]]) { const p = await page(vp, { theme: th, mode: md }); await p.screenshot({ path: `${out}${vn}_${th}_${md}.png` }); await p.close(); } console.log('styles ok'); },
    zoomprio: async () => { const p = await page(D, { theme: 'neon', mode: 'light', hash: '#13/53.5418/-113.4935', saved: [{ name: '我的家', lat: 53.5300, lng: -113.5200, address: 'home' }] });
      for (const z of [13, 14, 15, 17]) { await p.evaluate(z => window._map.jumpTo({ zoom: z }), z); await idle(p);
        const r = await p.evaluate(() => { const f = window._map.queryRenderedFeatures({ layers: ['poi'] }); const c = {}; f.forEach(x => c[x.properties.class] = (c[x.properties.class] || 0) + 1); return { n: f.length, saved: window._map.queryRenderedFeatures({ layers: ['saved-dot'] }).length, top: Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 6) }; });
        console.log('zoom', z, JSON.stringify(r)); await p.screenshot({ path: `${out}desktop_prio_z${z}.png` }); } await p.close(); },
    dirfree: async () => { for (const [vn, vp] of [['desktop', D], ['mobile', M]]) {
      const p = await page(vp, { theme: 'west', mode: 'light' });
      await p.click('#dirBtn'); await sleep(400);
      await p.click('#fromIn'); await sleep(300); await p.screenshot({ path: `${out}${vn}_dir_origin_options.png` });
      await p.keyboard.type('Edmonton City Hall'); await sleep(2500);
      const o = await p.$$eval('#fromIn ~ .acl .sug .t', e => e.map(x => x.textContent).slice(0, 3)); console.log(vn, 'from options', JSON.stringify(o));
      await p.evaluate(() => { const el = document.querySelector('#fromIn ~ .acl .sug'); el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); }); await sleep(600);
      await p.click('#toIn'); await p.keyboard.type('11211 142 St NW'); await sleep(2500);
      await p.evaluate(() => { const el = document.querySelector('#toIn ~ .acl .sug'); el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); }); await sleep(5000); await idle(p);
      await p.screenshot({ path: `${out}${vn}_dir_custom.png` }); console.log(vn, 'dir', await txt(p));
      await p.click('#swapBtn'); await sleep(5000); console.log(vn, 'swapped', (await txt(p)).slice(0, 150));
      await p.click('#dirX'); await sleep(800); console.log(vn, 'closed panel hidden', await p.$eval('#panel', e => e.classList.contains('hidden')), 'route features', await p.evaluate(() => window._map.querySourceFeatures('route').length));
      await p.close(); } },
    sat: async () => { for (const [n, h] of [['city', '#17/53.5440/-113.4909'], ['region', '#11/53.54/-113.49'], ['outside', '#12/51.05/-114.07']]) {
      const p = await page(D, { theme: 'neon', mode: 'dark', hash: h, sat: true }); await p.screenshot({ path: `${out}desktop_satellite_${n}.png` });
      console.log('sat', n, await p.evaluate(() => [window._map.getLayer('sat-eox') ? 1 : 0, window._map.getLayer('sat-yeg') ? 1 : 0])); await p.close(); }
      const m = await page(M, { theme: 'west', mode: 'light', hash: '#17/53.5440/-113.4909', sat: true }); await m.screenshot({ path: `${out}mobile_satellite.png` }); await m.close(); },
    photo: async () => { const p = await page(D, { theme: 'neon', mode: 'light', hash: '#16/53.5444/-113.4909' });
      await p.evaluate(() => window._app.showPlace({ name: 'Edmonton City Hall', address: '', lat: 53.54547, lng: -113.49016, osm: { type: 'W', id: 35008768 } })); await sleep(9000);
      await p.screenshot({ path: `${out}desktop_place_photo.png` }); console.log('photo card', await txt(p)); console.log('img', await p.$eval('.photo', e => e.src).catch(() => 'none'));
      await p.close(); },
    nav: async () => { for (const [vn, vp] of [['desktop', D], ['mobile', M]]) {
      const p = await page(vp, { theme: 'neon', mode: 'dark', search: '?sim=1' });
      await p.evaluate(() => { window._app.S.from = { name: 'A', lat: 53.5444, lng: -113.4909 }; window._app.openDirections({ name: 'B', lat: 53.5232, lng: -113.5065 }, true); });
      await sleep(9000); await p.screenshot({ path: `${out}${vn}_nav.png` });
      if (vn === 'desktop') {
        const before = await p.evaluate(() => window._app.S.nav.route().distance);
        // inject 2 off-route fixes ~200 m east of route
        for (let i = 0; i < 2; i++) await p.evaluate(() => { const m = window._map.getCenter(); window._app.S.nav.inject({ lat: 53.5400, lng: -113.4800, speed: 10, acc: 5 }); });
        await sleep(5000); const after = await p.evaluate(() => window._app.S.nav.route().distance);
        console.log('offroute reroute: before', Math.round(before), 'after', Math.round(after), after !== before ? 'REROUTED' : 'no change');
        const r0 = await p.evaluate(() => window._app.S.nav.route().distance); await p.evaluate(() => window._app.S.nav.checkBetter()); await sleep(4000);
        console.log('periodic check (same conditions) switched?', (await p.evaluate(() => window._app.S.nav.route().distance)) !== r0);
        await p.click('#navX'); await sleep(1200); console.log('nav X: top visible', await p.$eval('#top', e => !e.classList.contains('hidden')), 'banner hidden', await p.$eval('#navBanner', e => e.classList.contains('hidden')), 'route cleared', await p.evaluate(() => window._map.querySourceFeatures('route').length === 0));
        await p.screenshot({ path: `${out}${vn}_nav_exited.png` });
      }
      await p.close(); } },
    contrast: async () => { const p = await page(D, { theme: 'neon', mode: 'light' });
      const r = await p.evaluate(() => { const lum = c => { const m = c.match(/\d+(\.\d+)?/g).map(Number).slice(0, 3).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]; };
        const out = {}; for (const cls of ['neon light', 'neon dark', 'west light', 'west dark']) { document.body.className = cls; const cs = getComputedStyle(document.body);
          const probe = document.createElement('div'); probe.style.color = 'var(--muted)'; probe.style.background = 'var(--bg)'; document.body.appendChild(probe); const s = getComputedStyle(probe); const probe2 = document.createElement('div'); probe2.style.color = 'var(--fg)'; document.body.appendChild(probe2);
          const L1 = lum(s.color), L2 = lum(s.backgroundColor), L3 = lum(getComputedStyle(probe2).color); const cr = (a, b) => ((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2); out[cls] = { muted: cr(L1, L2), text: cr(L3, L2) }; probe.remove(); probe2.remove(); }
        return out; }); console.log('contrast', JSON.stringify(r)); await p.close(); },
  };
  for (const [k, f] of Object.entries(T)) if (!only || only.split(',').includes(k)) { try { await f(); } catch (e) { console.log('TASKFAIL', k, e.message); } }
  await b.close();
})();
