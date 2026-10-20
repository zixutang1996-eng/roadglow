const puppeteer = require('/workspace/pixelnav/node_modules/puppeteer-core'); const sl = ms => new Promise(r => setTimeout(r, ms));
const BASE = process.env.URL || 'http://127.0.0.1:18782/', out = '/workspace/gamenav/screenshots/v092/navsettings/', tag = process.argv[2] || 'local';
const cases = [ // [style, width, textScale, navCard, skin]
 ['west_light', 390, 1, { scale: 0.7, color: 'auto', opacity: 1 }], ['west_light', 390, 1, { scale: 1.5, color: 'auto', opacity: 1 }],
 ['west_dark', 360, 2, { scale: 1.5, color: 'swap', opacity: 1 }], ['west_light', 390, 1, { scale: 1, color: 'ink', opacity: 0.8 }],
 ['neon_dark', 390, 1, { scale: 1, color: 'parchment', opacity: 0.6 }], ['neon_light', 360, 2, { scale: 0.7, color: 'paper', opacity: 0.85 }],
 ['neon_dark', 360, 0.8, { scale: 1.3, color: 'sepia', opacity: 1 }], ['neon_dark', 390, 1, { scale: 1, color: 'auto', opacity: 1 }, 'blueprint'],
 ['neon_light', 390, 1, { scale: 1.15, color: 'auto', opacity: 0.9 }, 'blueprint']];
(async () => { const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'], headless: 'new' });
 let fails = 0;
 for (const [v, w, ts, nc, skin] of cases) { const [th, md] = v.split('_'); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.setViewport({ width: w, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.evaluateOnNewDocument((th, md, ts, nc) => { localStorage.setItem('theme', JSON.stringify(th)); localStorage.setItem('mode', JSON.stringify(md)); localStorage.setItem('a2hsSeen', '1'); localStorage.setItem('lang', '"en"'); localStorage.setItem('textScale', JSON.stringify(ts)); localStorage.setItem('iconScale', JSON.stringify(ts)); localStorage.setItem('navCard', JSON.stringify(nc));
    const pos = { coords: { latitude: 53.5444, longitude: -113.4909, accuracy: 10, heading: null, speed: null } }; Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition: s => setTimeout(() => s(pos), 10), watchPosition: s => { setTimeout(() => s(pos), 10); return 1; }, clearWatch() {} } }); }, th, md, ts, nc);
  await p.goto(BASE + '#14/53.5444/-113.4909', { waitUntil: 'networkidle0', timeout: 90000 }).catch(() => {}); await sl(2500);
  if (skin) { const r = await p.evaluate(async u => { try { const v = await window._skins.installFromUrl(u); await window._skins.refresh(); await window._skins.use(v.pack.id); return 'ok ' + v.warnings.length; } catch (e) { return 'ERR ' + e.message; } }, BASE + 'skins/blueprint/manifest.json'); console.log('install', r); await sl(3000); }
  let m = null;
  for (let t = 0; t < 3 && !(m && m.h); t++) { await p.evaluate(() => { const a = window._app; a.S.from = { name: 'A', lat: 53.5444, lng: -113.4909 }; a.openDirections({ name: 'Edmonton Valley Zoo Walterdale Hill Long Destination Name', lat: 53.5232, lng: -113.5263 }, true); }); await sl(9000);
   m = await p.evaluate(() => { const bn = document.querySelector('#navBanner'); if (!bn || bn.classList.contains('hidden')) return null; const r = bn.getBoundingClientRect(), ov = [];
    const chk = (root, sel, skip) => { const els = [...root.querySelectorAll(sel)].filter(e => e.offsetParent).map(e => [e.className || e.id, e.getBoundingClientRect()]);
      for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) { const [na, a] = els[i], [nb, c] = els[j]; if (a.width && c.width && a.left < c.right - 1 && c.left < a.right - 1 && a.top < c.bottom - 1 && c.top < a.bottom - 1 && !skip(na, nb)) ov.push(na + '×' + nb); } };
    chk(bn, '.ar,.dd,.tx,.objsub,.objk,#navX', (a, b) => a === 'dd' && b === 'tx'); const f = document.querySelector('#navFoot'); if (f) chk(f, '.eta,.ctl,#endBtn', () => false);
    const fr = f?.getBoundingClientRect(), cs = getComputedStyle(bn), lum = c => { const v = c.match(/[\d.]+/g).slice(0, 3).map(x => { x /= 255; return x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; }); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
    const offscreen = r.right > innerWidth + 1 || (fr && fr.right > innerWidth + 1);
    return { h: Math.round(r.height), foot: fr ? Math.round(fr.height) : null, ncc: document.body.classList.contains('ncc'), fg: getComputedStyle(bn.querySelector('.tx') || bn).color, bg: cs.backgroundColor, overlaps: ov, offscreen }; }); }
  const tagv = `${v}_${w}px_ts${ts}_nc${nc.scale}_${nc.color}_op${nc.opacity}${skin ? '_' + skin : ''}`;
  if (!m || m.overlaps.length || m.offscreen || errs.length) fails++;
  console.log(tagv, JSON.stringify(m), errs.length ? 'ERRS ' + errs.join(' | ') : ''); await p.screenshot({ path: `${out}${tag}_${tagv}.png` }); await p.close(); }
 console.log('fails', fails); await b.close(); })();
