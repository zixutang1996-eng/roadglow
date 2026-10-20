// v0.9.2 skin plugins: "roadglow-skin/1" packs. See docs/SKIN_PLUGINS.md.
// A pack is pure data (MapLibre style JSON + optional sprite sheet + colour tokens); no code or CSS is ever executed.
import { readable, contrast } from './navcard.js';
export const FORMAT = 'roadglow-skin/1';
export const BUILTIN = ['neon', 'west'];
const FONTS = ['IM FELL English Italic', 'IM FELL English Regular', 'Rajdhani Bold', 'Rajdhani SemiBold'];
const MAX_BYTES = 8 * 1024 * 1024, HEX = /^#[0-9a-f]{6}$/i, TOK = ['bg', 'fg', 'muted', 'accent', 'chip', 'line', 'route', 'themeColor'];

// ---------- IndexedDB store ----------
const db = () => new Promise((res, rej) => { const r = indexedDB.open('rg-skins', 1); r.onupgradeneeded = () => r.result.createObjectStore('packs', { keyPath: 'id' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const tx = async (mode, fn) => { const d = await db(); return new Promise((res, rej) => { const t = d.transaction('packs', mode), q = fn(t.objectStore('packs')); t.oncomplete = () => res(q?.result); t.onerror = () => rej(t.error); }); };
export const listInstalled = () => tx('readonly', s => s.getAll());
export const getPack = id => tx('readonly', s => s.get(id));
export const removePack = id => tx('readwrite', s => s.delete(id));
const putPack = p => tx('readwrite', s => s.put(p));

// ---------- validation (returns {ok, errors, warnings, pack}) ----------
const str = (v, n = 80) => typeof v === 'string' && v.trim().length > 0 && v.length <= n;
const name = v => str(v) || (v && typeof v === 'object' && (str(v.en) || str(v.zh)));
export function validate(p) {
  const E = [], W = [];
  if (!p || typeof p !== 'object') return { ok: false, errors: ['not a JSON object'], warnings: W };
  if (p.format !== FORMAT) E.push(`format must be "${FORMAT}"`);
  if (!/^[a-z0-9][a-z0-9-]{1,39}$/.test(p.id || '')) E.push('id: 2–40 chars, a-z 0-9 -');
  if (BUILTIN.includes(p.id) && !p.builtin) E.push('id is reserved by a built-in skin');
  if (!name(p.name)) E.push('name required (string or {en,zh})');
  if (!/^\d+\.\d+\.\d+$/.test(p.version || '')) E.push('version must be semver x.y.z');
  if (!str(p.author)) E.push('author required');
  if (!str(p.license, 64)) E.push('license required (SPDX id, e.g. CC-BY-4.0)');
  if (!BUILTIN.includes(p.base)) E.push('base must be "neon" or "west" (UI chrome family)');
  if (!p.modes || (!p.modes.light && !p.modes.dark)) E.push('modes.light and/or modes.dark required');
  for (const m of ['light', 'dark']) {
    const md = p.modes?.[m]; if (!md) continue;
    const st = md.style;
    if (!st || typeof st !== 'object') { E.push(`modes.${m}.style must be a style object (URL packs are resolved at install)`); continue; }
    if (st.version !== 8 || !Array.isArray(st.layers) || typeof st.sources !== 'object') E.push(`modes.${m}.style is not a MapLibre v8 style`);
    for (const [k, s] of Object.entries(st.sources || {})) for (const u of [s.url, ...(s.tiles || [])].filter(Boolean)) if (!/^https:\/\//.test(u)) E.push(`source ${k}: only https URLs allowed`);
    for (const l of st.layers || []) { const f = l.layout?.['text-font']; if (Array.isArray(f) && f.some(x => !FONTS.includes(x))) { W.push(`layer ${l.id}: font replaced (only bundled fonts: ${FONTS.join(', ')})`); l.layout['text-font'] = [p.base === 'west' ? 'IM FELL English Regular' : 'Rajdhani SemiBold']; } }
    if (md.sprite && !(md.sprite.json && typeof md.sprite.json === 'object' && /^data:image\/png;base64,/.test(md.sprite.png || ''))) E.push(`modes.${m}.sprite needs {json, png:data:image/png;base64,...}`);
    const t = p.tokens?.[m] || {};
    for (const k of TOK) if (t[k] != null && !HEX.test(t[k])) E.push(`tokens.${m}.${k} must be #rrggbb`);
    const nc = t.navCard || {};
    for (const k of ['bg', 'fg', 'swapBg', 'mapBase']) if (nc[k] != null && !HEX.test(nc[k])) E.push(`tokens.${m}.navCard.${k} must be #rrggbb`);
    if (nc.opacity != null && !(nc.opacity >= 0.6 && nc.opacity <= 1)) E.push(`tokens.${m}.navCard.opacity 0.6–1`);
    if (nc.scale != null && !(nc.scale >= 0.7 && nc.scale <= 1.5)) E.push(`tokens.${m}.navCard.scale 0.7–1.5`);
    // contrast: auto-fix text colours below 4.5:1 rather than reject
    if (!E.length && t.bg) for (const k of ['fg', 'muted']) if (t[k] && contrast(t[k], t.bg) < 4.5) { const f = readable(t.bg, t[k]); W.push(`tokens.${m}.${k} ${contrast(t[k], t.bg).toFixed(2)}:1 < 4.5 → ${f}`); t[k] = f; }
    if (!E.length && nc.bg && nc.fg && contrast(nc.fg, nc.bg) < 4.5) { const f = readable(nc.bg, nc.fg); W.push(`navCard.fg auto-fixed → ${f}`); nc.fg = f; }
  }
  if (JSON.stringify(p).length > MAX_BYTES) E.push('pack larger than 8 MB');
  return { ok: !E.length, errors: E, warnings: W, pack: p };
}

// ---------- install ----------
const blobToDataURL = b => new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });
async function getJSON(u) { const r = await fetch(u, { cache: 'no-cache' }); if (!r.ok) throw new Error(`${r.status} ${u}`); return r.json(); }
/** Resolve a hosted manifest whose modes reference relative files: {"style":"light.json","sprite":"sprite_light"} */
async function resolve(p, baseUrl) {
  const u = x => new URL(x, baseUrl).href;
  for (const m of ['light', 'dark']) {
    const md = p.modes?.[m]; if (!md) continue;
    if (typeof md.style === 'string') md.style = await getJSON(u(md.style));
    if (typeof md.sprite === 'string') { const png = await (await fetch(u(md.sprite + '.png'))).blob(); if (png.size > MAX_BYTES) throw new Error('sprite too big'); md.sprite = { json: await getJSON(u(md.sprite + '.json')), png: await blobToDataURL(png) }; }
  }
  return p;
}
export async function installFromUrl(url) {
  if (!/^https:\/\//.test(url) && !/^https?:\/\/(127\.0\.0\.1|localhost)/.test(url)) throw new Error('https URL required');
  const p = await resolve(await getJSON(url), url); return finish(p, url);
}
export async function installFromFile(file) {
  if (file.size > MAX_BYTES) throw new Error('file larger than 8 MB');
  const p = JSON.parse(await file.text());
  for (const m of ['light', 'dark']) if (typeof p.modes?.[m]?.style === 'string' || typeof p.modes?.[m]?.sprite === 'string') throw new Error('local files must be single-file packs (styles/sprites inlined)');
  return finish(p, 'file:' + file.name);
}
async function finish(p, src) {
  const v = validate(p); if (!v.ok) { const e = new Error(v.errors.join('\n')); e.validation = v; throw e; }
  p.installedFrom = src; p.installedAt = Date.now(); await putPack(p); return v;
}

// ---------- runtime ----------
let spriteCache = {};
async function decodeSprite(sp) {
  const img = new Image(); img.src = sp.png; await img.decode();
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
  const out = {}; for (const [k, r] of Object.entries(sp.json)) out[k] = { data: g.getImageData(r.x, r.y, r.width, r.height), pixelRatio: r.pixelRatio || 1, sdf: !!r.sdf };
  return out;
}
/** Prepare a pack style for a mode; returns {style, tokens}. Falls back to the other mode if one is missing. */
export async function packStyle(p, mode, base) {
  const m = p.modes[mode] ? mode : (mode === 'dark' ? 'light' : 'dark'), md = p.modes[m];
  const st = structuredClone(md.style);
  if (md.sprite) { spriteCache = await decodeSprite(md.sprite); delete st.sprite; }
  else { spriteCache = {}; st.sprite = `${base}sprites/${p.base}_${m}`; } // reuse the base family's icons
  return { style: st, tokens: p.tokens?.[m] || {} };
}
export function hookMissingImages(map) {
  map.on('styleimagemissing', e => { const s = spriteCache[e.id]; if (s && !map.hasImage(e.id)) map.addImage(e.id, s.data, { pixelRatio: s.pixelRatio, sdf: s.sdf }); });
}
export function applyTokens(t = {}) {
  const r = document.body.style;
  for (const k of ['bg', 'fg', 'muted', 'accent', 'chip', 'line']) t[k] ? r.setProperty('--' + k, t[k]) : r.removeProperty('--' + k);
}
export const packName = (p, zh) => typeof p.name === 'string' ? p.name : (zh ? p.name.zh || p.name.en : p.name.en || p.name.zh);
