// Generates built-in skin manifests and the example "blueprint" pack (hosted + single-file).
import fs from 'fs';
const P = 'public/skins'; fs.mkdirSync(`${P}/blueprint`, { recursive: true });
const meta = { format: 'roadglow-skin/1', version: '0.9.2', author: 'RoadGlow', license: 'MIT', builtin: true };
const tok = {
  neon: { light: { route: '#c2309a', themeColor: '#2a2f3c', navCard: { mapBase: '#8e94a2' } }, dark: { route: '#4fd6e8', themeColor: '#0f131c', navCard: { mapBase: '#14161f' } } },
  west: { light: { route: '#9a2a18', themeColor: '#5a3a1a', navCard: { mapBase: '#ebddbb' } }, dark: { route: '#e0a46a', themeColor: '#24170c', navCard: { mapBase: '#26201a' } } },
};
for (const [id, nm] of [['neon', { en: 'Neon', zh: '霓虹' }], ['west', { en: 'Frontier Ink', zh: '西部墨韵' }]]) {
  fs.mkdirSync(`${P}/${id}`, { recursive: true });
  fs.writeFileSync(`${P}/${id}/manifest.json`, JSON.stringify({ ...meta, id, name: nm, base: id, modes: { light: { style: `../../styles/${id}_light.json`, sprite: `../../sprites/${id}_light` }, dark: { style: `../../styles/${id}_dark.json`, sprite: `../../sprites/${id}_dark` } }, tokens: tok[id] }, null, 1));
}
// --- example pack: "Blueprint" = neon styles re-hued to cyanotype blue (sprite omitted → reuses Neon icons)
const hx = s => { let m = s.match(/^#([0-9a-f]{3,8})$/i); if (m) { let h = m[1]; if (h.length <= 4) h = [...h].map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)).concat(h.length === 8 ? parseInt(h.slice(6), 16) / 255 : 1); }
  m = s.match(/^rgba?\(([^)]+)\)$/); if (m) { const v = m[1].split(',').map(Number); return [v[0], v[1], v[2], v[3] ?? 1]; } return null; };
const rehue = (s, dark) => { const c = hx(s); if (!c) return s; const [r, g, b, a] = c, L = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const lo = dark ? [10, 30, 62] : [22, 64, 120], hi = dark ? [196, 226, 255] : [236, 244, 255]; const t = dark ? L : 0.25 + 0.75 * L;
  const o = lo.map((x, i) => Math.round(x + (hi[i] - x) * t)); return a < 1 ? `rgba(${o.join(',')},${a})` : '#' + o.map(x => x.toString(16).padStart(2, '0')).join(''); };
const walk = (v, d) => typeof v === 'string' ? rehue(v, d) : Array.isArray(v) ? v.map(x => walk(x, d)) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x, d)])) : v;
const mk = m => { const st = JSON.parse(fs.readFileSync(`public/styles/neon_${m}.json`)); for (const l of st.layers) if (l.paint) for (const k of Object.keys(l.paint)) if (/color/.test(k)) l.paint[k] = walk(l.paint[k], m === 'dark'); delete st.sprite; delete st.glyphs; st.name = `Blueprint ${m}`; return st; };
const bp = { format: 'roadglow-skin/1', id: 'blueprint', name: { en: 'Blueprint', zh: '蓝图' }, version: '1.0.0', author: 'RoadGlow example', license: 'CC0-1.0', base: 'neon',
  description: { en: 'Cyanotype blueprint recolour of Neon. Example skin pack.', zh: '霓虹风格的蓝晒图配色，示例皮肤包。' }, minApp: '0.9.2',
  modes: { light: { style: 'light.json' }, dark: { style: 'dark.json' } },
  tokens: { light: { route: '#d9480f', themeColor: '#16407a', accent: '#16407a', navCard: { bg: '#16407a', fg: '#ffffff', mapBase: '#9fb6d6', swapBg: '#ecf4ff' } },
            dark: { route: '#ffb347', themeColor: '#0a1e3e', accent: '#7fc4ff', navCard: { bg: '#0f2a52', fg: '#e8f2ff', mapBase: '#0a1e3e', swapBg: '#dcecff' } } } };
const L = mk('light'), D = mk('dark');
fs.writeFileSync(`${P}/blueprint/manifest.json`, JSON.stringify(bp, null, 1));
fs.writeFileSync(`${P}/blueprint/light.json`, JSON.stringify(L)); fs.writeFileSync(`${P}/blueprint/dark.json`, JSON.stringify(D));
fs.writeFileSync(`${P}/blueprint.rgskin.json`, JSON.stringify({ ...bp, modes: { light: { style: L }, dark: { style: D } } }));
console.log('skins ok', fs.statSync(`${P}/blueprint.rgskin.json`).size);
