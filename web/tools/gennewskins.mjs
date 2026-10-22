// v0.9.5: Deep Space / Nord / Tactical map styles, derived from the Neon style (same layer ids, so POIs, route,
// sprites and all app logic work unchanged) and recoloured with the approved mockup palettes (tools/newskin_pal.mjs,
// copied from screenshots/newskins/src/style.js). Labels keep the bundled glyph stacks; CJK uses localIdeographFontFamily.
import fs from 'fs';
import { PAL } from './newskin_pal.mjs';
const hide = l => { (l.layout ||= {}).visibility = 'none'; };
for (const key of Object.keys(PAL)) {
  const p = PAL[key], [skin, mode] = key.split('_');
  const st = JSON.parse(fs.readFileSync(`public/styles/neon_${mode}.json`)); st.name = key;
  st.sprite = `{SPRITE}/${skin === 'nord' ? 'west' : 'neon'}_${mode}`;
  const font = b => [skin === 'nord' ? 'IM FELL English Regular' : b ? 'Rajdhani Bold' : 'Rajdhani SemiBold'];
  const L = [];
  for (const l of st.layers) {
    const pt = l.paint ||= {}, id = l.id;
    const set = (k, v) => { if (v == null) hide(l); else pt[k] = v; };
    if (id === 'background') pt['background-color'] = p.bg;
    else if (id === 'landuse') pt['fill-color'] = p.land;
    else if (id === 'park' || id === 'wood') { pt['fill-color'] = p.park; if (id === 'wood') pt['fill-opacity'] = .7; }
    else if (id === 'water') pt['fill-color'] = p.water;
    else if (id === 'water-edge' || id === 'waterway') pt['line-color'] = p.wline;
    else if (id === 'building') { pt['fill-color'] = p.bld; delete pt['fill-outline-color']; pt['fill-antialias'] = true; if (p.tac) { pt['fill-outline-color'] = p.bld; l.minzoom = 13; } }
    else if (id === 'path') pt['line-color'] = p.minorC || p.minor;
    else if (/-glow$/.test(id)) hide(l);
    else if (id === 'minor-ink') set('line-color', p.minorC);
    else if (/^(secondary|primary)-ink$/.test(id)) set('line-color', p.majorC);
    else if (id === 'motorway-ink') set('line-color', p.mwC);
    else if (id === 'minor') pt['line-color'] = p.minor;
    else if (id === 'secondary' || id === 'primary') pt['line-color'] = p.major;
    else if (id === 'motorway') pt['line-color'] = p.mw;
    else if (id === 'rail') { pt['line-color'] = p.rail; pt['line-dasharray'] = [3, 3]; }
    else if (id === 'boundary') pt['line-color'] = p.wline;
    if (l.type === 'line') { delete pt['line-blur']; }
    if (l.type === 'symbol' && l.layout?.['text-font']) {
      l.layout['text-font'] = font(/Bold/.test(l.layout['text-font'][0]));
      pt['text-halo-color'] = p.halo; pt['text-halo-width'] = 1.4;
      pt['text-color'] = id === 'water-name' ? (mode === 'dark' && skin === 'space' ? '#5b7396' : p.wline) : id === 'road-name' || id === 'place-neigh' || id === 'place-suburb' ? p.road : p.lbl;
      if (/^place-(city|suburb|neigh)/.test(id) && skin !== 'nord') l.layout['text-transform'] = 'uppercase';
      if (/^place-/.test(id)) l.layout['text-letter-spacing'] = skin === 'nord' ? .08 : .18;
    }
    L.push(l);
    // Tactical: solid 3D blocks (no outlines) for navigation; toggled by the app (layer 'bld3d', hidden unless navigating)
    if (id === 'building' && p.tac) L.push({ id: 'bld3d', type: 'fill-extrusion', source: l.source, 'source-layer': 'building', minzoom: 14, layout: { visibility: 'none' },
      paint: { 'fill-extrusion-color': p.bld, 'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 8], 'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0], 'fill-extrusion-opacity': 1, 'fill-extrusion-vertical-gradient': true } });
  }
  st.layers = L;
  fs.writeFileSync(`public/styles/${key}.json`, JSON.stringify(st));
}
console.log('new skins ok', Object.keys(PAL).join(' '));
