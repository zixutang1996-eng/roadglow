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
const bi = (id, zh, en) => ({ type: 'skin', id: 'builtin-' + id, base: id, builtin: true, name: { zh, en }, version: APP });
const idx = { format: 'roadglow-catalog/1', updated: new Date().toISOString().slice(0, 10), packs: [
  bi('neon', '霓虹都市', 'Neon City'), bi('west', '荒野墨图', 'Frontier Ink'), bi('space', '深空', 'Deep Space'), bi('nord', '北境', 'Northland'), bi('tac', '战术', 'Tactical'),
  { type: 'skin', id: 'blueprint', name: bp.name, description: bp.description, version: bp.version, minAppVersion: bp.minAppVersion, url: `blueprint-1.1.0.rgpack`, sha256: sha(bpZ), size: bpZ.length },
  { type: 'voice', id: 'calm', name: calm.name, description: calm.description, version: calm.version, minAppVersion: calm.minAppVersion, url: `calm-1.0.0.rgpack`, sha256: sha(calmZ), size: calmZ.length },
] };
fs.writeFileSync(`${D}/index.json`, JSON.stringify(idx, null, 1)); console.log('packs ok', idx.packs.length);
