// v0.9.5 pack catalog (public/packs/index.json) + example packs. Built-ins are listed so the 皮肤与语音包 screen shows
// one list; downloadable packs are .rgpack zips with per-file SHA-256 in pack.json and a whole-file SHA-256 in the catalog.
import fs from 'fs'; import crypto from 'crypto'; import { zipSync, strToU8 } from 'fflate';
const sha = b => crypto.createHash('sha256').update(b).digest('hex'), D = 'public/packs'; fs.mkdirSync(D, { recursive: true });
const APP = JSON.parse(fs.readFileSync('package.json')).version;
function rgpack(pack, files) { const f = Object.fromEntries(Object.entries(files).map(([k, v]) => [k, typeof v === 'string' ? strToU8(v) : v]));
  pack.files = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, sha(v)])); f['pack.json'] = strToU8(JSON.stringify(pack, null, 1)); return Buffer.from(zipSync(f, { level: 9 })); }
// example skin: Blueprint (Neon recoloured cyanotype) + a small CSS theme
const bpL = fs.readFileSync('public/skins/blueprint/light.json', 'utf8'), bpD = fs.readFileSync('public/skins/blueprint/dark.json', 'utf8');
const bpCss = `/* Blueprint pack theme: scoped to the pack (body.pk-blueprint) */\nbody.pk-blueprint #searchbar::after{content:'';position:absolute;left:16px;right:16px;bottom:0;height:2px;background:#7fc4ff;opacity:.7}\n`;
const bp = { format: 'roadglow-pack/1', type: 'skin', id: 'blueprint', name: { zh: '蓝图', en: 'Blueprint' }, version: '1.1.0', minAppVersion: '0.9.5', author: 'RoadGlow example', license: 'CC0-1.0',
  description: { zh: '霓虹风格的蓝晒图配色（示例皮肤包）', en: 'Cyanotype recolour of Neon (example skin pack)' },
  skin: { base: 'neon', css: 'theme.css', modes: { light: { style: 'light.json' }, dark: { style: 'dark.json' } },
    tokens: { light: { route: '#d9480f', themeColor: '#16407a', accent: '#16407a', navCard: { bg: '#16407a', fg: '#ffffff', mapBase: '#9fb6d6', swapBg: '#ecf4ff' } }, dark: { route: '#ffb347', themeColor: '#0a1e3e', accent: '#7fc4ff', navCard: { bg: '#0f2a52', fg: '#e8f2ff', mapBase: '#0a1e3e', swapBg: '#dcecff' } } } } };
const bpZ = rgpack(bp, { 'light.json': bpL, 'dark.json': bpD, 'theme.css': bpCss }); fs.writeFileSync(`${D}/blueprint-1.1.0.rgpack`, bpZ);
// example voice: calm TTS profile with its own (original) wording
const calm = { format: 'roadglow-pack/1', type: 'voice', id: 'calm', name: { zh: '平静播报', en: 'Calm' }, version: '1.0.0', minAppVersion: '0.9.5', author: 'RoadGlow example', license: 'CC0-1.0',
  description: { zh: '语速稍慢、语调平稳的系统语音配置（示例语音包）', en: 'Slower, even system-TTS profile (example voice pack)' },
  voice: { tts: { rate: 0.92, pitch: 0.96 }, phrases: {
    zh: { left: ['左转'], right: ['右转'], slight_left: ['稍向左'], slight_right: ['稍向右'], sharp_left: ['向左急转'], sharp_right: ['向右急转'], straight: ['继续直行'], uturn: ['请掉头'], depart: ['出发'], roundabout: ['进入环岛，从第{exit}个出口驶出'], ferry: ['乘坐渡轮'], merge: ['并入车流'], in: '{dist}后，{what}', onto: '，进入{name}', reroute: ['正在重新规划'], better: ['有更快的路线，可节省{min}分钟'], arrive: ['已到达目的地'], gpslost: ['定位信号丢失'], test: '你好，这是平静播报语音。' },
    en: { left: ['Turn left'], right: ['Turn right'], slight_left: ['Keep slightly left'], slight_right: ['Keep slightly right'], sharp_left: ['Sharp left'], sharp_right: ['Sharp right'], straight: ['Continue straight'], uturn: ['Make a U-turn'], depart: ['Starting route'], roundabout: ['At the roundabout, take exit {exit}'], ferry: ['Board the ferry'], merge: ['Merge'], in: 'In {dist}, {what}', onto: ' onto {name}', reroute: ['Recalculating'], better: ['A faster route saves {min} minutes'], arrive: ['You have arrived'], gpslost: ['GPS signal lost'], test: 'Hello. This is the calm voice.' } } } };
const calmZ = rgpack(calm, {}); fs.writeFileSync(`${D}/calm-1.0.0.rgpack`, calmZ);

// 分久必合 / Three Kingdoms ink-wash skin (assets from packsrc/sanguo: python3 genink.py)
const SG = 'packsrc/sanguo', SO = `${SG}/out`, sgFiles = {};
for (const f of fs.readdirSync(SO)) if (/\.(webp|png|json)$/.test(f) && !['pads.json', 'scroll_geo.json'].includes(f)) sgFiles[f] = fs.readFileSync(`${SO}/${f}`);
for (const f of fs.readdirSync(`${SO}/fonts`)) sgFiles['fonts/' + f] = fs.readFileSync(`${SO}/fonts/${f}`);
const INK = { light: { bg: '#efe6d2', land: 'rgba(80,72,62,0.07)', park: 'rgba(70,80,60,0.13)', water: '#8f8b84', wedge: '#4a4844', bld: 'rgba(60,56,52,0.22)', bldo: 'rgba(40,36,32,0.35)', path: '#8a8278', minor: '#7a7268', sec: '#55504a', major: '#3b3733', mw: '#2a2724', rail: '#5e574e', bound: '#ac3024', lbl: '#2b2723', lbl2: '#5e5446', halo: 'rgba(239,231,212,0.9)', poi: '#6e2a20' },
  dark: { bg: '#1c1a18', land: 'rgba(220,210,190,0.04)', park: 'rgba(170,185,150,0.07)', water: '#3a3833', wedge: '#8d8576', bld: 'rgba(215,205,185,0.13)', bldo: 'rgba(215,205,185,0.25)', path: '#6a645a', minor: '#7d766b', sec: '#9a9282', major: '#bdb4a2', mw: '#e2d9c6', rail: '#7a7366', bound: '#c44a34', lbl: '#e4dac6', lbl2: '#a89e8a', halo: 'rgba(28,26,23,0.9)', poi: '#e0a08a' } };
function inkStyle(mode) {
  const c = INK[mode], st = JSON.parse(fs.readFileSync('public/styles/west_light.json', 'utf8')); delete st.sprite;
  const set = (id, k, v) => { const l = st.layers.find(x => x.id === id); if (l) { l.paint = l.paint || {}; l.paint[k] = v; } };
  const bg = st.layers.find(l => l.id === 'background'); bg.paint = { 'background-pattern': 'paper', 'background-color': c.bg };
  set('landuse', 'fill-color', c.land); set('park', 'fill-color', c.park); set('wood', 'fill-color', c.park);
  set('water', 'fill-color', c.water); set('water', 'fill-opacity', mode === 'light' ? 0.5 : 0.8); set('water-edge', 'line-color', c.wedge); set('waterway', 'line-color', c.wedge);
  set('building', 'fill-color', c.bld); set('building', 'fill-outline-color', c.bldo);
  set('path', 'line-color', c.path);
  for (const [id, col] of [['minor', c.minor], ['secondary', c.sec], ['primary', c.major], ['motorway', c.mw]]) { set(id, 'line-color', col); set(id + '-ink', 'line-color', col); set(id + '-ink', 'line-opacity', 0.35); }
  set('rail', 'line-color', c.rail); set('boundary', 'line-color', c.bound);
  for (const l of st.layers) if (l.type === 'symbol') { l.paint = { ...(l.paint || {}), 'text-color': l.id === 'poi' ? c.poi : l.id.startsWith('water') ? c.lbl2 : c.lbl, 'text-halo-color': c.halo, 'text-halo-width': 1.6 }; }
  return JSON.stringify(st);
}
sgFiles['light.json'] = inkStyle('light'); sgFiles['dark.json'] = inkStyle('dark');
sgFiles['theme.css'] = fs.readFileSync(`${SG}/theme.css`, 'utf8'); sgFiles['strings.json'] = fs.readFileSync(`${SG}/strings.json`, 'utf8');
sgFiles['LICENSE-assets.txt'] = 'Artwork in this pack (scroll, ink blobs, rider, horse, paper) was generated for the user of RoadGlow and is used with permission. Original homage to Chinese ink-wash painting; contains no game names, logos or seals.\nFonts: see fonts/OFL-*.txt (SIL Open Font License 1.1).\n';
const sg = { format: 'roadglow-pack/1', type: 'skin', id: 'sanguo', name: { zh: '分久必合', en: 'Three Kingdoms' }, version: '1.0.0', minAppVersion: '0.9.6', author: 'RoadGlow', license: 'Personal use; fonts OFL-1.1',
  description: { zh: '水墨三国：卷轴窗口、墨迹按钮、古文诗意文字、骏马为“我”', en: 'Ink-wash Three Kingdoms: hanging-scroll windows, ink-blob buttons, a horse as “me”' },
  strings: 'strings.json',
  skin: { base: 'west', css: 'theme.css', fx: ['scroll'], puck: { light: 'horse_light.png', dark: 'horse_dark.png' },
    modes: { light: { style: 'light.json', sprite: 'icons_light' }, dark: { style: 'dark.json', sprite: 'icons_dark' } },
    tokens: { light: { bg: '#efe6d2', fg: '#221e1a', muted: '#5e5446', accent: '#ac3024', chip: '#efe6d2', line: '#b9ab90', route: '#2b2724', themeColor: '#efe6d2', navCard: { bg: '#efe6d2', fg: '#221e1a', mapBase: '#e6dcc6', swapBg: '#221e1a' } },
      dark: { bg: '#1c1a18', fg: '#ddd3bf', muted: '#9a9080', accent: '#d0583f', chip: '#24211e', line: '#4a453e', route: '#e0d6c2', themeColor: '#1c1a18', navCard: { bg: '#1c1a18', fg: '#ddd3bf', mapBase: '#26231f', swapBg: '#ddd3bf' } } } } };
const sgZ = rgpack(sg, sgFiles); fs.writeFileSync(`${D}/sanguo-1.0.0.rgpack`, sgZ); console.log('sanguo pack', (sgZ.length / 1048576).toFixed(2), 'MB');
const bi = (id, zh, en) => ({ type: 'skin', id: 'builtin-' + id, base: id, builtin: true, name: { zh, en }, version: APP });
const idx = { format: 'roadglow-catalog/1', updated: new Date().toISOString().slice(0, 10), packs: [
  bi('neon', '霓虹都市', 'Neon City'), bi('west', '荒野墨图', 'Frontier Ink'), bi('space', '深空', 'Deep Space'), bi('nord', '北境', 'Northland'), bi('tac', '战术', 'Tactical'),
  { type: 'skin', id: 'blueprint', name: bp.name, description: bp.description, version: bp.version, minAppVersion: bp.minAppVersion, url: `blueprint-1.1.0.rgpack`, sha256: sha(bpZ), size: bpZ.length },
  { type: 'skin', id: 'sanguo', name: sg.name, description: sg.description, version: sg.version, minAppVersion: sg.minAppVersion, url: `sanguo-1.0.0.rgpack`, sha256: sha(sgZ), size: sgZ.length },
  { type: 'voice', id: 'calm', name: calm.name, description: calm.description, version: calm.version, minAppVersion: calm.minAppVersion, url: `calm-1.0.0.rgpack`, sha256: sha(calmZ), size: calmZ.length },
] };
fs.writeFileSync(`${D}/index.json`, JSON.stringify(idx, null, 1)); console.log('packs ok', idx.packs.length);
