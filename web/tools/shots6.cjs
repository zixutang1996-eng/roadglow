const puppeteer = require('/workspace/pixelnav/node_modules/puppeteer-core');
const path = require('path'); const out = path.join(__dirname, '../../screenshots/' + (process.env.OUTV || 'v06') + '/'); require('fs').mkdirSync(out, { recursive: true });
const BASE = process.env.URL || 'http://127.0.0.1:18781/'; const sleep = ms => new Promise(r => setTimeout(r, ms)); const only = process.argv.slice(2);
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'], headless: 'new' });
  const D = { width: 1280, height: 800 }, M = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
  const idle = async p => { await p.waitForFunction(() => window._map && window._map.loaded() && window._map.areTilesLoaded(), { timeout: 45000 }).catch(() => console.log('idle timeout')); await sleep(1200); };
  async function page(vp, { theme = 'neon', mode = 'light', hash = '#14/53.5418/-113.4935', search = '' } = {}) { const p = await b.newPage(); await p.setViewport(vp); p.on('pageerror', e => console.log('ERR', e.message));
    await p.evaluateOnNewDocument((theme, mode) => { Object.defineProperty(navigator, 'language', { get: () => 'zh-CN' }); localStorage.setItem('theme', JSON.stringify(theme)); localStorage.setItem('mode', JSON.stringify(mode)); }, theme, mode);
    await p.goto(BASE + search + hash, { waitUntil: 'networkidle0', timeout: 90000 }); await idle(p); return p; }
  const V = [['neon', 'light'], ['neon', 'dark'], ['west', 'light'], ['west', 'dark']];
  const T = {};
  T.puck = async () => { for (const [th, md] of V) { const p = await page(M, { theme: th, mode: md, hash: '#17/53.5418/-113.4935' });
    await p.evaluate(() => window._app.setMe({ coords: { latitude: 53.5418, longitude: -113.4935, heading: 35, accuracy: 25 } })); await sleep(800);
    await p.screenshot({ path: `${out}puck_${th}_${md}.png` }); console.log('puck', th, md, await p.evaluate(() => [document.querySelector('.puck svg') ? 'svg' : 'none', document.querySelector('.puck').parentElement.style.transform.match(/rotate[^)]*\)/)?.[0], window._map.querySourceFeatures('acc').length])); await p.close(); } };
  T.scale = async () => { const p = await page(M, { theme: 'west', mode: 'light', hash: '#11/53.5418/-113.4935' });
    for (const z of [10, 11.5, 12, 13, 14, 15, 16, 17, 18]) { await p.evaluate(z => window._map.jumpTo({ zoom: z }), z); await sleep(300);
      const r = await p.evaluate(() => { const s = document.querySelector('#scale'); const bb = s.getBoundingClientRect(); return [s.querySelector('span').textContent, s.querySelector('.sbar').style.width, Math.round(bb.bottom)]; }); console.log('scale z', z, JSON.stringify(r)); }
    await p.evaluate(() => window._map.jumpTo({ zoom: 12 })); await idle(p); await p.screenshot({ path: `${out}mobile_scale_z12.png` }); await p.close(); };
  T.reveal = async () => { for (const [th, md] of (process.env.REV4 ? V : [['neon', 'dark'], ['west', 'light']])) { const p = await page(M, { theme: th, mode: md, hash: '#11/53.5300/-113.5300' });
    for (const z of (process.env.REV4 ? [11.5, 12, 13, 14] : [11.5, 12, 12.5, 13, 13.5, 14, 15])) { await p.evaluate(z => window._map.jumpTo({ zoom: z }), z); await idle(p);
      const r = await p.evaluate(() => { const m = window._map, c = {}; const L = ['imp0', 'imp1', 'imp2', 'imp3'].filter(l => m.getLayer(l)); const imp = L.length ? m.queryRenderedFeatures({ layers: L }) : []; const names = [...new Set(imp.map(f => f.properties.name))].filter(n => /Mall|Centre|Airport|Station|Hospital|Southgate|Kingsway|Superstore|Walmart|Costco|Museum|Legislature|Stadium|Central|Ice District/i.test(n)).slice(0, 14); const poi = m.queryRenderedFeatures({ layers: ['poi'] }); imp.forEach(f => c[f.properties.class] = (c[f.properties.class] || 0) + 1); return { layers: L.length, imp: imp.length, poi: poi.length, scale: document.querySelector('#scale span').textContent, impTop: c, names }; });
      console.log(th, md, 'z', z, JSON.stringify(r)); await p.screenshot({ path: `${out}reveal_${th}_${md}_z${z}_${r.scale.replace(/\s/g, '')}.png` }); } await p.close(); } };
  T.nav = async () => { for (const [th, md] of V) { for (const [vn, vp] of (th === 'neon' && md === 'dark' ? [['mobile', M], ['desktop', D]] : [['mobile', M]])) {
    const p = await page(vp, { theme: th, mode: md, search: '?sim=1' });
    await p.evaluate(() => { window._app.S.from = { name: 'A', lat: 53.5444, lng: -113.4909 }; window._app.openDirections({ name: '阿尔伯塔大学医院', lat: 53.5203, lng: -113.5237 }, true); });
    await sleep(9000); await p.screenshot({ path: `${out}nav_${vn}_${th}_${md}.png` });
    console.log('nav', vn, th, md, await p.$eval('#navBanner', e => e.innerText.replace(/\n+/g, ' | ')), 'destMarker', !!(await p.$('.objmark')), 'puck', !!(await p.$('.puck.nav svg')));
    if (vn === 'mobile' && th === 'west') { await p.click('#endBtn'); await sleep(800); console.log('End btn: banner hidden', await p.$eval('#navBanner', e => e.classList.contains('hidden')), 'marker removed', !(await p.$('.objmark'))); }
    else { await p.click('#navX'); await sleep(800); console.log('X: banner hidden', await p.$eval('#navBanner', e => e.classList.contains('hidden')), 'marker removed', !(await p.$('.objmark'))); }
    await p.close(); } } };
  T.zoomspeed = async () => { const p = await page(D, {}); const r = await p.evaluate(async () => { const m = window._map; const t0 = performance.now(); document.querySelector('#zin').click(); await new Promise(r => m.once('zoomend', r)); return Math.round(performance.now() - t0); }); console.log('zoom button anim ms', r);
    const r2 = await p.evaluate(async () => { const m = window._map, z0 = m.getZoom(); const t0 = performance.now(); m.getCanvas().dispatchEvent(new MouseEvent('dblclick', { bubbles: true, clientX: 640, clientY: 400 })); await new Promise(r => m.once('zoomend', r)); return [Math.round(performance.now() - t0), +(m.getZoom() - z0).toFixed(2)]; }); console.log('dblclick zoom ms, dz', r2); await p.close(); };
  T.mobilefit = async () => { for (const [th, md] of [['neon', 'light'], ['west', 'dark']]) { const p = await page(M, { theme: th, mode: md, hash: '#17/53.5444/-113.4909' });
    await p.evaluate(() => window._app.showPlace({ name: 'Edmonton City Hall', lat: 53.5444, lng: -113.4909, osm: { type: 'W', id: 26389376 } })); await sleep(8000);
    const r = await p.evaluate(() => { const bad = []; for (const el of document.querySelectorAll('#panel *, #top *, .chip, .act')) { if (el.children.length) continue; if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflow !== 'visible' && !el.closest('.gal') && !el.closest('#chips') && el.id !== 'panelTitle') bad.push(el.className || el.tagName); } const sb = document.querySelector('#searchbar').getBoundingClientRect(); return { truncated: bad.slice(0, 10), searchbarW: sb.width, docW: document.documentElement.scrollWidth }; });
    console.log('mobilefit', th, md, JSON.stringify(r)); await p.screenshot({ path: `${out}mobile_card_${th}_${md}.png` });
    await p.click('#panelX'); await sleep(300); await p.click('#menuBtn'); await sleep(500); await p.screenshot({ path: `${out}mobile_menu_${th}_${md}.png` }); await p.close(); } };
  T.addr = async () => { const p = await page(M, { theme: 'west', mode: 'light', hash: '#17/53.5469/-113.4973' });
    for (const pl of [{ name: 'Rogers Place', lat: 53.5469, lng: -113.4973, osm: { type: 'W', id: 330658330 } }, { name: 'Edmonton City Hall', lat: 53.5444, lng: -113.4909, osm: { type: 'W', id: 26389376 } }, { name: 'No-address point', lat: 53.5401, lng: -113.4990, tags: {} }]) {
      await p.evaluate(x => window._app.showPlace(x), pl); await sleep(7000);
      console.log('addr', pl.name, '=>', await p.$eval('#addrTx', e => e.textContent), '|', await p.$eval('#addrNote', e => e.textContent)); }
    await p.screenshot({ path: `${out}mobile_card_approx_address.png` }); await p.close(); };
  T.longpress = async () => { for (const [vn, vp, th] of [['mobile', M, 'neon'], ['desktop', D, 'west']]) { const p = await page(vp, { theme: th, mode: 'light', hash: '#16/53.5418/-113.4935' });
    const st = () => p.evaluate(() => ({ dropped: !!window._app.S.place?.dropped, marker: !!document.querySelector('.droppin'), hidden: document.querySelector('#panel').classList.contains('hidden') }));
    const hold = async (x, y, ms, move = 0) => { if (vn === 'desktop') x += 500; if (vn === 'mobile') { const cdp = await p.target().createCDPSession(); await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await sleep(move ? 250 : ms / 2); if (move) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + move, y }] }); await sleep(ms / 2); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
      else { await p.mouse.move(x, y); await p.mouse.down(); await sleep(move ? 250 : ms / 2); if (move) await p.mouse.move(x + move, y, { steps: 3 }); await sleep(ms / 2); await p.mouse.up(); } };
    await hold(200, 300, 400); await sleep(300); console.log(vn, 'short hold 400ms', JSON.stringify(await st()));
    await hold(200, 300, 1200, 30); await sleep(300); console.log(vn, 'hold+move 30px', JSON.stringify(await st())); if ((await st()).dropped) { await p.click('#panelX'); await sleep(300); }
    await p.evaluate(() => window._map.jumpTo({ center: [-113.4935, 53.5418], zoom: 16 })); await sleep(500);
    if (vn === 'mobile') { await p.evaluate(() => { const c = window._map.getCanvasContainer(); const r = c.getBoundingClientRect(); }); }
    await p.evaluate(() => { window._ringSeen = 0; const o = new MutationObserver(() => { if (document.querySelector('.lpring.go:not(.hidden)')) window._ringSeen = 1; }); o.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] }); });
    await hold(200, 300, 1200); await sleep(5000); console.log(vn, 'hold 1200ms', JSON.stringify(await st()), 'ring shown', await p.evaluate(() => window._ringSeen));
    console.log(vn, 'card', await p.$eval('#panelBody', e => e.innerText.replace(/\n+/g, ' / ').slice(0, 260)));
    await p.screenshot({ path: `${out}${vn}_longpress_pin.png` });
    if (vn === 'mobile') await p.touchscreen.tap(250, 200); else await p.mouse.click(700, 200); await sleep(600); console.log(vn, 'tap elsewhere', JSON.stringify(await st()));
    if (vn === 'desktop') { await p.mouse.click(600, 400, { button: 'right' }); await sleep(1500); console.log('right-click', JSON.stringify(await st())); await p.click('#panelX'); await sleep(300); console.log('X', JSON.stringify(await st())); }
    await p.close(); } };
  T.voice = async () => { const p = await page(D, {}); const r = await p.evaluate(async () => { const m = await import('/src/voice.js').catch(() => null); return !!m; }); 
    const out2 = await p.evaluate(() => { const S = window._app.S; const res = {}; for (const vp of ['standard', 'frontier', 'street', 'canuck']) { localStorage.setItem('voicePack', vp); res[vp] = []; } return res; });
    console.log('voices available on box', await p.evaluate(() => speechSynthesis.getVoices().map(v => v.name + ' ' + v.lang).slice(0, 10)));
    await p.close(); };
  T.sizes = async () => { const p = await page(M, { theme: 'west', mode: 'light', hash: '#16/53.5418/-113.4935' });
    const ts0 = await p.evaluate(() => JSON.stringify(window._map.getLayoutProperty('poi', 'text-size')).slice(0, 60));
    await p.click('#menuBtn'); await sleep(400);
    await p.evaluate(() => { for (const k of ['textScale', 'iconScale']) { const el = document.querySelector(`[data-sz=${k}]`); el.value = 5; el.dispatchEvent(new Event('input', { bubbles: true })); } }); await sleep(800);
    await p.screenshot({ path: `${out}mobile_sizes_200_menu.png` });
    console.log('sizes poi text-size before', ts0, 'after', await p.evaluate(() => JSON.stringify(window._map.getLayoutProperty('poi', 'text-size')).slice(0, 80)), 'icon', await p.evaluate(() => JSON.stringify(window._map.getLayoutProperty('poi', 'icon-size')).slice(0, 60)));
    await p.evaluate(() => window._app.closeDrawer()); await idle(p); await p.screenshot({ path: `${out}mobile_sizes_200_map.png` });
    await p.evaluate(() => window._app.showPlace({ name: 'Edmonton City Hall', lat: 53.5444, lng: -113.4909, osm: { type: 'W', id: 26389376 } })); await sleep(7000);
    const r = await p.evaluate(() => { const bad = []; for (const el of document.querySelectorAll('#panel *, #top *, #controls *')) { const b = el.getBoundingClientRect(); if (b.width && (b.right > innerWidth + 1 || b.left < -1)) bad.push((el.id || el.className || el.tagName) + ':' + Math.round(b.right)); } return { offscreen: bad.slice(0, 8), docW: document.documentElement.scrollWidth }; });
    console.log('sizes 200% overflow', JSON.stringify(r)); await p.screenshot({ path: `${out}mobile_sizes_200_card.png` });
    await p.click('#panelX'); await p.click('#menuBtn'); await sleep(400); await p.click('[data-szreset]'); await sleep(500); console.log('after reset', await p.evaluate(() => [localStorage.getItem('textScale'), getComputedStyle(document.documentElement).getPropertyValue('--ts')]));
    await p.close(); };
  for (const k of (only.length ? only : Object.keys(T))) { try { await T[k](); } catch (e) { console.log('FAIL', k, e.message); } }
  await b.close();
})();
