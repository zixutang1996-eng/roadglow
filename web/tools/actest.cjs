const puppeteer = require('/workspace/pixelnav/node_modules/puppeteer-core'); const sleep = ms => new Promise(r => setTimeout(r, ms));
const BASE = process.env.URL || 'http://127.0.0.1:18781/'; const out = '/workspace/gamenav/screenshots/v07/';
(async () => { const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'], headless: 'new' });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); p.on('pageerror', e => console.log('ERR', e.message));
  await p.evaluateOnNewDocument(() => { Object.defineProperty(navigator, 'language', { get: () => 'en-CA' }); localStorage.setItem('theme', '"west"'); localStorage.setItem('mode', '"light"'); localStorage.setItem('a2hsSeen', '1'); });
  await p.goto(BASE + '#13/53.5418/-113.4935', { waitUntil: 'networkidle0', timeout: 90000 }); await sleep(2500);
  const rows = () => p.$$eval('#suggest .sug', a => a.slice(0, 8).map(x => x.innerText.replace(/\n+/g, ' | ').slice(0, 90)));
  for (const qs of ['west ed', 'tim', '10220 104', 'hortns', 'southg', 'kingsway m']) {
    await p.click('#q', { clickCount: 3 }); await p.keyboard.press('Backspace'); await p.evaluate(() => window._acLat = []);
    for (const ch of qs) { await p.keyboard.type(ch); await sleep(110); }
    await sleep(250); const early = await rows(); await sleep(2600); const fin = await rows();
    const lat = await p.evaluate(() => window._acLat);
    const loc = lat.filter(x => x.phase === 'local').map(x => x.ms), rem = lat.filter(x => x.phase === 'remote');
    console.log(JSON.stringify({ q: qs, localMs: loc, remote: rem.map(x => `${x.q}:${x.ms}ms`), early: early.slice(0, 3), final: fin }));
    if (qs === 'west ed' || qs === '10220 104') await p.screenshot({ path: `${out}ac_${qs.replace(/\s/g, '_')}.png` });
  }
  // keyboard: ArrowDown + Enter picks
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await sleep(2000); console.log('enter picked ->', await p.$eval('#panelTitle', e => e.textContent));
  // directions destination field
  await p.evaluate(() => window._app.openDirections(null)); await sleep(1500);
  const to = await p.$('#toIn'); await to.click(); await sleep(300); console.log('dest focus rows', await p.$$eval('.acl:not(.hidden) .sug', a => a.slice(0, 3).map(x => x.innerText.replace(/\n+/g, ' | '))));
  await p.keyboard.type('west ed', { delay: 110 }); await sleep(250); const e1 = await p.$$eval('.acl:not(.hidden) .sug', a => a.slice(0, 4).map(x => x.innerText.replace(/\n+/g, ' | ').slice(0, 70)));
  await sleep(2500); console.log('dest early', JSON.stringify(e1)); console.log('dest final', JSON.stringify(await p.$$eval('.acl:not(.hidden) .sug', a => a.slice(0, 6).map(x => x.innerText.replace(/\n+/g, ' | ').slice(0, 70)))));
  await p.screenshot({ path: `${out}ac_directions_dest.png` }); await b.close(); })();
