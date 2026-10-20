// Original POI icon sets (drawn for this project; no third-party assets). Output: public/sprites/<style>[@2x].{json,png}
import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';
import fs from 'fs';

// 24x24 stroke glyphs, centred at 12,12
const G = {
  restaurant: 'M8 4v6a2 2 0 0 0 4 0V4M10 4v16M16 4c-2 2-2 6 0 8v8',
  cafe: 'M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 10h2a2 2 0 0 1 0 4h-2M8 4c1 1-1 2 0 3M11 4c1 1-1 2 0 3',
  bar: 'M5 5h14l-7 8zM12 13v6M8 19h8',
  library: 'M4 6c3-1 5-1 8 1 3-2 5-2 8-1v12c-3-1-5-1-8 1-3-2-5-2-8-1zM12 7v12',
  supermarket: 'M3 5h3l2 10h10l2-7H7M10 19.5h.01M17 19.5h.01',
  fuel: 'M5 20V5h8v15M4 20h10M7 8h4M13 10h2l2 2v6a1.5 1.5 0 0 0 3 0V9l-3-3',
  hotel: 'M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5M6.5 11.5h.01',
  hospital: 'M9 4h6v5h5v6h-5v5H9v-5H4V9h5z',
  pharmacy: 'M7 17l10-10a3.5 3.5 0 0 0-5-5L2 12a3.5 3.5 0 0 0 5 5zM7 7l5 5',
  school: 'M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5M22 9v6',
  park: 'M12 3l-6 9h3l-4 6h14l-4-6h3zM12 18v3',
  bank: 'M12 3v18M16.5 7H10a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6H7',
  parking: 'M7 20V4h6a4 4 0 0 1 0 8H7',
  transit: 'M6 4h12a1 1 0 0 1 1 1v11H5V5a1 1 0 0 1 1-1zM5 11h14M8 16v3M16 16v3M8 13.5h.01M16 13.5h.01',
  ferry: 'M3 15l2 4h14l2-4zM6 15V9h12v6M12 9V4M9 12h.01M15 12h.01',
  museum: 'M3 9l9-5 9 5zM5 9v9M10 9v9M14 9v9M19 9v9M3 20h18',
  shop: 'M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2',
  generic: 'M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11zM12 10h.01',
};

const STY = {
  neon_dark:  { frame: 'hex', fill: '#161a26', stroke: '#4fd6e8', glyph: '#e8dc9a', glow: '#4fd6e8' },
  neon_light: { frame: 'hex', fill: '#ffffff', stroke: '#b03a8e', glyph: '#2c3040', glow: null },
  west_light: { frame: 'round', fill: '#f2e4c0', stroke: '#4a3320', glyph: '#3a2616', glow: null },
  west_dark:  { frame: 'round', fill: '#3a2f22', stroke: '#d6b483', glyph: '#ecd7ad', glow: null },
};

function svgFor(name, s, px) {
  const hex = 'M20 2.5L36.5 12v19L20 40.5 3.5 31V12z';
  const diamondTick = 'M20 0.8l2 2-2 2-2-2z';
  let frame;
  if (s.frame === 'hex') {
    frame = `${s.glow ? `<path d="${hex}" fill="none" stroke="${s.glow}" stroke-width="4" opacity="0.25" filter="url(#b)"/>` : ''}
      <path d="${hex}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="1.6" stroke-linejoin="miter"/>
      <path d="${diamondTick}" fill="${s.stroke}"/>`;
  } else {
    // hand-drawn roundel: slightly irregular double ring, roughened by turbulence
    frame = `<g filter="url(#r)"><circle cx="20" cy="21" r="17.5" fill="${s.fill}" stroke="${s.stroke}" stroke-width="2.2"/>
      <path d="M6 20.5a14.5 14.2 0 1 1 28 1" fill="none" stroke="${s.stroke}" stroke-width="0.8" opacity="0.7"/></g>`;
  }
  const sw = s.frame === 'hex' ? 1.5 : 2.1;
  const glyph = `<g transform="translate(8 9)" fill="none" stroke="${s.glyph}" stroke-width="${sw}" stroke-linecap="${s.frame === 'hex' ? 'square' : 'round'}" stroke-linejoin="${s.frame === 'hex' ? 'miter' : 'round'}" ${s.frame === 'round' ? 'filter="url(#r)"' : ''}><path d="${G[name]}"/></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px * 43 / 40}" viewBox="0 0 40 43">
    <defs><filter id="b" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.6"/></filter>
    <filter id="r"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${name.length}"/><feDisplacementMap in="SourceGraphic" scale="0.9"/></filter></defs>
    ${frame}${glyph}</svg>`;
}

fs.mkdirSync('public/sprites', { recursive: true });
for (const [sty, s] of Object.entries(STY)) {
  for (const ratio of [1, 2]) {
    const px = 26 * ratio, names = Object.keys(G), cols = 6;
    const imgs = names.map(n => { const r = new Resvg(svgFor(n, s, px)).render(); return { n, w: r.width, h: r.height, data: r.pixels }; });
    const cw = Math.max(...imgs.map(i => i.w)), ch = Math.max(...imgs.map(i => i.h));
    const out = new PNG({ width: cw * cols, height: ch * Math.ceil(names.length / cols) });
    const idx = {};
    imgs.forEach((im, k) => {
      const x0 = (k % cols) * cw, y0 = Math.floor(k / cols) * ch;
      for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) {
        const si = (y * im.w + x) * 4, di = ((y0 + y) * out.width + x0 + x) * 4;
        for (let c = 0; c < 4; c++) out.data[di + c] = im.data[si + c];
      }
      idx[im.n] = { x: x0, y: y0, width: im.w, height: im.h, pixelRatio: ratio };
    });
    const suf = ratio === 2 ? '@2x' : '';
    fs.writeFileSync(`public/sprites/${sty}${suf}.png`, PNG.sync.write(out));
    fs.writeFileSync(`public/sprites/${sty}${suf}.json`, JSON.stringify(idx));
  }
}
console.log('sprites ok');
