const puppeteer = require('/workspace/pixelnav/node_modules/puppeteer-core'); const sl = ms => new Promise(r => setTimeout(r, ms));
const BASE = process.env.URL || 'https://zixutang1996-eng.github.io/roadglow/', tag = process.argv[2], out = '/workspace/gamenav/screenshots/v092/navcard/';
const cases = [['west_light', 390, 1], ['west_dark', 390, 1], ['neon_light', 390, 1], ['neon_dark', 390, 1], ['west_light', 390, 2], ['west_dark', 360, 2], ['neon_dark', 360, 2], ['west_dark', 360, 0.8], ['west_light', 360, 1]];
(async () => { const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'], headless: 'new' });
 for (const [v, w, ts] of cases) { const [th, md] = v.split('_'); const p = await b.newPage(); await p.setViewport({ width: w, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.evaluateOnNewDocument((th, md, ts) => { localStorage.setItem('theme', JSON.stringify(th)); localStorage.setItem('mode', JSON.stringify(md)); localStorage.setItem('a2hsSeen', '1'); localStorage.setItem('lang', '"en"'); localStorage.setItem('textScale', JSON.stringify(ts)); localStorage.setItem('iconScale', JSON.stringify(ts));
    const pos = { coords: { latitude: 53.5444, longitude: -113.4909, accuracy: 10, heading: null, speed: null } }; Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition: s => setTimeout(() => s(pos), 10), watchPosition: s => { setTimeout(() => s(pos), 10); return 1; }, clearWatch() {} } }); }, th, md, ts);
  await p.goto(BASE + '#14/53.5444/-113.4909', { waitUntil: 'networkidle0', timeout: 90000 }).catch(() => {}); await sl(3000);
  await p.evaluate(() => { const a = window._app; a.S.from = { name: 'A', lat: 53.5444, lng: -113.4909 }; a.openDirections({ name: 'Edmonton Valley Zoo Walterdale Hill Long Destination Name', lat: 53.5232, lng: -113.5263 }, true); }); await sl(9000);
  const m = await p.evaluate(() => { const bn = document.querySelector('#navBanner'), r = bn.getBoundingClientRect(), ov = [];
    const els = [...bn.querySelectorAll('.ar,.dd,.tx,.objsub,.objk,#navX')].map(e => [e.className || e.id, e.getBoundingClientRect()]);
    for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) { const [na, a] = els[i], [nb, c] = els[j]; if (a.left < c.right - 1 && c.left < a.right - 1 && a.top < c.bottom - 1 && c.top < a.bottom - 1 && !(na === 'dd' && nb === 'tx')) ov.push(na + '×' + nb); }
    const f = document.querySelector('#navFoot')?.getBoundingClientRect(); return { h: Math.round(r.height), w: Math.round(r.width), foot: f ? Math.round(f.height) : null, overlaps: ov }; });
  console.log(tag, v, w, ts, JSON.stringify(m)); await p.screenshot({ path: `${out}${tag}_${v}_${w}px_ts${ts}.png` }); await p.close(); }
 await b.close(); })();
