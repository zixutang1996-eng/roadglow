// v0.9.10: write the car-skin export exactly as CarSkinStore stores it (light/dark.json + sprite_<mode>[@2x].json/png)
// using src/car.js carExport on the real built-in style / installed-pack data. Output: ./carex/<skin>/
import fs from 'node:fs'; import { unzipSync, strFromU8 } from 'fflate'; import { carExport } from '../../../src/car.js';
const W = '../../../', O = 'http://localhost/';
const pack = f => { const z = unzipSync(fs.readFileSync(W + 'public/packs/' + f)); const p = JSON.parse(strFromU8(z['pack.json']));
  for (const m of ['light', 'dark']) { const md = p.skin.modes[m]; if (!md) continue; md.style = JSON.parse(strFromU8(z[md.style])); if (typeof md.car === 'string') md.car = JSON.parse(strFromU8(z[md.car]));
    if (md.sprite) md.sprite = { json: JSON.parse(strFromU8(z[md.sprite + '.json'])), png: 'data:image/png;base64,' + Buffer.from(z[md.sprite + '.png']).toString('base64') }; } return p; };
const zh = ['coalesce', ['get', 'name:zh-Hans'], ['get', 'name:zh'], ['get', 'name'], ['get', 'name:en']];
const fin = st => { st.glyphs = O + 'glyphs/{fontstack}/{range}.pbf'; for (const l of st.layers) if (l.layout?.['text-field']) l.layout['text-field'] = zh; return st; }; // = main.js finishStyle (zh)
const SK = { neon: null, sanguo: 'sanguo-1.1.1.rgpack', synthb: 'synthb-1.0.0.rgpack', synthc: 'synthc-1.0.0.rgpack' };
const ROUTE = { neon_light: '#0b6f75', neon_dark: '#4fd6e8' };
for (const [id, f] of Object.entries(SK)) {
  let csf;
  if (!f) csf = async m => { const st = JSON.parse(fs.readFileSync(`${W}public/styles/${id}_${m}.json`)); st.sprite = `${O}sprites/${id}_${m}`; return { style: fin(st), sprite: null, route: ROUTE[`${id}_${m}`] }; };
  else { const p = pack(f); csf = async mode => { const m = p.skin.modes[mode] ? mode : 'light', md = p.skin.modes[m]; const st = structuredClone(md.car || md.style);
    if (md.sprite) st.sprite = '{CAR}/sprite_' + mode; else st.sprite = `${O}sprites/${p.skin.base}_${m}`; return { style: fin(st), sprite: md.sprite || null, route: p.skin.tokens?.[m]?.route }; }; }
  const ex = await carExport(csf, O), d = `carex/${id}`; fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true });
  for (const m of ['light', 'dark']) { fs.writeFileSync(`${d}/${m}.json`, ex[m].style);
    if (ex[m].spriteJson) for (const s of ['', '@2x']) { fs.writeFileSync(`${d}/sprite_${m}${s}.json`, ex[m].spriteJson); fs.writeFileSync(`${d}/sprite_${m}${s}.png`, Buffer.from(ex[m].spritePng.split(',')[1], 'base64')); } }
  fs.writeFileSync(`${d}/meta.json`, JSON.stringify({ id, ink: id === 'sanguo', route: ex.route, routeDark: ex.routeDark }));
  console.log(id, fs.readdirSync(d).join(' '));
}
