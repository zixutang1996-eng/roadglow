// v0.9.11 unit test: skinned car panel spec (src/car.js carPanelSpec / cssVars / carExport.panel) on built-ins + real packs.
// run: node --test tools/car/test_panel.mjs
import test from 'node:test'; import assert from 'node:assert/strict';
import { carPanelSpec, cssVars, carExport, BUILTIN_PANEL } from '../../src/car.js';
import { loadPk } from './packload.mjs';
const HEX = /^#[0-9a-f]{6}([0-9a-f]{2})?$/;
const lum = h => { const n = parseInt(h.slice(1, 7), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const sane = (p, tag) => { for (const k of ['bg', 'fg', 'muted', 'accent', 'arrow']) assert.match(p[k], HEX, `${tag} ${k}=${p[k]}`);
  assert.ok(contrast(p.fg, p.bg) >= 4.5, `${tag} text contrast ${contrast(p.fg, p.bg).toFixed(2)} ≥ 4.5`); assert.ok(p.radius >= 0 && p.radius <= 40); };

test('cssVars: common + mode-scoped vars and @font-face families', () => {
  const css = `:root{--a:#111;--head:'X Y',serif}\n@font-face{font-family:"Brush Q";src:url(data:font/woff2;base64,AA)}\nhtml.dark{--a:#222;--img:url(data:image/png;base64,QQ==)}\n.dark{--b:3px}`;
  const d = cssVars(css, 'dark'), l = cssVars(css, 'light');
  assert.equal(l.vars['--a'], '#111'); assert.equal(d.vars['--a'], '#222'); assert.ok(d.faces['brush q'] || d.faces['Brush Q'], 'font-face family found');
  assert.equal(d.vars['--img'], 'url(data:image/png;base64,QQ==)', 'data URL with ; kept whole');
});
for (const id of Object.keys(BUILTIN_PANEL)) test('built-in ' + id, () => { const [t, m] = id.split('_'); sane(carPanelSpec({ theme: t, mode: m }), id); });
test('west dark follows the palette accent', () => assert.equal(carPanelSpec({ theme: 'west', mode: 'dark', pal: { accent: '#aa3311' } }).accent, '#aa3311'));
test('unknown theme falls back to neon', () => assert.deepEqual(carPanelSpec({ theme: 'nope', mode: 'light' }), carPanelSpec({ theme: 'neon', mode: 'light' })));

const PK = { sanguo: 'public/packs/sanguo-1.1.1.rgpack', synthb: 'public/packs/synthb-1.0.1.rgpack', synthc: 'public/packs/synthc-1.0.1.rgpack' };
for (const [id, f] of Object.entries(PK)) for (const m of ['light', 'dark']) test(`pack ${id} ${m}`, async () => {
  const pk = await loadPk(f), p = carPanelSpec({ pk, mode: m }); sane(p, id + m);
  assert.ok(p.head, 'has a head font family');
  if (id === 'sanguo') { assert.match(p.frame, /^data:image\/(png|webp);base64,/, 'ink frame art'); assert.equal(p.slice.length, 4); assert.ok(p.fw > 0); assert.match(p.head, /ma ?shan ?zheng|rg_brush|brush/i); }
  else assert.ok(!p.frame || /^data:image/.test(p.frame));
});
test('pack carPanel overrides are sanitised', async () => {
  const pk = await loadPk(PK.synthb); pk.modes.dark.carPanel = { bg: '#000000', fg: 'red;}', radius: 999, frame: 'javascript:alert(1)', font: 'data:font/ttf;base64,AAEAAA', head: 'x'.repeat(200) };
  const p = carPanelSpec({ pk, mode: 'dark' });
  assert.equal(p.bg, '#000000'); assert.match(p.fg, HEX); assert.equal(p.radius, 40); assert.ok(!String(p.frame || '').startsWith('javascript')); assert.equal(p.font, 'data:font/ttf;base64,AAEAAA'); assert.equal(p.head.length, 60);
});
test('carExport carries panel {light,dark}; without panelSrc stays 0.9.10-shaped', async () => {
  const st = { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background' }] };
  const a = await carExport(async () => ({ style: structuredClone(st), sprite: null }), 'http://x/', m => carPanelSpec({ theme: 'nord', mode: m }));
  assert.ok(a.panel?.light && a.panel?.dark); sane(a.panel.dark, 'export');
  const b = await carExport(async () => ({ style: structuredClone(st), sprite: null }), 'http://x/');
  assert.ok(b.light && b.dark);
});
