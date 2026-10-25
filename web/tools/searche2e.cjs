// v0.9.13 end-to-end: type into the real search box (Lethbridge view), record time to the first row matching, and the top rows. Live network.
const puppeteer = require('/workspace/pptr/node_modules/puppeteer-core');
const BASE = process.env.URL || 'http://127.0.0.1:18793/';
const Q = [['800 robson st vancouver', /800 Robson/i], ['Superstore', /Real Canadian Superstore/i], ['1581 coalbanks blvd w, lethbridge', /1581 Coalbanks/i], ['Superstore', /Real Canadian Superstore/i], ['Superstore Lethbridge AB', /Real Canadian Superstore/i], ['superst', /Superstore/i], ['costco', /Costco/i], ['timmies', /Tim Hortons/i],
  ['1 dundas st w toronto', /1 Dundas/i], ['800 robson st vancouver', /800 Robson/i], ['8770 170 st nw edmonton', /8770 170/i], ['shoppers', /Shoppers Drug Mart/i]];
(async () => { const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'], headless: 'new' });
  const p = await b.newPage(); await p.setViewport({ width: 412, height: 915, deviceScaleFactor: 1 }); await p.evaluateOnNewDocument(() => localStorage.setItem('a2hsSeen', '1'));
  await p.goto(BASE + '#13/49.69/-112.84', { waitUntil: 'networkidle2', timeout: 90000 }); const out = [];
  for (const [q, re] of Q) { await p.$eval('#q', e => { e.value = ''; e.dispatchEvent(new Event('input')); }); await p.focus('#q'); const t0 = Date.now(); await p.keyboard.type(q, { delay: 40 }); const typed = Date.now();
    let ms = -1, rows = []; for (let i = 0; i < 100; i++) { rows = await p.$$eval('#suggest .sug .t', a => a.map(x => x.textContent.trim())); if (rows.some(r => re.test(r))) { ms = Date.now() - typed; break; } await new Promise(r => setTimeout(r, 100)); }
    await new Promise(r => setTimeout(r, 3000)); const fin = await p.$$eval('#suggest .sug', a => a.map(x => x.innerText.replace(/\s+/g, ' ').trim()));
    out.push({ q, msAfterLastKey: ms, rank: fin.findIndex(r => re.test(r)), top: fin.slice(0, 4) }); await new Promise(r => setTimeout(r, 1300)); }
  console.log(JSON.stringify(out, null, 1)); await b.close(); })();
