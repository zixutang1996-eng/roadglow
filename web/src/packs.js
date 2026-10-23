// v0.9.5 RoadGlow packs: skins + voices, installed at runtime (no APK update). Format: docs/PACKS.md
// Container: a .rgpack zip (pack.json + files) or a single pack.json with everything inlined.
// Integrity: catalog entries carry the SHA-256 of the downloaded file; pack.json "files" carries a SHA-256 per file.
// Packs are data only: MapLibre style JSON, sanitised CSS (no @import / remote url()), images, audio, TTS parameters.
import { unzipSync, strFromU8 } from 'fflate';
import * as SK from './skins.js';
export const FORMAT = 'roadglow-pack/1';
const MAX = 12 * 1024 * 1024;
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
export const sha256 = async u8 => hex(await crypto.subtle.digest('SHA-256', u8));
const cmpVer = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); } return 0; };
export { cmpVer };
const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml', mp3: 'audio/mpeg', ogg: 'audio/ogg', m4a: 'audio/mp4', wav: 'audio/wav', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf' };
const u8ToDataURL = (u8, ext) => new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(new Blob([u8], { type: MIME[ext] || 'application/octet-stream' })); });

/** CSS sanitiser: only scoped, local CSS. Strips @import, remote url(), javascript:, expression(), behaviour bindings. */
export function sanitizeCss(css, assets = {}) {
  let c = String(css || '').slice(0, 200000);
  c = c.replace(/@import[^;]*;?/gi, '').replace(/expression\s*\(/gi, '').replace(/javascript:/gi, '').replace(/-moz-binding|behavior\s*:/gi, '');
  c = c.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (m, q, u) => assets[u] ? `url("${assets[u]}")` : /^data:(image|font)\//i.test(u) ? m : 'none');
  return c;
}

/** Validate a parsed pack.json (new format). Returns {ok, errors, warnings}. */
export function validatePack(p, appVer) {
  const E = [], W = [], s = (v, n = 80) => typeof v === 'string' && v.trim() && v.length <= n;
  if (!p || typeof p !== 'object') return { ok: false, errors: ['not a JSON object'], warnings: W };
  if (p.format !== FORMAT) E.push(`format must be "${FORMAT}"`);
  if (!['skin', 'voice'].includes(p.type)) E.push('type must be "skin" or "voice"');
  if (!/^[a-z0-9][a-z0-9-]{1,39}$/.test(p.id || '')) E.push('id: 2–40 chars a-z 0-9 -');
  if (!(p.name && (s(p.name.zh) || s(p.name.en)))) E.push('name.zh / name.en required');
  if (!/^\d+\.\d+\.\d+$/.test(p.version || '')) E.push('version x.y.z');
  if (p.minAppVersion && !/^\d+\.\d+\.\d+$/.test(p.minAppVersion)) E.push('minAppVersion x.y.z');
  if (p.minAppVersion && appVer && cmpVer(appVer, p.minAppVersion) < 0) E.push(`needs app ${p.minAppVersion}+ (this is ${appVer})`);
  if (p.type === 'skin') {
    const k = p.skin || {}; if (!SK.BUILTIN.includes(k.base)) E.push(`skin.base must be one of ${SK.BUILTIN.join(', ')}`);
    if (!k.modes || (!k.modes.light && !k.modes.dark)) E.push('skin.modes.light and/or .dark required');
  }
  if (p.type === 'voice') {
    const v = p.voice || {}; if (!v.tts && !v.clips && !v.phrases) E.push('voice needs tts, phrases and/or clips');
    if (v.tts) { if (v.tts.rate != null && !(v.tts.rate >= 0.5 && v.tts.rate <= 2)) E.push('voice.tts.rate 0.5–2'); if (v.tts.pitch != null && !(v.tts.pitch >= 0.5 && v.tts.pitch <= 2)) E.push('voice.tts.pitch 0.5–2'); }
  }
  return { ok: !E.length, errors: E, warnings: W };
}

/** Read a pack from bytes (zip or json). Verifies whole-file hash (if expected) and per-file hashes. Resolves file refs. */
export async function readPack(u8, { expectSha, appVer } = {}) {
  if (u8.byteLength > MAX) throw new Error('pack larger than 12 MB');
  const got = await sha256(u8);
  if (expectSha && got !== expectSha.toLowerCase()) throw new Error('SHA-256 mismatch — download corrupted or tampered');
  let p, files = {};
  if (u8[0] === 0x50 && u8[1] === 0x4b) { files = unzipSync(u8); if (!files['pack.json']) throw new Error('zip has no pack.json'); p = JSON.parse(strFromU8(files['pack.json'])); }
  else p = JSON.parse(new TextDecoder().decode(u8));
  if (p.format === SK.FORMAT) return { legacy: true, pack: p, sha256: got }; // roadglow-skin/1 (0.9.2) still accepted
  const v = validatePack(p, appVer); if (!v.ok) { const e = new Error(v.errors.join('\n')); e.validation = v; throw e; }
  for (const [path, h] of Object.entries(p.files || {})) { if (!files[path]) throw new Error(`missing file ${path}`); if ((await sha256(files[path])) !== String(h).toLowerCase()) throw new Error(`SHA-256 mismatch: ${path}`); }
  const txt = path => { if (!files[path]) throw new Error(`missing file ${path}`); return strFromU8(files[path]); };
  const assets = {}; for (const path of Object.keys(files)) { const ext = path.split('.').pop().toLowerCase(); if (MIME[ext]) assets[path] = await u8ToDataURL(files[path], ext); }
  if (p.type === 'skin') {
    for (const m of ['light', 'dark']) { const md = p.skin.modes[m]; if (!md) continue;
      if (typeof md.style === 'string') md.style = JSON.parse(txt(md.style));
      if (typeof md.car === 'string') md.car = JSON.parse(txt(md.car)); // v0.9.10 optional car-screen style
      if (md.carPanel && typeof md.carPanel === 'object') for (const k of ['frame', 'font']) if (typeof md.carPanel[k] === 'string' && assets[md.carPanel[k]]) md.carPanel[k] = assets[md.carPanel[k]]; // v0.9.11 car panel art
      if (typeof md.sprite === 'string') md.sprite = { json: JSON.parse(txt(md.sprite + '.json')), png: assets[md.sprite + '.png'] };
      if (typeof md.css === 'string' && files[md.css]) md.css = txt(md.css); }
    if (typeof p.skin.css === 'string' && files[p.skin.css]) p.skin.css = txt(p.skin.css);
    if (p.skin.puck) for (const m of ['light', 'dark']) if (typeof p.skin.puck[m] === 'string') p.skin.puck[m] = assets[p.skin.puck[m]] || null;
    if (typeof p.strings === 'string' && files[p.strings]) p.strings = JSON.parse(txt(p.strings));
    p.skin.css = sanitizeCss(p.skin.css, assets); for (const m of ['light', 'dark']) if (p.skin.modes[m]?.css) p.skin.modes[m].css = sanitizeCss(p.skin.modes[m].css, assets);
  }
  if (p.type === 'voice' && p.voice.clips) for (const [k, f] of Object.entries(p.voice.clips)) p.voice.clips[k] = assets[f] || (/^data:audio\//.test(f) ? f : null);
  return { pack: p, sha256: got };
}

/** Convert a skin pack to the runtime shape used by skins.js (roadglow-skin/1) and store it there. */
async function storeSkin(p, src, sha) {
  const k = p.skin, legacy = { format: SK.FORMAT, id: p.id, name: p.name, version: p.version, author: p.author || '—', license: p.license || '—', base: k.base,
    modes: Object.fromEntries(['light', 'dark'].filter(m => k.modes[m]).map(m => [m, { style: k.modes[m].style, ...(k.modes[m].sprite ? { sprite: k.modes[m].sprite } : {}), ...(k.modes[m].car ? { car: k.modes[m].car } : {}), ...(k.modes[m].carPanel && typeof k.modes[m].carPanel === 'object' ? { carPanel: k.modes[m].carPanel } : {}) }])),
    tokens: k.tokens || {}, strings: p.strings || null, fx: Array.isArray(k.fx) ? k.fx.filter(x => typeof x === 'string').slice(0, 8) : [], puck: k.puck ? Object.fromEntries(['light', 'dark'].filter(m => typeof k.puck[m] === 'string' && /^data:image\/(png|webp);base64,/.test(k.puck[m])).map(m => [m, k.puck[m]])) : null, css: k.css || '', cssModes: { light: k.modes.light?.css || '', dark: k.modes.dark?.css || '' }, pack2: true, sha256: sha, minAppVersion: p.minAppVersion };
  for (const m of Object.keys(legacy.modes)) if (!legacy.modes[m].style) { const r = await fetch(`${new URL(import.meta.env.BASE_URL, location.href).href}styles/${k.base}_${m}.json`); legacy.modes[m].style = await r.json(); }
  return SK.installObject(legacy, src);
}
// ---------- voice store (localStorage; small) ----------
const VK = 'voicePacks';
export const voicePacks = () => { try { return JSON.parse(localStorage.getItem(VK)) || {}; } catch { return {}; } };
const saveVoices = v => localStorage.setItem(VK, JSON.stringify(v));
export function registerVoices(PACKS) { for (const [id, p] of Object.entries(voicePacks())) PACKS[id] = { label: p.name, pitch: p.voice.tts?.pitch ?? 1, rate: p.voice.tts?.rate ?? 1, prefer: {}, clips: p.voice.clips || null, ...(p.voice.phrases || {}), external: true, version: p.version }; }

export async function install(u8, src, opts = {}) {
  const r = await readPack(u8, opts);
  if (r.legacy) { const v = await SK.installObject(r.pack, src); return { type: 'skin', id: r.pack.id, name: r.pack.name, warnings: v.warnings }; }
  const p = r.pack;
  if (p.type === 'skin') { const v = await storeSkin(p, src, r.sha256); return { type: 'skin', id: p.id, name: p.name, warnings: v.warnings }; }
  const all = voicePacks(); if (JSON.stringify(p).length > 4.5e6) throw new Error('voice pack too large for local storage (max ~4 MB of clips)');
  all[p.id] = { ...p, installedFrom: src, sha256: r.sha256, installedAt: Date.now() }; saveVoices(all); return { type: 'voice', id: p.id, name: p.name, warnings: [] };
}
export async function installFromUrl(url, expectSha, appVer) {
  const r = await fetch(url, { cache: 'no-cache' }); if (!r.ok) throw new Error(`${r.status} ${url}`);
  return install(new Uint8Array(await r.arrayBuffer()), url, { expectSha, appVer });
}
export const installFromFile = async (file, appVer) => install(new Uint8Array(await file.arrayBuffer()), 'file:' + file.name, { appVer });
export async function removePack(type, id) { if (type === 'voice') { const a = voicePacks(); delete a[id]; saveVoices(a); } else await SK.removePack(id); }
export async function installed() {
  let skins = []; try { skins = await SK.listInstalled(); } catch {}
  return [...skins.map(p => ({ type: 'skin', id: p.id, name: p.name, version: p.version })), ...Object.values(voicePacks()).map(p => ({ type: 'voice', id: p.id, name: p.name, version: p.version }))];
}
/** Hosted catalog: packs/index.json next to the web app (GitHub Pages; bundled copy in the Beijing edition). */
export async function catalog(base) {
  const u = new URL('packs/index.json', base).href, r = await fetch(u, { cache: 'no-cache' }); if (!r.ok) throw new Error(`${r.status} catalog`);
  const c = await r.json(); if (c.format !== 'roadglow-catalog/1' || !Array.isArray(c.packs)) throw new Error('bad catalog');
  return c.packs.map(e => ({ ...e, url: new URL(e.url, u).href }));
}
