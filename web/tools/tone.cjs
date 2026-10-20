const puppeteer = require('/workspace/pixelnav/node_modules/puppeteer-core'); const sl = ms => new Promise(r => setTimeout(r, ms));
const BASE = process.env.URL || 'https://zixutang1996-eng.github.io/roadglow/', tag = process.argv[2], out = '/workspace/gamenav/screenshots/v092/tone/';
(async () => { const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'], headless: 'new' });
 for (const md of ['light', 'dark']) { const v = 'west_' + md; const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.evaluateOnNewDocument(md => { localStorage.setItem('theme', '"west"'); localStorage.setItem('mode', JSON.stringify(md)); localStorage.setItem('a2hsSeen', '1'); localStorage.setItem('lang', '"en"');
    const pos = { coords: { latitude: 53.5444, longitude: -113.4909, accuracy: 10, heading: null, speed: null } }; Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition: s => setTimeout(() => s(pos), 10), watchPosition: s => { setTimeout(() => s(pos), 10); return 1; }, clearWatch() {} } }); }, md);
  await p.goto(BASE + '#14/53.5444/-113.4909', { waitUntil: 'networkidle0', timeout: 90000 }).catch(() => {}); await sl(4000);
  await p.screenshot({ path: `${out}${tag}_map_${v}.png` });
  await p.click('#q'); await p.type('#q', 'airport', { delay: 60 }); await sl(5000); await p.screenshot({ path: `${out}${tag}_dropdown_${v}.png` });
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await sl(5000); await p.screenshot({ path: `${out}${tag}_card_${v}.png` });
  await p.click('#panelX').catch(() => {}); await sl(500);
  await p.click('#layersBtn'); await sl(600); await p.screenshot({ path: `${out}${tag}_layers_${v}.png` }); await p.click('#layersBtn').catch(() => {}); await sl(400);
  await p.evaluate(() => { const a = window._app; a.S.from = { name: 'A', lat: 53.5444, lng: -113.4909 }; a.openDirections({ name: 'University of Alberta', lat: 53.5232, lng: -113.5263 }, true); }); await sl(9000);
  await p.screenshot({ path: `${out}${tag}_nav_${v}.png` }); await p.click('#endBtn').catch(() => {}); await p.close(); }
 await b.close(); })();
