// v0.9.11: dump the exported car panel specs (src/car.js carPanelSpec on real packs / built-ins) for the mockups.
// run from web/: node tools/car/preview/export_v0911.mjs → tools/car/preview/panels.json (frames as data URLs)
import fs from 'node:fs'; import { carPanelSpec } from '../../../src/car.js'; import { loadPk } from '../packload.mjs';
const SK = { synthb: 'public/packs/synthb-1.0.1.rgpack', synthc: 'public/packs/synthc-1.0.1.rgpack', sanguo: 'public/packs/sanguo-1.1.1.rgpack', neon: null };
const out = {};
for (const [id, f] of Object.entries(SK)) { const pk = f ? await loadPk(f) : null; out[id] = {}; for (const m of ['light', 'dark']) out[id][m] = carPanelSpec({ pk, theme: id, mode: m }); }
fs.writeFileSync('tools/car/preview/panels.json', JSON.stringify(out));
for (const [id, v] of Object.entries(out)) for (const m of ['light', 'dark']) { const p = v[m]; console.log(id, m, p.bg, p.fg, p.accent, p.head, '/', p.body, p.frame ? 'frame' + JSON.stringify(p.slice) + ' fw' + p.fw : 'no-frame', 'r' + p.radius, 'bw' + p.bw, p.border); }
