// v0.9 feature screenshots: drawer sections, theme close buttons, address search, puck card, search-this-area pill; 4 variants.
const puppeteer = require('/workspace/pixelnav/node_modules/puppeteer-core'); const sl = ms => new Promise(r => setTimeout(r, ms));
const BASE = process.env.URL || 'http://127.0.0.1:18781/'; const out = '/workspace/gamenav/screenshots/' + (process.env.OUTV || 'v09') + '/feat/'; require('fs').mkdirSync(out, { recursive: true });
const log = []; const ok = (k, v) => { log.push([k, v]); console.log(k, v); };
(async () => { const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'], headless: 'new' });
  for (const [th, md] of [['west', 'light'], ['west', 'dark'], ['neon', 'light'], ['neon', 'dark']]) {
    const v = `${th}_${md}`; const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    p.on('pageerror', e => ok(v + ' pageerror', e.message));
    await p.evaluateOnNewDocument((th, md) => { localStorage.setItem('theme', JSON.stringify(th)); localStorage.setItem('mode', JSON.stringify(md)); localStorage.setItem('a2hsSeen', '1'); localStorage.setItem('lang', 'en');
      const pos = { coords: { latitude: 53.54701, longitude: -113.49771, accuracy: 12, heading: null, speed: null } };
      Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition: s => setTimeout(() => s(pos), 10), watchPosition: s => { setTimeout(() => s(pos), 10); return 1; }, clearWatch() {} } }); }, th, md);
    await p.goto(BASE + '#14/53.5418/-113.4935', { waitUntil: 'networkidle0', timeout: 90000 }); await sl(2500);
    // drawer: default (My places open), then open Settings, check state remembered after reload
    await p.click('#menuBtn'); await sl(500); await p.screenshot({ path: out + `drawer_${v}.png` });
    await p.click('[data-sech="settings"]'); await sl(350); await p.screenshot({ path: out + `drawer_settings_${v}.png` });
    const st = await p.evaluate(() => localStorage.getItem('drawerOpen')); ok(v + ' drawerOpen stored', st);
    await p.reload({ waitUntil: 'networkidle0' }); await sl(1500); await p.click('#menuBtn'); await sl(400);
    ok(v + ' settings open after reload', await p.evaluate(() => document.querySelector('[data-sec="settings"]').classList.contains('open')));
    await p.click('[data-sech="settings"]'); await sl(300); await p.click('[data-close]').catch(() => {}); await sl(400);
    // address search
    await p.click('#q'); await p.type('#q', '10220-104 avenue', { delay: 40 }); await sl(2500);
    const sug = await p.evaluate(() => [...document.querySelectorAll('#suggest .sg, #suggest > div')].slice(0, 4).map(e => e.textContent.trim().slice(0, 60)));
    ok(v + ' addr suggest', JSON.stringify(sug)); await p.screenshot({ path: out + `addrsearch_${v}.png` });
    await p.evaluate(() => { const q = document.querySelector('#q'); q.value = ''; q.dispatchEvent(new Event('input')); q.blur(); }); await sl(300);
    // puck card
    await p.click('#locBtn').catch(() => {}); await sl(2500); await p.evaluate(() => window._showMe()); await sl(3500);
    ok(v + ' puck addr', await p.evaluate(() => (document.querySelector('#addrTx')?.textContent || '') + ' | ' + (document.querySelector('#addrNote')?.textContent || '')));
    await p.screenshot({ path: out + `puckcard_${v}.png` });
    await p.click('#panelX').catch(() => {}); await sl(400);
    // semantic search + pill
    await p.evaluate(() => window._map.jumpTo({ center: [-113.4935, 53.5418], zoom: 14 })); await sl(800);
    await p.click('#q'); await p.type('#q', 'coffee'); await sl(600); await p.keyboard.press('Enter'); await p.waitForFunction(() => document.querySelectorAll('#panelBody .it').length > 0, { timeout: 40000 }).catch(() => {}); await sl(2000);
    const n1 = await p.evaluate(() => document.querySelectorAll('#panelBody .it').length);
    await p.evaluate(() => window._map.jumpTo({ center: [-113.56, 53.52] })); await sl(1500);
    const pill = await p.evaluate(() => !document.querySelector('#areaPill').classList.contains('hidden')); ok(v + ' pill shown after pan', pill);
    await p.screenshot({ path: out + `pill_${v}.png` });
    if (pill) { await p.click('#areaPill'); await sl(1500); await p.waitForFunction(() => document.querySelectorAll('#panelBody .it').length > 0, { timeout: 40000 }).catch(() => {}); await sl(1500); }
    const pill2 = await p.evaluate(() => !document.querySelector('#areaPill').classList.contains('hidden'));
    const c2 = await p.evaluate(() => { const m = window._map, fs = m.queryRenderedFeatures({ layers: ['cat'] }); return [document.querySelectorAll('#panelBody .it').length, fs.length]; });
    ok(v + ' pill rerun', JSON.stringify({ before: n1, after: c2, pillHiddenAfter: !pill2 })); await p.screenshot({ path: out + `pill_after_${v}.png` });
    // layers popover (close button shape)
    await p.click('#layersBtn').catch(() => {}); await sl(600); await p.screenshot({ path: out + `layers_${v}.png` });
    await p.close();
  }
  require('fs').writeFileSync(out + 'shots9.json', JSON.stringify(log, null, 1)); await b.close(); })();
