const puppeteer = require('/workspace/pptr/node_modules/puppeteer-core'); const sl = ms => new Promise(r => setTimeout(r, ms));
const BASE = process.env.URL || 'http://127.0.0.1:4180/', out = (process.env.OUT || "/tmp/") ;
(async () => { const b = await puppeteer.launch({ executablePath: '/opt/google/chrome/chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'], headless: 'new' });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 800, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  p.on('pageerror', e => console.log('pageerror', e.message));
  await p.evaluateOnNewDocument(() => { localStorage.setItem('a2hsSeen', '1'); localStorage.setItem('lang', '"en"'); });
  await p.goto(BASE + '?sim=1#14/53.5444/-113.4909', { waitUntil: 'networkidle0', timeout: 90000 }).catch(() => {}); await sl(3000);
  await p.evaluate(() => { const a = window._app; a.S.from = { name: 'A', lat: 53.5444, lng: -113.4909 }; a.openDirections({ name: 'Valley Zoo', lat: 53.5232, lng: -113.5263 }, true); });
  await p.waitForFunction(() => document.body.classList.contains('navon'), { timeout: 30000 }); await sl(6000);
  const r = await p.evaluate(() => new Promise(res => { const m = window._map, el = document.querySelector('.puck'), S = []; const t0 = performance.now();
    const R = 6371008.8, rad = Math.PI / 180, hv = (a, b) => { const dl = (b.lat - a.lat) * rad, dg = (b.lng - a.lng) * rad, s = Math.sin(dl / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dg / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(s)); };
    const tick = ts => { const q = el.getBoundingClientRect(), x = q.left + q.width / 2, y = q.top + q.height / 2, g = m.unproject([x, y]); S.push({ t: ts, x, y, g, c: m.getCenter(), br: m.getBearing(), me: { ...window._app.S.me } });
      if (ts - t0 < 10000) requestAnimationFrame(tick); else { const st = [], dts = [], cst = []; let back = 0, maxScr = 0;
        for (let i = 1; i < S.length; i++) { const d = hv(S[i - 1].g, S[i].g); st.push(d); dts.push(S[i].t - S[i - 1].t); cst.push(hv(S[i - 1].c, S[i].c)); maxScr = Math.max(maxScr, Math.hypot(S[i].x - S[0].x, S[i].y - S[0].y)); }
        const v = st.map((d, i) => d / (dts[i] / 1000)), mean = a => a.reduce((s, x) => s + x, 0) / a.length, sd = a => { const u = mean(a); return Math.sqrt(mean(a.map(x => (x - u) ** 2))); };
        const dv = v.slice(1).map((x, i) => Math.abs(x - v[i])); let fixJumps = 0; for (let i = 1; i < S.length; i++) if (S[i].me.lat !== S[i - 1].me.lat && st[i - 1] > 3 * mean(st)) fixJumps++;
        res({ frames: S.length, fps: +(1000 / mean(dts)).toFixed(1), frameMsMax: +Math.max(...dts).toFixed(1), stepMean: +mean(st).toFixed(3), stepMax: +Math.max(...st).toFixed(3), speedMean: +mean(v).toFixed(2), speedSd: +sd(v).toFixed(2), speedChangeMax: +Math.max(...dv).toFixed(2), jumpsAtFix: fixJumps, puckScreenDriftPx: +maxScr.toFixed(2), camStepMax: +Math.max(...cst).toFixed(3) }); } };
    requestAnimationFrame(tick); }));
  console.log(JSON.stringify(r)); await p.screenshot({ path: out + 'nav_0918.png' }); await b.close(); })();
