// v0.9.16 For Hunters / 猎人模式: downloadable Alberta overlay pack (Government of Alberta open data, OGL–Alberta).
// Pack = gzip JSON {format:'roadglow-overlay/1', layers:{id: FeatureCollection}}, hosted on GitHub Pages (not bundled in the APK),
// stored in IndexedDB, drawn as MapLibre GeoJSON sources (geojson-vt tiles in the worker → smooth at any zoom).
import { gunzipSync, strFromU8 } from 'fflate';
export const PACK = { id: 'alberta-hunters', version: '1.0.0', file: 'alberta-hunters-1.0.0.json.gz', sha: 'c3bde4e68a1dffdbb016db7dec6ffcece8da8ef4fddce344a1f941a079caab61', bytes: 2095541 };
const PAGES = 'https://zixutang1996-eng.github.io/roadglow/hunt/';
// id, zh, en, colour, default-on, label property, kind
export const DEFS = [
  ['wmu', '狩猎区 WMU（编号）', 'Wildlife Management Units (WMU)', '#ff7a00', 1, 'WMUNIT_CODE'],
  ['gwa', '绿区（多为公有林地）/ 白区（多为私有农地）', 'Green / White Area', '#2e9d4a', 1, 'GWA_NAME'],
  ['pluz', '公有土地使用区 PLUZ', 'Public Land Use Zones', '#b05cff', 1, 'PLUZ_NAME'],
  ['plra', '公有土地休闲区', 'Public Land Recreation Areas', '#00a6c8', 0, 'PLREC_NAME'],
  ['rmfr', '落基山森林保护区', 'Rocky Mountains Forest Reserve', '#5f8f2f', 0, 'ROCKYMTN_NAME'],
  ['eslu', '东坡土地利用分区', 'Eastern Slopes land-use zoning', '#8a7a3a', 0, 'ESLUZ_NAME'],
  ['parks', '公园与保护区（多数禁猎或限猎）', 'Parks & protected areas', '#e0245e', 1, 'NAME'],
  ['ir', '第一民族保留地（需许可）', 'First Nations reserves', '#c08a00', 1, 'IRES_NAME'],
  ['metis', '梅蒂斯定居点', 'Métis Settlements', '#c08a00', 1, 'METIS_NAME'],
  ['dnd', '国防部靶场 / 军事基地（禁止进入）', 'DND ranges & bases', '#d00000', 1, 'MB_NAME'],
  ['graze', '放牧租赁地（须联系承租人）', 'Grazing leases (contact leaseholder)', '#a0522d', 0, 'COMMON_NAME'],
];
const LAB = { dnd: 'AWR_NAME', dndb: 'MB_NAME' };
const db = () => new Promise((res, rej) => { const r = indexedDB.open('rg-hunt', 1); r.onupgradeneeded = () => r.result.createObjectStore('p'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const tx = async (m, f) => { const d = await db(); return new Promise((res, rej) => { const t = d.transaction('p', m), s = t.objectStore('p'), q = f(s); t.oncomplete = () => res(q?.result); t.onerror = () => rej(t.error); }); };
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
let DATA = null, map = null, store = null;
export const meta = () => store.get('huntPack', null);
export const on = () => !!store.get('huntOn', false) && !!meta();
export const layerOn = id => { const s = store.get('huntLy', null); return s ? !!s[id] : !!DEFS.find(d => d[0] === id)?.[4]; };
async function load() { if (DATA) return DATA; const u8 = await tx('readonly', s => s.get('pack')); if (!u8) return null; DATA = JSON.parse(strFromU8(gunzipSync(new Uint8Array(u8)))); return DATA; }
export async function download(onProg) {
  const r = await fetch(PAGES + PACK.file, { cache: 'no-cache' }); if (!r.ok) throw new Error('HTTP ' + r.status);
  const tot = +r.headers.get('content-length') || 0, rd = r.body.getReader(), parts = []; let n = 0;
  for (;;) { const { done, value } = await rd.read(); if (done) break; parts.push(value); n += value.length; onProg?.(n, tot); }
  const u8 = new Uint8Array(n); let o = 0; for (const p of parts) { u8.set(p, o); o += p.length; }
  const sha = hex(await crypto.subtle.digest('SHA-256', u8)); if (!PACK.sha.startsWith('__') && sha !== PACK.sha) throw new Error('SHA-256 mismatch');
  const j = JSON.parse(strFromU8(gunzipSync(u8))); if (j.format !== 'roadglow-overlay/1') throw new Error('bad pack');
  await tx('readwrite', s => s.put(u8.buffer, 'pack')); DATA = j;
  store.set('huntPack', { version: j.version, built: j.built, bytes: n, at: Date.now() }); return j;
}
export async function remove() { await tx('readwrite', s => s.delete('pack')); DATA = null; store.set('huntPack', null); store.set('huntOn', false); clear(); }
const IDS = () => DEFS.flatMap(d => d[0] === 'dnd' ? ['dnd', 'dndb'] : [d[0]]);
function clear() { if (!map?.getStyle()) return; for (const id of IDS()) { for (const s of ['-f', '-l', '-t']) if (map.getLayer('hu-' + id + s)) map.removeLayer('hu-' + id + s); if (map.getSource('hu-' + id)) map.removeSource('hu-' + id); } }
export async function apply() {
  if (!map?.getStyle()) return; clear(); if (!on()) return; const d = await load(); if (!d || !on()) return;
  const dark = document.body.classList.contains('dark') || /dark|night/.test(document.body.className);
  const before = map.getStyle().layers.find(l => l.type === 'symbol')?.id; const font = map.getStyle().layers.find(l => l.id === 'poi')?.layout?.['text-font'] || ['Rajdhani SemiBold'];
  for (const def of DEFS) { if (!layerOn(def[0])) continue; for (const id of def[0] === 'dnd' ? ['dnd', 'dndb'] : [def[0]]) {
    const fc = d.layers[id]; if (!fc || map.getSource('hu-' + id)) continue; const c = def[3], big = id === 'wmu' || id === 'gwa';
    map.addSource('hu-' + id, { type: 'geojson', data: fc, tolerance: 0.6, buffer: 32 });
    map.addLayer({ id: 'hu-' + id + '-f', type: 'fill', source: 'hu-' + id, paint: { 'fill-color': c, 'fill-opacity': id === 'wmu' ? 0.03 : id === 'gwa' ? ['match', ['get', 'GWA_NAME'], 'Green Area', 0.1, 0.0] : 0.16 } }, before);
    map.addLayer({ id: 'hu-' + id + '-l', type: 'line', source: 'hu-' + id, paint: { 'line-color': c, 'line-width': big ? ['interpolate', ['linear'], ['zoom'], 5, 1, 12, 2.6] : ['interpolate', ['linear'], ['zoom'], 6, 0.6, 13, 2], 'line-opacity': 0.9, ...(id === 'wmu' ? { 'line-dasharray': [3, 1.5] } : {}) } }, before);
    if (id === 'wmu' || id === 'pluz' || id === 'parks') map.addLayer({ id: 'hu-' + id + '-t', type: 'symbol', source: 'hu-' + id, minzoom: id === 'wmu' ? 6 : 9,
      layout: { 'text-field': id === 'wmu' ? ['concat', 'WMU ', ['to-string', ['to-number', ['get', 'WMUNIT_CODE']]]] : ['get', def[5]], 'text-font': font, 'text-size': id === 'wmu' ? 15 : 12, 'symbol-placement': 'point', 'text-padding': 20 },
      paint: { 'text-color': dark ? '#ffd2a0' : c, 'text-halo-color': dark ? '#000' : '#fff', 'text-halo-width': 1.6 } });
  } }
}
/** zones containing a point (map tap): [{zh,en,name}] */
export function identify(pt) {
  if (!on()) return []; const ls = IDS().map(i => 'hu-' + i + '-f').filter(l => map.getLayer(l)); if (!ls.length) return [];
  const seen = new Set(), out = [];
  for (const f of map.queryRenderedFeatures(pt, { layers: ls })) { const id = f.layer.id.slice(3, -2), def = DEFS.find(d => d[0] === (id === 'dndb' ? 'dnd' : id)); const p = f.properties, nm = p[LAB[id] || def[5]] ?? '';
    const k = id + nm; if (seen.has(k)) continue; seen.add(k);
    out.push({ id, zh: def[1], en: def[2], name: id === 'wmu' ? `WMU ${+p.WMUNIT_CODE || p.WMUNIT_CODE}${p.WMUNIT_NAME ? ' · ' + p.WMUNIT_NAME : ''}` : String(nm), c: def[3], extra: id === 'graze' ? p.ACTIVITY_TYPE : id === 'parks' ? p.TYPE : id === 'pluz' ? p.TYPE : '' }); }
  return out.sort((a, b) => IDS().indexOf(a.id) - IDS().indexOf(b.id));
}
export function init(m, st) { map = m; store = st; map.on('style.load', () => setTimeout(() => apply().catch(() => {}), 80)); if (on()) map.once('idle', () => apply().catch(() => {})); }
