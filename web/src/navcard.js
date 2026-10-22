// v0.9.2 adjustable navigation card (top instruction card + bottom bar): size + colour + opacity.
// Text colour is always auto-chosen so contrast against the (alpha-composited) card stays >= 4.5:1.
const K = 'navCard';
export const NC_DEF = { scale: 1, color: 'auto', opacity: 1 };
export const NC_SCALES = [0.7, 0.85, 1, 1.15, 1.3, 1.5];
// colour presets drawn from the two skin families' palettes
export const NC_PRESETS = {
  parchment: { bg: '#ead9b4', fg: '#22160b', zh: '羊皮纸', en: 'Parchment' },
  ink:       { bg: '#2a1f14', fg: '#f1e2c2', zh: '墨色', en: 'Ink' },
  sepia:     { bg: '#6b4a2b', fg: '#fbf0d9', zh: '棕褐', en: 'Sepia' },
  night:     { bg: '#0f1a22', fg: '#e3ecef', zh: '夜蓝', en: 'Night' },
  neon:      { bg: '#173a48', fg: '#ffffff', zh: '霓虹青', en: 'Neon teal' },
  paper:     { bg: '#f6f3ea', fg: '#1b1f24', zh: '白纸', en: 'Paper' },
};
// each mode's own panel colour ("auto") and its opposite ("swap")
const OWN0 = { west_light: '#ece0c2', west_dark: '#1c1f23', neon_light: '#f6f1e8', neon_dark: '#141824' };
const MAPBASE0 = { west_light: '#eedcb2', west_dark: '#1c222a', neon_light: '#e9e4da', neon_dark: '#14161f' };
const OWN = { ...OWN0 }, MAPBASE = { ...MAPBASE0 };
/** v0.9.3: the active night palette overrides the panel + map base colours. */
export function ncOwn(key, bg, mapBase) { OWN[key] = bg || OWN0[key]; MAPBASE[key] = mapBase || MAPBASE0[key]; }
const OPP = { west_light: 'west_dark', west_dark: 'west_light', neon_light: 'neon_dark', neon_dark: 'neon_light' };

export const ncGet = () => { try { return { ...NC_DEF, ...(JSON.parse(localStorage.getItem(K)) || {}) }; } catch { return { ...NC_DEF }; } };
export const ncSet = v => localStorage.setItem(K, JSON.stringify({ ...ncGet(), ...v }));

const hex = h => { h = h.replace('#', ''); if (h.length === 3) h = [...h].map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
const toHex = a => '#' + a.map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
const lum = c => { const v = hex(c).map(x => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
export const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const mix = (a, b, t) => toHex(hex(a).map((x, i) => x * t + hex(b)[i] * (1 - t)));
// best readable text colour: keep preferred if >= 4.5, else nudge toward black/white until it passes
export function readable(bg, pref) {
  if (pref && contrast(pref, bg) >= 4.5) return pref;
  const tgt = contrast('#000000', bg) > contrast('#ffffff', bg) ? '#000000' : '#ffffff';
  if (!pref) return tgt === '#000000' ? '#111111' : '#ffffff';
  for (let t = 0.1; t <= 1.001; t += 0.1) { const c = mix(tgt, pref, t); if (contrast(c, bg) >= 4.5) return c; }
  return tgt;
}
/** key = 'west_dark' etc; tok = active skin pack navCard tokens (optional). Returns resolved values (also for tests). */
export function ncResolve(key, tok = {}) {
  const c = ncGet(); const scale = Math.min(1.5, Math.max(0.7, +c.scale || 1)); const op = Math.min(1, Math.max(0.6, +c.opacity || 1));
  let bg = null, fg = null;
  if (c.color === 'swap') bg = tok.swapBg || OWN[OPP[key]];
  else if (NC_PRESETS[c.color]) ({ bg, fg } = NC_PRESETS[c.color]);
  else if (tok.bg) ({ bg, fg } = tok);
  else if (op < 1) bg = OWN[key];
  const custom = !!bg;
  const shown = bg ? mix(bg, tok.mapBase || MAPBASE[key] || '#808080', op) : null; // what the eye sees over the map
  return { scale, opacity: op, custom, bg, shown, fg: shown ? readable(shown, fg) : null, ratio: shown ? +contrast(readable(shown, fg), shown).toFixed(2) : null };
}
export function ncApply(key, tok) {
  const r = ncResolve(key, tok), root = document.documentElement, b = document.body;
  root.style.setProperty('--ncs', r.scale);
  b.classList.toggle('ncc', r.custom);
  if (r.custom) { const [R, G, B] = hex(r.bg); root.style.setProperty('--ncbg', `rgba(${R},${G},${B},${r.opacity})`); root.style.setProperty('--ncfg', r.fg); }
  return r;
}
export function ncHtml(L, cur = ncGet()) {
  const i = Math.max(0, NC_SCALES.indexOf(+cur.scale)), opts = [['auto', L('跟随皮肤', 'Skin default')], ['swap', L('反色', 'Swapped')], ...Object.entries(NC_PRESETS).map(([k, p]) => [k, L(p.zh, p.en)])];
  const sw = k => NC_PRESETS[k] ? `<i class="ncsw" style="background:${NC_PRESETS[k].bg}"></i>` : '';
  return `<div class="szrow"><span>${L('大小', 'Size')}</span><input type="range" min="0" max="${NC_SCALES.length - 1}" step="1" value="${i}" data-nc="scale"><b id="ncv_scale">${Math.round(NC_SCALES[i] * 100)}%</b></div>
   <div class="ncgrid">${opts.map(([k, l]) => `<button class="${cur.color === k ? 'on' : ''}" data-ncc="${k}">${sw(k)}${l}</button>`).join('')}</div>
   <div class="szrow"><span>${L('不透明度', 'Opacity')}</span><input type="range" min="60" max="100" step="5" value="${Math.round(cur.opacity * 100)}" data-nc="opacity"><b id="ncv_opacity">${Math.round(cur.opacity * 100)}%</b></div>
   <div class="sub" style="padding:4px 0 0;font-size:calc(12.5px * var(--ts,1))">${L('文字颜色自动调整，对比度始终 ≥ 4.5:1', 'Text colour adjusts automatically to keep contrast ≥ 4.5:1')}</div>
   <button class="btn ghost" data-ncreset="1" style="margin-top:6px">${L('重置为默认', 'Reset')}</button>`;
}
