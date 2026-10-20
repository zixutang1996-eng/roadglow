// v0.9: search random real City of Edmonton address points in several formats + reverse-geocode them (in-browser, local build)
const puppeteer = require('/workspace/pixelnav/node_modules/puppeteer-core'); const S = require('./addrsamples.json');
const BASE = process.env.URL || 'http://127.0.0.1:18781/';
(async () => { const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'], headless: 'new' });
  const p = await b.newPage(); await p.evaluateOnNewDocument(() => localStorage.setItem('a2hsSeen', '1'));
  await p.goto(BASE + '#13/53.54/-113.49', { waitUntil: 'networkidle0', timeout: 90000 });
  const r = await p.evaluate(async S => { const A = window._app.AC.ADDR, out = []; let ok = 0, n = 0;
    for (const [hn, st, lat, lng] of S) {
      const m = st.match(/^(\d+) (STREET|AVENUE) (NW)$/), fm = [];
      if (m) { const ty = m[2] === 'STREET' ? 'St' : 'Ave', tl = m[2].toLowerCase(); fm.push(`${hn} ${m[1]} ${ty} NW`, `${hn}-${m[1]} ${tl}`, `${hn} ${m[1]} ${ty}`, `${hn} ${m[1]}${ty.toLowerCase()} nw edmonton`, `${hn} ${m[1]}${m[2] === 'STREET' ? 'th' : 'th'} ${tl} nw`); }
      else { const w = st.split(' '); fm.push(`${hn} ${st.toLowerCase()}`, `${hn} ${w.slice(0, -2).join(' ').toLowerCase()} ${w.at(-2).slice(0, 2).toLowerCase()}`, `${hn} ${w[0].toLowerCase()}`); }
      for (const f of fm) { const t0 = performance.now(); const res = await A.search(f, 5); const ms = performance.now() - t0; n++;
        const hit = res.findIndex(x => Math.abs(x.lat - lat) < 2e-5 && Math.abs(x.lng - lng) < 2e-5); if (hit >= 0) ok++;
        out.push({ q: f, rank: hit, top: res[0]?.name, ms: +ms.toFixed(1) }); }
      const rv = await A.reverse(lat + 0.00003, lng + 0.00003); out.push({ reverse: `${hn} ${st}`, got: rv?.name, m: rv && +rv.dist.toFixed(1) });
    } return { ok, n, out }; }, S);
  console.log(JSON.stringify(r, null, 1)); require('fs').writeFileSync('/workspace/gamenav/screenshots/v09/addrtest.json', JSON.stringify(r, null, 1)); await b.close(); })();
