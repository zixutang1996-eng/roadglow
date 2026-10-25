// v0.9.13: Lethbridge (City of Lethbridge parcels) address search incl. the reported "1581 coalbanks blvd w" + random sample + reverse; also Edmonton still works
const puppeteer = require('/workspace/pptr/node_modules/puppeteer-core'); const fs = require('fs');
const BASE = process.env.URL || 'http://127.0.0.1:18793/';
const A = Object.entries(JSON.parse(fs.readFileSync('/workspace/osm/leth/addr.json'))).map(([k, v]) => { const m = k.match(/^(\S+) (.+)$/); return [m[1], m[2], v[1], v[0]]; });
const samp = []; for (let i = 0; i < 40; i++) samp.push(A[Math.floor((i * 7919.37) % A.length)]);
(async () => { const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'], headless: 'new' });
  const p = await b.newPage(); await p.evaluateOnNewDocument(() => localStorage.setItem('a2hsSeen', '1'));
  await p.goto(BASE + '#13/49.69/-112.84', { waitUntil: 'networkidle0', timeout: 90000 });
  const r = await p.evaluate(async samp => { const AD = window._app.AC.ADDR, out = []; let ok = 0, n = 0;
    const must = ['1581 coalbanks blvd w, lethbridge', '1581 Coalbanks Blvd W', '1581 coalbanks boulevard west', '1581 coalbanks blvd w lethbridge ab', '1581 Coalbanks Blvd W, Lethbridge, AB T1J 5J7', '1581 coalbanks'];
    for (const q of must) { const res = await AD.search(q, 5); const hit = res.findIndex(x => x.exact && /1581 COALBANKS/i.test(x.name)); n++; if (hit === 0) ok++; out.push({ q, rank: hit, top: res[0] && [res[0].name, res[0].lat, res[0].lng] }); }
    for (const s of samp) { const q = `${s[0]} ${s[1].toLowerCase()}`; const res = await AD.search(q, 5, { lat: 49.69, lng: -112.84 }); const hit = res.findIndex(x => Math.abs(x.lat - s[2]) < 3e-5 && Math.abs(x.lng - s[3]) < 3e-5); n++; if (hit >= 0) ok++; out.push({ q, rank: hit, top: res[0]?.name }); }
    const rv = await AD.reverse(49.6678, -112.8974); out.push({ reverse: rv?.name, m: rv && +rv.dist.toFixed(1) });
    const ye = await AD.search('10220 104 ave nw', 3); out.push({ edm: ye[0]?.name });
    return { ok, n, out }; }, samp);
  console.log(JSON.stringify(r, null, 1)); await b.close(); })();
