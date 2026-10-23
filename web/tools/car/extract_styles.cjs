// Dumps the car (MapLibre Native) style for each skin × light/dark from a served web build → out dir.
// usage: node extract_styles.cjs http://127.0.0.1:18796/ outdir
const puppeteer = require('/workspace/pptr/node_modules/puppeteer-core'); const fs = require('fs');
const [base, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage(); await p.setViewport({ width: 800, height: 600 });
  p.on('pageerror', e => console.log('pageerror', e.message));
  await p.goto(base, { waitUntil: 'networkidle2', timeout: 90000 }); await p.waitForFunction('window.__rgMapReady && window.__rgCarStyle', { timeout: 90000 });
  const skins = await p.evaluate(() => Object.keys(window._skins?.list?.() || {}));
  console.log('skins api', Object.keys(await p.evaluate(() => window._skins || {})), skins);
  await p.evaluate(async b => { try { const u8 = new Uint8Array(await (await fetch(b + 'packs/sanguo-1.1.0.rgpack')).arrayBuffer()); const v = await window._app.installPackBytes(u8); await window._skins.refresh(); window.__inkId = v?.id || v?.pack?.id || JSON.stringify(v); } catch (e) { window.__inkErr = e.message; } }, base); console.log('ink', await p.evaluate(() => window.__inkId || window.__inkErr));
  const combos = JSON.parse(process.env.COMBOS || '[["neon",null],["west",null],["space",null],["nord",null],["tac",null],["sanguo","sanguo"]]');
  for (const [theme, skin] of combos) for (const mode of ['light', 'dark']) {
    const r = await p.evaluate(async (theme, skin, mode) => {
      const S = window._app.S; S.mode = mode;
      try { if (skin) await window._skins.use(skin); else { S.skin = null; S.theme = theme; await window._app.setStyle(); } } catch (e) { return 'ERR ' + e.message; }
      await new Promise(r => { const m = window._map; if (m.isStyleLoaded()) setTimeout(r, 1500); else m.once('idle', r); setTimeout(r, 8000); });
      return { json: window.__rgCarStyle(), ink: document.documentElement.classList.contains('fx-inkui'), skin: S.skin || S.theme };
    }, theme, skin, mode);
    if (typeof r === 'string') { console.log(theme, mode, r); continue; }
    fs.writeFileSync(`${out}/${skin || theme}_${mode}.json`, r.json); console.log(theme, mode, r.skin, 'ink', r.ink, r.json.length);
  }
  await b.close();
})();
