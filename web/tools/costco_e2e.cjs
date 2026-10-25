// v0.9.15 search audit e2e: 'costco' variants near Lethbridge (headless Chrome, real network)
const puppeteer = require('/workspace/pptr/node_modules/puppeteer-core'); const sleep = ms => new Promise(r => setTimeout(r, ms));
const BASE = process.env.URL || 'http://127.0.0.1:18781/'; const out = process.env.OUT || '/tmp/';
(async () => { const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'], headless: 'new' });
  for (const [qs, how] of [['costco', 'enter'], ['Costco', 'tap'], ['COSTCO', 'enter'], ['costc', 'enter'], ['superstore', 'enter']]) {
    const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await p.evaluateOnNewDocument(() => { Object.defineProperty(navigator, 'language', { get: () => 'zh-CN' }); localStorage.setItem('theme', '"west"'); localStorage.setItem('mode', '"dark"'); localStorage.setItem('a2hsSeen', '1'); });
    await p.goto(BASE + '#14/49.668/-112.80', { waitUntil: 'networkidle2', timeout: 90000 }); await sleep(3000);
    await p.click('#q'); for (const ch of qs) { await p.keyboard.type(ch); await sleep(90); }
    await sleep(how === 'tap' ? 1500 : 150);
    const sug = await p.$$eval('#suggest .sug .t', a => a.slice(0, 3).map(x => x.textContent));
    const t0 = Date.now();
    if (how === 'tap') await p.click('#suggest .sug[data-i="0"]'); else await p.keyboard.press('Enter');
    let first = null; for (let i = 0; i < 100; i++) { await sleep(100); const n = await p.$$eval('#panelBody .it', a => a.length).catch(() => 0); if (n && first == null) { first = Date.now() - t0; break; } }
    await sleep(7000);
    const title = await p.$eval('#panelTitle', e => e.textContent).catch(() => '?');
    const rows = await p.$$eval('#panelBody .it', a => a.slice(0, 6).map(x => x.innerText.replace(/\n+/g, ' | ').slice(0, 70))).catch(() => []);
    const head = await p.$eval('#panelBody .list > div', e => e.textContent).catch(() => '');
    console.log(JSON.stringify({ q: qs, how, sug, title, firstResultMs: first, head, rows }));
    await p.screenshot({ path: `${out}search_${qs}_${how}.png` }); await p.close();
  }
  await b.close(); })();
