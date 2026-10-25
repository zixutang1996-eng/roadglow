import { NATIVE } from './native.js';
import { BJ, BJ_CENTER, BJ_ZOOM, BJ_BOUNDS, TILE_BUNDLES, registerTileProtocol } from './bj.js';
import * as maplibregl from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';
import './v093.css';
import './v095.css';
import './v099.css';
import { PALS, PAL_DEF, recolor, applyPalVars } from './palettes.js';
import { ic, iconDefs, catIc } from './uiicons.js';
import * as AC from './ac.js';
import * as TP from './tilepoi.js';
import * as MP from './majorpoi.js';
import * as ios from './ios.js';
const AV = '?v=0.9.3'; // asset version: busts caches for styles + important-POI data
document.body.insertAdjacentHTML('afterbegin', iconDefs());
for (const [id, k] of [['menuBtn', 'menu'], ['clearBtn', 'close'], ['dirBtn', 'dir'], ['layersBtn', 'layers'], ['locBtn', 'locate']]) { const el = document.getElementById(id); if (el) el.innerHTML = ic(k); }
import { t, lang, setLang, fmtDist, fmtDur, instruction, OV, setOverrides } from './i18n.js';
import { initScrollFx, fxReopen } from './scrollfx.js';
import { photon, photonReverse, nominatim, osmElement, nearbyCategory, nearbyCategoryNominatim, osrm, photoFor, photosFor, haversine, overpass, photonBox, reverseAddr } from './services.js';
let placeExtras = null; const tools = {}; let drawerExtra = () => ({ lists: '', tools: '' });
document.documentElement.dataset.lang = lang; const ZH = lang === 'zh', L = (zh, en) => ZH ? (OV.L[zh] || zh) : (OV.L[zh] || en);

maplibregl.setWorkerUrl(workerUrl);
if (TILE_BUNDLES) registerTileProtocol(maplibregl);
const $ = s => document.querySelector(s);
const APPVER = import.meta.env.VITE_APPVER || '';
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const store = { get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set: (k, v) => localStorage.setItem(k, JSON.stringify(v)) };
const S = { sat: store.get('sat', false), theme: store.get('theme', 'neon'), skin: store.get('skin', null), mode: store.get('mode', 'auto'), me: null, place: null, routes: null, routeIdx: 0, travel: BJ ? 'walk' : 'drive', from: null, catLayer: null, pal: PALS[store.get('pal', PAL_DEF)] ? store.get('pal', PAL_DEF) : PAL_DEF };
import * as SK from './skins.js';
let SKINS = []; const refreshSkins = async () => { try { SKINS = await SK.listInstalled(); } catch { SKINS = []; } };
export const THEMES = ['neon', 'west', 'space', 'nord', 'tac'];
// v0.9.7 'inkui' pack layout (skin.fx: ["inkui"] → <html class="fx-inkui">): extra, skin-styled blocks are prepended to the
// existing windows; the original DOM and its handlers stay (the pack CSS hides them until the user asks for details).
const INK = () => document.documentElement.classList.contains('fx-inkui');
const LIP = { star: 'M12 3.2l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z', list: 'M8.5 6h12M8.5 12h12M8.5 18h12M3.6 6h1.2M3.6 12h1.2M3.6 18h1.2', clock: 'M12 3a9 9 0 1 1 0 18 9 9 0 1 1 0-18zM12 7.2V12l3.2 2.4',
  brush: 'M20.5 3.5c-3.6 2.4-7.4 6.4-9.6 9.4M10.9 12.9c-2.2-.4-4 .9-4.4 3.1-.3 1.9-1.4 3-3 3.6 3.2 1.1 7.1.2 8-2.6.4-1.3.2-2.9-.6-4.1z', layers: 'M12 3.5l9 4.8-9 4.8-9-4.8zM3.4 12.6l8.6 4.6 8.6-4.6M3.4 16.6l8.6 4.6 8.6-4.6',
  sun: 'M12 8.4a3.6 3.6 0 1 1 0 7.2 3.6 3.6 0 1 1 0-7.2zM12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8', dl: 'M12 3.5v11M7.4 10.2l4.6 4.8 4.6-4.8M4 19.8h16',
  pin: 'M12 21s-6.5-6.6-6.5-11.3a6.5 6.5 0 0 1 13 0C18.5 14.4 12 21 12 21zM12 7.4a2.3 2.3 0 1 0 0 4.6 2.3 2.3 0 1 0 0-4.6z', heart: 'M12 20s-7.6-4.8-8.6-9.6C2.8 7.2 5 4.6 7.8 4.6c1.8 0 3.2 1.1 4.2 2.6 1-1.5 2.4-2.6 4.2-2.6 2.8 0 5 2.6 4.4 5.8C19.6 15.2 12 20 12 20z',
  cup: 'M4.5 8.5h12v5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5zM16.5 10h1.6a2.3 2.3 0 0 1 0 4.6h-1.6M8 3.5c-.8 1 .8 1.8 0 3M11.5 3.5c-.8 1 .8 1.8 0 3', go: 'M12 3l3.4 9L12 21l-3.4-9z' };
const li = (k, cls = '') => `<svg class="lic ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${LIP[k] || LIP.pin}"/></svg>`;
const CNUM = n => { const d = '〇一二三四五六七八九'; n = Math.round(n); if (n <= 10) return n === 10 ? '十' : d[n]; if (n < 20) return '十' + d[n % 10]; if (n < 100) return d[Math.floor(n / 10)] + '十' + (n % 10 ? d[n % 10] : ''); return String(n).split('').map(c => d[+c]).join(''); };
const SHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'], shiOf = h => SHI[Math.floor(((h + 1) % 24) / 2)];
const DIRZ = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'], DIRE = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const brg = (a, b) => { const r = Math.PI / 180, y = Math.sin((b.lng - a.lng) * r) * Math.cos(b.lat * r), x = Math.cos(a.lat * r) * Math.sin(b.lat * r) - Math.sin(a.lat * r) * Math.cos(b.lat * r) * Math.cos((b.lng - a.lng) * r); return (Math.atan2(y, x) / r + 360) % 360; };
const FAM = th => th === 'neon' ? 'neon' : 'west'; // CSS chrome family; new skins override tokens on top of it (v095.css)
const isDark = () => S.mode === 'dark' || (S.mode === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
const styleKey = () => `${S.theme}_${isDark() ? 'dark' : 'light'}`;
const base = new URL(import.meta.env.BASE_URL, location.href).href;

const BJ_TILES = () => TILE_BUNDLES ? 'rgt://{z}/{x}/{y}' : `${new URL(import.meta.env.BASE_URL, location.href).href}tiles/{z}/{x}/{y}.pbf`;
let _tj; const tileJSON = () => BJ ? Promise.resolve({ tiles: [BJ_TILES()], maxzoom: 14 }) : _tj ||= fetch('https://tiles.openfreemap.org/planet').then(r => r.json()).catch(e => { _tj = null; throw e; });
async function loadStyle() {
  let st, pk = null;
  if (S.skin) { try { pk = await SK.getPack(S.skin); } catch {} if (!pk) { S.skin = null; store.set('skin', null); } }
  if (pk) { S.theme = pk.base; const ps = await SK.packStyle(pk, isDark() ? 'dark' : 'light', base); st = ps.style; window.__skinTok = pk.tokens || {}; SK.applyPackCss(pk, isDark() ? 'dark' : 'light'); setOverrides(pk.strings); window.__skinPuck = pk.puck?.[isDark() ? 'dark' : 'light'] || pk.puck?.light || null; document.documentElement.classList.toggle('fx-scroll', (pk.fx || []).includes('scroll')); document.documentElement.classList.toggle('fx-inkui', (pk.fx || []).includes('inkui')); }
  else { window.__skinTok = null; SK.applyPackCss(null); setOverrides(null); window.__skinPuck = null; document.documentElement.classList.remove('fx-scroll', 'fx-inkui'); st = await (await fetch(`${base}styles/${styleKey()}.json${AV}`)).json(); st.sprite = typeof st.sprite === 'string' && st.sprite.startsWith('{SPRITE}/') && !['neon', 'west'].includes(S.theme) ? `${base}sprites/${st.sprite.slice(9)}` : `${base}sprites/${styleKey()}`; if (styleKey() === 'west_dark') recolor(st, S.pal); }
  return finishStyle(st);
}
/** shared tail of loadStyle / carStyleFor: local glyphs, offline tiles (province builds), label language, airport icon */
function finishStyle(st) {
  st.glyphs = `${base}glyphs/{fontstack}/{range}.pbf`;
  if (BJ) for (const [k, sr] of Object.entries(st.sources)) if (sr.type === 'vector' && /openfreemap/.test(sr.url || (sr.tiles || [])[0] || '')) st.sources[k] = { type: 'vector', tiles: [BJ_TILES()], minzoom: 0, maxzoom: 14, bounds: BJ_BOUNDS, attribution: '© OpenStreetMap contributors · OpenMapTiles · OpenFreeMap（离线）' };
  const nameExpr = lang === 'zh' ? ['coalesce', ['get', 'name:zh-Hans'], ['get', 'name:zh'], ['get', 'name'], ['get', 'name:en']] : ['coalesce', ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']];
  for (const l of st.layers) if (l.layout?.['text-field']) l.layout['text-field'] = nameExpr;
  const poi = st.layers.find(l => l.id === 'poi');
  if (poi) poi.layout['icon-image'] = ['case', ['==', ['get', 'class'], 'aerodrome'], 'airport', poi.layout['icon-image']];
  return st;
}
/** v0.9.10 car screen: the active skin's style for one mode, without touching the live map/UI.
 *  Packs: optional modes.<m>.car style, else the pack's map style; embedded sprite sheets are returned for export. */
async function carStyleFor(mode) {
  let st, sprite = null, route;
  const pk = S.skin ? await SK.getPack(S.skin).catch(() => null) : null;
  if (pk) {
    const m = pk.modes[mode] ? mode : (mode === 'dark' ? 'light' : 'dark'), md = pk.modes[m];
    st = structuredClone(md.car || md.style);
    if (md.sprite) { sprite = md.sprite; st.sprite = '{CAR}/sprite_' + mode; } else st.sprite = `${base}sprites/${pk.base}_${m}`;
    route = pk.tokens?.[m]?.route;
  } else {
    const key = `${S.theme}_${mode}`;
    st = await (await fetch(`${base}styles/${key}.json${AV}`)).json();
    st.sprite = typeof st.sprite === 'string' && st.sprite.startsWith('{SPRITE}/') && !['neon', 'west'].includes(S.theme) ? `${base}sprites/${st.sprite.slice(9)}` : `${base}sprites/${key}`;
    if (key === 'west_dark') recolor(st, S.pal);
    route = key === 'west_dark' ? PALS[S.pal].map.route : ROUTEC[key];
  }
  return { style: finishStyle(st), sprite, route };
}
const ROUTEC = { neon_dark: '#4fd6e8', neon_light: '#0b6f75', west_light: '#9a2a18', space_light: '#d8462b', space_dark: '#e9e6dc', nord_light: '#34312b', nord_dark: '#e8e2d0', tac_dark: '#d7ff3a', tac_light: '#e0571f' };
const routeColor = () => skinTok().route || (styleKey() === 'west_dark' ? PALS[S.pal].map.route : ROUTEC[styleKey()]);
const THEMEC = { neon_light: '#e9e4da', neon_dark: '#0f131c', west_light: '#5a3a1a', west_dark: '#24170c', space_light: '#eceae4', space_dark: '#0a0c10', nord_light: '#d9d7cf', nord_dark: '#24272a', tac_dark: '#11140f', tac_light: '#c4c1ab' };
import { ncApply, ncHtml, ncSet, ncOwn, NC_SCALES, NC_DEF } from './navcard.js';
export const skinTok = () => window.__skinTok?.[isDark() ? 'dark' : 'light'] || {};
// v0.9.5 per-skin UI fonts (OFL, Latin subsets): loaded only when that skin is selected, at idle; html.f-<skin> flips CSS to them.
const SKFONTS = { space: [['Space Grotesk', 'SpaceGrotesk-var.woff2', '300 700'], ['IBM Plex Mono', 'IBMPlexMono-500.woff2', '400 500'], ['IBM Plex Mono', 'IBMPlexMono-600.woff2', '600 700']],
  nord: [['Cinzel', 'Cinzel-var.woff2', '400 900'], ['Cormorant Garamond', 'Cormorant-var.woff2', '300 700']],
  tac: [['Barlow Condensed', 'BarlowCondensed-500.woff2', '400 500'], ['Barlow Condensed', 'BarlowCondensed-600.woff2', '600'], ['Barlow Condensed', 'BarlowCondensed-700.woff2', '700 900'], ['IBM Plex Mono', 'IBMPlexMono-500.woff2', '400 500']] };
const skFontsP = {};
function loadSkinFonts() {
  const k = S.theme; if (!SKFONTS[k] || skFontsP[k] || !('FontFace' in window)) return;
  skFontsP[k] = 1; const ur = 'U+0000-00FF,U+0131,U+0152-0153,U+2000-206F,U+2190-21FF,U+2212,U+25A0-25FF';
  (window.requestIdleCallback || (f => setTimeout(f, 200)))(() => Promise.all(SKFONTS[k].map(([f, file, w]) => new FontFace(f, `url(${base}fonts/${file}) format("woff2")`, { weight: w, display: 'swap', unicodeRange: ur }).load().then(x => document.fonts.add(x))))
    .then(() => document.documentElement.classList.add('f-' + k)).catch(e => console.warn('fonts', e)), { timeout: 1500 });
}
// v0.9.3 F3 fonts (Frontier Ink only): lazy-loaded after first render via FontFace (swap); system serif until ready.
let fontsP = null;
function loadWestFonts() {
  if (fontsP || S.theme !== 'west' || S.skin || !('FontFace' in window)) return;
  const u = f => `url(${base}fonts/${f}) format("woff2")`;
  const go = () => { fontsP = Promise.all([
    new FontFace('Alegreya', u('Alegreya-500.woff2'), { weight: '400 600', display: 'swap', unicodeRange: 'U+0000-024F,U+2000-206F,U+20AC,U+2190-21FF' }),
    new FontFace('Alegreya', u('Alegreya-700.woff2'), { weight: '700 900', display: 'swap', unicodeRange: 'U+0000-024F,U+2000-206F,U+20AC,U+2190-21FF' }),
    new FontFace('LXGW WenKai UI', u('WenKaiM-ui.woff2'), { weight: '100 900', display: 'swap', unicodeRange: 'U+2E80-9FFF,U+FF00-FFEF' }),
  ].map(f => f.load().then(x => (document.fonts.add(x), x)))).then(() => document.documentElement.classList.add('f093')).catch(e => console.warn('fonts', e)); };
  (window.requestIdleCallback || (f => setTimeout(f, 300)))(go, { timeout: 2500 });
}
function applyBodyClass() { const tc = document.getElementById('themeColor'); if (tc) tc.content = skinTok().themeColor || (styleKey() === 'west_dark' && !S.skin ? PALS[S.pal].ui.theme : THEMEC[styleKey()]) || '#101521'; document.body.className = `${FAM(S.theme)} sk-${S.theme} ${isDark() ? 'dark' : 'light'}${$('#panel').classList.contains('hidden') ? '' : ' panel-open'}${$('#panel').classList.contains('collapsed') ? ' panel-collapsed' : ''} p-${S.pal}${S.skin ? ' pk-' + S.skin : ''}${document.body.classList.contains('navon') ? ' navon' : ''}`; applyPalVars(S.pal, styleKey() === 'west_dark' && !S.skin); ncOwn(styleKey(), styleKey() === 'west_dark' && !S.skin ? PALS[S.pal].ui.bg : null, styleKey() === 'west_dark' && !S.skin ? PALS[S.pal].map.land : null); SK.applyTokens(skinTok()); ncApply(styleKey(), skinTok().navCard); if (window._map) { loadWestFonts(); loadSkinFonts(); } }

// ---------- map ----------
const hash = location.hash.slice(1).split('/').map(Number);
// v0.9.2h robust boot: sanitize old settings, style the chrome first, never die on a bad skin, explain missing WebGL2
if (!THEMES.includes(S.theme)) { S.theme = 'neon'; store.set('theme', 'neon'); }
if (!['auto', 'light', 'dark'].includes(S.mode)) { S.mode = 'auto'; store.set('mode', 'auto'); }
for (const k of ['textScale', 'iconScale']) { const v = store.get(k, 1); if (!(v >= 0.8 && v <= 2)) store.set(k, 1); }
try { applyBodyClass(); } catch (e) { console.warn('bodyclass', e); }
let bootStyle;
try { bootStyle = await loadStyle(); } catch (e) { console.warn('style/skin failed, falling back to built-in', e); S.skin = null; store.set('skin', null); window.__skinTok = null; try { bootStyle = await loadStyle(); } catch (e2) { S.theme = 'neon'; store.set('theme', 'neon'); bootStyle = await loadStyle(); } }
function bootFail(e) {
  const gl = /WebGL/i.test(e?.message || '');
  const el = document.createElement('div'); el.className = 'card'; el.id = 'bootFail'; el.setAttribute('role', 'alert');
  el.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:50;max-width:min(520px,90vw);padding:18px 20px;line-height:1.5';
  el.innerHTML = gl ? `<b>${L('地图无法显示：浏览器未启用 WebGL2', 'The map can’t be shown: WebGL2 is not available in this browser')}</b>
    <div style="margin-top:8px">${L('请在浏览器设置中开启“使用图形加速/硬件加速”，然后完全重启浏览器。Edge：edge://settings/system；Chrome：chrome://settings/system；Firefox：about:preferences 中的“使用推荐的性能设置”。也可打开 edge://gpu 或 chrome://gpu 检查 WebGL2 状态，或更新显卡驱动。',
      'Turn on “Use graphics/hardware acceleration when available” and fully restart the browser. Edge: edge://settings/system · Chrome: chrome://settings/system · Firefox: about:preferences → Performance. You can check edge://gpu or chrome://gpu for “WebGL2”, or update your graphics driver.')}</div>`
    : `<b>${L('地图加载失败', 'The map failed to load')}</b><div style="margin-top:8px">${esc(e?.message || e)}</div><button class="btn" style="margin-top:10px" onclick="localStorage.removeItem('skin');location.reload()">${L('重置皮肤并重新加载', 'Reset skin and reload')}</button>`;
  document.body.appendChild(el);
}
// v0.9.4 start view (never Edmonton by default): URL hash → last saved view → (Beijing edition: Chaoyang) → neutral world view,
// then, without blocking the first render, refine: coarse device fix if permission is already granted, else city-level IP lookup.
// v0.9.13: start on the user's real position. Order: explicit URL hash (web only) → last real GPS fix → last saved view → world view;
// then ALWAYS refine with a live fix (cold start and every resume). IP lookup only if we have never had a GPS fix.
const HASHOK = !(window.Capacitor?.isNativePlatform?.()) && hash.length >= 3 && !hash.some(isNaN), SAVEDV = store.get('view', null), LASTFIX = store.get('lastFix', null);
const START = HASHOK ? { center: [hash[2], hash[1]], zoom: hash[0] } : LASTFIX ? { center: [LASTFIX.lng, LASTFIX.lat], zoom: 14 } : SAVEDV?.c ? { center: SAVEDV.c, zoom: SAVEDV.z } : BJ ? { center: BJ_CENTER, zoom: BJ_ZOOM } : { center: [10, 28], zoom: 1.6 };
const NEED_LOC = !HASHOK && !BJ;
let map;
try { map = new maplibregl.Map({
  container: 'map', style: bootStyle,
  center: START.center, zoom: START.zoom,
  attributionControl: { compact: true }, hash: false, maxPitch: 70, fadeDuration: 150, localIdeographFontFamily: '"PingFang SC","Noto Sans CJK SC","Microsoft YaHei",sans-serif',

}); } catch (e) { bootFail(e); throw e; }
let userMoved = false; map.on('dragstart', () => userMoved = true); map.on('zoomstart', e => { if (e.originalEvent) userMoved = true; });
map.on('moveend', () => { const c = map.getCenter(); store.set('view', { c: [+c.lng.toFixed(5), +c.lat.toFixed(5)], z: +map.getZoom().toFixed(2) }); });
const startLoc = async (resume = false) => {
  let moved = false; const t0 = Date.now();
  const go = (lng, lat, z) => { if (moved || S.nav?.active || !isFinite(lng) || !isFinite(lat) || (userMoved && !resume)) return; map.easeTo({ center: [lng, lat], zoom: Math.max(z, resume ? map.getZoom() : 0), duration: resume ? 500 : 900 }); };
  const fix = (o) => new Promise((ok, no) => navigator.geolocation ? navigator.geolocation.getCurrentPosition(ok, no, o) : no(0));
  const got = (p, final) => { store.set('lastFix', { lng: p.coords.longitude, lat: p.coords.latitude, t: Date.now() }); go(p.coords.longitude, p.coords.latitude, 15); if (final) moved = true; };
  try { got(await fix({ enableHighAccuracy: false, timeout: 3000, maximumAge: 5 * 60e3 }), false); } catch {}
  try { got(await fix({ enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }), true); return; } catch {}
  if (store.get('lastFix', null) || resume) return; // never let a coarse IP guess override a real fix
  try { // city-level IP lookup (ipapi.co, no key), cached 7 days — only before the first ever GPS fix
    let g = store.get('ipGeo', null);
    if (!g || Date.now() - g.t > 7 * 864e5) { const r = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout ? AbortSignal.timeout(1500) : undefined, credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store' }); const j = await r.json(); if (!(isFinite(j.latitude) && isFinite(j.longitude))) throw 0; g = { lng: j.longitude, lat: j.latitude, t: Date.now() }; store.set('ipGeo', g); }
    if (!store.get('lastFix', null) && Date.now() - t0 < 20000) go(g.lng, g.lat, 10.5);
  } catch {}
};
if (NEED_LOC) { setTimeout(() => startLoc(false), 0); let hid = 0; document.addEventListener('visibilitychange', () => { if (document.hidden) hid = Date.now(); else if (hid && Date.now() - hid > 60e3) startLoc(true); }); }
initScrollFx(); window._map = map; map.once('load', () => { window.__rgMapReady = 1; window.__rgHideSplash?.(); window.__rgT = performance.now(); }); map.once('load', loadWestFonts); map.once('load', loadSkinFonts); map.once('idle', () => setTimeout(() => (window.requestIdleCallback || setTimeout)(warmDrawer, { timeout: 3000 }), 1500)); if (NATIVE && !BJ) map.once('load', () => setTimeout(() => import('./updates.js').then(m => m.initUpdates({ toast, L, store, openUpd: () => tools.update() })).catch(e => console.warn(e)), 4000)); SK.hookMissingImages(map); refreshSkins(); import('./car.js').then(m => m.initCar({ map, S, isDark, lang, carStyleFor, panelSrc: async () => ({ pk: S.skin ? await SK.getPack(S.skin).catch(() => null) : null, theme: S.theme, pal: S.theme === 'west' ? { accent: PALS[S.pal]?.map?.route } : null }), panelOn: () => store.get('carPanel', true), onDest: d => { S.travel = 'drive'; openDirections(d, true); }, onStop: () => S.nav?.end?.() })).catch(e => console.warn(e)); window._skins = { ...SK, refresh: refreshSkins, use: async id => { S.skin = id; store.set('skin', id); await setStyle(); } }; window._sug = () => sugItems.map(r => ({ dbg: [r.ts, r.sc, Math.round(r.dist), r.src].join('/'), name: r.name, address: r.address, lat: r.lat, lng: r.lng, sem: !!r.sem, src: r.src, cls: r.cls || r.category }));
applyBodyClass();
const updHash = () => { const c = map.getCenter(); history.replaceState(null, '', `${location.pathname}${location.search}#${map.getZoom().toFixed(2)}/${c.lat.toFixed(5)}/${c.lng.toFixed(5)}`); };
map.on('moveend', updHash);
map.on('rotate', () => { $('#needle').style.transform = `rotate(${-90 - map.getBearing()}deg)`; });

// Pre-compile the circle shader (pin) at idle so the first place card doesn't stall on GL program link.
function warmPinShader() { if (S.place || S.nav) return; const src = map.getSource('pins'); if (!src || !map.getLayer('pins')) return;
  const c = map.getCenter(), op = ['circle-opacity', 'circle-stroke-opacity']; op.forEach(k => map.setPaintProperty('pins', k, 0.01));
  src.setData({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [c.lng, c.lat] } }] });
  map.once('idle', () => { op.forEach(k => map.setPaintProperty('pins', k, 1)); if (!S.place) src.setData({ type: 'FeatureCollection', features: [] }); else drawPin(); }); }
map.on('style.load', () => map.once('idle', () => setTimeout(warmPinShader, 600)));
function addOverlays() {
  const empty = { type: 'FeatureCollection', features: [] };
  for (const id of ['route-alt', 'route', 'pins', 'cat']) if (!map.getSource(id)) map.addSource(id, { type: 'geojson', data: empty });
  const c = routeColor(), dk = isDark();
  map.addLayer({ id: 'route-alt', type: 'line', source: 'route-alt', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': dk ? '#6b7280' : '#9aa0a6', 'line-width': 6, 'line-opacity': 0.8 } });
  const tk = skinTok(), rl = { 'line-join': 'round', 'line-cap': 'round' };
  map.addLayer({ id: 'route-case', type: 'line', source: 'route', layout: rl, paint: tk.routeGlow ? { 'line-color': tk.routeGlow, 'line-width': 22, 'line-blur': 8, 'line-opacity': tk.routeGlowOp ?? 0.4 } : { 'line-color': dk ? '#05070c' : '#ffffff', 'line-width': 10 } });
  map.addLayer({ id: 'route', type: 'line', source: 'route', layout: rl, paint: { 'line-color': c, 'line-width': tk.routeWidth || 6 } });
  if (tk.routeCore) map.addLayer({ id: 'route-core', type: 'line', source: 'route', layout: rl, paint: { 'line-color': tk.routeCore, 'line-width': 1.6, 'line-opacity': tk.routeCoreOp ?? 0.7 } });
  map.addLayer({ id: 'cat', type: 'symbol', source: 'cat', layout: { 'icon-image': ['get', 'icon'], 'icon-allow-overlap': true, 'text-field': ['get', 'name'], 'text-font': map.getStyle().layers.find(l => l.id === 'poi')?.layout['text-font'] || ['Rajdhani SemiBold'], 'text-size': 12, 'text-offset': [0, 1.1], 'text-anchor': 'top', 'text-optional': true }, paint: { 'text-color': c, 'text-halo-color': dk ? '#000' : '#fff', 'text-halo-width': 1.4 } });
  map.addLayer({ id: 'pins', type: 'circle', source: 'pins', paint: { 'circle-radius': 9, 'circle-color': c, 'circle-stroke-width': 3, 'circle-stroke-color': dk ? '#000' : '#fff' } });
  if (S.sat) addSatellite();
  if (!map.getSource('saved')) map.addSource('saved', { type: 'geojson', data: savedFC() });
  map.addLayer({ id: 'saved-dot', type: 'circle', source: 'saved', paint: { 'circle-radius': 8, 'circle-color': '#f2b600', 'circle-stroke-width': 2.5, 'circle-stroke-color': dk ? '#000' : '#fff' } });
  map.addLayer({ id: 'saved-label', type: 'symbol', source: 'saved', layout: { 'text-field': ['get', 'name'], 'text-font': map.getStyle().layers.find(l => l.id === 'poi')?.layout['text-font'] || ['Rajdhani SemiBold'], 'text-size': 15, 'text-offset': [0, 1.1], 'text-anchor': 'top', 'text-allow-overlap': true }, paint: { 'text-color': dk ? '#ffd65c' : '#7a5600', 'text-halo-color': dk ? '#000' : '#fff', 'text-halo-width': 2 } });
  addAccLayer(); addImportant(); setTimeout(applySizes, 0);
  drawRoutes(); drawPin(); if (S.catData) map.getSource('cat').setData(S.catData);
}
map.on('load', addOverlays);
// v0.6: snappier zoom (≈30% shorter tap/button animations, faster wheel)
map.scrollZoom.setWheelZoomRate(1 / 320); map.scrollZoom.setZoomRate(1 / 75);
{ const ez = map.easeTo.bind(map); map.easeTo = (o, ev) => { if (o && o.duration === 300 && o.zoom !== undefined && ev?.originalEvent) o = { ...o, duration: 210 }; return ez(o, ev); }; }
// important POIs for z11.5–14 (prebuilt from the OSM Alberta extract; tiles take over from z14)
// v0.7b continuous rank-based POI reveal: all named Edmonton-area POIs (prebuilt from OSM, tools/genpois.py) each carry a reveal zoom rz.
// Layer filters are evaluated at integer zoom, but layer minzoom is fractional, so features are banded into 0.25-zoom layers:
// band b has minzoom b and fades in from b to b+0.6. More important bands are added last (on top) so they win collisions.
const BANDS = []; for (let b = 9.75; b <= 17.5; b += 0.25) BANDS.push(+b.toFixed(2));
const IMP = BANDS.map(b => 'rp' + String(b).replace('.', '_'));
const YEG = [[-113.85, 53.35], [-113.15, 53.35], [-113.15, 53.72], [-113.85, 53.72], [-113.85, 53.35]];
function addImportant() {
  if (!map.getSource('imp')) map.addSource('imp', { type: 'geojson', data: `${base}${BJ ? 'bj_imp' : 'pois_yeg'}.geojson${AV}`, buffer: 64, tolerance: 0 });
  const poi = map.getStyle().layers.find(l => l.id === 'poi'); if (!poi) return;
  // vector-tile POIs only outside the covered area (fallback), so nothing pops in at z14 inside Edmonton
  const f0 = baseFilters.poi ||= poi.filter;
  // clutter rule for the tile fallback too: must have a name (except toilets/ATM/parking from z17), never gates/bollards/benches/bins/etc.
  const DENY = ['gate', 'bollard', 'lift_gate', 'kerb', 'cycle_barrier', 'bench', 'waste_basket', 'bicycle_parking', 'vending_machine', 'parking_entrance', 'street_lamp', 'fire_hydrant', 'manhole', 'pole', 'shelter', 'entrance', 'recycling', 'drinking_water', 'post_box', 'telephone', 'swimming_pool', 'pitch'];
  const clean = ['all', ['!', ['in', ['get', 'subclass'], ['literal', DENY]]], ['!', ['in', ['get', 'class'], ['literal', DENY]]],
    ['any', ['has', 'name'], ['all', ['>=', ['zoom'], 17], ['in', ['get', 'class'], ['literal', ['toilets', 'atm', 'parking']]]]]];
  const outside = ['!', ['within', { type: 'Polygon', coordinates: [YEG] }]];
  map.setLayoutProperty('poi', 'visibility', 'none'); // replaced by decoded tile POIs (tpoi bands) outside Edmonton
  if (!map.getSource('tpoi')) map.addSource('tpoi', { type: 'geojson', data: TPOI || { type: 'FeatureCollection', features: [] }, buffer: 64, tolerance: 0 });
  for (const id of [...TPI, 'tp-air']) if (map.getLayer(id)) map.removeLayer(id);
  const before = map.getLayer('saved-dot') ? 'saved-dot' : undefined;
  const lay = (b, extra) => ({ 'icon-image': poi.layout['icon-image'], 'icon-size': ['interpolate', ['linear'], ['zoom'], 10.75, 0.72, 14, 0.95, 17, 1.05], 'text-field': poi.layout['text-field'], 'text-font': poi.layout['text-font'],
    'text-size': ['interpolate', ['linear'], ['zoom'], 10.75, 13.5, 14, 16.5, 17, 18], 'text-anchor': 'top', 'text-offset': [0, 1.1], 'text-optional': true, 'text-max-width': 7, 'icon-padding': 0, 'text-padding': 1, ...extra });
  const pnt = b => { const op = ['interpolate', ['linear'], ['zoom'], b, 0.55, b + 0.4, 1]; return { 'icon-opacity': op, 'text-opacity': op, 'text-color': poi.paint['text-color'], 'text-halo-color': poi.paint['text-halo-color'], 'text-halo-width': poi.paint['text-halo-width'] }; };
  // airports world-wide from z9.75 (aerodrome_label exists from z8 in the tiles); Alberta airports come from the prebuilt dataset
  map.addLayer({ id: 'tp-air', type: 'symbol', source: 'omt', 'source-layer': 'aerodrome_label', minzoom: 9.75, filter: ['all', ['has', 'name'], ['any', ['has', 'iata'], ['>=', ['zoom'], 11]], ['!', ['within', { type: 'Polygon', coordinates: [AB] }]]],
    layout: lay(9.75, { 'icon-image': 'airport', 'symbol-sort-key': 0 }), paint: pnt(9.75) }, before);
  for (let i = TPB.length - 1; i >= 0; i--) { const b = TPB[i];
    map.addLayer({ id: TPI[i], type: 'symbol', source: 'tpoi', minzoom: b, filter: ['all', ['>=', ['get', 'rz'], b], ['<', ['get', 'rz'], b + 0.25]],
      layout: lay(b, { 'symbol-sort-key': ['get', 'rz'] }), paint: pnt(b) }, before); }
  if (!map.getSource('mpoi')) map.addSource('mpoi', { type: 'geojson', data: MPOI || { type: 'FeatureCollection', features: [] } });
  for (const id of MPI) if (map.getLayer(id)) map.removeLayer(id);
  for (let i = MPB.length - 1; i >= 0; i--) { const b = MPB[i];
    map.addLayer({ id: MPI[i], type: 'symbol', source: 'mpoi', minzoom: b, maxzoom: 12, filter: ['all', ['>=', ['get', 'rz'], b], ['<', ['get', 'rz'], b + 0.25]], layout: lay(b, { 'symbol-sort-key': ['get', 'rz'] }), paint: pnt(b) }, before); }
  refreshTpoi(); refreshMpoi();
  for (let i = BANDS.length - 1; i >= 0; i--) {
    const b = BANDS[i], id = IMP[i];
    const op = ['interpolate', ['linear'], ['zoom'], b, 0.55, b + 0.4, 1];
    if (map.getLayer(id)) map.removeLayer(id);
    map.addLayer({ id, type: 'symbol', source: 'imp', minzoom: b, filter: ['all', ['>=', ['get', 'rz'], b], ['<', ['get', 'rz'], b + 0.25]],
      layout: { 'icon-image': poi.layout['icon-image'], 'icon-size': ['interpolate', ['linear'], ['zoom'], 10.75, 0.72, 14, 0.95, 17, 1.05], 'text-field': poi.layout['text-field'], 'text-font': poi.layout['text-font'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 10.75, 13.5, 14, 16.5, 17, 18], 'text-anchor': 'top', 'text-offset': [0, 1.1], 'text-optional': true, 'text-max-width': 7, 'symbol-sort-key': ['-', 200, ['get', 'sc']], 'icon-padding': 0, 'text-padding': 1 },
      paint: { 'icon-opacity': op, 'text-opacity': op, 'text-color': poi.paint['text-color'], 'text-halo-color': poi.paint['text-halo-color'], 'text-halo-width': poi.paint['text-halo-width'] } }, map.getLayer('saved-dot') ? 'saved-dot' : undefined);
  }
}
const baseFilters = {};
// v0.9.2 reveal zoom for tile POIs: class tier + per-tile rank (OpenMapTiles rank = importance order inside each z14 tile, so the reveal stays evenly spread)
const AB = [[-120, 49], [-110, 49], [-110, 60], [-120, 60], [-120, 49]];
const TPB = []; for (let b = 12; b <= 16.5; b += 0.25) TPB.push(+b.toFixed(2));
const TPI = TPB.map(b => 'tp' + String(b).replace('.', '_'));
let TPOI = null, tpT = 0, MPOI = null, mpT = 0;
const MPB = []; for (let b = 9.75; b <= 11.75; b += 0.25) MPB.push(+b.toFixed(2));
const MPI = MPB.map(b => 'mp' + String(b).replace('.', '_'));
async function refreshMpoi() {
  const z = map.getZoom(); if (z < 9.5 || z >= 12 || !map.getSource('mpoi')) return; const my = ++mpT;
  const fc = await MP.majorFor(map.getBounds(), c => !inYEG(c)); if (!fc || my !== mpT) return; MPOI = fc; map.getSource('mpoi')?.setData(fc);
}
map.on('moveend', refreshMpoi);
const inYEG = ([x, y]) => x > YEG[0][0] && x < YEG[1][0] && y > YEG[0][1] && y < YEG[2][1];
async function refreshTpoi() {
  if (map.getZoom() < 11.9 || !map.getSource('tpoi')) return; const my = ++tpT;
  let tj; try { tj = await tileJSON(); } catch { return; }
  const fc = await TP.poisFor(map.getBounds(), tj.tiles[0], c => !inYEG(c), 48); if (!fc || my !== tpT) return;
  TPOI = fc; map.getSource('tpoi')?.setData(fc);
}
map.on('moveend', refreshTpoi);
const TSCORE = ['+', ['case',
  ['in', ['get', 'subclass'], ['literal', ['mall', 'department_store', 'station', 'aerodrome', 'university', 'stadium', 'zoo', 'theme_park', 'ferry_terminal']]], 12,
  ['in', ['get', 'class'], ['literal', ['hospital', 'railway', 'college', 'stadium', 'museum', 'zoo', 'town_hall', 'ferry_terminal', 'attraction', 'castle']]], 12,
  ['in', ['get', 'class'], ['literal', ['grocery', 'supermarket', 'fuel', 'pharmacy', 'library', 'lodging', 'cinema', 'theatre', 'school', 'police', 'fire_station', 'monument', 'campsite']]], 12.5,
  ['in', ['get', 'class'], ['literal', ['restaurant', 'fast_food', 'cafe', 'bank', 'bar', 'pub', 'park', 'shop', 'place_of_worship', 'post']]], 13,
  ['==', ['get', 'class'], 'bus'], 14.75, 13.75],
  ['*', 0.05, ['-', ['min', ['coalesce', ['get', 'rank'], 40], 40], 1]]]; // must match tilepoi.js rzOf
// custom scale bar with round metric steps
const scaleEl = document.createElement('div'); scaleEl.id = 'scale'; scaleEl.innerHTML = '<div class="sbar"></div><span></span>'; document.body.appendChild(scaleEl);
const STEPS = [5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000];
// v0.9.3: rAF-coalesced, cached container height (no layout read per move frame), DOM writes only when the value changes
let scH = 0, scRaf = 0, scLast = '';
const scMeasure = () => { scH = map.getContainer().clientHeight; };
function updScaleNow() {
  scRaf = 0; if (!scH) scMeasure();
  const y = scH / 2, a = map.unproject([0, y]), b = map.unproject([100, y]);
  const mpp = haversine({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng }) / 100, maxW = 130;
  let m = STEPS[0]; for (const s of STEPS) if (s / mpp <= maxW) m = s;
  const w = Math.round(m / mpp), k = w + '|' + m; if (k === scLast) return; scLast = k;
  scaleEl.querySelector('.sbar').style.width = w + 'px'; scaleEl.querySelector('span').textContent = m >= 1000 ? `${m / 1000} ${ZH ? '公里' : 'km'}` : `${m} ${ZH ? '米' : 'm'}`;
}
const updScale = () => { if (!scRaf) scRaf = requestAnimationFrame(updScaleNow); };
map.on('move', updScale); map.on('load', updScale); map.on('resize', () => { scMeasure(); updScale(); });
async function setStyle() {
  store.set('theme', S.theme); store.set('mode', S.mode); applyBodyClass();
  map.setStyle(await loadStyle(), { diff: false });
  map.once('style.load', addOverlays); if (puck) puck.getElement().innerHTML = puckSvg();
  q.placeholder = t('search'); renderLayersPop(); renderDrawer(); window.__rgSkinChanged?.();
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => S.mode === 'auto' && setStyle());

const savedFC = () => ({ type: 'FeatureCollection', features: store.get('saved', []).map(s => ({ type: 'Feature', properties: { name: s.name }, geometry: { type: 'Point', coordinates: [s.lng, s.lat] } })) });
// Satellite: EOX Sentinel-2 cloudless 2024 (CC BY-NC-SA 4.0, personal non-commercial) (City of Edmonton orthophoto tiles block cross-origin browser use, so not included).

function addSatellite() {
  if (!map.getSource('eox')) map.addSource('eox', { type: 'raster', tileSize: 256, maxzoom: 15,
    tiles: ['https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2024_3857/default/g/{z}/{y}/{x}.jpg'],
    attribution: '<a href="https://s2maps.eu" target="_blank">Sentinel-2 cloudless – s2maps.eu</a> by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2024), CC BY-NC-SA 4.0' });
  const before = map.getLayer('landuse') ? 'landuse' : undefined;
  map.addLayer({ id: 'sat-eox', type: 'raster', source: 'eox', paint: { 'raster-fade-duration': 150 } }, before);
  for (const l of map.getStyle().layers) {
    if (l.type === 'fill' || l.id === 'water-edge' || l.id === 'waterway') map.setLayoutProperty(l.id, 'visibility', 'none');
    if (l.type === 'line' && !l.id.startsWith('route')) map.setPaintProperty(l.id, 'line-opacity', l.id.includes('glow') ? 0 : 0.55);
    if (l.type === 'symbol' && l.paint?.['text-halo-color'] !== undefined) { map.setPaintProperty(l.id, 'text-halo-color', '#000000'); map.setPaintProperty(l.id, 'text-color', '#ffffff'); }
  }
}
// ---------- my location ----------
let puck;
// original player-marker style pucks (drawn for this project)
function puckSvg() {
  const dk = isDark();
  if (window.__skinPuck) return `<div class="pkpuck"><img src="${window.__skinPuck}" width="64" height="64" alt="" draggable="false"></div>`;
  if (S.theme === 'tac') return `<svg class="pk-tac" width="64" height="64" viewBox="0 0 64 64" style="overflow:visible"><g fill="none" stroke="${dk ? '#d7ff3a' : '#1a1c15'}" stroke-width="1.6" style="filter:drop-shadow(0 0 1.5px ${dk ? 'rgba(0,0,0,.7)' : 'rgba(255,255,255,.85)'})"><circle cx="32" cy="32" r="17"/><path d="M32 7v9M32 48v9M7 32h9M48 32h9M32 25v3M32 36v3M25 32h3M36 32h3"/><path d="M28.5 4 32 .5 35.5 4" stroke-width="2.2"/></g><circle cx="32" cy="32" r="2" fill="${dk ? '#d7ff3a' : '#1a1c15'}"/></svg>`;
  if (S.theme === 'space') { const c = dk ? '#e9e6dc' : '#d8462b', m = dk ? '#81838a' : '#77756f'; return `<svg class="pk-space" width="150" height="150" viewBox="0 0 150 150" style="overflow:visible"><ellipse cx="75" cy="75" rx="74" ry="22" transform="rotate(-14 75 75)" fill="none" stroke="${m}" stroke-width="1" opacity=".35"/><circle cx="75" cy="75" r="48" fill="none" stroke="${m}" stroke-width="1" stroke-dasharray="3 3" opacity=".55"/><circle cx="75" cy="75" r="18" fill="${c}" opacity=".15"/><path d="M75 60 82 84 75 80 68 84Z" fill="${c}" stroke="${dk ? '#07080b' : '#fff'}" stroke-width="2" stroke-linejoin="round"/></svg>`; }
  if (S.theme === 'nord') return `<svg width="46" height="46" viewBox="0 0 32 32" style="overflow:visible"><circle cx="16" cy="16" r="13" fill="rgba(232,226,208,.18)"/><path d="M16 3.5 25 26 16 21 7 26Z" fill="#efece4" stroke="#1b1c1d" stroke-width="1.8" stroke-linejoin="round" style="filter:drop-shadow(0 2px 3px rgba(0,0,0,.5))"/></svg>`;
  if (S.theme === 'west') return `<svg width="48" height="48" viewBox="0 0 32 32"><defs><filter id="pr"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="1.3"/></filter></defs>
    <g filter="url(#pr)"><path d="M16 2.5C17.3 8.5 22.5 19.5 27 28.5 22.3 25.6 19.2 24.6 16 24.9 12.8 24.6 9.7 25.6 5 28.5 9.5 19.5 14.7 8.5 16 2.5Z" fill="${dk ? '#efe2c2' : '#f7edd6'}" stroke="#20150b" stroke-width="2.3" stroke-linejoin="round"/>
    <path d="M16 7.5 16 22" stroke="#20150b" stroke-width="1" opacity=".55"/></g></svg>`;
  return `<svg width="50" height="50" viewBox="0 0 32 32" style="overflow:visible"><circle cx="16" cy="16" r="14.5" fill="none" stroke="#4fd6e8" stroke-width="1" opacity="${dk ? .55 : .8}"/>
    <path d="M16 3 27 27.5 16 21.5 5 27.5Z" fill="#ffd25a" stroke="${dk ? '#4fd6e8' : '#0f3a44'}" stroke-width="1.6" stroke-linejoin="miter"/><path d="M16 9 16 19.5" stroke="#7a5a00" stroke-width="1.2"/></svg>`;
}
function accCircle(c, r) { const pts = []; for (let i = 0; i <= 48; i++) { const a = i / 48 * 2 * Math.PI; pts.push([c.lng + r / (111320 * Math.cos(c.lat * Math.PI / 180)) * Math.cos(a), c.lat + r / 110540 * Math.sin(a)]); } return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [pts] } }; }
function updAcc() {
  if (!map.getSource('acc')) return;
  map.getSource('acc').setData({ type: 'FeatureCollection', features: S.me?.acc && S.me.acc < 3000 ? [accCircle(S.me, S.me.acc)] : [] });
}
function addAccLayer() {
  const c = S.theme === 'west' ? (isDark() ? '#d9c7a2' : '#5a3d22') : (isDark() ? '#4fd6e8' : '#1d6f7c');
  if (!map.getSource('acc')) map.addSource('acc', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  map.addLayer({ id: 'acc', type: 'fill', source: 'acc', paint: { 'fill-color': c, 'fill-opacity': 0.12 } });
  map.addLayer({ id: 'acc-line', type: 'line', source: 'acc', paint: { 'line-color': c, 'line-width': 1.5, 'line-opacity': 0.6, ...(S.theme === 'west' ? { 'line-dasharray': [3, 2] } : {}) } });
  updAcc(); if (puck) puck.getElement().innerHTML = puckSvg();
}
function setMe(pos) {
  S.me = { lat: pos.coords.latitude, lng: pos.coords.longitude, heading: pos.coords.heading ?? S.compassHdg ?? null, speed: pos.coords.speed, acc: pos.coords.accuracy };
  if (!puck) { const el = document.createElement('div'); el.className = 'puck'; el.innerHTML = puckSvg(); el.style.cursor = 'pointer'; el.addEventListener('click', ev => { ev.stopPropagation(); showMe(); }); puck = new maplibregl.Marker({ element: el, rotationAlignment: 'map', pitchAlignment: 'map' }).setLngLat(S.me).addTo(map); }
  if (isFinite(S.me.lat) && pos.coords.accuracy != null && (!setMe.t || Date.now() - setMe.t > 30e3)) { setMe.t = Date.now(); store.set('lastFix', { lng: S.me.lng, lat: S.me.lat, t: setMe.t }); }
  window.__rgCar?.pos(S.me); puck.setLngLat(S.me); if (S.me.heading != null && !isNaN(S.me.heading) && !S.nav?.active) puck.setRotation(S.me.heading); updAcc();
}
export const locate = (fly = true) => navigator.geolocation?.getCurrentPosition(p => { setMe(p); fly && map.flyTo({ center: S.me, zoom: Math.max(map.getZoom(), 15) }); }, err => ios.geoHelp(err, openPanel), { enableHighAccuracy: true, timeout: 10000 });

// ---------- search ----------
const q = $('#q'); q.placeholder = t('search');
let sugTimer, sugItems = [], sugSel = -1, lastQ = '';
// v0.7 autocomplete: instant local rows on every keystroke, remote rows merged after a 150 ms debounce (stale requests aborted)
const acCtx = () => ({ c: map.getCenter(), z: map.getZoom(), B: map.getBounds(), zh: ZH });
const acExtra = v => [['saved', store.get('saved', [])], ['recent', store.get('recents', [])], ['offline', offlineSearch(v)], ['tile', tileFeats(v)]];
// v0.9.2 world-wide instant hits: POIs + airports in the vector tiles already loaded for the current view (no network)
function tileFeats(v) {
  const it = AC.intentOf(v), cls = new Set(it?.cls || []), x = AC.norm(v), out = [], seen = new Set();
  const take = (f, cl) => { const n = f.properties[ZH ? 'name:zh' : 'name:en'] || f.properties.name; if (!n) return; const c = f.geometry.coordinates; const k = n + c[1].toFixed(3) + c[0].toFixed(3); if (seen.has(k)) return;
    const hit = (cls.has(cl) || cls.has(f.properties.subclass)) && (!it.sub || it.sub.includes(f.properties.subclass) || cl === 'aerodrome'); if (!hit && !(x.length >= 2 && AC.norm(n).includes(x))) return; seen.add(k);
    out.push({ name: n, address: catLabel(f.properties.subclass || cl), lat: c[1], lng: c[0], cls: cl, category: cl, _cat: hit ? 1 : 0, sc: cl === 'aerodrome' ? AC.apSc(n, it) + (f.properties.iata ? 40 : 0) : hit ? AC.apSc(n, it) : 0 }); };
  try { if (map.getSource('omt')) for (const f of map.querySourceFeatures('omt', { sourceLayer: 'aerodrome_label' })) take(f, 'aerodrome');
    for (const f of (TPOI?.features || [])) { if (out.length > 400) break; take(f, f.properties.class); }
    if (map.getZoom() >= 14) for (const f of map.querySourceFeatures('omt', { sourceLayer: 'poi' })) { if (out.length > 400) break; take(f, f.properties.class); } } catch { }
  return out;
}
const acPrefix = (v, list) => { const sem = semMatch(v); if (sem) return [{ sem, name: `${L('在此区域搜索', 'Search this area for')}「${sem.t}」`, address: L('附近所有相关地点（含连锁品牌）', 'All matching places nearby, incl. chains') }]; const ce = chainEntry(v, list); return ce ? [ce] : []; };
window._acLat = [];
const SUGC = new Map(); const sugKey = (v, ctx) => `${v.toLowerCase().replace(/\s+/g, ' ')}|${ctx.c.lat.toFixed(2)},${ctx.c.lng.toFixed(2)}|${Math.round(ctx.z)}`;
// v0.9.14: a search is running (category/chain list, place opened) → stop autocomplete from re-opening the dropdown over it
function beginSearch() { S.searching = 1; clearTimeout(sugTimer); searchAbort?.abort(); $('#suggest').classList.add('hidden'); }
q.addEventListener('input', () => {
  $('#clearBtn').classList.toggle('hidden', !q.value);
  clearTimeout(sugTimer); searchAbort?.abort(); S.searching = 0;
  const v = q.value.trim(); lastQ = v;
  if (v.length < 1) { renderSuggest(recentItems()); return; }
  const t0 = performance.now(), ctx = acCtx(), local = AC.localSuggest(v, ctx, acExtra(v));
  renderSuggest([...acPrefix(v, local), ...local], false, v); window._acLat.push({ q: v, phase: 'local', ms: +(performance.now() - t0).toFixed(1), n: local.length });
  const ac = new AbortController(); searchAbort = ac;
  // v0.9.14: recent-query cache (case-insensitive, per ~1 km map area): repeat / back-spaced queries paint the final list instantly
  const rk = sugKey(v, ctx); const hit = SUGC.get(rk); if (hit) { renderSuggest([...acPrefix(v, hit), ...hit], false, v); window._acLat.push({ q: v, phase: 'cache', ms: +(performance.now() - t0).toFixed(1), n: hit.length }); return; }
  sugTimer = setTimeout(() => AC.suggest(v, { ...ctx, me: S.me }, acExtra(v), (list, phase, ms, prov) => { if (ac.signal.aborted || lastQ !== v || phase === 'local' || S.searching) return;
    if (phase === 'remote') { SUGC.set(rk, list); if (SUGC.size > 80) SUGC.delete(SUGC.keys().next().value); }
    renderSuggest([...acPrefix(v, list), ...list], false, v); window._acLat.push({ q: v, phase, ms: +(performance.now() - t0).toFixed(0), n: list.length, prov }); }, ac.signal).catch(() => {}), v.length < 3 ? 220 : 180);
});
q.addEventListener('focus', () => { const c = S.me && AC.ADDR.cityAt(S.me.lat, S.me.lng, 0.5); AC.ADDR.loadIndex(c || undefined); }, { once: true });
q.addEventListener('focus', () => { S.searching = 0; if (!q.value) renderSuggest(recentItems()); });
q.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { sugSel = Math.max(0, Math.min(sugItems.length - 1, sugSel + (e.key === 'ArrowDown' ? 1 : -1))); renderSuggest(sugItems, true); e.preventDefault(); }
  if (e.key === 'Enter') { const sm = sugSel < 0 && semMatch(q.value); if (sm) return semanticSearch(sm, q.value.trim()); if (sugItems[sugSel >= 0 ? sugSel : 0]) pick(sugItems[sugSel >= 0 ? sugSel : 0]); else nominatimSearch(q.value.trim()); }
  if (e.key === 'Escape') { $('#suggest').classList.add('hidden'); q.blur(); }
});
$('#clearBtn').onclick = () => { q.value = ''; $('#clearBtn').classList.add('hidden'); closePanel(); clearCat(); S.place = null; drawPin(); q.focus(); };
// instant local hits: loaded vector-tile POIs + offline index (no network)
function localHits(v) {
  const x = v.toLowerCase(), c = map.getCenter(), out = [], seen = new Set();
  for (const f of map.queryRenderedFeatures({ layers: ['poi', ...IMP, ...TPI, 'tp-air'].filter(l => map.getLayer(l)) })) {
    const n = f.properties[ZH ? 'name:zh' : 'name:en'] || f.properties.name; if (!n || !(n.toLowerCase().includes(x) || (f.properties.name || '').toLowerCase().includes(x))) continue;
    const [lng, lat] = f.geometry.coordinates, k = n + lat.toFixed(4); if (seen.has(k)) continue; seen.add(k);
    const id = typeof f.id === 'number' ? f.id : null;
    out.push({ name: n, address: catLabel(f.properties.subclass || f.properties.class), lat, lng, category: f.properties.class, osm: id ? { type: ['N', 'N', 'W', 'R'][id % 10] || 'N', id: Math.floor(id / 10) } : (f.properties.osm ? { type: f.properties.osm[0], id: +f.properties.osm.slice(1) } : null), dist: haversine(c, { lat, lng }), local: 1 });
  }
  for (const o of offlineSearch(v)) if (!seen.has(o.name + o.lat.toFixed(4))) out.push(o);
  return out.sort((a, b) => a.dist - b.dist).slice(0, 8);
}
function chainEntry(v, list) {
  if (BJ) return null; // chain lookup needs Overpass (online)
  const x = v.trim().toLowerCase(); if (x.length < 3 || /^\d/.test(x)) return null;
  const known = SEM.flatMap(e => e.brands).find(b => b.toLowerCase().replace(/[’']/g, '') === x.replace(/[’']/g, '') || (x.length > 4 && b.toLowerCase().startsWith(x)));
  const same = list.filter(r => r.name && r.name.toLowerCase().includes(x)); const multi = new Set(same.map(r => r.name.toLowerCase())).size < same.length;
  if (!known && !multi) return null;
  const nm = known || same[0].name;
  return { sem: { chain: 1, t: nm, k: [nm.toLowerCase()], icon: 'generic', name: reEsc(nm).replace(/['’]/g, '.?'), brands: [nm], qids: [] }, name: `${L('显示所有「', 'All 「')}${nm}${L('」分店与同名地点', '」 branches & same-named places')}`, address: L('当前范围及附近 · 列表 + 地图标记', 'In view & nearby · list + map markers') };
}
function renderLocal(v) { if (v.length < 2) return; const lh = localHits(v); if (!lh.length) return; const ce = chainEntry(v, lh); renderSuggest([...(semMatch(v) ? [{ sem: semMatch(v), name: `${L('在此区域搜索', 'Search this area for')}「${semMatch(v).t}」`, address: '' }] : ce ? [ce] : []), ...lh], false, v); }
let searchAbort = null;
async function runSearch(v) {
  lastQ = v; searchAbort?.abort(); const ac = new AbortController(); searchAbort = ac;
  try {
    const B = map.getBounds(), c = map.getCenter(), z = map.getZoom();
    const al = AC.aliasOf(v); const [inView, near, adr, als] = await Promise.all([photonBox(v, B, c, z, 10, ac.signal).catch(() => []), photon(v, c, 10, z, ac.signal).catch(() => []), AC.ADDR.parse(v) ? AC.ADDR.search(v, 5, S.me || c).then(o => o.some(x => x.exact) ? o : AC.geocodeAddress(v, S.me || c, ac.signal).then(g => [...g.map(x => x.approx ? { ...x, address: `${x.address} · ${L('门牌号未收录，仅定位到街道', 'house number not in open data — street only')}` } : x), ...o])).catch(() => []) : [], al ? photon(al, c, 10, z, ac.signal).catch(() => []) : []]);
    if (ac.signal.aborted) return;
    if (lastQ !== v) return;
    const inB = x => B.contains([x.lng, x.lat]);
    const sc = x => (inB(x) ? 0 : 1e7) + haversine(c, x) * (inB(x) ? 0.2 : 1);
    let r = [...localHits(v), ...inView, ...als, ...near];
    r = r.sort((a, b) => sc(a) - sc(b)).map(x => ({ ...x, dist: haversine(c, x) }));
    const sem = semMatch(v); if (sem || r.some(x => x.dist < 50000)) r = r.filter(x => x.dist < 150000 || inB(x));
    const ce = !sem && chainEntry(v, r); if (ce) r.unshift(ce);
    r.unshift(...adr);
    if (sem) r.unshift({ sem, name: `${L('在此区域搜索', 'Search this area for')}「${sem.t}」`, address: L('附近所有相关地点（含连锁品牌）', 'All matching places nearby, incl. chains') });
    if (!r.filter(x => !x.sem).length && /^\d/.test(v)) { try { r.push(...await nominatim(v, c)); } catch {} }
    const seen = new Set(); renderSuggest(r.filter(x => { const key = x.sem ? 'sem' + x.name : x.name.toLowerCase() + '|' + (x.lat ?? 0).toFixed(3) + (x.lng ?? 0).toFixed(3); if (seen.has(key)) return false; seen.add(key); return true; }), false, v);
  } catch { renderSuggest([], false, v); }
}
async function nominatimSearch(v) {
  if (!v) return;
  $('#suggest').innerHTML = `<div class="sug"><div class="t">${t('searching')}</div></div>`; $('#suggest').classList.remove('hidden');
  try { renderSuggest(await nominatim(v, map.getCenter()), false, null); } catch (e) { renderSuggest([], false, null); }
}
const shortAddr = r => { const lc = AC.locality(r); if (lc) { const a0 = (r.address || '').split(', ').find(x => x && x !== r.name && x !== r.city && x !== r.state && !/^(Canada|加拿大)$/.test(x) && !/^[A-Z]\d[A-Z]/.test(x)); return [a0, lc].filter(Boolean).join(' · '); } return shortAddr0(r); };
const shortAddr0 = r => { const a = (r.address || '').split(', ').filter(x => x && x !== r.name && !/^(Canada|加拿大)$/.test(x)); return (a.length ? a.slice(0, 3).join(', ') : catLabel(String(r.cls || r.category || '').split('=').pop())) || ''; };
const recentItems = () => store.get('recents', []).slice(0, 8).map(r => ({ ...r, recent: true }));
function renderSuggest(items, keepSel, qForNom) {
  if (S.searching && qForNom !== null) return; // v0.9.14: no dropdown while a search runs (nominatimSearch passes null)
  setTimeout(() => { const b = $('#suggest'); if (!b.querySelector('.sugx') && !b.classList.contains('hidden') && b.innerHTML) { b.insertAdjacentHTML('afterbegin', `<div class="sugx"><button class="xbig" aria-label="close">✕</button></div>`); b.querySelector('.sugx button').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); b.classList.add('hidden'); q.blur(); }); } }, 0);
  sugItems = items; if (!keepSel) sugSel = -1;
  const box = $('#suggest');
  if (!items.length && qForNom === undefined) { box.classList.add('hidden'); return; }
  if (INK() && items.length && items.every(r => r.recent || r.inkSaved)) { box.innerHTML = inkSugHtml(items); box.classList.add('inks'); box.classList.remove('hidden'); return; }
  box.classList.remove('inks');
  box.innerHTML = items.map((r, i) => `<div class="sug${i === sugSel ? ' sel' : ''}" data-i="${i}"><div class="i">${r.sem ? ic('search') : r.recent || r.src === 'recent' ? ic('clock') : r.src === 'saved' ? ic('star') : catIc(r.cls || r.category)}</div><div style="flex:1;min-width:0"><div class="t">${esc(r.name)}</div><div class="s">${esc(shortAddr(r))}</div></div>${r.dist != null ? `<div class="s" style="flex:none">${fmtDist(r.dist)}</div>` : ''}</div>`).join('')
    + (!items.length ? `<div class="sug"><div class="s">${t('noresults')}</div></div>` : '')
    + (qForNom && AC.correct(qForNom) ? `<div class="sug" data-fix="${esc(AC.correct(qForNom))}"><div class="i">${ic('search')}</div><div class="t" style="font-size:14px">${L('您是不是要找：', 'Did you mean: ')}<b>${esc(AC.correct(qForNom))}</b></div></div>` : '')
    + (qForNom ? `<div class="sug" data-nom="1"><div class="i">${ic('search')}</div><div class="t">${t('nominatim')}</div></div>` : '');
  box.classList.remove('hidden');
}
$('#suggest').addEventListener('click', e => {
  const ik = e.target.closest('[data-inkclr],[data-inkk]');
  if (ik) { if (ik.dataset.inkclr) { store.set('recents', []); $('#suggest').classList.add('hidden'); return; } const b = document.querySelector(`.chip[data-k="${ik.dataset.inkk}"]`); $('#suggest').classList.add('hidden'); q.blur(); if (b) runChip(b); return; }
  const el = e.target.closest('.sug'); if (!el) return;
  if (el.dataset.nom) return nominatimSearch(q.value.trim());
  if (el.dataset.fix) { q.value = el.dataset.fix; q.dispatchEvent(new Event('input')); q.focus(); return; }
  if (el.dataset.i) pick(sugItems[+el.dataset.i]);
});
document.addEventListener('pointerdown', e => { if (!e.target.closest('#top')) $('#suggest').classList.add('hidden'); });
function addRecent(p) {
  const r = store.get('recents', []).filter(x => !(Math.abs(x.lat - p.lat) < 1e-5 && Math.abs(x.lng - p.lng) < 1e-5));
  r.unshift({ name: p.name, address: p.address, lat: p.lat, lng: p.lng, osm: p.osm, category: p.category }); store.set('recents', r.slice(0, 30));
}
function pick(p) {
  if (p.sem) return semanticSearch(p.sem, q.value.trim());
  beginSearch(); q.value = p.name; q.blur(); $('#clearBtn').classList.remove('hidden');
  map.flyTo({ center: [p.lng, p.lat], zoom: Math.max(map.getZoom(), 16), padding: panelPadding() });
  showPlace(p);
}
const panelPadding = () => innerWidth > 700 ? { left: 420 } : { bottom: innerHeight * 0.45 };

// ---------- 'Search this area' pill (v0.9) ----------
const pill = document.createElement('button'); pill.id = 'areaPill'; pill.className = 'card hidden'; pill.innerHTML = `${ic('search')}<span>${L('搜索此区域', 'Search this area')}</span>`; document.body.appendChild(pill);
function markSearch(o) { S.lastSearch = { ...o, c: map.getCenter(), z: map.getZoom(), q: q.value.trim() }; hidePill(); }
function hidePill() { pill.classList.add('hidden'); }
map.on('moveend', () => { const L0 = S.lastSearch; if (!L0 || S._fitting || !S.catData || S.nav?.active) return;
  const a = map.project(L0.c), w = map.getContainer().clientWidth, h = map.getContainer().clientHeight, c = map.project(map.getCenter());
  const moved = Math.abs(a.x - c.x) > 0.3 * w || Math.abs(a.y - c.y) > 0.3 * h, dz = Math.abs(map.getZoom() - L0.z) > 1;
  pill.classList.toggle('hidden', !(moved || dz)); });
pill.onclick = () => { const L0 = S.lastSearch; hidePill(); if (!L0) return; if (L0.type === 'sem') semanticSearch(L0.e, L0.raw, true); else { const b = document.querySelector(`.chip[data-k="${L0.k}"]`); if (b) runChip(b); } };
q.addEventListener('input', () => { if (S.lastSearch && q.value.trim() !== S.lastSearch.q) hidePill(); });
// ---------- chips (category search via Overpass in current view) ----------
const CATS = [['restaurant', '["amenity"~"^(restaurant|fast_food)$"]', 'restaurant'], ['cafe', '["amenity"="cafe"]', 'cafe'], ['supermarket', '["shop"~"^(supermarket|convenience|greengrocer)$"]', 'supermarket'],
  ['fuel', '["amenity"="fuel"]', 'fuel'], ['hotel', '["tourism"~"^(hotel|motel|hostel|guest_house)$"]', 'hotel'], ['park', '["leisure"="park"]', 'park'],
  ['pharmacy', '["amenity"="pharmacy"]', 'pharmacy'], ['atm', '["amenity"~"^(atm|bank)$"]', 'bank'], ['charging', '["amenity"="charging_station"]', 'fuel'], ['parking', '["amenity"="parking"]', 'parking']];
$('#chips').innerHTML = CATS.map(([k]) => `<button class="chip" data-k="${k}">${t(k)}</button>`).join('');
$('#chips').addEventListener('click', async e => {
  const b = e.target.closest('.chip'); if (!b) return;
  if (b.classList.contains('on')) { clearCat(); closePanel(); return; }
  runChip(b);
});
async function runChip(b) {
  document.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === b));
  const [k, filter, icon] = CATS.find(c => c[0] === b.dataset.k);
  markSearch({ type: 'chip', k });
  openPanel(`<div class="list"><div class="row">${t('searching')}</div></div>`, t(k));
  try {
    if (map.getZoom() < 12.5) await new Promise(r => { map.once('moveend', r); map.easeTo({ zoom: 13.5 }); });
    let els; try { els = await nearbyCategory(filter, map.getBounds()); } catch { els = await nearbyCategoryNominatim(k, map.getBounds()); }
    const items = els.map(x => ({ name: x.tags.name, lat: x.lat ?? x.center?.lat, lng: x.lon ?? x.center?.lon, osm: { type: x.type, id: x.id }, tags: x.tags, category: k,
      address: [x.tags['addr:housenumber'], x.tags['addr:street']].filter(Boolean).join(' ') })).filter(x => x.lat);
    const c = map.getCenter(); items.sort((a, b) => ((a.lat - c.lat) ** 2 + (a.lng - c.lng) ** 2) - ((b.lat - c.lat) ** 2 + (b.lng - c.lng) ** 2));
    S.catData = { type: 'FeatureCollection', features: items.map((it, i) => ({ type: 'Feature', id: i, properties: { name: it.name, icon, i }, geometry: { type: 'Point', coordinates: [it.lng, it.lat] } })) };
    map.getSource('cat')?.setData(S.catData); S.catItems = items;
    openPanel(`<div class="list"><div class="dh">${t(k)} · ${items.length}</div>${items.map((it, i) => `<div class="it" data-i="${i}"><div>${esc(it.name)}</div><div class="s">${esc(it.address || it.tags.cuisine || '')}${hoursBadgeSync(it.tags)}</div></div>`).join('') || `<div class="row">${t('noresults')}</div>`}</div>`, `${t(k)} · ${items.length}`);
    $('#panelBody').querySelector('.list').onclick = ev => { const it = ev.target.closest('.it'); if (it) { const p = S.catItems[+it.dataset.i]; map.easeTo({ center: [p.lng, p.lat], zoom: 17, padding: panelPadding() }); showPlace(p); } };
    hydrateBadges(); markSearch({ type: 'chip', k });
  } catch (err) { openPanel(`<div class="row">${t('err')}: ${esc(err.message)}</div>`); }
}
function clearCat() { hidePill(); S.lastSearch = null; clearCat0(); }
function clearCat0() { document.querySelectorAll('.chip').forEach(c => c.classList.remove('on')); S.catData = null; map.getSource('cat')?.setData({ type: 'FeatureCollection', features: [] }); }
let OH = null; const ohLib = () => OH ??= import('opening_hours').then(m => m.default);
const hoursBadgeSync = tags => tags.opening_hours ? ` · <span class="ohb" data-oh="${esc(tags.opening_hours)}"></span>` : '';
async function hydrateBadges() { const lib = await ohLib(); document.querySelectorAll('.ohb').forEach(el => { const r = ohStatus(lib, el.dataset.oh); if (r) el.outerHTML = r.badge; }); }
function ohStatus(lib, s) {
  try {
    const oh = new lib(s, { address: { country_code: 'ca', state: 'Alberta' } }, { locale: lang });
    const open = oh.getState(), next = oh.getNextChange();
    const tm = next ? next.toLocaleTimeString(lang === 'zh' ? 'zh-CN' : 'en-CA', { hour: 'numeric', minute: '2-digit' }) : '';
    const badge = `<span class="${open ? 'open' : 'closed'}">${t(open ? 'open' : 'closed')}</span>${next ? ` · ${t(open ? 'closes' : 'opens')} ${tm}` : ''}`;
    let table = '';
    try { table = oh.prettifyValue({ conf: { locale: lang, rule_sep_string: '\n', print_semicolon: false } }); } catch { table = s; }
    return { badge, table };
  } catch { return null; }
}

// ---------- place card ----------
const panel = $('#panel');
let panelKind = '';
function openPanel(html, title = '', kind = 'list') { const pb = $('#panelBody'); if (kind === 'place' && panelKind === 'place' && !panel.classList.contains('hidden') && $('#panelTitle').textContent === title) { if (pb.innerHTML !== html) { const y = panel.scrollTop; pb.innerHTML = html; panel.scrollTop = y; } return; } panelKind = kind; $('#panelTitle').textContent = title; $('#panelBody').innerHTML = html; fxReopen(panel); panel.classList.remove('hidden', 'collapsed'); panel.scrollTop = 0; applyBodyClass(); }
function closePanel() { panel.classList.add('hidden'); panel.classList.remove('collapsed'); applyBodyClass(); }
function collapsePanel(on) { panel.classList.toggle('collapsed', on); panel.scrollTop = 0; applyBodyClass(); }
$('#panelX').onclick = e => { e.stopPropagation(); if (panelKind === 'dir') return closeDirections(); closePanel(); if (panelKind === 'place') { S.place = null; drawPin(); } };
$('#panelHead').onclick = e => { if (e.target.closest('#panelX')) return; if (panel.classList.contains('collapsed')) collapsePanel(false); };
// Google-Maps-like: a map tap while something is open only dismisses / collapses it (and does not select a POI)
function dismissOnTap() {
  let did = false;
  for (const id of ['#layersPop', '#suggest']) if (!$(id).classList.contains('hidden')) { $(id).classList.add('hidden'); did = true; }
  if (document.activeElement?.tagName === 'INPUT') { document.activeElement.blur(); did = true; }
  document.querySelectorAll('.acl').forEach(x => { if (!x.classList.contains('hidden') && x.innerHTML) { x.classList.add('hidden'); did = true; } });
  if (!panel.classList.contains('hidden') && !panel.classList.contains('collapsed') && panel.style.visibility !== 'hidden') { collapsePanel(true); did = true; }
  return did;
}
function drawPin() {
  if (dropMarker) { dropMarker.remove(); dropMarker = null; }
  if (S.place?.dropped) { const el = document.createElement('div'); el.className = 'droppin'; el.innerHTML = pinSvg(); dropMarker = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([S.place.lng, S.place.lat]).addTo(map); }
  const src = map.getSource('pins'); if (!src) return;
  src.setData({ type: 'FeatureCollection', features: S.place && !S.place.fromPoi && !S.place.dropped ? [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [S.place.lng, S.place.lat] } }] : [] });
}
const CAT_ZH = { pharmacy: '药店', chemist: '药店', station: '车站', railway: '铁路', halt: '车站', tram_stop: '电车站', bus_stop: '公交站', bus_station: '公交总站', restaurant: '餐厅', fast_food: '快餐', cafe: '咖啡', bar: '酒吧', pub: '酒馆', supermarket: '超市', convenience: '便利店', fuel: '加油站', hotel: '酒店', motel: '汽车旅馆', park: '公园', hospital: '医院', clinic: '诊所', doctors: '诊所', dentist: '牙科', school: '学校', university: '大学', college: '学院', library: '图书馆', bank: '银行', atm: 'ATM', parking: '停车场', museum: '博物馆', attraction: '景点', viewpoint: '观景台', theatre: '剧院', cinema: '电影院', mall: '购物中心', clothes: '服装店', bakery: '面包店', ice_cream: '冰淇淋', post_office: '邮局', police: '警察局', place_of_worship: '宗教场所', aerodrome: '机场', airport: '机场', ferry_terminal: '渡口', zoo: '动物园', stadium: '体育场', sports_centre: '体育中心', playground: '游乐场', garden: '花园', city: '城市', town: '镇', village: '村', suburb: '城区', neighbourhood: '社区', house: '住宅', residential: '住宅区', road: '道路', street: '街道', city_hall: '市政厅', townhall: '市政厅', hardware: '五金店', department_store: '百货商店', books: '书店', car_repair: '汽修', gift: '礼品店', hairdresser: '理发店', beauty: '美容店' };
const catLabel = c => { const k = String(c || '').replace(/^(amenity|shop|tourism|leisure|place|building|highway|office|craft|railway|public_transport|aeroway)=/, ''); return ZH && CAT_ZH[k] ? CAT_ZH[k] : k.replace(/_/g, ' '); };
async function showPlace(p) {
  S.place = p; drawPin(); if (!p.me) addRecent(p);
  renderPlace(p, p.tags || null, null);
  let tags = p.tags;
  if (!tags && p.osm) { try { const el = await osmElement(p.osm.type, p.osm.id); tags = el?.tags || {}; } catch { tags = {}; } if (S.place !== p) return; p.tags = tags; renderPlace(p, tags, null); }
  if (tags) {
    const [lib, photo] = await Promise.all([tags.opening_hours ? ohLib() : null, photosFor(tags, p).catch(() => [])]);
    if (S.place !== p) return;
    renderPlace(p, tags, { oh: lib && ohStatus(lib, tags.opening_hours), photo });
  }
}
const fold = (k, d) => (store.get('fold', {})[k] ?? d);
document.addEventListener('toggle', e => { const d = e.target; if (d.dataset?.fold) { const o = store.get('fold', {}); o[d.dataset.fold] = d.open ? 1 : 0; store.set('fold', o); } }, true);
function renderPlace(p, tags, extra) {
  tags = tags || {};
  const saved = store.get('saved', []).some(s => Math.abs(s.lat - p.lat) < 1e-5 && Math.abs(s.lng - p.lng) < 1e-5);
  const addr = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ') + (tags['addr:city'] ? ', ' + tags['addr:city'] : '');
  const cat = catLabel(tags.amenity ? 'amenity=' + tags.amenity : tags.shop ? 'shop=' + tags.shop : tags.tourism ? 'tourism=' + tags.tourism : tags.leisure ? 'leisure=' + tags.leisure : p.category);
  const web = tags.website || tags['contact:website'], tel = tags.phone || tags['contact:phone'];
  const ink = INK() ? inkPlaceHtml(p, tags, extra, cat) : '';
  openPanel(`<div class="pc${ink ? ' ink' : ''}">${ink}
    ${extra?.photo?.length ? `<details class="fold gfold" data-fold="gal"${fold('gal', 1) ? ' open' : ''}><summary class="fsum">${ic('info')}${L('照片', 'Photos')} · ${extra.photo.length}</summary>${galleryHtml(extra.photo)}</details>` : ''}
    <h2>${esc(tags[lang === 'zh' ? 'name:zh' : 'name:en'] || p.name)}</h2><div class="cat">${esc(cat)}${tags.cuisine ? ' · ' + esc(tags.cuisine.replace(/;/g, ', ')) : ''}</div>
    <div class="acts">
      <button class="act primary" data-a="dir"><span class="b">${ic('dir')}</span>${t('directions')}</button>
      <button class="act" data-a="start"><span class="b">${ic('start')}</span>${t('start')}</button>
      <button class="act" data-a="save"><span class="b">${ic('star', saved ? 'on' : '')}</span>${saved ? t('saved_ok') : t('save')}</button>
      <button class="act" data-a="share"><span class="b">${ic('share')}</span>${t('share')}</button>
      ${p.dropped ? `<button class="act" data-a="measure"><span class="b">${ic('measure')}</span>${L('从这里测距', 'Measure from here')}</button>` : ''}
    </div>
    ${tags.opening_hours ? `<div class="row"><span class="i">${ic('clock')}</span><div style="flex:1">${extra?.oh ? `<details class="fold" data-fold="hrs"${fold('hrs', 0) ? ' open' : ''}><summary>${extra.oh.badge}</summary><div class="hrs">${esc(extra.oh.table)}</div></details>` : esc(tags.opening_hours)}</div></div>` : ''}
    ${p.desc ? `<div class="desc">${esc(p.desc)}</div>` : ''}
    ${p.quest ? `<div class="row"><span class="i">${ic('quest')}</span><div><button class="btn${questDone().includes(p.quest.id) ? ' ghost' : ''}" id="qDone">${questDone().includes(p.quest.id) ? L('✔ 已完成（点按取消）', '✔ Completed (tap to undo)') : L('标记为已完成', 'Mark as completed')}</button><div style="font-size:13px;color:var(--muted);margin-top:4px"><a href="https://www.wikidata.org/wiki/${p.quest.id}" target="_blank" rel="noopener">Wikidata ${p.quest.id}</a></div></div></div>` : ''}
    <div id="wx"></div>
    <div class="row" id="addrRow"><span class="i">${ic('pin')}</span><div style="flex:1"><div id="addrTx">${esc(fmtAddr(tags) || p.address || tags._display || '')}</div><div id="addrNote" style="font-size:calc(13px * var(--ts,1));color:var(--muted)">${p._note || (p._approx ? L('大致地址（按坐标反查）', 'Approx. address (from coordinates)') : '')}</div></div><button class="btn ghost" id="copyAddr" style="flex:none;padding:6px 12px">${L('复制', 'Copy')}</button></div>
    ${tel ? `<div class="row"><span class="i">${ic('phone')}</span><a href="tel:${esc(tel)}">${esc(tel)}</a></div>` : ''}
    ${web ? `<div class="row"><span class="i">${ic('web')}</span><a href="${esc(web.startsWith('http') ? web : 'https://' + web)}" target="_blank" rel="noopener">${esc(web.replace(/^https?:\/\//, ''))}</a></div>` : ''}
    ${tags.wheelchair ? `<div class="row"><span class="i">${ic('access')}</span><div>${esc(tags.wheelchair)}</div></div>` : ''}
    <div class="row"><span class="i">${ic('coord')}</span><div style="flex:1">${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}</div><button class="btn ghost" id="copyLL" style="flex:none;padding:6px 12px">${L('复制', 'Copy')}</button></div>
    ${p.osm ? `<div class="tags"><a href="https://www.openstreetmap.org/${{ N: 'node', W: 'way', R: 'relation' }[p.osm.type] || p.osm.type}/${p.osm.id}" target="_blank" rel="noopener">OpenStreetMap</a></div>` : ''}
  </div>`, tags[lang === 'zh' ? 'name:zh' : 'name:en'] || p.name, 'place');
  const ika = $('#panelBody .ikacts'); if (ika) ika.onclick = e => { const b = e.target.closest('[data-ika]'); if (!b) return; if (b.dataset.ika === 'more') { const pc = $('#panelBody .pc'); b.setAttribute('aria-expanded', pc.classList.toggle('more')); return; } $('#panelBody .acts [data-a=start]')?.click(); };
  $('#panelBody .acts').onclick = e => {
    const a = e.target.closest('.act')?.dataset.a;
    if (a === 'dir') openDirections(p);
    if (a === 'start') openDirections(p, true);
    if (a === 'save') { const doSave = list => { let s = store.get('saved', []); s = saved ? s.filter(x => !(Math.abs(x.lat - p.lat) < 1e-5 && Math.abs(x.lng - p.lng) < 1e-5)) : [{ name: p.name, address: addr || p.address, lat: p.lat, lng: p.lng, osm: p.osm, list }, ...s]; store.set('saved', s); map.getSource('saved')?.setData(savedFC()); renderPlace(p, tags, extra); renderDrawer(); if (list) toast(L('已保存到 ', 'Saved to ') + list); }; saved ? doSave() : chooseList(p, doSave); }
    if (a === 'share') share(p);
    if (a === 'measure') { closePanel(); S.place = null; drawPin(); tools.measure({ lat: p.lat, lng: p.lng }); }
  };
  if ($('#qDone')) $('#qDone').onclick = () => { const d = questDone(), i = d.indexOf(p.quest.id); i >= 0 ? d.splice(i, 1) : d.push(p.quest.id); store.set('questDone', d); renderPlace(p, tags, extra); updQuestLayer(); };
  placeExtras?.(p); fillAddress(p, tags);
  $('#copyLL').onclick = async () => { const tx = `${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}`; try { await navigator.clipboard.writeText(tx); toast(L('坐标已复制', 'Coordinates copied')); } catch { prompt('', tx); } };
  $('#copyAddr').onclick = async () => { const tx = $('#addrTx').textContent; try { await navigator.clipboard.writeText(tx); toast(L('地址已复制', 'Address copied')); } catch { prompt(L('地址', 'Address'), tx); } };
  if (extra?.photo?.length) bindGallery($('#panelBody .gal'), extra.photo);
}
// v0.9.7 ink place card (targets: place_light / place_dark): seal + name, rule, sub-line, description, mountain band, 2×2 grid, 启程 / 详观
function inkPlaceHtml(p, tags, extra, cat) {
  const nm = tags[lang === 'zh' ? 'name:zh' : 'name:en'] || p.name;
  const d = S.me ? haversine(S.me, p) : null;
  const dist = d == null ? '' : lang === 'zh' ? (d < 500 ? ` · 距此${CNUM(Math.max(1, Math.round(d / 1.5 / 10) * 10))}步` : ` · 距此${CNUM(Math.max(1, Math.round(d / 500)))}里`) : ` · ${fmtDist(d)} ${'away'}`;
  const dirTx = S.me && d > 30 ? (lang === 'zh' ? DIRZ : DIRE)[Math.round(brg(S.me, p) / 45) % 8] : '';
  const addr = fmtAddr(tags) || p.address || '';
  const hrs = extra?.oh ? String(extra.oh.badge).replace(/<[^>]+>/g, '') : tags.opening_hours || '';
  const feat = [tags.cuisine, tags.brand, tags.outdoor_seating === 'yes' ? L('有露天座', 'outdoor seating') : '', tags.wheelchair === 'yes' ? L('无障碍', 'step-free') : ''].filter(Boolean).join(' · ').replace(/;/g, ', ');
  const desc = p.desc || tags.description || '';
  const seal = lang === 'zh' ? `<i class="ikseal">${esc(String(cat).replace(/[^\u4e00-\u9fff]/g, '').slice(0, 2) || '名所')}</i>` : `<i class="ikseal g">${catIc(p.category || (tags.amenity ? 'amenity=' + tags.amenity : ''))}</i>`;
  const cell = (icn, k, v) => `<div><b><span class="gi">${li(icn)}</span>${k}</b><span>${esc(v || '—')}</span></div>`;
  return `<div class="ikp"><div class="ikp-h">${seal}<h3>${esc(nm)}</h3></div><div class="ikrule"><i></i></div>
    <div class="ikp-sub">${esc(cat)}${esc(dist)}</div>${desc ? `<div class="ikp-d">${esc(desc)}</div>` : ''}<div class="ikmtn"></div>
    <div class="ikgrid">${cell('pin', L('方位', 'Where'), [dirTx, addr].filter(Boolean).join(' · '))}${cell('cup', L('类别', 'Kind'), cat + (tags.cuisine ? ' · ' + tags.cuisine.split(';')[0] : ''))}${cell('clock', L('营业', 'Hours'), hrs)}${cell('star', L('特色', 'Notes'), feat)}</div>
    <div class="ikacts"><button class="ikb red" data-ika="start">${li('go')}<b>${L('启程', 'Go')}</b></button><button class="ikb" data-ika="more" aria-expanded="false">${li('list')}<b>${L('详观', 'Details')}</b></button></div></div>`;
}
async function share(p) {
  const url = `${location.origin}${location.pathname}?p=${p.lat.toFixed(6)},${p.lng.toFixed(6)}&n=${encodeURIComponent(p.name)}#17/${p.lat.toFixed(5)}/${p.lng.toFixed(5)}`;
  if (navigator.share) { try { await navigator.share({ title: p.name, url }); return; } catch {} }
  try { await navigator.clipboard.writeText(url); toast(t('copied')); } catch { prompt('URL', url); }
}

// POI click with hit tolerance (any rendered POI / category result)
const hitLayers = () => ['quests', 'cat', 'saved-dot', ...IMP, ...TPI, ...MPI, 'tp-air', 'poi'].filter(l => map.getLayer(l));
map.on('click', e => {
  if (S.nav?.active || S.picking || S.measuring) return;
  if (S.lpSuppress) { S.lpSuppress = false; return; }
  if (S.place?.dropped && !panel.classList.contains('hidden')) { closePanel(); S.place = null; drawPin(); return; }
  if (dismissOnTap()) return;
  const pad = 10, b = [[e.point.x - pad, e.point.y - pad], [e.point.x + pad, e.point.y + pad]];
  const fs = map.queryRenderedFeatures(b, { layers: hitLayers() });
  if (!fs.length) return;
  const f = fs.sort((a, b2) => (a.layer.id === 'poi' ? 1 : 0) - (b2.layer.id === 'poi' ? 1 : 0))[0];
  const [lng, lat] = f.geometry.coordinates;
  if (f.layer.id === 'quests') return showQuest(QDATA[f.properties.i]);
  if (f.layer.id === 'cat') { const it = S.catItems[f.properties.i]; showPlace(it); return; }
  if (f.layer.id === 'saved-dot') { const sv = store.get('saved', []).find(x => x.name === f.properties.name); if (sv) return showPlace(sv); }
  if (IMP.includes(f.layer.id)) { const o = f.properties.osm; return showPlace({ name: f.properties[lang === 'zh' ? 'name:zh' : 'name:en'] || f.properties.name, address: '', lat, lng, osm: { type: o[0], id: +o.slice(1) }, category: f.properties.class, fromPoi: true }); }
  // OpenMapTiles/Planetiler feature id = osm_id * 10 + (1 node | 2 way | 3 relation)
  const id = typeof f.id === 'number' ? f.id : null;
  const osm = id ? { type: ['N', 'N', 'W', 'R'][id % 10] || 'N', id: Math.floor(id / 10) } : null;
  const name = f.properties[lang === 'zh' ? 'name:zh' : 'name:en'] || f.properties.name;
  showPlace({ name, address: '', lat, lng, osm, category: f.properties.class, fromPoi: true });
});
for (const l of ['poi', 'cat']) { map.on('mouseenter', l, () => map.getCanvas().style.cursor = 'pointer'); map.on('mouseleave', l, () => map.getCanvas().style.cursor = ''); }

// Long-press / right-click: drop pin + reverse geocode ("What's here?")
// Long-press (≈850 ms) to drop a pin: touch or mouse hold; right-click also works. Cancels on move > 9 px, 2nd finger, or any map motion.
let lp = null;
const lpRing = document.createElement('div'); lpRing.className = 'lpring hidden'; document.body.appendChild(lpRing);
function lpCancel() { if (!lp) return; clearTimeout(lp.t); lp = null; lpRing.classList.add('hidden'); }
const lpXY = ev => { const t = ev.touches ? ev.touches[0] || ev.changedTouches?.[0] : ev; return t ? [t.clientX, t.clientY] : null; };
let lpTouchT = 0;
function lpStart(oe) {
  if (oe.touches) lpTouchT = Date.now(); else if (Date.now() - lpTouchT < 1500) return; // ignore emulated mouse after touch
  S.lpSuppress = false; if (lp) return lpCancel();
  if ((oe.touches && oe.touches.length !== 1) || (!oe.touches && oe.button !== 0) || S.nav?.active || S.picking || S.measuring) return;
  const [cx, cy] = lpXY(oe), r = map.getCanvasContainer().getBoundingClientRect(), pt = { x: cx - r.left, y: cy - r.top };
  lp = { x: cx, y: cy, t: setTimeout(() => { const ll = map.unproject([pt.x, pt.y]); lpCancel(); S.lpSuppress = true; navigator.vibrate?.(25); dropPin(ll); }, 850) };
  lpRing.style.transform = `translate(${cx - 28}px,${cy - 28}px)`; lpRing.classList.remove('hidden', 'go'); void lpRing.offsetWidth; lpRing.classList.add('go');
}
const lpMove = oe => { if (!lp) return; const xy = lpXY(oe); if ((oe.touches?.length || 1) > 1 || !xy || Math.hypot(xy[0] - lp.x, xy[1] - lp.y) > 9) lpCancel(); };
{ const c = map.getCanvasContainer(), o = { capture: true, passive: true };
  c.addEventListener('touchstart', lpStart, o); c.addEventListener('mousedown', lpStart, o);
  c.addEventListener('touchmove', lpMove, o); window.addEventListener('mousemove', lpMove, o);
  for (const ev of ['touchend', 'touchcancel']) c.addEventListener(ev, lpCancel, o);
  window.addEventListener('mouseup', lpCancel, o); }
for (const ev of ['movestart', 'zoomstart', 'rotatestart', 'pitchstart', 'dragstart']) map.on(ev, lpCancel);
map.on('contextmenu', e => { e.originalEvent?.preventDefault(); lpCancel(); S.lpSuppress = true; navigator.vibrate?.(25); dropPin(e.lngLat); });
let dropMarker = null;
function pinSvg() { return S.theme === 'west'
  ? `<svg width="40" height="52" viewBox="0 0 40 52"><path d="M20 50C17 40 5 30 5 18a15 15 0 0 1 30 0c0 12-12 22-15 32z" fill="#f3e7cb" stroke="#20150b" stroke-width="2.4"/><path d="M14 12l12 12M26 12 14 24" stroke="#7c2e22" stroke-width="3.2" stroke-linecap="round"/></svg>`
  : `<svg width="40" height="52" viewBox="0 0 40 52" style="overflow:visible"><path d="M20 50 20 36" stroke="#4fd6e8" stroke-width="2"/><path d="M20 2 34 18 20 36 6 18Z" fill="#e0457a" stroke="#ffd25a" stroke-width="2"/><path d="M20 11 27 18 20 27 13 18Z" fill="#ffd25a"/></svg>`; }
function showMe() { if (!S.me) return; showPlace({ name: L('我的位置', 'My location'), address: '', lat: S.me.lat, lng: S.me.lng, me: true, tags: {} }); }
window._showMe = () => showMe();
function dropPin(ll) {
  const p = { name: t('dropped'), address: '', lat: ll.lat, lng: ll.lng, dropped: true, tags: {} };
  showPlace(p);
}
// ---------- directions ----------
// S.from / S.dest: {name,lat,lng} or {gps:true}
function attachAC(input, onPick) {
  const box = document.createElement('div'); box.className = 'acl hidden'; input.parentElement.appendChild(box);
  let tm, items = [];
  const extra = () => [{ gps: true, name: t('mylocation'), address: 'GPS' }, { pickMap: true, name: lang === 'zh' ? '在地图上选择' : 'Choose on map', address: '' },
    ...store.get('saved', []).slice(0, 3), ...store.get('recents', []).slice(0, 4)];
  const render = list => { items = list; box.innerHTML = list.map((r, i) => `<div class="sug" data-i="${i}"><div class="i">${r.gps ? ic('locate') : r.pickMap ? ic('coord') : r.src === 'recent' ? ic('clock') : r.src === 'saved' ? ic('star') : catIc(r.cls || r.category)}</div><div style="flex:1;min-width:0"><div class="t">${esc(r.name)}</div><div class="s">${esc(r.gps || r.pickMap ? (r.address || '') : shortAddr(r))}</div></div>${r.dist != null && !r.gps ? `<div class="s" style="flex:none">${fmtDist(r.dist)}</div>` : ''}</div>`).join(''); box.classList.toggle('hidden', !list.length); };
  input.addEventListener('focus', () => { input.select(); render(extra()); });
  let acA = null, sel = -1;
  input.addEventListener('input', () => { clearTimeout(tm); acA?.abort(); sel = -1; const v = input.value.trim(); if (v.length < 1) return render(extra());
    const top = extra().slice(0, 2), ctx = acCtx(), local = AC.localSuggest(v, ctx, acExtra(v)); render([...top, ...local]);
    const ac = new AbortController(); acA = ac;
    tm = setTimeout(() => AC.suggest(v, ctx, acExtra(v), (list, ph) => { if (!ac.signal.aborted && ph === 'remote' && input.value.trim() === v) render([...top, ...list]); }, ac.signal).catch(() => {}), 0); });
  input.addEventListener('keydown', e => { const rows = box.querySelectorAll('.sug'); if (!rows.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { sel = Math.max(0, Math.min(rows.length - 1, sel + (e.key === 'ArrowDown' ? 1 : -1))); rows.forEach((r, i) => r.classList.toggle('sel', i === sel)); e.preventDefault(); }
    if (e.key === 'Enter' && items[sel >= 0 ? sel : (items[0]?.gps || items[0]?.pickMap ? 2 : 0)]) { e.preventDefault(); box.classList.add('hidden'); input.blur(); onPick(items[sel >= 0 ? sel : (items[0]?.gps || items[0]?.pickMap ? 2 : 0)]); } });
  box.addEventListener('pointerdown', e => { const el = e.target.closest('.sug'); if (!el) return; e.preventDefault(); box.classList.add('hidden'); input.blur(); onPick(items[+el.dataset.i]); });
  input.addEventListener('blur', () => setTimeout(() => box.classList.add('hidden'), 150));
}
function pickOnMap() {
  return new Promise(res => {
    closePanelTemp(true);
    const bar = document.createElement('div'); bar.className = 'card pickbar'; bar.innerHTML = `<span>${lang === 'zh' ? '点按地图选择位置' : 'Tap the map to choose'}</span><button class="btn ghost">${lang === 'zh' ? '取消' : 'Cancel'}</button>`;
    document.body.appendChild(bar); S.picking = true;
    const done = v => { S.picking = false; bar.remove(); map.off('click', onClick); closePanelTemp(false); res(v); };
    const onClick = async e => { const ll = e.lngLat; let name = `${ll.lat.toFixed(5)}, ${ll.lng.toFixed(5)}`; try { const r = await photonReverse(ll); if (r) name = r.name; } catch {} done({ name, lat: ll.lat, lng: ll.lng }); };
    bar.querySelector('button').onclick = () => done(null);
    setTimeout(() => map.on('click', onClick), 0);
  });
}
const closePanelTemp = hide => { panel.style.visibility = hide ? 'hidden' : ''; };
function openDirections(dest, autostart = false) {
  if (dest !== undefined) S.dest = dest; S.from = S.from || { gps: true, name: t('mylocation') }; S.routes = null;
  openPanel(`<button class="xbtn" id="dirX" title="${lang === 'zh' ? '关闭路线' : 'Close directions'}">✕</button><div class="dir">
    <div class="seg" id="modeSeg" style="margin-right:48px"><button data-m="drive">🚗 ${t('drive')}</button><button data-m="walk">🚶 ${t('walk')}</button><button data-m="bike">🚲 ${L('骑行', 'Bike')}</button><button data-m="transit">🚌 ${t('transit')}</button></div>
    <div class="row2"><div style="flex:1">
      <div class="fld"><span>◯</span><div class="acbox" style="flex:1"><input id="fromIn" value="${esc(S.from.name)}"></div></div>
      <div class="fld"><span>${ic('pin')}</span><div class="acbox" style="flex:1"><input id="toIn" value="${esc(S.dest?.name || '')}" placeholder="${t('to')}"></div></div>
    </div><button class="swap" id="swapBtn" title="swap">⇅</button></div>
  </div><div id="alts">${S.dest ? `<div class="row">${t('searching')}</div>` : ''}</div><div id="steps"></div>`, t('directions'), 'dir');
  const seg = $('#modeSeg'); const mark = () => seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.m === S.travel)); mark();
  seg.onclick = e => { const m = e.target.closest('button')?.dataset.m; if (m) { S.travel = m; mark(); route(false); } };
  const set = which => async v => { if (!v) return; if (v.pickMap) { v = await pickOnMap(); if (!v) return openDirections(); } S[which] = v.gps ? { gps: true, name: t('mylocation') } : { name: v.name, lat: v.lat, lng: v.lng }; openDirections(); };
  attachAC($('#fromIn'), set('from')); attachAC($('#toIn'), set('dest'));
  $('#swapBtn').onclick = () => { const f = S.from; S.from = S.dest || { gps: true, name: t('mylocation') }; S.dest = f.gps ? null : f; if (!S.dest && S.from.gps) {} openDirections(); };
  $('#dirX').onclick = closeDirections;
  if (S.dest && !S.dest.gps) route(autostart); else if (S.dest?.gps) route(autostart);
}
function closeDirections() { clearTransit(); S.routes = null; S.from = null; drawRoutes(); closePanel(); }
const gpsNow = () => new Promise(res => navigator.geolocation ? navigator.geolocation.getCurrentPosition(p => { setMe(p); res(S.me); }, () => res(null), { timeout: 8000, enableHighAccuracy: true }) : res(null));
async function resolveEnd(e) { if (!e) return null; if (!e.gps) return e; return S.me || await gpsNow(); }
async function route(autostart) {
  const from = await resolveEnd(S.from), to = await resolveEnd(S.dest);
  if (!from || !to) { $('#alts').innerHTML = `<div class="row">${!from ? t('err') + ': GPS' : ''}</div>`; return; }
  clearTransit();
  if (S.travel === 'transit') { S.routes = null; drawRoutes(); return routeTransit(from, to); }
  try {
    S.routes = await osrm(from, to, S.travel); S.routeIdx = 0; drawRoutes(); fitRoute(); renderAlts();
    if (autostart) startNav();
  } catch (e) { $('#alts').innerHTML = `<div class="row">${t('err')}: ${esc(e.message)}</div>`; }
}
function renderAlts() {
  $('#alts').innerHTML = S.routes.map((r, i) => `<div class="alt${i === S.routeIdx ? ' on' : ''}" data-i="${i}"><div class="d">${fmtDur(r.duration)}<small>${fmtDist(r.distance)}</small></div>
    ${r.note && i === S.routeIdx ? `<div class="sub" style="padding:4px 0">${esc(r.note)}</div>` : ''}${i === S.routeIdx ? `<div style="margin-top:8px"><button class="btn" id="goBtn">▲ ${t('start')}</button></div>` : ''}</div>`).join('');
  $('#alts').onclick = e => { if (e.target.id === 'goBtn') return startNav(); const a = e.target.closest('.alt'); if (a) { S.routeIdx = +a.dataset.i; drawRoutes(); renderAlts(); } };
  const r = S.routes[S.routeIdx];
  $('#steps').innerHTML = `<div class="dh" style="font-size:15px">${t('steps')}</div>` + r.steps.map(s => `<div class="step"><div class="i">${arrow(s)}</div><div>${esc(instruction(s))}<div class="m">${s.distance ? fmtDist(s.distance) : ''}</div></div></div>`).join('');
}
export const arrow = s => s.type === 'arrive' ? '⚑' : s.type === 'depart' ? '⬆' : s.modifier.includes('left') ? (s.modifier.includes('slight') ? '⬉' : '⬅') : s.modifier.includes('right') ? (s.modifier.includes('slight') ? '⬈' : '➡') : s.modifier === 'uturn' ? '⮌' : s.type.includes('roundabout') ? '⟳' : '⬆';
function drawRoutes() {
  if (!map.getSource('route')) return;
  const rs = S.routes || [];
  map.getSource('route').setData({ type: 'FeatureCollection', features: rs[S.routeIdx] ? [{ type: 'Feature', properties: {}, geometry: rs[S.routeIdx].geometry }] : [] });
  map.getSource('route-alt').setData({ type: 'FeatureCollection', features: rs.filter((_, i) => i !== S.routeIdx).map(r => ({ type: 'Feature', properties: {}, geometry: r.geometry })) });
}
function fitRoute() {
  const c = S.routes[S.routeIdx].geometry.coordinates; const b = new maplibregl.LngLatBounds(c[0], c[0]); c.forEach(x => b.extend(x));
  map.fitBounds(b, { padding: innerWidth > 700 ? { left: 440, right: 80, top: 80, bottom: 80 } : { top: 140, bottom: innerHeight * 0.5, left: 40, right: 40 }, duration: 600 });
}
async function startNav() {
  ios.unlockSpeech(); ios.enableCompass(onCompass); // must run synchronously inside the Start tap on iOS
  ios.wakeOn(toast); document.getElementById('iosGuide')?.remove();
  const { startNavigation } = await import('./nav.js'); // lazy: only loaded when navigating
  closePanel();
  S.nav = startNavigation({ map, S, setMe: (c) => { S.me = c; if (puck) puck.setLngLat(c); updAcc(); }, getPuck: () => puck, makePuck: c => { setMe({ coords: { latitude: c.lat, longitude: c.lng } }); return puck; }, reroute: async from => (await osrm(from, await resolveEnd(S.dest), S.travel)), drawRoutes, onEnd: () => { ios.wakeOff(); S.nav = null; S.routes = null; drawRoutes(); $('#top').classList.remove('hidden'); } });
  $('#top').classList.add('hidden');
}
$('#dirBtn').onclick = () => openDirections(S.place || null);

// ---------- controls ----------
$('#zin').onclick = () => map.zoomIn({ duration: 350 }); $('#zout').onclick = () => map.zoomOut({ duration: 350 });
$('#compassBtn').onclick = () => { if (S.nav?.active) return S.nav.toggleHeading(); map.easeTo({ bearing: 0, pitch: 0 }); };
$('#locBtn').onclick = () => { ios.enableCompass(onCompass); locate(true); };
let compT = 0;
function onCompass(h) { S.compassHdg = h; const n = performance.now(); if (n - compT < 120 || !puck || S.nav?.active) return; compT = n; if (S.me && (S.me.speed == null || S.me.speed < 1)) puck.setRotation(h); }
setTimeout(() => ios.maybeShowA2HS(), 2500);
$('#layersBtn').onclick = () => { const lp = $('#layersPop'); if (lp.classList.contains('hidden')) { renderLayersPop(); sheetOpen(); } else sheetClose(); };
// v0.9.9 Layers = draggable bottom sheet with ONLY 昼 / 夜 / 卫星 (+ the Frontier Ink night palettes while that skin is active).
// Skins are chosen only in drawer → 地图皮肤. Animation is transform-only.
const LYI = { day: 'M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4M12 8.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7z', night: 'M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z', sat: 'M4 8l4-4 3 3-4 4zM13 17l4-4 3 3-4 4zM9.5 14.5l5-5M8 16a5 5 0 0 0 0 0M5 15a4 4 0 0 0 4 4' };
const lyic = k => `<svg class="lyic" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${LYI[k]}"/></svg>`;
function renderLayersPop() {
  const lp = $('#layersPop'), dk = isDark(), cur = S.sat ? 'sat' : dk ? 'night' : 'day', ink = INK();
  lp.classList.add('sheet'); lp.classList.toggle('inkl', ink);
  const opt = (k, attrs, zh, en, sub) => `<button class="lyo${cur === k ? ' on' : ''}" ${attrs}><span class="lyi">${lyic(k)}</span><b>${L(zh, en)}</b><small>${L(sub[0], sub[1])}</small></button>`;
  const pal = S.theme === 'west' && !S.skin ? `<div class="lyh">${L('夜间配色', 'Night palette')}</div><div class="seg palseg">${Object.entries(PALS).map(([k, p]) => `<button data-pal="${k}" class="${S.pal === k ? 'on' : ''}" title="${L(p.zh, p.en)}"><i style="display:inline-block;width:12px;height:12px;border-radius:50%;vertical-align:-1px;margin-right:5px;background:${p.map.mot};box-shadow:0 0 0 2px ${p.map.land}"></i>${k.toUpperCase()}</button>`).join('')}</div><div class="lys">${L(PALS[S.pal].zh, PALS[S.pal].en)}${dk ? '' : L(' · 夜间模式下生效', ' · applies at night')}</div>` : '';
  lp.innerHTML = `<div class="shg" data-drag="1"><i class="shbar"></i></div><div class="lyt"><b>${L('图层', 'Layers')}</b><button class="xbig popx" data-x="1" aria-label="close">✕</button></div>${ink ? '<div class="ikrule"><i></i></div>' : ''}
    <div class="ly3">${opt('day', 'data-md="light" data-sat="0"', '昼', 'Day', ['日间地图', 'Day map'])}${opt('night', 'data-md="dark" data-sat="0"', '夜', 'Night', ['夜间地图', 'Night map'])}${opt('sat', 'data-sat="1"', '卫星', 'Satellite', ['航拍影像', 'Imagery'])}</div>
    ${pal}<div class="lymore"><div class="lys">${S.mode === 'auto' ? L('当前跟随系统昼夜；点 昼 / 夜 改为手动。', 'Following system day/night; tap Day / Night to set it manually.') : `<button class="lyauto" data-md="auto">${L('改回跟随系统昼夜', 'Follow system day/night again')}</button>`}</div>
    <div class="lys">${L('卫星：EOX Sentinel‑2 无云（非商业）+ 埃德蒙顿市航拍', 'Satellite: EOX Sentinel‑2 cloudless (non‑commercial) + City of Edmonton orthophoto')}</div></div>`;
  lp.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.x) return sheetClose();
    if (b.dataset.pal) { S.pal = b.dataset.pal; store.set('pal', S.pal); if (styleKey() === 'west_dark') setStyle().then(renderLayersPop); else { applyBodyClass(); renderLayersPop(); } return; }
    if (b.dataset.md) S.mode = b.dataset.md;
    if (b.dataset.sat) { S.sat = b.dataset.sat === '1'; store.set('sat', S.sat); }
    setStyle().then(() => { if (!lp.classList.contains('hidden')) renderLayersPop(); }); };
}
// bottom-sheet drag: follow the finger with translateY; release → snap to half / full / dismiss
function sheetOpen() { const lp = $('#layersPop'); lp.classList.remove('full', 'shdrag'); lp.style.transform = ''; lp.classList.add('shin'); lp.classList.remove('hidden'); requestAnimationFrame(() => requestAnimationFrame(() => lp.classList.remove('shin'))); }
function sheetClose() { const lp = $('#layersPop'); if (lp.classList.contains('hidden')) return; lp.classList.remove('shdrag'); lp.style.transform = ''; lp.classList.add('shout'); const fin = () => { lp.classList.add('hidden'); lp.classList.remove('shout', 'full'); }; const t = setTimeout(fin, 320); lp.addEventListener('transitionend', function f(ev) { if (ev.target !== lp) return; lp.removeEventListener('transitionend', f); clearTimeout(t); fin(); }); }
window._sheet = { open: () => { renderLayersPop(); sheetOpen(); }, close: sheetClose };
(() => { const lp = $('#layersPop'); let y0 = null, dy = 0, t0 = 0, pid = null;
  lp.addEventListener('pointerdown', e => { if (!lp.classList.contains('sheet') || !e.target.closest('.shg,.lyt') || e.target.closest('button')) return; y0 = e.clientY; dy = 0; t0 = performance.now(); pid = e.pointerId; lp.setPointerCapture?.(pid); lp.classList.add('shdrag'); });
  lp.addEventListener('pointermove', e => { if (y0 == null || e.pointerId !== pid) return; dy = e.clientY - y0; const full = lp.classList.contains('full'); const lim = full ? Math.max(0, dy) : dy < 0 ? Math.max(dy, -lp.offsetHeight * .35) * .6 : dy; lp.style.transform = `translate3d(0,${(full ? 0 : 0) + lim}px,0)`; });
  const up = e => { if (y0 == null) return; y0 = null; lp.classList.remove('shdrag'); lp.style.transform = ''; const v = dy / Math.max(1, performance.now() - t0);
    if (dy > 90 || v > .6) { if (lp.classList.contains('full') && dy < 200) lp.classList.remove('full'); else sheetClose(); }
    else if (dy < -40 || v < -.5) lp.classList.add('full'); };
  lp.addEventListener('pointerup', up); lp.addEventListener('pointercancel', up); })();

// ---------- drawer ----------
let drawerSig = '';
const drawerState = () => { let x = [S.theme, S.mode, S.pal, S.skin, lang, SKINS.length, isDark()].join(); for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); x += '|' + k + '=' + localStorage.getItem(k); } return x; };
function renderDrawerIfStale() { const g = drawerState(); if (g !== drawerSig || !$('#drawer').firstChild) renderDrawer(); }
const curSkinName = () => S.skin ? SK.packName(SKINS.find(p => p.id === S.skin) || { name: { zh: S.skin, en: S.skin } }, ZH) : t(S.theme);
function renderDrawer() { drawerSig = drawerState();
  const saved = store.get('saved', []), rec = store.get('recents', []);
  const li = (arr, k) => arr.slice(0, 6).map((p, i) => `<div class="di" data-${k}="${i}"><span class="i">${k === 's' ? ic('star') : ic('clock')}</span><div>${esc(p.name)}<div class="s" style="font-size:12px;color:var(--muted)">${esc(p.address || '')}</div></div></div>`).join('') || `<div class="sub">${t('empty')}</div>`;
  const sub = (icn, title, inner) => `<div class="ds"><div class="di"><span class="i">${ic(icn)}</span><b>${title}</b></div>${inner}</div>`;
  const pad = h => `<div style="padding:0 22px 10px 58px">${h}</div>`;
  const X = drawerExtra(), open = store.get('drawerOpen', { mine: 1 });
  const sec = (id, icn, title, inner) => `<section class="dsec${open[id] ? ' open' : ''}" data-sec="${id}"><button class="dsh" data-sech="${id}" aria-expanded="${!!open[id]}"><span class="i">${ic(icn)}</span><b>${title}</b><span class="chev"></span></button><div class="dsb"><div class="dsi">${inner}</div></div></section>`;
  $('#drawer').innerHTML = `<div class="dh"><span>RoadGlow</span>${OV.L['@drawerSub'] ? `<i class="dsub">${esc(OV.L['@drawerSub'])}</i>` : ''}<button class="xbig xbtn" data-close="1" aria-label="close">${ic('close')}</button></div>${INK() ? inkMenuHtml() : ''}
   ${sec('mine', 'star', L('地点', 'Places'), sub('star', t('saved'), li(saved, 's')) + X.lists + sub('clock', t('recents'), li(rec, 'r') + (rec.length ? `<div class="di" data-clear="1"><span class="i">${ic('trash')}</span>${t('clear_history')}</div>` : '')))}
   ${sec('map', 'layers', L('地图', 'Map'), `<div class="ds"><div class="di" data-tool="packs"><span class="i">${ic('layers')}</span><div><b>${L('地图皮肤', 'Map skins')}</b><div class="s" style="font-size:13.5px;color:var(--muted)">${esc(curSkinName())} · ${L('选择、下载、更新', 'choose, download, update')}</div></div></div></div>` + X.tools)}
   ${sec('explore', 'quest', L('探索', 'Explore'), `<div class="ds"><div class="di" data-sq="1"><span class="i">${ic('quest')}</span><div><b>${L('支线任务', 'Side quests')}</b><div class="s" style="font-size:13.5px;color:var(--muted)">${L('鬼镇、废墟、奇特景点、观景台', 'Ghost towns, ruins, oddities, viewpoints')} · ${questDone().length} ✔</div></div></div>
     <div class="di" data-tool="transit"><span class="i">${ic('dir')}</span><div><b>${L('公共交通', 'Transit')}</b><div class="s" style="font-size:13.5px;color:var(--muted)">${L('Transitous 社区数据（含 ETS）', 'Transitous community data (incl. ETS)')}</div></div></div>
     <div class="di" data-tool="weather"><span class="i">${ic('info')}</span><div><b>${L('天气（地图中心）', 'Weather (map centre)')}</b><div class="s" style="font-size:13.5px;color:var(--muted)">Open-Meteo</div></div></div></div>`)}
   ${sec('navv', 'voice', L('导航与语音', 'Navigation & voice'), sub('voice', L('导航语音', 'Navigation voice'), `<div style="padding:0 22px 12px 58px" id="voiceBox">${voiceHtml()}</div>`)
     + sub('dir', L('导航卡片', 'Navigation card'), `<div style="padding:4px 22px 12px 22px" id="ncBox">${ncHtml(L)}</div>`)
     + (NATIVE && !BJ ? sub('dir', L('车机导航面板（Android Auto）', 'Car nav panel (Android Auto)'), pad(`<div class="seg"><button data-carp="1" class="${store.get('carPanel', true) ? 'on' : ''}">${L('皮肤主题', 'Skinned')}</button><button data-carp="0" class="${store.get('carPanel', true) ? '' : 'on'}">${L('标准卡片', 'Standard card')}</button></div>`)) : ''))}
   ${sec('settings', 'settings', t('settings'), sub('layers', L('昼夜模式', 'Day / night'), pad(`<div class="seg">${['auto', 'light', 'dark'].map(m => `<button data-md="${m}" class="${S.mode === m ? 'on' : ''}">${t(m)}</button>`).join('')}</div>`))
     + sub('settings', t('language'), pad(`<div class="seg"><button data-lang="" class="${!localStorage.getItem('lang') ? 'on' : ''}">${t('lang_auto')}</button><button data-lang="zh" class="${localStorage.getItem('lang') === 'zh' ? 'on' : ''}">中文</button><button data-lang="en" class="${localStorage.getItem('lang') === 'en' ? 'on' : ''}">English</button></div>`))
     + sub('size', L('文字与图标大小', 'Text & icon size'), pad(sizeHtml())))}
   <section class="dsec dupd"><button class="dsh" data-tool="update"><span class="i">${ic('info')}</span><b>${L('检查更新', 'Check for updates')}</b><span class="updver">v${APPVER}</span></button></section>
   ${sec('about', 'info', t('about'), `<div class="sub">${t('about_text')}</div>`)}<div class="orn" aria-hidden="true"><span class="ornl"></span><span class="ornw"><i></i><b></b></span></div>`;
  $('#drawer').onclick = e => {
    const ik = e.target.closest('[data-ink]'); if (ik) return inkMenu(ik.dataset.ink);
    const h = e.target.closest('[data-sech]'); if (h) { const o = store.get('drawerOpen', { mine: 1 }), id = h.dataset.sech, sc = h.parentElement; o[id] = sc.classList.toggle('open') ? 1 : 0; h.setAttribute('aria-expanded', !!o[id]); store.set('drawerOpen', o); return; }
    const el = e.target.closest('[data-s],[data-r],[data-md],[data-lang],[data-clear],[data-close],[data-sq],[data-tool],[data-vp],[data-vtest],[data-szreset],[data-ncc],[data-ncreset],[data-carp]'); if (!el) return;
    if (el.dataset.carp) { store.set('carPanel', el.dataset.carp === '1'); window.__rgCarPush?.(); return renderDrawer(); }
    if (el.dataset.close) return closeDrawer();
    if (el.dataset.ncc || el.dataset.ncreset) { if (el.dataset.ncreset) localStorage.removeItem('navCard'); else ncSet({ color: el.dataset.ncc }); applyBodyClass(); $('#ncBox').innerHTML = ncHtml(L); return; }
    if (el.dataset.szreset) { store.set('textScale', 1); store.set('iconScale', 1); applySizes(); return renderDrawer(); }
    if (el.dataset.vp) { localStorage.setItem('voicePack', el.dataset.vp); localStorage.removeItem('voiceName'); return renderDrawer(); }
    if (el.dataset.vtest) return import('./voice.js').then(m => m.say(m.phrase('test')));
    if (el.dataset.sq) { closeDrawer(); return openSideQuests(); }
    if (el.dataset.tool) { closeDrawer(); return tools[el.dataset.tool]?.(el.dataset.arg); }
    if (el.dataset.s) { closeDrawer(); pick(saved[+el.dataset.s]); }
    else if (el.dataset.r) { closeDrawer(); pick(rec[+el.dataset.r]); }
    else if (el.dataset.md) { S.mode = el.dataset.md; setStyle(); }
    else if (el.dataset.lang !== undefined) setLang(el.dataset.lang);
    else if (el.dataset.clear) { store.set('recents', []); renderDrawer(); }
  };
}
// v0.9.7 ink drawer: a short classical menu (targets: drawer_zh / drawer_en); 诸般设置 reveals every original section
function inkMenuHtml() {
  const curName = curSkinName();
  const row = (k, icn, zh, en, extra = '') => `<button class="ikm" data-ink="${k}">${li(icn)}<b>${L(zh, en)}</b>${extra}</button>`;
  return `<div class="inkm"><div class="ikrule"><i></i></div>
    ${row('saved', 'star', '珍藏之地', 'Saved places')}${row('trips', 'list', '行程录', 'Trips')}${row('recent', 'clock', '近日行迹', 'Recent')}
    <div class="ikbrush"></div>${row('skins', 'brush', '画风', 'Map skins', `<em>${esc(curName)}</em>`)}${row('voice', 'layers', '传令之声', 'Voice')}
    <div class="ikbrush b2"></div>${row('all', 'sun', '诸般设置', 'Settings')}${row('update', 'dl', '手新版', 'Check for updates')}</div>
    <button class="ikback" data-ink="back">‹ ${L('返', 'Back')}</button><div class="inkpoem" aria-hidden="true"></div>`;
}
function inkMenu(k) {
  const d = $('#drawer');
  if (k === 'all') { d.classList.add('all'); d.scrollTop = 0; return; }
  if (k === 'back') { d.classList.remove('all'); d.scrollTop = 0; return; }
  if (k === 'trips') { const o = store.get('drawerOpen', { mine: 1 }); o.mine = 1; store.set('drawerOpen', o); d.classList.add('all'); renderDrawer(); d.querySelector('[data-sec=mine]')?.classList.add('open'); d.scrollTop = 0; return; }
  closeDrawer();
  if (k === 'skins') return tools.packs?.();
  if (k === 'update') return tools.update?.();
  if (k === 'voice') { const o = store.get('drawerOpen', { mine: 1 }); o.navv = 1; store.set('drawerOpen', o); setTimeout(() => { openDrawer?.(); d.classList.add('all'); renderDrawer(); d.querySelector('[data-sec=navv]')?.scrollIntoView(); }, 50); return; }
  if (k === 'saved' || k === 'recent') { S.inkList = k; renderSuggest(k === 'saved' ? store.get('saved', []).map(r => ({ ...r, src: 'saved', inkSaved: true })) : recentItems()); }
}
// v0.9.7 ink search window: recents (or saved) as a classical list + 常寻之所 chips (target: search)
const INK_CH = ['restaurant', 'cafe', 'hotel', 'pharmacy', 'parking', 'fuel'];
function inkSugHtml(items) {
  const sv = store.get('saved', []), isSaved = r => sv.some(x => Math.abs(x.lat - r.lat) < 1e-5 && Math.abs(x.lng - r.lng) < 1e-5);
  const title = items[0]?.inkSaved ? L('珍藏之地', 'Saved places') : L('近日行迹', 'Recent');
  return `<div class="iks-h"><b>${title}</b>${items[0]?.inkSaved ? '' : `<button class="iks-clr" data-inkclr="1">${L('拂去', 'Clear')}</button>`}</div>`
    + items.map((r, i) => { const s2 = isSaved(r); return `<div class="sug iks${i === sugSel ? ' sel' : ''}" data-i="${i}"><div class="i${s2 ? ' r' : ''}">${li(s2 ? 'heart' : r.inkSaved ? 'star' : i % 2 ? 'pin' : 'clock')}</div><div style="flex:1;min-width:0"><div class="t">${esc(r.name)}</div><div class="s">${s2 ? L('已入珍藏', 'Saved') : esc(shortAddr(r))}</div></div></div>`; }).join('')
    + `<div class="iks-h k"><b>${L('常寻之所', 'Frequent')}</b></div><div class="iks-ch">${INK_CH.map(k => `<button class="ikc" data-inkk="${k}">${t(k)}</button>`).join('')}</div><div class="iks-mtn"></div>`;
}
// v0.9.3 drawer: the wrapper slides (transform only); frost = one-time downscaled+blurred map snapshot, else dim scrim
// The WebGL readback is the expensive part, so it runs only after the slide has finished (never during the animation),
// and the snapshot is reused while the camera has not moved.
let frostKey = '';
function frostSnap() {
  const fc = $('#frost'); if (!fc) return;
  const k = [map.getCenter().lng.toFixed(5), map.getCenter().lat.toFixed(5), map.getZoom().toFixed(2), map.getBearing().toFixed(1), map.getPitch().toFixed(0), styleKey(), S.pal].join();
  if (k === frostKey) return void fc.classList.add('on');
  fc.classList.remove('on');
  const snap = () => map.once('render', () => {
    if (!$('#drawer').classList.contains('open')) return;
    try {
      const src = map.getCanvas(), w = Math.max(1, src.clientWidth >> 2), h = Math.max(1, src.clientHeight >> 2);
      fc.width = w; fc.height = h; const c = fc.getContext('2d'); c.filter = 'blur(1px)';
      c.drawImage(src, 0, 0, w, h); c.filter = 'none';
      c.fillStyle = isDark() ? 'rgba(0,0,0,.18)' : 'rgba(255,250,240,.12)'; c.fillRect(0, 0, w, h);
      frostKey = k; requestAnimationFrame(() => fc.classList.add('on'));
    } catch { /* lost context: dim scrim alone */ }
  }) && map.triggerRepaint();
  setTimeout(snap, 340); // after the 240 ms slide has settled
}
// v0.9.3: pre-render + pre-rasterise the drawer once while idle (invisible, non-interactive) so the first open is a pure compositor slide
function warmDrawer() {
  try { window.__warmCat?.(); renderLayersPop?.(); } catch {}
  const w = $('#drawerW'), d = $('#drawer'); if (!w || d.classList.contains('open')) return;
  try { renderDrawer(); } catch { return; }
  const st = w.style; st.transition = 'none'; st.opacity = '0.01'; st.transform = 'none'; d.style.pointerEvents = 'none';
  requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(() => { st.transform = st.opacity = ''; d.style.pointerEvents = ''; requestAnimationFrame(() => { st.transition = ''; }); }, 60)));
}
const openDrawer = () => { $('#drawer').classList.remove('all'); renderDrawerIfStale(); $('#drawer').classList.add('open'); $('#drawerW')?.classList.add('open'); $('#scrim').classList.remove('hidden'); frostSnap(); };
const closeDrawer = () => { $('#drawer').classList.remove('open'); $('#drawerW')?.classList.remove('open'); $('#scrim').classList.add('hidden'); $('#frost')?.classList.remove('on'); };
$('#menuBtn').onclick = openDrawer; $('#scrim').onclick = closeDrawer;

let toastT; export function toast(s, ms = 2200) { const el = $('#toast'); el.textContent = s; el.classList.remove('hidden'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.add('hidden'), ms); }

// Shared link ?p=lat,lng&n=name
const sp = new URLSearchParams(location.search);
if (sp.get('p')) { const [la, ln] = sp.get('p').split(',').map(Number); if (!isNaN(la)) map.once('load', () => showPlace({ name: sp.get('n') || t('dropped'), address: `${la}, ${ln}`, lat: la, lng: ln })); }
navigator.permissions?.query({ name: 'geolocation' }).then(r => { if (r.state === 'granted') locate(false); }).catch(() => {});
// ---------- semantic / category search (keywords zh+en -> OSM tags, names, brands) ----------
const BR = (names, qids = []) => ({ brands: names, qids });
const SEM = [
  { k: ['burger', 'burgers', 'hamburger', '汉堡', '汉堡包'], t: L('汉堡', 'Burgers'), icon: 'restaurant', cuisine: 'burger', amen: 'fast_food|restaurant', name: 'burger', ...BR(["McDonald's", 'Burger King', "Wendy's", 'A&W', 'Five Guys', "Harvey's", "Carl's Jr", 'Fatburger', 'Red Robin', 'Burger Baron', 'Smash'], ['Q38076', 'Q177054', 'Q550258', 'Q2818848', 'Q1131810', 'Q1466184']) },
  { k: ['pizza', '披萨', '比萨'], t: L('披萨', 'Pizza'), icon: 'restaurant', cuisine: 'pizza', amen: 'fast_food|restaurant', name: 'pizza', ...BR(["Domino's", 'Pizza Hut', 'Panago', 'Little Caesars', 'Boston Pizza', 'Pizza 73', 'Freshslice'], ['Q839466', 'Q191615']) },
  { k: ['coffee', 'cafe', 'café', '咖啡', '咖啡馆', '咖啡店'], t: L('咖啡', 'Coffee'), icon: 'cafe', amen: 'cafe', cuisine: 'coffee_shop', name: 'coffee|café|cafe', ...BR(['Tim Hortons', 'Starbucks', 'Second Cup', 'Blenz'], ['Q175106', 'Q37158']) },
  { k: ['sushi', '寿司', 'japanese', '日料', '日本料理'], t: L('寿司 / 日料', 'Sushi / Japanese'), icon: 'restaurant', cuisine: 'sushi|japanese|ramen', amen: 'restaurant|fast_food', name: 'sushi|ramen', ...BR([]) },
  { k: ['chinese', '中餐', '中国菜', '火锅', 'hot pot', 'hotpot'], t: L('中餐', 'Chinese food'), icon: 'restaurant', cuisine: 'chinese|hot_pot|sichuan|cantonese|dim_sum', amen: 'restaurant|fast_food', name: 'hot pot|noodle|dumpling', ...BR([]) },
  { k: ['pho', 'vietnamese', '越南粉', '越南菜'], t: L('越南菜', 'Vietnamese'), icon: 'restaurant', cuisine: 'vietnamese', amen: 'restaurant|fast_food', name: 'pho', ...BR([]) },
  { k: ['chicken', 'fried chicken', '炸鸡'], t: L('炸鸡', 'Chicken'), icon: 'restaurant', cuisine: 'chicken|fried_chicken', amen: 'fast_food|restaurant', name: 'chicken', ...BR(['KFC', "Popeyes", "Mary Brown's", 'Church\'s'], ['Q524757']) },
  { k: ['pharmacy', 'drugstore', '药店', '药房'], t: L('药店', 'Pharmacy'), icon: 'pharmacy', amen: 'pharmacy', shop: 'chemist', name: 'pharmacy|drug', ...BR(['Shoppers Drug Mart', 'Rexall', 'London Drugs']) },
  { k: ['gas', 'gas station', 'fuel', 'petrol', '加油站', '加油'], t: L('加油站', 'Gas'), icon: 'fuel', amen: 'fuel', name: '', ...BR(['Petro-Canada', 'Shell', 'Esso', 'Co-op', 'Husky', 'Costco Gas', 'Mobil']) },
  { k: ['grocery', 'supermarket', '超市', '杂货'], t: L('超市', 'Groceries'), icon: 'supermarket', shop: 'supermarket|convenience|greengrocer', name: '', ...BR(['Safeway', 'Sobeys', 'Save-On-Foods', 'Real Canadian Superstore', 'No Frills', 'T&T', 'Walmart', 'Costco']) },
  { k: ['bar', 'pub', '酒吧'], t: L('酒吧', 'Bars'), icon: 'bar', amen: 'bar|pub|biergarten', name: '', ...BR([]) },
  { k: ['hospital', '医院', 'er', 'emergency', '急诊'], t: L('医院', 'Hospitals'), icon: 'hospital', amen: 'hospital|clinic', name: 'hospital', ...BR([]) },
  { k: ['hotel', 'motel', '酒店', '旅馆', '住宿'], t: L('住宿', 'Hotels'), icon: 'hotel', tour: 'hotel|motel|hostel|guest_house', name: '', ...BR([]) },
  { k: ['atm', 'bank', '银行', '取款机'], t: L('银行 / ATM', 'Banks / ATMs'), icon: 'bank', amen: 'bank|atm', name: '', ...BR(['RBC', 'TD', 'Scotiabank', 'BMO', 'CIBC', 'ATB']) },
  { k: ['library', '图书馆'], t: L('图书馆', 'Libraries'), icon: 'library', amen: 'library', name: '', ...BR([]) },
  { k: ['park', '公园'], t: L('公园', 'Parks'), icon: 'park', leis: 'park|garden|nature_reserve', name: '', ...BR([]) },
  { k: ['ice cream', '冰淇淋', 'dessert', '甜品'], t: L('甜品', 'Dessert'), icon: 'cafe', amen: 'ice_cream', shop: 'pastry|confectionery', cuisine: 'ice_cream|dessert', name: 'ice cream|gelato|dessert', ...BR(['Dairy Queen', 'Marble Slab'], ['Q1141226']) },
  { k: ['bakery', '面包', '面包店', '烘焙'], t: L('面包店', 'Bakeries'), icon: 'cafe', shop: 'bakery', name: 'bakery', ...BR([]) },
  { k: ['restaurant', 'food', '餐厅', '饭店', '吃饭', '美食'], t: L('餐厅', 'Restaurants'), icon: 'restaurant', amen: 'restaurant|fast_food|food_court', name: '', ...BR([]) },
  { k: ['parking', '停车', '停车场'], t: L('停车场', 'Parking'), icon: 'parking', amen: 'parking', name: '', ...BR([]) },
  { k: ['ev', 'charging', '充电', '充电站'], t: L('充电站', 'EV charging'), icon: 'fuel', amen: 'charging_station', name: '', ...BR([]) },
];
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function semMatch(v) { const x = v.trim().toLowerCase(); if (!x) return null; const K = e => e.k.map(k => k.toLowerCase()); return SEM.find(e => K(e).includes(x)) || SEM.find(e => K(e).some(k => k.length > 2 && (x === k + 's' || x.endsWith(' ' + k) || x.startsWith(k + ' ')))) || null; }
function semOverpass(e, bb) {
  const P = [];
  if (e.amen) P.push(`nwr["amenity"~"^(${e.amen})$"]${e.cuisine && !/cafe|pharmacy|fuel|bank|library|parking|charging|hospital|ice_cream/.test(e.amen) && e.t !== L('餐厅', 'Restaurants') ? `["cuisine"~"${e.cuisine}",i]` : ''}(${bb});`);
  if (e.shop) P.push(`nwr["shop"~"^(${e.shop})$"](${bb});`);
  if (e.tour) P.push(`nwr["tourism"~"^(${e.tour})$"](${bb});`);
  if (e.leis) P.push(`nwr["leisure"~"^(${e.leis})$"]["name"](${bb});`);
  if (e.name) P.push(`nwr["name"~"${e.name}",i]["amenity"](${bb});`, `nwr["name"~"${e.name}",i]["shop"](${bb});`);
  if (e.brands.length) P.push(`nwr["brand"~"^(${e.brands.map(reEsc).join('|')})",i](${bb});`, `nwr["name"~"^(${e.brands.map(reEsc).join('|')})",i](${bb});`);
  if (e.qids.length) P.push(`nwr["brand:wikidata"~"^(${e.qids.join('|')})$"](${bb});`);
  return `[out:json][timeout:12];(${P.join('')});out tags center 150;`;
}
// features already in the loaded vector tiles (instant, works offline for cached tiles)
function semTiles(e) {
  const re = new RegExp([e.name, ...e.brands.map(reEsc)].filter(Boolean).join('|') || '^$', 'i');
  const cls = new Set([...(e.amen || '').split('|'), ...(e.shop || '').split('|'), ...(e.tour || '').split('|'), e.icon]);
  return map.queryRenderedFeatures({ layers: ['poi', ...TPI].filter(l => map.getLayer(l)) }).filter(f => (re.source !== '^$' && re.test(f.properties.name || '')) || (!e.cuisine && !e.chain && (cls.has(f.properties.subclass) || cls.has(f.properties.class)))).map(f => {
    const id = typeof f.id === 'number' ? f.id : null; return { type: id ? ['node', 'node', 'way', 'relation'][id % 10] : 'node', id: id ? Math.floor(id / 10) : 0, lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0], tags: { name: f.properties.name, amenity: f.properties.subclass } }; });
}
async function semanticSearch(e, raw, again = false) {
  beginSearch(); q.blur(); const tok = S.semTok = (S.semTok || 0) + 1; if (again) clearCat0(); else clearCat();
  openPanel(`<div class="list"><div class="row">${t('searching')}</div></div>`, e.t);
  if (map.getZoom() < 12.5) await new Promise(r => { map.once('moveend', r); map.easeTo({ zoom: 13 }); });
  const B = map.getBounds(), bb = `${B.getSouth()},${B.getWest()},${B.getNorth()},${B.getEast()}`;
  let els = [], src = [];
  const nameRe = new RegExp([e.name, ...e.brands.map(reEsc), ...e.k.filter(k => /^[a-z]{4,}/.test(k))].filter(Boolean).join('|') || '^$', 'i');
  const ovP = Promise.race([overpass(semOverpass(e, bb), 9000), new Promise((_, rj) => setTimeout(() => rj(new Error('timeout')), 11000))]).then(r => { src.push('Overpass'); return r; }).catch(() => []);
  const terms = [...new Set([raw, e.k.find(k => /^[a-z]/.test(k)), ...e.brands.slice(0, 7)].filter(Boolean))];
  const phP = Promise.all(terms.map(tm => photonBox(tm, B, map.getCenter(), map.getZoom(), 20).catch(() => []))).then(r => r.flat());
  const okPh = x => !/^(highway|place|boundary|landuse|building)=/.test(x.category || '') && (nameRe.test(x.name) || (!e.name && !e.brands.length && new RegExp(`=(${[e.amen, e.shop, e.tour, e.leis].filter(Boolean).join('|')})$`).test(x.category || '')));
  const phEl = ph => ph.filter(okPh).map(x => ({ type: { N: 'node', W: 'way', R: 'relation' }[x.osm?.type] || 'node', id: x.osm?.id, lat: x.lat, lon: x.lng, tags: { name: x.name, _addr: x.address.split(',')[0], _city: AC.locality(x) } }));
  // v0.9.14 progressive: Photon (~0.5 s) paints list + pins first; Overpass (up to 11 s) merges in when it lands
  let fitted = false;
  const draw = (els, src, final) => {
    if (tok !== S.semTok) return;
    const seen = new Set(), all = [...els, ...semTiles(e)].filter(x => x.tags?.name && (x.lat ?? x.center?.lat)).filter(x => { const k = x.type + x.id; if (x.id && seen.has(k)) return false; seen.add(k); const k2 = x.tags.name.toLowerCase() + (x.lat ?? x.center.lat).toFixed(3) + (x.lon ?? x.center.lon).toFixed(3); if (seen.has(k2)) return false; seen.add(k2); return true; });
    const c = map.getCenter();
    const items = all.map(x => ({ name: x.tags.name, lat: x.lat ?? x.center.lat, lng: x.lon ?? x.center.lon, osm: x.id ? { type: x.type, id: x.id } : null, tags: x.tags.opening_hours || x.tags.cuisine ? x.tags : null, category: e.t,
      address: [[x.tags['addr:housenumber'], x.tags['addr:street']].filter(Boolean).join(' ') || x.tags._addr || '', x.tags._city || [x.tags['addr:city'], x.tags['addr:province'] || x.tags['addr:state']].filter(Boolean).join(', ')].filter(Boolean).join(' · '), _t: x.tags }))
      .sort((a, b) => haversine(c, a) - haversine(c, b));
    // pins: only the current view (+50 %) / nearest few — the list keeps everything
    const pinB = { w: B.getWest() - (B.getEast() - B.getWest()) / 2, e: B.getEast() + (B.getEast() - B.getWest()) / 2, s: B.getSouth() - (B.getNorth() - B.getSouth()) / 2, n: B.getNorth() + (B.getNorth() - B.getSouth()) / 2 };
    const pinned = items.map((it, i) => [it, i]).filter(([it], k) => k < 5 || (it.lng >= pinB.w && it.lng <= pinB.e && it.lat >= pinB.s && it.lat <= pinB.n)).slice(0, 60);
    S.catData = { type: 'FeatureCollection', features: pinned.map(([it, i]) => ({ type: 'Feature', id: i, properties: { name: it.name, icon: e.icon, i }, geometry: { type: 'Point', coordinates: [it.lng, it.lat] } })) };
    map.getSource('cat')?.setData(S.catData); S.catItems = items;
    openPanel(`<div class="list"><div style="font-size:13px;color:var(--muted);padding:6px 18px">${L('当前地图范围内 · 按距离排序 · 数据', 'In current map view · nearest first · data')}: ${src.join(' + ') || '—'} / OSM${final ? '' : ' · ' + L('仍在补充…', 'loading more…')}</div>${items.map((it, i) => `<div class="it" data-i="${i}"><div>${esc(it.name)}</div><div class="s">${fmtDist(haversine(c, it))}${it.address ? ' · ' + esc(it.address) : ''}${it._t.cuisine ? ' · ' + esc(it._t.cuisine.replace(/;/g, ', ')) : ''}${hoursBadgeSync(it._t)}</div></div>`).join('') || (final ? `<div class="row">${t('noresults')}</div>` : `<div class="row">${t('searching')}</div>`)}</div>`, `${e.t} · ${items.length}`);
    $('#panelBody').querySelector('.list').onclick = ev => { const it = ev.target.closest('.it'); if (it) { const p = S.catItems[+it.dataset.i]; map.easeTo({ center: [p.lng, p.lat], zoom: 17, padding: panelPadding() }); showPlace(p); } };
    hydrateBadges();
    if (!fitted && pinned.length) { fitted = true; const p0 = pinned[0][0]; const bx = new maplibregl.LngLatBounds([p0.lng, p0.lat], [p0.lng, p0.lat]); pinned.slice(0, 25).forEach(([i]) => bx.extend([i.lng, i.lat])); if (!B.contains(bx.getNorthEast()) || !B.contains(bx.getSouthWest())) map.fitBounds(bx, { padding: 60, maxZoom: 15 }); }
  };
  const ph = await phP; if (tok !== S.semTok) return; const phs = phEl(ph); if (phs.length) src.push('Photon');
  let ovDone = false; ovP.then(() => { ovDone = true; });
  await Promise.resolve(); if (!ovDone && phs.length) draw([...phs], src, false);
  const ov = await ovP; if (tok !== S.semTok) return; els.push(...ov, ...phs);
  if (!ov.length) { try { await nomWait(); const u = new URL('https://nominatim.openstreetmap.org/search'); u.search = new URLSearchParams({ q: e.k.find(k => /^[a-z]/.test(k)) || raw, viewbox: `${B.getWest()},${B.getNorth()},${B.getEast()},${B.getSouth()}`, bounded: 1, limit: 40, extratags: 1, addressdetails: 1, format: 'jsonv2' });
      const nm = (await (await fetch(u)).json()).map(x => ({ type: x.osm_type, id: x.osm_id, lat: +x.lat, lon: +x.lon, tags: { name: x.name, ...(x.extratags || {}), 'addr:housenumber': x.address?.house_number, 'addr:street': x.address?.road, _city: AC.locality({ city: x.address?.city || x.address?.town || x.address?.village, state: x.address?.state }) } })); if (nm.length) src.push('Nominatim'); els.push(...nm); } catch {} }
  draw(els, src, true);
  S._fitting = true; setTimeout(() => { S._fitting = false; markSearch({ type: 'sem', e, raw }); }, 1500);

}
let lastNomS = 0; const nomWait = async () => { const w = Math.max(0, lastNomS + 1100 - Date.now()); await new Promise(r => setTimeout(r, w)); lastNomS = Date.now(); };

// ---------- full formatted address (local format) ----------
const PROV = { Alberta: 'AB', 'British Columbia': 'BC', Saskatchewan: 'SK', Manitoba: 'MB', Ontario: 'ON', Quebec: 'QC', 'Québec': 'QC', 'New Brunswick': 'NB', 'Nova Scotia': 'NS', 'Prince Edward Island': 'PE', 'Newfoundland and Labrador': 'NL', Yukon: 'YT', 'Northwest Territories': 'NT', Nunavut: 'NU', 阿尔伯塔省: 'AB', 艾伯塔省: 'AB', 不列颠哥伦比亚省: 'BC', 安大略省: 'ON', 魁北克省: 'QC', 萨斯喀彻温省: 'SK', 曼尼托巴省: 'MB' };
const ABBR = [[/\bNorthwest\b/g, 'NW'], [/\bNortheast\b/g, 'NE'], [/\bSouthwest\b/g, 'SW'], [/\bSoutheast\b/g, 'SE'], [/\bAvenue\b/g, 'Ave'], [/\bStreet\b/g, 'St'], [/\bRoad\b/g, 'Rd'], [/\bDrive\b/g, 'Dr'], [/\bBoulevard\b/g, 'Blvd'], [/\bTrail\b/g, 'Trl'], [/\bCrescent\b/g, 'Cres'], [/\bPlace\b/g, 'Pl'], [/\bCourt\b/g, 'Crt'], [/\bWay\b/g, 'Way']];
function fmtAddr(t) {
  const hn = t['addr:housenumber'], st = t['addr:street'] && ABBR.reduce((s, [r, v]) => s.replace(r, v), t['addr:street']), unit = t['addr:unit'] || t['addr:flats'] || t['_n:unit'];
  const city = t['addr:city'], pc = t['addr:postcode'] || t['_n:postcode'], state = t['addr:province'] || t['addr:state'] || t['_n:state'], cc = (t['addr:country'] || t['_n:cc'] || '').toUpperCase();
  const line1 = (st && hn && st.startsWith(hn + ' ') ? [unit ? unit + '-' + st : st] : [unit && hn ? `${unit}-${hn}` : hn, st]).filter(Boolean).join(' ');
  if (!line1 && !city) return '';
  const parts = String(state || '').split(/[;；]/), hit = parts.find(x => PROV[x.trim()]); const prov = hit ? PROV[hit.trim()] : parts[0]; const ca = cc === 'CA' || !!hit;
  const tail = [prov, pc].filter(Boolean).join(ca ? ' ' : ', ');
  return [line1 || null, city, tail || null, ca ? null : (t['addr:country'] ? null : t['_n:country'])].filter(Boolean).join(', ');
}
const complete = t => t['addr:housenumber'] && t['addr:street'] && t['addr:city'] && (t['addr:postcode'] || t['_n:postcode']) && (t['addr:province'] || t['addr:state'] || t['_n:state']);
async function fillAddress(p, tags) {
  if (complete(tags)) return; const has = tags['addr:housenumber'] || tags['addr:street'];
  try {
    let extra = null;
    if (has && p.osm && !tags._display) { const el = await osmElement(p.osm.type, p.osm.id); extra = el?.tags; }
    let coe = null;
    if (!has && AC.ADDR.cityAt(p.lat, p.lng)) { const r = await AC.ADDR.reverse(p.lat, p.lng).catch(() => null); if (r && r.dist < (p.me ? 60 : 40)) { const [, hn, st] = r.name.match(/^(\S+) (.+)$/); coe = r; extra = { 'addr:housenumber': hn, 'addr:street': st, 'addr:city': r.city.split(',')[0] }; } }
    if (!coe && (!extra || !fmtAddr({ ...extra, ...tags }))) extra = { ...(await reverseAddr(p)), _approx: !has, _nom: !has };
    if (coe) p._note = L(`最近的门牌（${/Leth/.test(coe.city) ? '莱斯布里奇' : '埃德蒙顿'}市政府地址点，约 ${Math.round(coe.dist)} 米）`, `Nearest address point (City of ${coe.city.split(',')[0]}, ~${Math.round(coe.dist)} m)`);
    if (!coe && extra._nom) p._note = BJ ? L('大致地址（离线按坐标估算）', 'Approx. address (offline, from coordinates)') : L('大致地址（Nominatim 按坐标反查）', 'Approx. address (Nominatim reverse geocode)');
    if (extra._approx) p._approx = true;
    if (S.place !== p || !$('#addrTx')) return;
    const merged = { ...extra, ...Object.fromEntries(Object.entries(tags).filter(([, v]) => v)) }; Object.assign(tags, Object.fromEntries(Object.entries(merged).filter(([k]) => k.startsWith('_n:') || !tags[k])));
    $('#addrTx').textContent = fmtAddr(has ? merged : extra) || $('#addrTx').textContent;
    if (p._note || extra._approx) $('#addrNote').textContent = p._note || L('大致地址（按坐标反查）', 'Approx. address (from coordinates)');
  } catch {}
}
// ---------- photo gallery (scroll-snap = native smooth swipe) ----------
function galleryHtml(ph, fs = false) {
  return `<div class="gal${fs ? ' fs' : ''}"><div class="gtrack">${ph.map((x, i) => `<figure><img ${i < 2 ? '' : 'data-'}src="${esc(x.src)}" alt="" decoding="async"><figcaption>📷 <a href="${esc(x.page || '#')}" target="_blank" rel="noopener">${esc(x.credit || '')}</a></figcaption></figure>`).join('')}</div>
    ${ph.length > 1 ? `<button class="garr l" aria-label="prev">‹</button><button class="garr r" aria-label="next">›</button>` : ''}<div class="gidx">1/${ph.length}</div>${fs ? '<button class="xbig gx" aria-label="close">✕</button>' : ''}</div>`;
}
function bindGallery(g, ph, start = 0) {
  const tr = g.querySelector('.gtrack'), figs = [...tr.children];
  const cur = () => Math.round(tr.scrollLeft / tr.clientWidth);
  const load = i => [i - 1, i, i + 1].forEach(k => { const im = figs[k]?.querySelector('img[data-src]'); if (im) { im.src = im.dataset.src; im.removeAttribute('data-src'); } });
  const go = i => { i = Math.max(0, Math.min(ph.length - 1, i)); load(i); tr.scrollTo({ left: i * tr.clientWidth, behavior: 'smooth' }); };
  let raf; tr.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { const i = cur(); g.querySelector('.gidx').textContent = `${i + 1}/${ph.length}`; load(i); }); }, { passive: true });
  g.querySelector('.garr.l')?.addEventListener('click', e => { e.stopPropagation(); go(cur() - 1); });
  g.querySelector('.garr.r')?.addEventListener('click', e => { e.stopPropagation(); go(cur() + 1); });
  if (start) requestAnimationFrame(() => { load(start); tr.scrollLeft = start * tr.clientWidth; });
  if (!g.classList.contains('fs')) tr.addEventListener('click', e => { if (!e.target.closest('img')) return; const box = document.createElement('div'); box.innerHTML = galleryHtml(ph, true); const fg = box.firstElementChild; document.body.appendChild(fg); bindGallery(fg, ph, cur()); });
  else { const close = () => { g.remove(); removeEventListener('keydown', kd); }; const kd = e => { if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') go(cur() - 1); if (e.key === 'ArrowRight') go(cur() + 1); };
    addEventListener('keydown', kd); g.querySelector('.gx').onclick = close; }
}
// ---------- user-adjustable sizes (no style reload: rescale stored base expressions) ----------
const SZ = [0.8, 1, 1.25, 1.5, 1.75, 2];
const sz = () => ({ t: store.get('textScale', 1), i: store.get('iconScale', 1) });
let baseSizes = {};
function scaleExpr(v, k) {
  if (typeof v === 'number') return +(v * k).toFixed(3);
  if (Array.isArray(v) && v[0] === 'interpolate') return [...v.slice(0, 3), ...v.slice(3).map((x, i) => i % 2 ? (typeof x === 'number' ? +(x * k).toFixed(3) : ['*', k, x]) : x)];
  if (Array.isArray(v) && v[0] === 'step') return [v[0], v[1], ...v.slice(2).map((x, i) => i % 2 === 0 ? (typeof x === 'number' ? +(x * k).toFixed(3) : ['*', k, x]) : x)];
  return ['*', k, v];
}
function applySizes() {
  const { t: ts, i: is } = sz();
  document.documentElement.style.setProperty('--ts', ts); document.documentElement.style.setProperty('--is', is);
  if (!map.isStyleLoaded()) return;
  for (const l of map.getStyle().layers) {
    if (l.type !== 'symbol') continue;
    const b = baseSizes[l.id] ||= { t: l.layout?.['text-size'], i: l.layout?.['icon-size'] };
    try { if (b.t !== undefined) map.setLayoutProperty(l.id, 'text-size', scaleExpr(b.t, ts)); if (b.i !== undefined) map.setLayoutProperty(l.id, 'icon-size', scaleExpr(b.i, is)); } catch (e) { console.warn('size', l.id, e.message); }
  }
}
map.on('style.load', () => { baseSizes = {}; setTimeout(applySizes, 60); });
applySizes();
function sizeHtml() { const { t: ts, i: is } = sz(); const row = (k, v, lab) => `<div class="szrow"><span>${lab}</span><input type="range" min="0" max="5" step="1" value="${Math.max(0, SZ.indexOf(v))}" data-sz="${k}"><b id="szv_${k}">${Math.round(v * 100)}%</b></div>`;
  return row('textScale', ts, L('文字', 'Text')) + row('iconScale', is, L('图标', 'Icons')) + `<button class="btn ghost" data-szreset="1">${L('重置为默认', 'Reset')}</button>`; }
document.addEventListener('input', e => { const n = e.target.dataset?.nc; if (n) { const v = n === 'scale' ? NC_SCALES[+e.target.value] : +e.target.value / 100; ncSet({ [n]: v }); $('#ncv_' + n).textContent = Math.round(v * 100) + '%'; applyBodyClass(); } });
document.addEventListener('input', e => { const k = e.target.dataset?.sz; if (!k) return; const v = SZ[+e.target.value]; store.set(k, v); $('#szv_' + k).textContent = Math.round(v * 100) + '%'; applySizes(); });
// ---------- voice pack settings (voice.js is tiny; loaded with the drawer) ----------
import { PACKS, voices, voicePack } from './voice.js';
import * as PK from './packs.js';
import { initIsland } from './island.js';
setTimeout(() => { window._island = initIsland(store); }, 0);
PK.registerVoices(PACKS);
function voiceHtml() {
  const cur = voicePack(), vs = voices(), sel = localStorage.getItem('voiceName') || '';
  return `<div class="vpgrid">${Object.entries(PACKS).map(([k, p]) => `<button class="btn ghost${k === cur ? ' on' : ''}" data-vp="${k}">${esc(p.label[ZH ? 'zh' : 'en'])}</button>`).join('')}</div>
    <select id="voiceSel" class="vsel"><option value="">${L('自动选择声音', 'Auto voice')}</option>${vs.map(v => `<option${v.name === sel ? ' selected' : ''}>${esc(v.name)}</option>`).join('')}</select>
    <button class="btn" data-vtest="1" style="margin-top:8px">▶ ${L('试听', 'Test')}</button> <button class="btn ghost" data-tool="voicepacks" style="margin-top:8px">${L('下载语音包', 'Get voice packs')}</button>
    <div style="font-size:13px;color:var(--muted);margin-top:4px">${L('口音取决于设备已安装的语音', 'Accent depends on the voices installed on this device')}</div>`;
}
document.addEventListener('change', e => { if (e.target.id === 'voiceSel') { e.target.value ? localStorage.setItem('voiceName', e.target.value) : localStorage.removeItem('voiceName'); } });
if (window.speechSynthesis) speechSynthesis.onvoiceschanged = () => { if ($('#drawer').classList.contains('open')) renderDrawer(); };
// ---------- side quests (Wikidata CC0 + Wikimedia Commons) ----------
function questDone() { return store.get('questDone', []); }
const QK = { ghost: L('鬼镇 / 废弃村落', 'Ghost town / abandoned village'), ruin: L('废墟', 'Ruins'), odd: L('奇特建筑 / 路边奇观', 'Oddity / roadside attraction'), view: L('观景点', 'Viewpoint'), nature: L('奇特地貌', 'Odd landform') };
let QDATA = null;
async function questData() { if (!QDATA) QDATA = await (await fetch(`${base}sidequests_ca.json`)).json(); return QDATA; }
const qName = o => (ZH && o.zh) || o.en || o.zh;
const thumb = f => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(f)}?width=160`;
async function liveQuests(c) { // only used far from the prebuilt Canada set
  const cls = 'wd:Q74047 wd:Q350895 wd:Q109607 wd:Q180174 wd:Q14915208 wd:Q548879 wd:Q6017969';
  const qq = `SELECT ?i ?c ?coord ?img ?l ?d WHERE { SERVICE wikibase:around { ?i wdt:P625 ?coord. bd:serviceParam wikibase:center "Point(${c.lng} ${c.lat})"^^geo:wktLiteral; bd:serviceParam wikibase:radius "120". } VALUES ?c { ${cls} } ?i wdt:P31 ?c. OPTIONAL{?i wdt:P18 ?img} SERVICE wikibase:label { bd:serviceParam wikibase:language "${ZH ? 'zh,en' : 'en'}". ?i rdfs:label ?l. ?i schema:description ?d. } } LIMIT 200`;
  const j = await (await fetch('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(qq), { signal: AbortSignal.timeout(20000) })).json();
  const K = { Q74047: 'ghost', Q350895: 'ghost', Q109607: 'ruin', Q180174: 'odd', Q14915208: 'odd', Q548879: 'odd', Q6017969: 'view' }, m = {};
  for (const b of j.results.bindings) { const id = b.i.value.split('/').pop(); if (m[id] || /^Q\d+$/.test(b.l.value)) continue; const [lng, lat] = b.coord.value.slice(6, -1).split(' ').map(Number);
    m[id] = { id, lat, lng, k: K[b.c.value.split('/').pop()], en: b.l.value, d: b.d?.value, img: b.img ? decodeURIComponent(b.img.value.split('/').pop()) : undefined }; }
  return Object.values(m);
}
function updQuestLayer() {
  if (!QDATA || !map.getSource('quests')) return; const d = questDone();
  map.getSource('quests').setData({ type: 'FeatureCollection', features: QDATA.map((o, i) => ({ type: 'Feature', properties: { i, name: qName(o), done: d.includes(o.id) ? 1 : 0 }, geometry: { type: 'Point', coordinates: [o.lng, o.lat] } })) });
}
function addQuestLayer() {
  if (!S.questsOn || !map.isStyleLoaded()) return;
  if (!map.getSource('quests')) map.addSource('quests', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  if (!map.getLayer('quests')) map.addLayer({ id: 'quests', type: 'symbol', source: 'quests', layout: { 'icon-image': 'quest', 'icon-size': ['interpolate', ['linear'], ['zoom'], 4, 0.7, 12, 1.15], 'icon-allow-overlap': true, 'text-field': ['step', ['zoom'], '', 8, ['get', 'name']], 'text-font': map.getStyle().layers.find(l => l.id === 'poi')?.layout['text-font'] || ['Rajdhani SemiBold'], 'text-size': 15, 'text-offset': [0, 1.3], 'text-anchor': 'top', 'text-optional': true }, paint: { 'icon-opacity': ['case', ['==', ['get', 'done'], 1], 0.55, 1], 'text-color': isDark() ? '#ffe08a' : '#5a3d00', 'text-halo-color': isDark() ? '#000' : '#fff', 'text-halo-width': 2 } });
  updQuestLayer(); applySizes();
}
map.on('style.load', () => setTimeout(addQuestLayer, 50));
function showQuest(o) {
  const p = { name: qName(o), lat: o.lat, lng: o.lng, address: QK[o.k] || '', category: QK[o.k], desc: (ZH && o.dz) || o.d || '', quest: o, tags: { name: qName(o), wikidata: o.id, ...(o.img ? { wikimedia_commons: 'File:' + o.img } : {}), _display: QK[o.k] } };
  map.easeTo({ center: [o.lng, o.lat], zoom: Math.max(map.getZoom(), 12) }); showPlace(p);
}
async function openSideQuests() {
  openPanel(`<div class="row">${t('searching')}</div>`, L('支线任务', 'Side quests'), 'quests');
  const data = await questData(); S.questsOn = true; addQuestLayer();
  const c = S.me || map.getCenter(), dist = o => haversine(c, o);
  let list = data.map(o => [dist(o), o]).sort((a, b) => a[0] - b[0]);
  if (list[0][0] > 300000) { try { const live = await liveQuests(c); if (live.length) list = live.map(o => [dist(o), o]).sort((a, b) => a[0] - b[0]); } catch {} }
  const done = questDone(), tot = data.length, nd = data.filter(o => done.includes(o.id)).length;
  const shown = list.slice(0, 80);
  openPanel(`<div style="padding:10px 16px 6px"><div style="font-size:15px;color:var(--muted)">${L(`探索进度：${nd} / ${tot}（加拿大）`, `Exploration: ${nd} / ${tot} (Canada)`)}</div><div class="prog"><i style="width:${(100 * nd / tot).toFixed(1)}%"></i></div>
    <div style="font-size:13px;color:var(--muted)">${L('按与你/地图中心的距离排序 · 数据 Wikidata (CC0)，照片 Wikimedia Commons', 'Sorted by distance from you / map centre · Data: Wikidata (CC0), photos: Wikimedia Commons')}</div></div>
    <div id="sqList">${shown.map(([d, o], i) => `<div class="sq${done.includes(o.id) ? ' done' : ''}" data-i="${i}">${o.img ? `<img loading="lazy" src="${thumb(o.img)}" alt="">` : `<div class="ph0">✦</div>`}<div><div class="t">${esc(qName(o))}</div><div class="s">${esc(QK[o.k] || '')} · ${fmtDist(d)}</div>${o.d ? `<div class="s">${esc(((ZH && o.dz) || o.d).slice(0, 90))}</div>` : ''}</div></div>`).join('')}</div>`, L('支线任务', 'Side quests'), 'quests');
  $('#sqList').onclick = e => { const el = e.target.closest('.sq'); if (el) showQuest(shown[+el.dataset.i][1]); };
}

// ======================= v0.5 =======================
// ---------- transit (Transitous / MOTIS, free community service; GTFS incl. Edmonton ETS) ----------
function decodePoly(str, prec = 7) { let i = 0, lat = 0, lng = 0; const out = [], f = 10 ** prec;
  while (i < str.length) { for (const k of [0, 1]) { let b, sh = 0, r = 0; do { b = str.charCodeAt(i++) - 63; r |= (b & 31) << sh; sh += 5; } while (b >= 32); const d = r & 1 ? ~(r >> 1) : r >> 1; if (k) lng += d; else lat += d; } out.push([lng / f, lat / f]); }
  return out; }
async function transitPlan(from, to) {
  const u = `https://api.transitous.org/api/v1/plan?fromPlace=${from.lat},${from.lng}&toPlace=${to.lat},${to.lng}&time=${new Date().toISOString()}&numItineraries=4`;
  const j = await (await fetch(u, { signal: AbortSignal.timeout(20000) })).json();
  return (j.itineraries || []).map(it => ({ duration: it.duration, start: it.startTime, end: it.endTime, transfers: it.transfers,
    legs: it.legs.map(l => ({ mode: l.mode, name: l.routeShortName || l.displayName || '', head: l.headsign || '', color: l.routeColor ? '#' + l.routeColor : null, from: l.from?.name, to: l.to?.name, start: l.startTime, end: l.endTime, dur: l.duration, dist: l.distance, agency: l.agencyName, coords: l.legGeometry?.points ? decodePoly(l.legGeometry.points, l.legGeometry.precision || 7) : [] })) }));
}
const MODEI = { WALK: '🚶', BUS: '🚌', TRAM: '🚊', SUBWAY: '🚇', RAIL: '🚆', REGIONAL_RAIL: '🚆', FERRY: '⛴', BIKE: '🚲', COACH: '🚌', HIGHSPEED_RAIL: '🚄', METRO: '🚇' };
const hm = s => new Date(s).toLocaleTimeString(ZH ? 'zh-CN' : 'en-CA', { hour: 'numeric', minute: '2-digit' });
function drawTransit(it) {
  const fs = (it?.legs || []).map(l => ({ type: 'Feature', properties: { c: l.mode === 'WALK' ? '#7a7f8a' : (l.color || routeColor()), w: l.mode === 'WALK' ? 1 : 0 }, geometry: { type: 'LineString', coordinates: l.coords } }));
  if (!map.getSource('transit')) { map.addSource('transit', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.addLayer({ id: 'transit-case', type: 'line', source: 'transit', filter: ['==', ['get', 'w'], 0], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': isDark() ? '#000' : '#fff', 'line-width': 10 } });
    map.addLayer({ id: 'transit', type: 'line', source: 'transit', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ['get', 'c'], 'line-width': ['case', ['==', ['get', 'w'], 1], 4, 6], 'line-dasharray': [1, 0] } }); }
  map.getSource('transit').setData({ type: 'FeatureCollection', features: fs });
  const all = fs.flatMap(f => f.geometry.coordinates); if (all.length) { const b = new maplibregl.LngLatBounds(all[0], all[0]); all.forEach(c => b.extend(c)); map.fitBounds(b, { padding: innerWidth > 700 ? { left: 440, right: 80, top: 80, bottom: 80 } : { top: 140, bottom: innerHeight * 0.5, left: 40, right: 40 }, duration: 600 }); }
}
async function routeTransit(from, to) {
  $('#alts').innerHTML = `<div class="row">${t('searching')}</div>`; $('#steps').innerHTML = '';
  let its; try { its = await transitPlan(from, to); } catch (e) { $('#alts').innerHTML = `<div class="row">${t('err')}: Transitous ${esc(e.message)}</div>`; return; }
  if (!its.length) { $('#alts').innerHTML = `<div class="row">${L('此时段没有公交方案（或该地区无 GTFS 数据）', 'No transit itinerary found (or no GTFS data here)')}</div>`; drawTransit(null); return; }
  let sel = 0;
  const render = () => {
    $('#alts').innerHTML = its.map((it, i) => `<div class="alt${i === sel ? ' on' : ''}" data-i="${i}"><div class="d">${fmtDur(it.duration)}<small>${hm(it.start)} – ${hm(it.end)} · ${L('换乘', 'transfers')} ${it.transfers}</small></div>
      <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;align-items:center">${it.legs.filter(l => l.mode !== 'WALK' || l.dur > 120).map(l => l.mode === 'WALK' ? `<span>🚶${Math.round(l.dur / 60)}′</span>` : `<span class="tl" style="background:${l.color || 'var(--accent)'};color:#fff">${MODEI[l.mode] || '🚌'} ${esc(l.name)}</span>`).join('<span>›</span>')}</div></div>`).join('')
      + `<div style="font-size:12.5px;color:var(--muted);padding:6px 16px">${L('时刻表数据：Transitous（社区免费服务，GTFS 计划时刻，部分含实时）。公交模式不提供逐向导航。', 'Schedules: Transitous (free community service, scheduled GTFS, some realtime). No turn-by-turn in transit mode.')}</div>`;
    const it = its[sel];
    $('#steps').innerHTML = `<div class="dh" style="font-size:15px">${t('steps')}</div>` + it.legs.map(l => `<div class="step"><div class="i">${MODEI[l.mode] || '•'}</div><div>${l.mode === 'WALK' ? `${L('步行至', 'Walk to')} ${esc(l.to === 'END' ? (S.dest?.name || t('to')) : l.to)}` : `<b>${esc(l.name)}</b> ${esc(l.head ? '→ ' + l.head : '')}<div class="m">${hm(l.start)} ${esc(l.from)} → ${hm(l.end)} ${esc(l.to)}</div>`}<div class="m">${fmtDur(l.dur)}${l.dist ? ' · ' + fmtDist(l.dist) : ''}${l.agency ? ' · ' + esc(l.agency) : ''}</div></div></div>`).join('');
    drawTransit(it);
  };
  render(); $('#alts').onclick = e => { const a = e.target.closest('.alt'); if (a) { sel = +a.dataset.i; render(); } };
}
const clearTransit = () => map.getSource('transit')?.setData({ type: 'FeatureCollection', features: [] });

// ---------- distance measuring ----------
tools.measure = (start) => {
  if (S.measuring) return; S.measuring = true; closePanel(); const pts = start && typeof start === 'object' ? [start] : [];
  if (!map.getSource('measure')) { map.addSource('measure', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.addLayer({ id: 'measure-line', type: 'line', source: 'measure', filter: ['==', ['geometry-type'], 'LineString'], paint: { 'line-color': routeColor(), 'line-width': 4, 'line-dasharray': [2, 1] } });
    map.addLayer({ id: 'measure-pt', type: 'circle', source: 'measure', filter: ['==', ['geometry-type'], 'Point'], paint: { 'circle-radius': 7, 'circle-color': '#fff', 'circle-stroke-color': routeColor(), 'circle-stroke-width': 3 } }); }
  const bar = document.createElement('div'); bar.className = 'card pickbar measurebar'; document.body.appendChild(bar);
  const total = () => pts.reduce((s, p, i) => i ? s + haversine(pts[i - 1], p) : 0, 0);
  const draw = () => { map.getSource('measure')?.setData({ type: 'FeatureCollection', features: [...pts.map(p => ({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [p.lng, p.lat] } })), ...(pts.length > 1 ? [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: pts.map(p => [p.lng, p.lat]) } }] : [])] });
    bar.innerHTML = `<div><div style="font-size:13px;color:var(--muted)">${L('测距：点按地图添加点', 'Measure: tap the map to add points')}</div><div id="mTotal" style="font-size:24px;font-weight:700">${fmtDist(total())}</div></div><button class="btn ghost" data-u="1">${L('撤销', 'Undo')}</button><button class="xbig" data-x="1" aria-label="close">✕</button>`; };
  const onClick = e => { pts.push({ lat: e.lngLat.lat, lng: e.lngLat.lng }); draw(); };
  bar.onclick = e => { if (e.target.closest('[data-u]')) { pts.pop(); draw(); } if (e.target.closest('[data-x]')) { S.measuring = false; map.off('click', onClick); bar.remove(); map.getSource('measure')?.setData({ type: 'FeatureCollection', features: [] }); } };
  map.on('click', onClick); draw(); S.measureTotal = total;
};

// ---------- weather (Open-Meteo, no key) + sunrise/sunset computed locally (NOAA algorithm) ----------
function sunTimes(lat, lng, date = new Date()) {
  const rad = Math.PI / 180, J = date / 864e5 + 2440587.5, n = Math.round(J - 2451545.0 + 0.0008 - lng / 360);
  const Js = n + 0.0009 - lng / 360, M = (357.5291 + 0.98560028 * Js) % 360, C = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 0.0003 * Math.sin(3 * M * rad);
  const lam = (M + C + 180 + 102.9372) % 360, Jt = 2451545.0 + Js + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * lam * rad);
  const dec = Math.asin(Math.sin(lam * rad) * Math.sin(23.44 * rad)), cw = (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * Math.sin(dec)) / (Math.cos(lat * rad) * Math.cos(dec));
  if (cw > 1 || cw < -1) return { polar: cw > 1 ? 'night' : 'day' };
  const w = Math.acos(cw) / rad, toD = j => new Date((j - 2440587.5) * 864e5);
  return { rise: toD(Jt - w / 360), set: toD(Jt + w / 360) };
}
const WMO = c => c === 0 ? ['☀️', L('晴', 'Clear')] : c <= 2 ? ['🌤', L('少云', 'Partly cloudy')] : c === 3 ? ['☁️', L('阴', 'Overcast')] : c <= 48 ? ['🌫', L('雾', 'Fog')] : c <= 57 ? ['🌦', L('毛毛雨', 'Drizzle')] : c <= 67 ? ['🌧', L('雨', 'Rain')] : c <= 77 ? ['🌨', L('雪', 'Snow')] : c <= 82 ? ['🌧', L('阵雨', 'Showers')] : c <= 86 ? ['🌨', L('阵雪', 'Snow showers')] : ['⛈', L('雷暴', 'Thunderstorm')];
const wxCache = new Map();
placeExtras = async p => {
  const el = $('#wx'); if (!el) return;
  const st = sunTimes(p.lat, p.lng), tf = d => d.toLocaleTimeString(ZH ? 'zh-CN' : 'en-CA', { hour: 'numeric', minute: '2-digit' });
  const sun = st.polar ? (st.polar === 'day' ? L('极昼', 'Midnight sun') : L('极夜', 'Polar night')) : `🌅 ${tf(st.rise)} · 🌇 ${tf(st.set)}`;
  const k = p.lat.toFixed(2) + ',' + p.lng.toFixed(2);
  const show = w => { if (!$('#wx') || S.place !== p) return; const [ic, tx] = w ? WMO(w.current.weather_code) : ['', ''];
    $('#wx').innerHTML = `<div class="row"><span class="i">${ic || '☼'}</span><div>${w ? `<b>${Math.round(w.current.temperature_2m)}°C</b> ${tx} · ${L('体感', 'feels')} ${Math.round(w.current.apparent_temperature)}° · ${L('今日', 'today')} ${Math.round(w.daily.temperature_2m_min[0])}–${Math.round(w.daily.temperature_2m_max[0])}°` : ''}
      <div style="font-size:15px;color:var(--muted)">${sun}${L('（日出日落为本地计算，时间按本设备时区显示）', ' (computed locally, shown in this device’s time zone)')}</div>${w ? `<div style="font-size:12px;color:var(--muted)">Weather: Open-Meteo.com (CC BY 4.0)</div>` : ''}</div></div>`; };
  show(null);
  try { let w = wxCache.get(k); if (!w) { w = await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.lat.toFixed(3)}&longitude=${p.lng.toFixed(3)}&current=temperature_2m,apparent_temperature,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`, { signal: AbortSignal.timeout(8000) })).json(); wxCache.set(k, w); } show(w); } catch {}
};

// ---------- saved lists ----------
const lists = () => store.get('lists', [L('收藏', 'Favourites'), L('想去', 'Want to go')]);
function chooseList(p, after) {
  const box = document.createElement('div'); box.className = 'card listpick';
  box.innerHTML = `<div style="font-weight:600;font-size:18px;margin-bottom:10px">${L('保存到列表', 'Save to list')}</div>${lists().map((l, i) => `<button class="btn ghost lp" data-i="${i}">${esc(l)}</button>`).join('')}
    <button class="btn ghost lp" data-new="1">＋ ${L('新建列表', 'New list')}</button><button class="xbig popx" data-x="1" aria-label="close">✕</button>`;
  document.body.appendChild(box);
  box.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.x) return box.remove();
    let name; if (b.dataset.new) { name = prompt(L('列表名称', 'List name')); if (!name) return; store.set('lists', [...lists(), name]); } else name = lists()[+b.dataset.i];
    box.remove(); after(name); };
}
drawerExtra = () => {
  const saved = store.get('saved', []), ls = [...new Set([...lists(), ...saved.map(s => s.list).filter(Boolean)])];
  const off = store.get('offline', []);
  return { lists: `<div class="ds"><div class="di"><span class="i">${ic('list')}</span><b>${L('我的列表', 'My lists')}</b></div>${ls.map(l => { const n = saved.filter(s => (s.list || lists()[0]) === l).length; return `<div class="di" data-tool="list" data-arg="${esc(l)}"><span class="i">▸</span>${esc(l)} <span style="color:var(--muted)">· ${n}</span></div>`; }).join('')}</div>`, tools: `<div class="ds"><div class="di" data-tool="measure"><span class="i">${ic('measure')}</span><b>${L('测量距离', 'Measure distance')}</b></div>
   <div class="di" data-tool="offline"><span class="i">${ic('offline')}</span><div><b>${L('下载当前区域（离线）', 'Download this area (offline)')}</b><div class="s" style="font-size:13.5px;color:var(--muted)">${off.length ? L(`已下载 ${off.length} 个区域`, `${off.length} area(s) downloaded`) : L('地图 + 地点，可离线查看和搜索', 'Map + places, view & search offline')}</div></div></div></div>` };
};
tools.transit = () => { S.travel = 'transit'; toast(L('已切换为公交模式：选择目的地后点“路线”', 'Transit mode on: pick a destination, then Directions'), 3500); q.focus(); };
tools.weather = () => { const c = map.getCenter(); showPlace({ name: L('地图中心', 'Map centre'), address: `${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}`, lat: c.lat, lng: c.lng }); };
// v0.9.4 dedicated update channel (drawer → 检查更新); updates.js is loaded only when opened
// v0.9.5 皮肤与语音包: hosted catalog (packs/index.json on the web app, i.e. the live-update path) + installed + local file.
tools.voicepacks = () => tools.packs('voice');
let _cat = null, _catT = 0; const catCached = async (force) => { if (force || !_cat || Date.now() - _catT > 120000) { _cat = PK.catalog(base).catch(e => { _cat = null; throw e; }); _catT = Date.now(); } return _cat; };
window.__warmCat = () => catCached().catch(() => {});
tools.packs = async (kind = 'skin') => { if (kind !== 'voice') kind = 'skin';
  const nm = n => typeof n === 'string' ? n : (ZH ? n?.zh || n?.en : n?.en || n?.zh) || '';
  const draw = async (msg = '') => {
    let cat = [], err = ''; try { cat = (await catCached()).filter(c => c.type === kind); } catch (e) { err = String(e.message || e); }
    const inst = (await PK.installed()).filter(p => p.type === kind), iv = Object.fromEntries(inst.map(p => [p.type + ':' + p.id, p]));
    const curV = voicePack(), curS = S.skin;
    const row = (e, c) => { const k = e.type + ':' + e.id, have = iv[k], up = have && c && PK.cmpVer(c.version, have.version) > 0, inUse = e.type === 'voice' ? curV === e.id : (e.builtin ? !curS && S.theme === e.base : curS === e.id);
      const old = !!(APPVER && c?.minAppVersion && PK.cmpVer(APPVER, c.minAppVersion) < 0);
      return `<div class="pkrow${inUse ? ' on' : ''}"><div class="pkt"><b>${esc(nm(e.name))}</b><span class="s">${e.type === 'voice' ? L('语音', 'Voice') : L('皮肤', 'Skin')} · v${esc((have || c || e).version || '')}${e.builtin ? ' · ' + L('内置', 'built-in') : ''}${up ? ` → v${esc(c.version)}` : ''}${old ? ' · ' + L(`需要 App ${c.minAppVersion}+`, `needs app ${c.minAppVersion}+`) : ''}</span>${c?.description ? `<span class="s">${esc(nm(c.description))}</span>` : ''}</div><div class="pkb">
        ${!e.builtin && c && (!have || up) && !old ? `<button class="btn" data-pki="${esc(c.id)}">${up ? L('更新', 'Update') : L('安装', 'Install')}</button>` : ''}
        ${(have || e.builtin) && !inUse ? `<button class="btn ghost" data-pku="${esc(k)}"${e.builtin ? ` data-pkb="${esc(e.base)}"` : ''}>${L('使用', 'Use')}</button>` : ''}${inUse ? `<span class="pkon">✔ ${L('使用中', 'In use')}</span>` : ''}
        ${have && !e.builtin ? `<button class="btn ghost" data-pkr="${esc(k)}">${L('移除', 'Remove')}</button>` : ''}</div></div>`; };
    const catIds = new Set(cat.map(c => c.type + ':' + c.id));
    const isInst = c => c.builtin || iv[c.type + ':' + c.id];
    const local = inst.filter(p => !catIds.has(p.type + ':' + p.id));
    const html = `<div class="pks">${msg ? `<div class="pkmsg">${esc(msg)}</div>` : ''}
      <div class="pkh">${kind === 'skin' ? L('已安装的皮肤', 'Installed skins') : L('已安装的语音包', 'Installed voices')}</div>${cat.filter(isInst).map(c => row(c, c)).join('')}${local.map(p => row(p, null)).join('')}
      <div class="pkh">${L('可下载', 'Available to download')}</div>${err ? `<div class="s">${L('目录加载失败：', 'Catalog unavailable: ') + esc(err)}</div>` : (cat.filter(c => !isInst(c)).map(c => row(c, c)).join('') || `<div class="s">${L('已全部安装', 'All installed')}</div>`)}
      <div class="pkh">${L('从文件安装', 'Install from file')}</div><label class="btn ghost pkfile">${L('选择 .rgpack / .json 文件', 'Choose a .rgpack / .json file')}<input type="file" id="pkFile" accept=".rgpack,.zip,.json,application/zip,application/json" hidden></label>
      <div class="s" style="margin-top:8px">${L('无需更新 App；安装前会校验 SHA-256。', 'No app update needed; SHA-256 is verified before install.')}</div></div>`;
    openPanel((kind === 'skin' && OV.L['@skinsSub'] ? `<div class="pksub">${esc(OV.L['@skinsSub'])}</div>` : '') + html, kind === 'skin' ? (OV.L['@skinsTitle'] || L('地图皮肤', 'Map skins')) : L('导航语音包', 'Voice packs'));
    const body = $('#panelBody'), find = id => cat.find(c => c.type + ':' + c.id === id || c.id === id);
    $('#pkFile').onchange = async ev => { const f = ev.target.files[0]; if (!f) return; try { const r = await PK.installFromFile(f, APPVER); await done(r); } catch (e) { draw('✖ ' + e.message); } };
    body.onclick = async ev => { const b = ev.target.closest('button'); if (!b) return;
      try {
        if (b.dataset.pki) { b.disabled = true; b.textContent = L('下载中…', 'Downloading…'); const c = find(b.dataset.pki); const r = await PK.installFromUrl(c.url, c.sha256, APPVER); return done(r); }
        if (b.dataset.pku) { const [ty, id] = b.dataset.pku.split(':'); if (ty === 'voice') { localStorage.setItem('voicePack', id); return draw(); } S.skin = b.dataset.pkb ? null : id; if (b.dataset.pkb) S.theme = b.dataset.pkb; store.set('skin', S.skin); store.set('theme', S.theme); await setStyle(); return draw(); }
        if (b.dataset.pkr) { const [ty, id] = b.dataset.pkr.split(':'); if (ty === 'voice' && voicePack() === id) localStorage.removeItem('voicePack'); if (ty === 'skin' && S.skin === id) { S.skin = null; store.set('skin', null); } await PK.removePack(ty, id); delete PACKS[id]; await refreshSkins(); if (ty === 'skin') await setStyle(); return draw(L('已移除', 'Removed')); }
      } catch (e) { draw('✖ ' + e.message); } };
    async function done(r) { await refreshSkins(); PK.registerVoices(PACKS); if (r.type === 'skin') { S.skin = r.id; store.set('skin', r.id); await setStyle(); } else localStorage.setItem('voicePack', r.id); draw(`✔ ${nm(r.name)}${r.warnings?.length ? '\n⚠ ' + r.warnings.join('\n⚠ ') : ''}`); }
  };
  draw();
};
// files handed to the app by Android (open-with / share intent; MainActivity → window event 'rgPackFile')
let pkTok = ''; window.addEventListener('rgPackFile', async ev => { try { const d = ev.b64 ? ev : ev.detail || {}; if (d.tok && d.tok === pkTok) return; pkTok = d.tok || ''; const bin = atob(d.b64 || ''); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  const r = await PK.install(u8, 'share:' + (d.name || 'pack'), { appVer: APPVER }); await refreshSkins(); PK.registerVoices(PACKS); if (r.type === 'skin') { S.skin = r.id; store.set('skin', r.id); await setStyle(); } else localStorage.setItem('voicePack', r.id);
  toast(L('已安装：', 'Installed: ') + (typeof r.name === 'string' ? r.name : (ZH ? r.name.zh : r.name.en))); } catch (e) { toast('✖ ' + (e.message || e)); } });
tools.update = () => import('./updates.js').then(m => m.openUpdater({ openPanel, L, $, native: NATIVE, bj: BJ, webVer: APPVER })).catch(e => toast(String(e.message || e)));
tools.list = name => {
  const items = store.get('saved', []).filter(s => (s.list || lists()[0]) === name);
  openPanel(`<div class="list">${items.map((it, i) => `<div class="it" data-i="${i}"><div>${ic('star')} ${esc(it.name)}</div><div class="s">${esc(it.address || '')}</div></div>`).join('') || `<div class="row">${t('empty')}</div>`}</div>`, `${name} · ${items.length}`);
  $('#panelBody .list').onclick = e => { const el = e.target.closest('.it'); if (el) pick(items[+el.dataset.i]); };
};

// ---------- offline areas (Service Worker cache of tiles + local place index) ----------
const lng2x = (l, z) => Math.floor((l + 180) / 360 * 2 ** z), lat2y = (a, z) => Math.floor((1 - Math.log(Math.tan(a * Math.PI / 180) + 1 / Math.cos(a * Math.PI / 180)) / Math.PI) / 2 * 2 ** z);
if (!NATIVE && 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === '127.0.0.1')) navigator.serviceWorker?.register(`${base}sw.js`).catch(() => {});
tools.offline = async () => {
  const B = map.getBounds(), tj = await (await fetch('https://tiles.openfreemap.org/planet')).json(), tpl = tj.tiles[0];
  const urls = []; const z0 = Math.max(0, Math.floor(map.getZoom()) - 4);
  for (let z = z0; z <= 14; z++) { const x0 = lng2x(B.getWest(), z), x1 = lng2x(B.getEast(), z), y0 = lat2y(B.getNorth(), z), y1 = lat2y(B.getSouth(), z);
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) urls.push(tpl.replace('{z}', z).replace('{x}', x).replace('{y}', y)); }
  { const g = await ios.offlineGuard(urls.length * 30e3, m => Promise.resolve(confirm(m))); if (!g.ok) return; S.offlinePersisted = g.persisted; }
  if (urls.length > 3000) return toast(L(`区域太大（${urls.length} 个瓦片），请放大后再下载`, `Area too large (${urls.length} tiles) — zoom in first`));
  openPanel(`<div class="row"><div>${L('正在下载…', 'Downloading…')} <span id="offN">0</span> / ${urls.length}<div class="prog"><i id="offP" style="width:0"></i></div><div style="font-size:13px;color:var(--muted)">${L('矢量瓦片 OpenFreeMap（z' + z0 + '–14，放大后自动细化）', 'OpenFreeMap vector tiles (z' + z0 + '–14, overzoomed beyond)')}</div></div></div>`, L('离线下载', 'Offline download'));
  const cache = await caches.open('rg-tiles-v1'); let done = 0, fail = 0;
  const glyphs = []; for (const f of [...new Set(map.getStyle().layers.flatMap(l => l.layout?.['text-font'] || []))]) for (const r of ['0-255', '256-511', '8192-8447']) glyphs.push(`${base}glyphs/${encodeURIComponent(f)}/${r}.pbf`);
  const all = [...urls, ...glyphs, ...THEMES.flatMap(t => ['dark', 'light'].map(m => t + '_' + m)).flatMap(k => [`${base}styles/${k}.json${AV}`, `${base}sprites/${k}.json`, `${base}sprites/${k}.png`, `${base}sprites/${k}@2x.json`, `${base}sprites/${k}@2x.png`]), 'https://tiles.openfreemap.org/planet'];
  const work = async () => { while (all.length) { const u = all.pop(); try { if (!(await cache.match(u))) { const r = await fetch(u); if (r.ok) await cache.put(u, r); else fail++; } } catch { fail++; } done++; if ($('#offN')) { $('#offN').textContent = Math.min(done, urls.length); $('#offP').style.width = (100 * done / (urls.length + 40)).toFixed(1) + '%'; } } };
  await Promise.all(Array.from({ length: 6 }, work));
  // local place index for offline search: named POIs from the downloaded z14 tiles (already rendered features) + Photon names
  const feats = map.querySourceFeatures('omt', { sourceLayer: 'poi' }).filter(f => f.properties.name).map(f => ({ name: f.properties[ZH ? 'name:zh' : 'name:en'] || f.properties.name, n2: f.properties.name, cls: f.properties.class, lat: +f.geometry.coordinates[1].toFixed(6), lng: +f.geometry.coordinates[0].toFixed(6) }));
  const idx = new Map(store.get('offlineIdx', []).map(x => [x.n2 + x.lat, x])); feats.forEach(x => idx.set(x.n2 + x.lat, x));
  store.set('offlineIdx', [...idx.values()].slice(-20000));
  store.set('offline', [...store.get('offline', []), { b: [B.getWest(), B.getSouth(), B.getEast(), B.getNorth()], n: urls.length, at: Date.now() }]);
  S.offlineLast = { tiles: urls.length, fail, places: feats.length };
  openPanel(`<div class="row"><div><b>${L('下载完成', 'Download complete')}</b> · ${urls.length} ${L('个瓦片', 'tiles')}${fail ? ` · ${fail} ${L('失败', 'failed')}` : ''} · ${feats.length} ${L('个可离线搜索的地点', 'places searchable offline')}
    <div style="font-size:13.5px;color:var(--muted);margin-top:8px">${L('限制：浏览器可能在存储紧张时清除缓存；离线时无法路线规划、实时搜索、照片、天气、营业时间详情。', 'Limits: the browser may evict the cache under storage pressure; offline there is no routing, live search, photos, weather or full details.')}</div></div></div>`, L('离线下载', 'Offline download'));
};
function offlineSearch(v) { const x = v.toLowerCase(), c = map.getCenter(); return store.get('offlineIdx', []).filter(o => (o.name + ' ' + o.n2).toLowerCase().includes(x)).map(o => ({ name: o.name, address: L('离线 · ', 'offline · ') + (o.cls || ''), lat: o.lat, lng: o.lng, category: o.cls, dist: haversine(c, o) })).sort((a, b) => a.dist - b.dist).slice(0, 12); }

AC.loadIndex(`${base}${BJ ? 'pois_bj' : 'pois_yeg'}.geojson${AV}`);
window._app = { installPackBytes: (u8, sha) => PK.install(u8, 'test', { expectSha: sha, appVer: APPVER }), AC, ios, applySizes, setMe, updScale, sunTimes, offlineSearch, semanticSearch, semMatch, S, openSideQuests, showQuest, questData, tools, showPlace, openDirections, startNav, pick, openDrawer, closeDrawer, runSearch, setStyle, nominatimSearch };
renderDrawer(); // re-render once all menu sections (lists, tools) are defined
// v0.9.5 compass bar (Northland / Tactical navigation): one static strip, only its transform changes on rotate.
{ const cb = document.querySelector('#cbar .cbt'); if (cb && window._map) {
  const N = { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW' };
  let h = ''; for (let a = -360; a < 720; a += 15) { const k = ((a % 360) + 360) % 360; h += `<span class="${k % 90 === 0 ? 'c' : ''}">${N[k] || '·'}</span>`; } cb.innerHTML = h;
  let raf = 0; const upd = () => { raf = 0; if (!document.body.classList.contains('navon')) return; const b = ((window._map.getBearing() % 360) + 360) % 360; cb.style.transform = `translate3d(${-((b + 360) / 15) * 30 - 15}px,0,0)`; };
  window._map.on('rotate', () => { if (!raf) raf = requestAnimationFrame(upd); }); new MutationObserver(upd).observe(document.body, { attributes: true, attributeFilter: ['class'] });
} }
