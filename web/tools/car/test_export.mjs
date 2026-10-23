// v0.9.10 unit test: car style export (src/car.js carExportMode/carExport) on real built-in styles + real packs.
// run: node --test tools/car/test_export.mjs
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs'; import { unzipSync, strFromU8 } from 'fflate';
import { carExportMode, carExport } from '../../src/car.js';
const O = 'http://localhost/';
const pack = f => { const z = unzipSync(fs.readFileSync('public/packs/' + f)); const p = JSON.parse(strFromU8(z['pack.json']));
  for (const m of ['light', 'dark']) { const md = p.skin.modes[m]; if (!md) continue; md.style = JSON.parse(strFromU8(z[md.style]));
    if (md.sprite) md.sprite = { json: JSON.parse(strFromU8(z[md.sprite + '.json'])), png: 'data:image/png;base64,' + Buffer.from(z[md.sprite + '.png']).toString('base64') }; } return p; };
const checkStyle = (s) => { const st = JSON.parse(s); assert.equal(st.version, 8); assert.ok(st.layers.length > 5);
  for (const l of st.layers) if (l.source) assert.ok(st.sources[l.source], 'layer source exists ' + l.id);
  assert.ok(!JSON.stringify(st).includes(O), 'no page-origin URLs left'); return st; };

test('built-in neon: sprite + glyphs → {WEB}', () => {
  const st = JSON.parse(fs.readFileSync('public/styles/neon_dark.json'));
  st.sprite = O + 'sprites/neon_dark'; st.glyphs = O + 'glyphs/{fontstack}/{range}.pbf';
  st.sources.rgx = { type: 'geojson', data: { type: 'FeatureCollection', features: [] } }; st.layers.push({ id: 'x', type: 'line', source: 'rgx' });
  const e = carExportMode({ style: st }, 'dark', O), o = checkStyle(e.style);
  assert.equal(o.sprite, '{WEB}/sprites/neon_dark'); assert.equal(o.glyphs, '{WEB}/glyphs/{fontstack}/{range}.pbf');
  assert.ok(!o.sources.rgx && !o.layers.find(l => l.id === 'x'), 'runtime geojson dropped'); assert.equal(e.spriteJson, undefined);
});
for (const f of ['sanguo-1.1.1.rgpack', 'synthb-1.0.0.rgpack', 'synthc-1.0.0.rgpack']) test('pack ' + f, async () => {
  const p = pack(f);
  const csf = async mode => { const md = p.skin.modes[mode] || p.skin.modes.light; const st = structuredClone(md.car || md.style); st.glyphs = O + 'glyphs/{fontstack}/{range}.pbf'; if (!md.sprite) st.sprite = O + `sprites/${p.skin.base}_${mode}`; return { style: st, sprite: md.sprite || null, route: p.skin.tokens?.[mode]?.route }; };
  const ex = await carExport(csf, O);
  for (const m of ['light', 'dark']) { const o = checkStyle(ex[m].style); const md = p.skin.modes[m];
    if (md.sprite) { assert.equal(o.sprite, '{CAR}/sprite_' + m); assert.ok(ex[m].spritePng.startsWith('data:image/png;base64,')); const sj = JSON.parse(ex[m].spriteJson);
      const icons = new Set(Object.keys(sj)); const used = JSON.stringify(o.layers.map(l => l.layout?.['icon-image']).filter(Boolean));
      for (const n of ['restaurant', 'fuel', 'hospital', 'parking']) if (used.includes('"' + n + '"')) assert.ok(icons.has(n), 'sprite has ' + n); }
    else assert.match(o.sprite, /^\{WEB\}\/sprites\//);
    assert.match(o.glyphs, /^\{WEB\}\/glyphs\//); }
  if (f.startsWith('sanguo')) assert.ok(ex.light.spriteJson && ex.dark.spriteJson, 'ink pack exports its icon sheet (was missing in 0.9.8)');
});
test('optional pack car style wins over map style', async () => {
  const base = JSON.parse(fs.readFileSync('public/styles/neon_light.json')); const car = structuredClone(base); car.name = 'CARSTYLE';
  const ex = await carExport(async m => ({ style: m === 'light' ? car : base, sprite: null }), O);
  assert.equal(JSON.parse(ex.light.style).name, 'CARSTYLE');
});
test('non-https tile sources dropped (e.g. rgt:// province tiles)', () => {
  const st = { version: 8, sources: { a: { type: 'vector', tiles: ['rgt://b/{z}'] }, b: { type: 'vector', url: 'https://x/t.json' } }, layers: [{ id: 'bg', type: 'background' }, { id: 'a', type: 'fill', source: 'a', 'source-layer': 'w' }, { id: 'b', type: 'fill', source: 'b', 'source-layer': 'w' }] };
  const o = JSON.parse(carExportMode({ style: st }, 'light', O).style); assert.deepEqual(Object.keys(o.sources), ['b']); assert.equal(o.layers.length, 2);
});
