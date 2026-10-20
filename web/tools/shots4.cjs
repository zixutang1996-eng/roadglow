const puppeteer = require('/workspace/pixelnav/node_modules/puppeteer-core');
const path = require('path'); const out = path.join(__dirname, '../../screenshots/' + (process.env.V || 'v04') + '/'); require('fs').mkdirSync(out, { recursive: true });
const BASE = process.env.URL || 'http://127.0.0.1:18781/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const only = process.argv.slice(2);
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'], headless: 'new' });
  const D = { width: 1280, height: 800 }, M = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
  async function page(vp, { theme = 'neon', mode = 'dark', hash = '#16/53.5418/-113.4935', search = '', ls = {} } = {}) {
    const p = await b.newPage(); await p.setViewport(vp);
    p.on('pageerror', e => console.log('ERR', e.message));
    await p.evaluateOnNewDocument((theme, mode, ls) => { Object.defineProperty(navigator, 'language', { get: () => 'zh-CN' });
      localStorage.setItem('theme', JSON.stringify(theme)); localStorage.setItem('mode', JSON.stringify(mode)); for (const k in ls) localStorage.setItem(k, JSON.stringify(ls[k])); }, theme, mode, ls);
    await p.goto(BASE + search + hash, { waitUntil: 'networkidle0', timeout: 90000 });
    await idle(p); return p;
  }
  const idle = async p => { await p.waitForFunction(() => window._map && window._map.loaded() && window._map.areTilesLoaded(), { timeout: 45000 }).catch(() => console.log('idle timeout')); await sleep(1200); };
  const st = async p => p.evaluate(() => ({ hidden: document.querySelector('#panel').classList.contains('hidden'), collapsed: document.querySelector('#panel').classList.contains('collapsed'), title: document.querySelector('#panelTitle').textContent, place: window._app.S.place?.name || null }));
  const T = {};
  T.card = async () => { for (const [vn, vp] of [['mobile', M], ['desktop', D]]) {
    const p = await page(vp, { theme: 'neon', mode: 'light', hash: '#17/53.5444/-113.4909' });
    await p.evaluate(() => window._app.showPlace({ name: 'Edmonton City Hall', lat: 53.5444, lng: -113.4909, osm: { type: 'W', id: 26389376 } })); await sleep(6000);
    await p.screenshot({ path: `${out}${vn}_card_close_button.png` }); console.log(vn, 'open', JSON.stringify(await st(p)));
    // tap on an empty-ish map point; also a POI tap while open must not select
    const poi = await p.evaluate(() => { const f = window._map.queryRenderedFeatures({ layers: ['poi'] })[0]; if (!f) return null; const pt = window._map.project(f.geometry.coordinates); return { x: pt.x, y: pt.y, name: f.properties.name }; });
    const xy = poi || { x: vp.width / 2, y: 200 };
    if (vn === 'mobile') { xy.x = 200; xy.y = 250; }
    if (vn === 'mobile') await p.touchscreen.tap(xy.x, xy.y); else await p.mouse.click(xy.x, xy.y); await sleep(800);
    console.log(vn, 'tap at', JSON.stringify(xy), await p.evaluate((x, y) => document.elementFromPoint(x, y)?.className, xy.x, xy.y), 'after map tap (poi under tap:', poi?.name, ')', JSON.stringify(await st(p)));
    await p.screenshot({ path: `${out}${vn}_card_collapsed_after_map_tap.png` });
    if (vn === 'mobile') { const r = await p.$eval('#panelHead', e => { const b = e.getBoundingClientRect(); return [b.x + 60, b.y + 20]; }); await p.touchscreen.tap(r[0], r[1]); } else await p.click('#panelHead'); await sleep(500); console.log(vn, 'after tapping peek bar', JSON.stringify(await st(p)));
    if (vn === 'mobile') { const r = await p.$eval('#panelX', e => { const b = e.getBoundingClientRect(); return [b.x + 24, b.y + 24]; }); await p.touchscreen.tap(r[0], r[1]); } else await p.click('#panelX'); await sleep(500); console.log(vn, 'after X', JSON.stringify(await st(p)));
    await p.close(); } };
  T.icons = async () => { for (const th of ['neon', 'west']) for (const md of ['light', 'dark']) { const p = await page(D, { theme: th, mode: md, hash: '#12/53.5418/-113.4935' });
    for (const z of [12.5, 13.5, 14.5, 15.5, 16.5, 17.5]) { await p.evaluate(z => window._map.jumpTo({ zoom: z }), z); await idle(p);
      const n = await p.evaluate(() => window._map.queryRenderedFeatures({ layers: ['poi'] }).length); console.log(th, md, 'z', z, 'poi rendered', n);
      await p.screenshot({ path: `${out}icons_${th}_${md}_z${z}.png` }); } await p.close(); } };
  T.quests = async () => { for (const [vn, vp] of [['mobile', M], ['desktop', D]]) { const p = await page(vp, { theme: 'west', mode: 'light', hash: '#9/53.5418/-113.4935' });
    await p.click('#menuBtn'); await sleep(500); await p.screenshot({ path: `${out}${vn}_menu_side_quests_entry.png` });
    await p.click('[data-sq]'); await sleep(4000); await idle(p);
    await p.screenshot({ path: `${out}${vn}_side_quests_list.png` });
    console.log(vn, 'quests list', await p.$$eval('.sq .t', e => e.slice(0, 5).map(x => x.textContent + ' / ' + x.nextSibling.textContent)));
    const withImg = await p.$$eval('.sq', e => e.findIndex(x => x.querySelector('img')));
    await p.click(`.sq[data-i="${withImg}"]`); await sleep(7000); await idle(p);
    await p.screenshot({ path: `${out}${vn}_side_quest_card.png` }); console.log(vn, 'quest card', JSON.stringify(await st(p)), await p.$eval('#panelBody', e => e.innerText.replace(/\n+/g, ' / ').slice(0, 300)));
    await p.click('#qDone'); await sleep(300); console.log('done list', await p.evaluate(() => localStorage.getItem('questDone')));
    await p.close(); } };
  T.search = async () => { for (const [vn, vp] of [['desktop', D], ['mobile', M]]) { const p = await page(vp, { theme: 'neon', mode: 'dark', hash: '#14/53.5418/-113.4935' });
    await p.click('#q'); await p.keyboard.type('burger'); await sleep(3000); await p.screenshot({ path: `${out}${vn}_search_burger_suggest.png` });
    console.log(vn, 'suggest', await p.$$eval('#suggest .sug .t', e => e.slice(0, 5).map(x => x.textContent)));
    await p.keyboard.press('Enter'); await sleep(16000); await idle(p);
    await p.screenshot({ path: `${out}${vn}_search_burger_results.png` });
    console.log(vn, 'results', await p.$eval('#panelTitle', e => e.textContent), await p.$$eval('#panelBody .it', e => e.slice(0, 8).map(x => x.innerText.replace(/\n/g, ' | '))));
    if (vn === 'desktop') { await p.click('#clearBtn'); await p.click('#q'); for (const a of ['10220 104 Ave NW', '汉堡', 'coffee']) { await p.evaluate(() => { const q = document.querySelector('#q'); q.value = ''; }); await p.type('#q', a); await sleep(3000); console.log('suggest', a, await p.$$eval('#suggest .sug', e => e.slice(0, 4).map(x => x.innerText.replace(/\n/g, ' | ')))); } }
    await p.close(); } };
  T.gallery = async () => { const p = await page(M, { theme: 'west', mode: 'light', hash: '#16/53.5326/-113.5068' });
    await p.evaluate(() => window._app.showPlace({ name: 'Alberta Legislature Building', lat: 53.5326, lng: -113.5068, tags: { name: 'Alberta Legislature Building', wikidata: 'Q2648949' } })); await sleep(9000);
    console.log('gallery', await p.$eval('.gidx', e => e.textContent).catch(() => 'none'));
    await p.screenshot({ path: `${out}mobile_gallery_card.png` });
    await p.click('.garr.r').catch(() => {}); await sleep(1200); console.log('after next', await p.$eval('.gidx', e => e.textContent).catch(() => 'none'));
    await p.screenshot({ path: `${out}mobile_gallery_photo2.png` });
    await p.click('.gal img').catch(e => console.log('tap img fail', e.message)); await sleep(2000); console.log('fullscreen', await p.$eval('.gal.fs .gidx', e => e.textContent).catch(() => 'none'));
    await p.screenshot({ path: `${out}mobile_gallery_fullscreen.png` }); await p.click('.gal.fs .gx'); await sleep(300); console.log('fs closed', !(await p.$('.gal.fs')));
    await p.close(); };
  for (const k of (only.length ? only : Object.keys(T))) { try { await T[k](); } catch (e) { console.log('FAIL', k, e.message); } }
  await b.close();
})();
