// v0.9.2 iPhone EMULATION test: Playwright WebKit + iPhone 15 descriptor. Not real iOS Safari.
const { webkit, devices } = require('/workspace/pw/node_modules/playwright');
const out = '/workspace/gamenav/screenshots/v092/ios/'; const BASE = process.env.URL || 'https://zixutang1996-eng.github.io/roadglow/';
const sl = ms => new Promise(r => setTimeout(r, ms)); const R = {}; const ok = (k, v) => { R[k] = v; console.log(k, typeof v === 'string' ? v : JSON.stringify(v)); };
(async () => {
  const b = await webkit.launch(); const dev = devices['iPhone 15'] || devices['iPhone 14']; ok('device', dev.userAgent.slice(0, 80));
  for (const [th, md] of [['west', 'light'], ['west', 'dark'], ['neon', 'light'], ['neon', 'dark']]) {
    const v = th + '_' + md, errs = [];
    const ctx = await b.newContext({ ...dev, locale: 'en-US', geolocation: { latitude: 53.5444, longitude: -113.4909 }, permissions: ['geolocation'] });
    await ctx.addInitScript(([th, md]) => { localStorage.setItem('theme', JSON.stringify(th)); localStorage.setItem('mode', JSON.stringify(md)); localStorage.setItem('a2hsSeen', '1'); localStorage.setItem('lang', '"en"'); }, [th, md]);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push('pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
    const t0 = Date.now(); await p.goto(BASE + '#13/53.5444/-113.4909', { waitUntil: 'load', timeout: 90000 });
    await p.waitForFunction(() => window._map && window._map.loaded() && window._map.isStyleLoaded(), null, { timeout: 60000 }).catch(() => {}); ok(v + ' load→map ready ms', Date.now() - t0);
    await sl(4000);
    ok(v + ' render', await p.evaluate(() => { const m = window._map, ls = m.getStyle().layers.map(l => l.id); return { layers: ls.length, pois: m.queryRenderedFeatures({ layers: ls.filter(i => /^(rp|tp|mp)/.test(i)) }).length, canvas: !!document.querySelector('canvas.maplibregl-canvas') }; }));
    ok(v + ' css', await p.evaluate(() => { const g = (s, pr) => { const e = document.querySelector(s); return e ? getComputedStyle(e).getPropertyValue(pr) : null; };
      return { maskBoxImg: g('#searchbar', '-webkit-mask-box-image-source'), floatFilter: g('.floatw', 'filter') || g('.floatw', '-webkit-filter'), sugwFilter: g('.sugw', 'filter'), clip: g('#panel', 'clip-path'),
        sat: getComputedStyle(document.documentElement).getPropertyValue('--sat'), topPad: g('#top', 'top'), webkitMask: CSS.supports('-webkit-mask-box-image', 'url(a.png) 10 fill / 10px round'), maskBorder: CSS.supports('mask-border', 'url(a.png) 10 fill / 10px round') }; }));
    await p.screenshot({ path: `${out}map_${v}.png` });
    // search + autocomplete
    for (const q of ['airport', '机场']) { await p.fill('#q', ''); await p.click('#q'); await p.keyboard.type(q, { delay: 80 }); await p.waitForFunction(q => (window._acLat || []).some(x => x.q === q && x.phase === 'remote'), q, { timeout: 12000 }).catch(() => {});
      await sl(400); const top = await p.evaluate(() => window._sug().filter(x => !x.sem).slice(0, 3).map(x => x.name)); ok(v + ' ac ' + q, top);
      if (th === 'west' || md === 'dark') await p.screenshot({ path: `${out}ac_${q === '机场' ? 'jichang' : q}_${v}.png` }); }
    await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await sl(4500);
    ok(v + ' place card', await p.evaluate(() => ({ open: !document.querySelector('#panel').classList.contains('hidden'), title: document.querySelector('#panelBody h2, #panelBody .pname, #panelTitle')?.textContent?.slice(0, 50) })));
    await p.screenshot({ path: `${out}card_${v}.png` });
    if (v === 'west_light' || v === 'neon_dark') {
      // routes
      for (const m of ['drive', 'walk', 'transit']) {
        await p.evaluate(() => { const a = window._app; a.S.from = { name: 'Downtown', lat: 53.5444, lng: -113.4909 }; a.openDirections({ name: 'University of Alberta', lat: 53.5232, lng: -113.5263 }); }); await sl(2500);
        await p.click(`#modeSeg button[data-m="${m}"]`).catch(e => errs.push('mode click ' + m + ' ' + e.message.slice(0, 60))); await sl(9000);
        ok(v + ' route ' + m, await p.evaluate(() => ({ alts: document.querySelectorAll('#alts .alt').length, txt: (document.querySelector('#alts')?.innerText || document.querySelector('#panelBody')?.innerText || '').replace(/\s+/g, ' ').slice(0, 90) })));
        await p.screenshot({ path: `${out}route_${m}_${v}.png` }); }
      await p.click('#modeSeg button[data-m="drive"]').catch(() => {}); await sl(7000);
      await p.click('#goBtn').catch(e => errs.push('goBtn ' + e.message.slice(0, 60))); await sl(5000);
      ok(v + ' nav started', await p.evaluate(() => ({ banner: !document.querySelector('#navBanner').classList.contains('hidden'), foot: !!document.querySelector('#navFoot') && getComputedStyle(document.querySelector('#navFoot')).display !== 'none', wake: window._app.ios.wakeState?.() })));
      await p.screenshot({ path: `${out}nav_${v}.png` });
      await p.click('#endBtn').catch(e => errs.push('endBtn ' + e.message.slice(0, 60))); await sl(1200);
      ok(v + ' nav ended', await p.evaluate(() => document.querySelector('#navBanner').classList.contains('hidden')));
      // layers + menu
      await p.click('#panelX').catch(() => {}); await sl(400);
      await p.click('#layersBtn'); await sl(500); const lo = await p.evaluate(() => !document.querySelector('#layersPop').classList.contains('hidden')); await p.screenshot({ path: `${out}layers_${v}.png` });
      await p.click('#layersBtn').catch(() => {}); await sl(400); const lc = await p.evaluate(() => document.querySelector('#layersPop').classList.contains('hidden'));
      if (!lc) { await p.mouse.click(120, 600); await sl(400); } ok(v + ' layers open/close(btn)/close(map tap)', [lo, lc, await p.evaluate(() => document.querySelector('#layersPop').classList.contains('hidden'))]);
      await p.click('#menuBtn'); await sl(600); const mo = await p.evaluate(() => document.querySelector('#drawer').classList.contains('open'));
      await p.click('[data-sech="settings"]').catch(() => {}); await sl(500); await p.screenshot({ path: `${out}menu_${v}.png` });
      const sld = await p.$('input[data-sz="textScale"]'); let szr = null;
      if (sld) { await sld.scrollIntoViewIfNeeded(); await sld.evaluate(e => { e.value = 4; e.dispatchEvent(new Event('input', { bubbles: true })); }); await sl(500); szr = await p.evaluate(() => [localStorage.getItem('textScale'), document.querySelector('#szv_textScale')?.textContent]); await p.screenshot({ path: `${out}textsize_${v}.png` });
        await sld.evaluate(e => { e.value = 1; e.dispatchEvent(new Event('input', { bubbles: true })); }); }
      ok(v + ' menu open / text slider', [mo, szr]);
      await p.click('#scrim').catch(() => {}); await sl(500); ok(v + ' menu closed', await p.evaluate(() => !document.querySelector('#drawer').classList.contains('open')));
    }
    if (v === 'west_light') {
      ok('pwa', await p.evaluate(async () => ({ manifest: document.querySelector('link[rel=manifest]')?.getAttribute('href'), ati: document.querySelector('link[rel=apple-touch-icon]')?.getAttribute('href'),
        capable: document.querySelector('meta[name=apple-mobile-web-app-capable]')?.content || document.querySelector('meta[name=mobile-web-app-capable]')?.content, status: document.querySelector('meta[name=apple-mobile-web-app-status-bar-style]')?.content,
        viewport: document.querySelector('meta[name=viewport]')?.content, sw: 'serviceWorker' in navigator ? !!(await navigator.serviceWorker.getRegistration()) : 'unsupported', swCtl: !!navigator.serviceWorker?.controller })));
      const man = await (await p.request.get(BASE + 'manifest.webmanifest')).json(); ok('manifest', { display: man.display, icons: man.icons.length, start: man.start_url, scope: man.scope });
      const ati = await p.evaluate(() => document.querySelector('link[rel=apple-touch-icon]')?.href); if (ati) ok('apple-touch-icon status', (await p.request.get(ati)).status());
    }
    ok(v + ' console errors', errs.slice(0, 8)); await ctx.close();
  }
  // safe-area: emulate notch insets via CSS env override is not possible in WebKit headless; check CSS uses env()
  require('fs').writeFileSync(out + 'results.json', JSON.stringify(R, null, 1)); await b.close();
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
