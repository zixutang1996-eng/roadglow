// v0.9.3 Frontier Ink night palettes (map + panels). Map colours measured in mockups (labels >= 10:1 on land).
export const PALS = {
  n1: { zh: '暖棕夜', en: 'Warm sepia', map: { bg: '#221a12', land: '#251c14', park: '#323520', water: '#0c171c', wedge: '#5b6a62', bld: '#33281c', bldo: '#4a3b2a', path: '#9c8460', ink: '#120d08', minor: '#5a4832', sec: '#77603f', pri: '#9a7a4c', mot: '#b08452', rail: '#8a7656', label: '#e2cfa8', poi: '#e0ac74', halo: '#140f0a', wlabel: '#8fa7a0', route: '#e0a46a' },
    ui: { bg: '#201c19', bg2: '#2b2622', fg: '#efe5d2', muted: '#c7bba5', acc: '#e0b468', hl: 'rgba(255,236,200,.13)', theme: '#1a1511' } },
  n2: { zh: '石板蓝夜', en: 'Slate blue', map: { bg: '#1a1f26', land: '#1c222a', park: '#263a2e', water: '#0a121b', wedge: '#4c6478', bld: '#262d36', bldo: '#3a4552', path: '#7f8c96', ink: '#0c0f13', minor: '#3c4652', sec: '#53606c', pri: '#7a828a', mot: '#a08a66', rail: '#6c7782', label: '#d6d9d2', poi: '#d9b98a', halo: '#0e1216', wlabel: '#7f9cb3', route: '#e0b468' },
    ui: { bg: '#1c1f23', bg2: '#272b30', fg: '#ece4d4', muted: '#c4bba9', acc: '#d9b36a', hl: 'rgba(220,228,240,.13)', theme: '#15181c' } },
  n3: { zh: '橄榄林夜', en: 'Olive forest', map: { bg: '#1b1f16', land: '#1d2118', park: '#2e3d22', water: '#0b1714', wedge: '#506a58', bld: '#2a2e20', bldo: '#3e4430', path: '#8e8a62', ink: '#0d0f0a', minor: '#454a34', sec: '#5e6444', pri: '#8a845a', mot: '#a88a52', rail: '#77775a', label: '#dcd6b4', poi: '#d6b07a', halo: '#0f120c', wlabel: '#86a594', route: '#e6c070' },
    ui: { bg: '#1c1e18', bg2: '#272a21', fg: '#ede6cf', muted: '#c6bfa4', acc: '#d8b86a', hl: 'rgba(235,240,205,.12)', theme: '#16180f' } },
  n4: { zh: '炭灰琥珀夜', en: 'Charcoal amber', map: { bg: '#1c1b1a', land: '#1e1d1b', park: '#2b3527', water: '#0b1218', wedge: '#556270', bld: '#292725', bldo: '#3d3a36', path: '#8a7a62', ink: '#0d0c0b', minor: '#46423c', sec: '#56514a', pri: '#b08446', mot: '#c8924a', rail: '#706a60', label: '#e0d4bc', poi: '#e6a856', halo: '#0f0e0d', wlabel: '#8296a6', route: '#f0b45a' },
    ui: { bg: '#1e1d1c', bg2: '#2a2826', fg: '#efe4cc', muted: '#c9bda6', acc: '#e6a856', hl: 'rgba(255,225,180,.12)', theme: '#171615' } },
};
export const PAL_DEF = 'n2';
const MAPK = { background: ['background-color', 'bg'], landuse: ['fill-color', 'land'], park: ['fill-color', 'park'], wood: ['fill-color', 'park'], water: ['fill-color', 'water'], 'water-edge': ['line-color', 'wedge'], waterway: ['line-color', 'wedge'], building: ['fill-color', 'bld'], path: ['line-color', 'path'], minor: ['line-color', 'minor'], secondary: ['line-color', 'sec'], primary: ['line-color', 'pri'], motorway: ['line-color', 'mot'], rail: ['line-color', 'rail'] };
/** Recolour a west_dark style JSON in place. */
export function recolor(st, key) {
  const p = PALS[key]?.map; if (!p) return st;
  for (const l of st.layers) {
    const pt = l.paint || (l.paint = {}), m = MAPK[l.id];
    if (m) pt[m[0]] = p[m[1]];
    if (l.id === 'building') pt['fill-outline-color'] = p.bldo;
    if (l.id.endsWith('-ink')) pt['line-color'] = p.ink;
    if (l.type === 'symbol' && pt['text-color'] !== undefined) { pt['text-halo-color'] = p.halo; pt['text-color'] = l.id === 'water-name' ? p.wlabel : (l.id === 'poi' || l.id === 'place-country') ? p.poi : p.label; }
  }
  return st;
}
export function applyPalVars(key, on) {
  const r = document.documentElement.style, u = PALS[key]?.ui;
  for (const k of ['bg', 'bg2', 'fg', 'muted', 'acc', 'hl']) on && u ? r.setProperty(`--p-${k}`, u[k]) : r.removeProperty(`--p-${k}`);
}
