// v0.9.8 Android Auto bridge (phone side). Pushes the active skin's resolved MapLibre style, the position and the
// navigation state to the native car screen (CarBridgePlugin → CarState); receives destinations picked on the car.
import { Capacitor, registerPlugin } from '@capacitor/core';
const ON = Capacitor.getPlatform() === 'android';
const CB = ON ? registerPlugin('CarBridge') : null;
const strip = s => String(s || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
const turnOf = s => s.type === 'arrive' ? 'arrive' : s.type === 'depart' ? 'depart' : (s.modifier || 'straight');
let lastPos = 0, lastNav = 0;

/** Rewrites the in-WebView style so MapLibre Native can load it (assets via asset://public/, drops runtime overlay layers). */
function nativeStyle(map) {
  const st = JSON.parse(JSON.stringify(map.getStyle()));
  const origin = location.origin + '/';
  const fix = u => typeof u === 'string' && u.startsWith(origin) ? 'asset://public/' + u.slice(origin.length).replace(/\?.*$/, '') : u;
  const keep = new Set(Object.entries(st.sources).filter(([, s]) => s.type === 'vector' || s.type === 'raster' || s.type === 'raster-dem').map(([k]) => k));
  for (const k of Object.keys(st.sources)) if (!keep.has(k)) delete st.sources[k];
  for (const s of Object.values(st.sources)) { if (s.tiles) s.tiles = s.tiles.map(fix); if (s.url) s.url = fix(s.url); }
  st.layers = st.layers.filter(l => !l.source || keep.has(l.source));
  if (typeof st.sprite === 'string') st.sprite = fix(st.sprite); else if (Array.isArray(st.sprite)) st.sprite = st.sprite.map(x => ({ ...x, url: fix(x.url) }));
  st.glyphs = fix(st.glyphs); delete st.terrain;
  return JSON.stringify(st);
}
/**
 * v0.9.10: one mode's style → the file form stored natively (CarSkinStore). Page-origin URLs become {WEB}/ (resolved
 * natively to the bundle in use: APK assets or live-update dir), only vector/raster/raster-dem sources are kept, the
 * pack's own sprite sheet (JS-only on the phone) is exported next to the style as {CAR}/sprite_<mode>.
 */
export function carExportMode({ style, sprite }, mode, origin) {
  const st = JSON.parse(JSON.stringify(style));
  const fix = u => typeof u === 'string' && u.startsWith(origin) ? '{WEB}/' + u.slice(origin.length).replace(/\?.*$/, '') : u;
  const keep = new Set(Object.entries(st.sources || {}).filter(([, s]) => ['vector', 'raster', 'raster-dem'].includes(s.type) && [s.url, ...(s.tiles || [])].filter(Boolean).every(u => /^(https:|asset:|file:)/.test(u) || u.startsWith(origin))).map(([k]) => k));
  for (const k of Object.keys(st.sources || {})) if (!keep.has(k)) delete st.sources[k];
  for (const s of Object.values(st.sources)) { if (s.tiles) s.tiles = s.tiles.map(fix); if (s.url) s.url = fix(s.url); }
  st.layers = (st.layers || []).filter(l => !l.source || keep.has(l.source));
  if (sprite?.json && /^data:image\/png;base64,/.test(sprite.png || '')) st.sprite = '{CAR}/sprite_' + mode;
  else if (typeof st.sprite === 'string') st.sprite = fix(st.sprite); else if (Array.isArray(st.sprite)) st.sprite = st.sprite.map(x => ({ ...x, url: fix(x.url) })); else delete st.sprite;
  st.glyphs = fix(st.glyphs); delete st.terrain;
  const out = { style: JSON.stringify(st) };
  if (st.sprite === '{CAR}/sprite_' + mode) { out.spriteJson = JSON.stringify(sprite.json); out.spritePng = sprite.png; }
  return out;
}
export async function carExport(carStyleFor, origin, panelSrc) {
  const [l, d] = await Promise.all([carStyleFor('light'), carStyleFor('dark')]);
  const out = { light: carExportMode(l, 'light', origin), dark: carExportMode(d, 'dark', origin), route: l.route || null, routeDark: d.route || null };
  if (panelSrc) { const src = await panelSrc(); out.panel = { light: carPanelSpec({ ...src, mode: 'light' }), dark: carPanelSpec({ ...src, mode: 'dark' }) }; }
  return out;
}
// ---------- v0.9.11 skinned car panel ----------
const HEXC = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i;
const hex = (v, d) => { if (typeof v !== 'string') return d; const s = v.trim(); if (/^#[0-9a-f]{3}$/i.test(s)) return '#' + [...s.slice(1)].map(c => c + c).join(''); return HEXC.test(s) ? s.toLowerCase() : d; };
const num = (v, d, lo, hi) => { const n = parseFloat(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
const fam = v => { const m = String(v || '').match(/^\s*['"]?([^,'"]+)['"]?/); return m ? m[1].trim() : null; };
/** Built-in themes (no pack): their own panel look, mirroring the phone's nav banner colours and fonts. */
export const BUILTIN_PANEL = {
  neon_dark: { bg: '#0b1622', bg2: '#12324a', fg: '#e8fbff', muted: '#8fb3c4', accent: '#4fd6e8', border: '#4fd6e8', bw: 1.5, radius: 12, shadow: '#4fd6e855', sx: 0, sy: 0, head: 'Rajdhani', body: 'Rajdhani' },
  neon_light: { bg: '#f4fbfc', bg2: '#dff1f3', fg: '#0b2a33', muted: '#4b6b74', accent: '#0b6f75', border: '#0b6f75', bw: 1.5, radius: 12, shadow: '#0b6f7533', sx: 0, sy: 3, head: 'Rajdhani', body: 'Rajdhani' },
  west_light: { bg: '#f1e7d0', bg2: '#e6d7b4', fg: '#2b1d12', muted: '#6b5440', accent: '#9a2a18', border: '#6b4a2a', bw: 2, radius: 6, shadow: '#2b1d1233', sx: 0, sy: 3, head: 'IM Fell English', body: 'Alegreya' },
  west_dark: { bg: '#1d1610', bg2: '#2a2017', fg: '#efe2c4', muted: '#b39f80', accent: '#d9a441', border: '#8a6a3a', bw: 2, radius: 6, shadow: '#00000066', sx: 0, sy: 3, head: 'IM Fell English', body: 'Alegreya' },
  space_light: { bg: '#f4f1ea', bg2: '#ebe6db', fg: '#1b1b1b', muted: '#5d5a54', accent: '#d8462b', border: '#1b1b1b', bw: 2, radius: 4, shadow: '#d8462b', sx: 4, sy: 4, head: 'Space Grotesk', body: 'Space Grotesk' },
  space_dark: { bg: '#141414', bg2: '#1c1c1c', fg: '#e9e6dc', muted: '#a29e94', accent: '#e9e6dc', border: '#e9e6dc', bw: 1.5, radius: 4, shadow: '#000000', sx: 4, sy: 4, head: 'Space Grotesk', body: 'Space Grotesk' },
  nord_light: { bg: '#f3efe6', bg2: '#e8e2d4', fg: '#34312b', muted: '#6e685c', accent: '#34312b', border: '#34312b', bw: 1, radius: 2, shadow: '#34312b22', sx: 0, sy: 2, head: 'Cinzel', body: 'Cinzel' },
  nord_dark: { bg: '#1e1d1a', bg2: '#26241f', fg: '#e8e2d0', muted: '#a8a08c', accent: '#e8e2d0', border: '#e8e2d0', bw: 1, radius: 2, shadow: '#00000066', sx: 0, sy: 2, head: 'Cinzel', body: 'Cinzel' },
  tac_dark: { bg: '#0d0f0c', bg2: '#151912', fg: '#e8f0d8', muted: '#9aa68a', accent: '#d7ff3a', border: '#d7ff3a', bw: 2, radius: 0, shadow: null, sx: 0, sy: 0, head: 'Barlow Condensed', body: 'Barlow Condensed' },
  tac_light: { bg: '#f2f0ea', bg2: '#e4e1d8', fg: '#1a1a1a', muted: '#5a5a54', accent: '#e0571f', border: '#1a1a1a', bw: 2, radius: 0, shadow: null, sx: 0, sy: 0, head: 'Barlow Condensed', body: 'Barlow Condensed' },
};
/** CSS custom properties of a pack stylesheet: common rules + rules scoped to `.light` / `.dark`. Also @font-face families. */
export function cssVars(css, mode) {
  const other = mode === 'dark' ? 'light' : 'dark', out = {}, faces = {};
  const c = String(css || '').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of c.matchAll(/@font-face\s*\{([^}]*)\}/g)) { const f = fam((m[1].match(/font-family\s*:\s*([^;]+)/) || [])[1]); if (f) faces[f] = 1; }
  const rules = [...c.replace(/@font-face\s*\{[^}]*\}/g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  for (const pass of [0, 1]) for (const [, sel, body] of rules) {
    const own = new RegExp(`\\.${mode}\\b`).test(sel), oth = new RegExp(`\\.${other}\\b`).test(sel);
    if (oth && !own) continue; if (pass === 0 ? own : !own) continue;
    for (const d of body.matchAll(/(--[\w-]+)\s*:\s*((?:url\([^)]*\)|[^;])+)/g)) out[d[1]] = d[2].replace(/!important/, '').trim();
  }
  return { vars: out, faces, css: c };
}
const firstHex = v => (String(v || '').match(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi) || []);
/**
 * The panel spec for one mode. Pack `modes.<m>.carPanel` wins (validated), else derived from the pack tokens / theme.css
 * (nav banner background, border, hard shadow, fonts, nine-slice `--blob-card` art), else the built-in table.
 */
export function carPanelSpec({ pk = null, theme = 'neon', mode = 'dark', pal = null } = {}) {
  let p;
  if (!pk) p = { ...(BUILTIN_PANEL[`${theme}_${mode}`] || BUILTIN_PANEL[`neon_${mode}`] || BUILTIN_PANEL.neon_dark) };
  else {
    const m = pk.modes?.[mode] ? mode : (mode === 'dark' ? 'light' : 'dark');
    const t = pk.tokens?.[m] || pk.tokens?.[mode] || {}, nc = t.navCard || {};
    const { vars: v, faces, css } = cssVars((pk.css || '') + '\n' + (pk.cssModes?.[m] || ''), m);
    const bgs = firstHex(v['--pbg']);
    p = { bg: hex(bgs[0], hex(nc.bg, hex(t.bg, '#101418'))), bg2: hex(bgs[1], null), fg: hex(v['--tx'] || v['--ink'], hex(nc.fg, hex(t.fg, '#ffffff'))),
      muted: hex(v['--tx2'] || v['--ink2'], hex(t.muted, '#999999')), accent: hex(v['--acc'] || v['--red'], hex(t.accent, '#4fd6e8')), border: null, bw: 0, radius: num(v['--prad'], 10, 0, 40), shadow: null, sx: 0, sy: 0,
      head: null, body: null };
    if (!v['--pbg'] && v['--paper']) p.bg = hex(v['--paper'], p.bg);
    const bd = String(v['--pbd'] || '').match(/([\d.]+)px\s+\w+\s+(#[0-9a-f]{3,8})/i); if (bd) { p.bw = num(bd[1], 0, 0, 6); p.border = hex(bd[2], null); }
    const sh = String(v['--psh'] || '').match(/(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)(?:px)?\s+(#[0-9a-f]{3,8})/i); if (sh) { p.sx = num(sh[1], 0, -12, 12); p.sy = num(sh[2], 0, -12, 12); p.shadow = hex(sh[4], null); }
    const f = k => { for (const x of String(v[k] || '').split(',')) { const n = fam(x); if (n && faces[n]) return n; } return fam(v[k]); };
    p.head = f('--head') || f('--f-head'); p.body = f('--body') || f('--f-body') || p.head;
    const art = String(v['--blob-card'] || '').match(/url\(\s*["']?(data:image\/(?:png|webp);base64,[^"')]+)/i);
    if (art) { const u = css.match(/border-image\s*:\s*var\(--blob-card\)\s+([\d\s]+)(?:fill)?\s*\/\s*([\d.]+)px(?:\s*\/\s*([\d.]+)px)?/i);
      const sl = u ? u[1].trim().split(/\s+/).map(Number) : [60]; const s4 = [sl[0], sl[1] ?? sl[0], sl[2] ?? sl[0], sl[3] ?? sl[1] ?? sl[0]];
      p.frame = art[1]; p.slice = s4; p.fw = num(u?.[2], 30, 4, 80); p.outset = num(u?.[3], 0, 0, 60); p.border = null; p.bw = 0; p.shadow = '#1e140a4d'; p.sx = 0; p.sy = 4; }
  }
  const cp = pk?.modes?.[mode]?.carPanel || pk?.modes?.[mode === 'dark' ? 'light' : 'dark']?.carPanel;
  if (cp && typeof cp === 'object') {
    for (const k of ['bg', 'bg2', 'fg', 'muted', 'accent', 'border', 'shadow']) if (cp[k] !== undefined) p[k] = cp[k] === null ? null : hex(cp[k], p[k]);
    for (const [k, lo, hi] of [['bw', 0, 6], ['radius', 0, 40], ['sx', -12, 12], ['sy', -12, 12], ['fw', 4, 80], ['outset', 0, 60]]) if (cp[k] != null) p[k] = num(cp[k], p[k], lo, hi);
    for (const k of ['head', 'body']) if (typeof cp[k] === 'string') p[k] = cp[k].slice(0, 60);
    if (typeof cp.frame === 'string' && /^data:image\/(png|webp);base64,/.test(cp.frame)) { p.frame = cp.frame; p.slice = Array.isArray(cp.slice) ? [0, 1, 2, 3].map(i => num(cp.slice[i] ?? cp.slice[0], 40, 1, 400)) : [40, 40, 40, 40]; }
    if (cp.frame === null) delete p.frame;
    if (typeof cp.font === 'string' && /^data:(font\/(ttf|otf)|application\/(x-font-ttf|font-sfnt));base64,/.test(cp.font)) p.font = cp.font;
  }
  if (!pk && theme === 'west' && mode === 'dark' && pal?.accent) p.accent = hex(pal.accent, p.accent);
  p.arrow = p.accent; return p;
}
export function initCar({ map, S, isDark, lang, carStyleFor, panelSrc, panelOn = () => true, onDest, onStop }) {
  window.__rgCarStyle = () => nativeStyle(map); // also used by tools/car/extract_styles.cjs
  window.__rgCarExport = () => carExport(carStyleFor, location.origin + '/', panelSrc); // tools/car/preview + tests
  if (!ON) return;
  let lastSig = null, skinOk = true;
  const push = async () => { try {
    const ink = document.documentElement.classList.contains('fx-inkui'), zh = lang === 'zh';
    // legacy path (0.9.8/0.9.9 natives): in-memory style of the current mode
    CB.setStyle({ json: nativeStyle(map), skin: S.skin || S.theme, dark: isDark(), ink, zh }).catch(() => {});
    if (!skinOk || !carStyleFor) return;
    const sig = [S.skin, S.theme, S.pal, S.mode, lang, panelOn(), (await import('./skins.js').then(m => m.getPack(S.skin)).catch(() => null))?.installedAt || 0].join('|');
    if (sig === lastSig) return;
    const ex = await carExport(carStyleFor, location.origin + '/', panelSrc);
    await CB.setSkin({ id: S.skin || S.theme, mode: S.mode, dark: isDark(), ink, zh, panelOn: panelOn(), ...ex }); // older natives ignore panel/panelOn
    lastSig = sig;
  } catch (e) { if (/not implemented|unimplemented/i.test(String(e?.message || e))) skinOk = false; else console.warn('car style', e); } };
  map.on('style.load', () => setTimeout(push, 300)); window.__rgCarPush = () => setTimeout(push, 50); if (map.isStyleLoaded()) push();
  CB.addListener('carDest', d => { if (d.name === '__stop__') onStop(); else onDest({ name: d.name, lat: +d.lat, lng: +d.lng }); });
  CB.takePending().then(d => d?.name && onDest({ name: d.name, lat: +d.lat, lng: +d.lng })).catch(() => {});
  window.__rgCar = {
    pos(p) { const n = Date.now(); if (n - lastPos < 900) return; lastPos = n; CB.pos({ lat: p.lat, lng: p.lng, bearing: p.heading ?? 0 }).catch(() => {}); },
    nav(o) {
      const n = Date.now(); if (o.active && n - lastNav < 900 && !o.force) return; lastNav = n;
      const s = o.step || {};
      CB.nav({ active: !!o.active, cue: strip(o.cue), road: s.name || '', turn: o.active ? turnOf(s) : 'straight', dest: o.dest || '', stepDist: o.toNext || 0, lanes: s.lanes || '', remDist: o.rem || 0, eta: o.eta || 0,
        lat: o.p?.lat, lng: o.p?.lng, bearing: o.bearing ?? 0, route: o.route ? o.route.flat() : undefined }).catch(() => {});
    },
  };
}
