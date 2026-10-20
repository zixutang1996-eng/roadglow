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

// filled glyph overrides (solid silhouettes)
Object.assign(G, {
  restaurant: 'M7 3h1.4v5h1V3h1.4v5h1V3H13v6.5a2.5 2.5 0 0 1-2 2.4V21H9V11.9a2.5 2.5 0 0 1-2-2.4zM15 3c3 0 3.5 4 3.5 7.5H17V21h-2z',
  cafe: 'M4 8h13v6a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6zM17 9.5h1.5a3 3 0 0 1 0 6H17v-2h1.5a1 1 0 0 0 0-2H17zM8 2.5c1.5 1.5-.5 2.5.5 4h-1.6C6 5 8 4 6.5 2.5zM12 2.5c1.5 1.5-.5 2.5.5 4h-1.6c-.9-1.5 1.1-2.5-.4-4z',
  bar: 'M4 4h16l-7 8.5V18h4v2H7v-2h4v-5.5z',
  library: 'M2.5 5.5c3.5-1.2 6.5-1 8.5.8V20c-2-1.4-5-1.6-8.5-.6zM21.5 5.5c-3.5-1.2-6.5-1-8.5.8V20c2-1.4 5-1.6 8.5-.6z',
  supermarket: 'M2 4h3.6l.7 3H21l-2.4 8.5H8.2l.4 1.5H19v2H7l-3-13H2zM9 19.5a1.6 1.6 0 1 0 0 .1zM17 19.5a1.6 1.6 0 1 0 0 .1z',
  fuel: 'M4 3h10v8h1.5a2 2 0 0 1 2 2v4a1 1 0 0 0 2 0V9l-2.5-2.5 1.4-1.4L21.5 8.2V17a3 3 0 0 1-6 0v-4H14v8H4zM6.5 5.5v4h5v-4z',
  hotel: 'M2 6h2.5v7H21v7h-2.5v-3h-14v3H2zM6 9.5a2.2 2.2 0 1 0 4.4 0 2.2 2.2 0 1 0-4.4 0zM11.5 8h6a3.5 3.5 0 0 1 3.5 3.5v.5h-9.5z',
  hospital: 'M8.5 3h7v5.5H21v7h-5.5V21h-7v-5.5H3v-7h5.5z',
  pharmacy: 'M4.2 11.8l7.6-7.6a4.6 4.6 0 0 1 6.5 6.5l-7.6 7.6a4.6 4.6 0 0 1-6.5-6.5z',
  school: 'M12 3l11 5.5-11 5.5L1 8.5zM5 12l7 3.5 7-3.5v4.5c-3.5 3-10.5 3-14 0zM21 9.5h1.6V16H21z',
  park: 'M12 2l7 10h-3.2l4.2 6H13v4h-2v-4H4l4.2-6H5z',
  bank: 'M12 2l10 5v2H2V7zM4 10h3v7H4zM10.5 10h3v7h-3zM17 10h3v7h-3zM2 18h20v3H2z',
  parking: 'M6 3h7.5a5.5 5.5 0 0 1 0 11H10v7H6zM10 6.5v4h3.3a2 2 0 0 0 0-4z',
  transit: 'M6 2.5h12a2 2 0 0 1 2 2V17H4V4.5a2 2 0 0 1 2-2zM6.5 5v5.5h11V5zM8 13a1.4 1.4 0 1 0 .1 0zM16 13a1.4 1.4 0 1 0 .1 0zM6 17.5h3l-1.5 3.5H5zM15 17.5h3l1 3.5h-2.5z',
  ferry: 'M11 2h2v3h4v6l4 1.5-2.5 6.5h-13L3 12.5 7 11V5h4zM9 7v3.3l3-1.1 3 1.1V7zM2 20.5c2 1.3 4 1.3 5 0 1 1.3 4 1.3 5 0 1 1.3 4 1.3 5 0 1 1.3 3 1.3 5 0v2H2z',
  museum: 'M12 2l10 5.5H2zM4 9h3v9H4zM10.5 9h3v9h-3zM17 9h3v9h-3zM2 19h20v3H2z',
  shop: 'M4 8h16l-1.2 13H5.2zM8 8V6.5a4 4 0 0 1 8 0V8h-2V6.5a2 2 0 0 0-4 0V8z',
  generic: 'M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7zm0 4.3a2.7 2.7 0 1 0 0 5.4 2.7 2.7 0 1 0 0-5.4z',
  quest: 'M12 1.5l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 8.7l7.1-.6z',
});
// category groups -> badge shape + colour family
const GROUP = { restaurant: 'food', cafe: 'food', bar: 'food', supermarket: 'shop', shop: 'shop', hospital: 'health', pharmacy: 'health',
  school: 'edu', library: 'edu', transit: 'trans', ferry: 'trans', fuel: 'trans', parking: 'trans', museum: 'culture', park: 'park',
  bank: 'service', generic: 'service', hotel: 'lodge', quest: 'quest' };
// hues per group (light / dark variants per theme); fills auto-darkened until glyph contrast >= 4.5
const HUE = {
  neon:  { food: '#e0567a', shop: '#8a5cf0', health: '#e5484d', edu: '#d99a1e', trans: '#2f8fe0', culture: '#c2309a', park: '#25a86b', service: '#4a8a9a', lodge: '#5b62d6', quest: '#e8b400' },
  west:  { food: '#a8452a', shop: '#6d5a9a', health: '#9e2a22', edu: '#a77a1e', trans: '#3d6a8a', culture: '#7a3d6a', park: '#4f7a3a', service: '#5a6a6a', lodge: '#6a4a2e', quest: '#b8862a' },
};
// 40x43 viewBox shapes, centre ~ (20,21)
const SHAPE = {
  neon: { food: 'M20 2.5L36.5 12v19L20 40.5 3.5 31V12z', shop: 'M9 3h22l6 6v22l-6 6H9l-6-6V9z', health: 'M13 2.5h14L37.5 13v16L27 39.5H13L2.5 29V13z',
    edu: 'M20 2l17.5 12.5-6.5 24H9l-6.5-24z', trans: 'M8 3h24a5 5 0 0 1 5 5v26a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5z', culture: 'M20 1.5L38.5 21 20 40.5 1.5 21z',
    park: 'M20 2C30 2 37 9 37 19c0 11-9 19-17 21C12 38 3 30 3 19 3 9 10 2 20 2z', service: 'M3 8l5-5h24l5 5v26l-5 5H8l-5-5z', lodge: 'M20 2l17 13v24H3V15z', quest: 'M20 1l5.3 8.3 9.7-2.3-2.3 9.7L41 21l-8.3 5.3 2.3 9.7-9.7-2.3L20 42l-5.3-8.3-9.7 2.3 2.3-9.7L-1 21l8.3-5.3L5 7l9.7 2.3z' },
  west: { food: 'M20 3a18 18 0 1 1 0 36 18 18 0 1 1 0-36z', shop: 'M4 4h32v28l-16 8-16-8z', health: 'M20 2l16 5v12c0 11-8 18-16 21C12 37 4 30 4 19V7z',
    edu: 'M4 3h32v34l-16-6-16 6z', trans: 'M13 2.5h14l10.5 10.5v16L27 39.5H13L2.5 29V13z', culture: 'M20 1.5L38.5 21 20 40.5 1.5 21z',
    park: 'M20 2c8 6 17 13 17 22a17 17 0 0 1-34 0c0-9 9-16 17-22z', service: 'M20 2l16.5 9.5v19L20 40 3.5 30.5v-19z', lodge: 'M20 2l17 14v23H3V16z', quest: 'M20 1l4.7 9.6 10.5 1.5-7.6 7.4 1.8 10.5L20 25l-9.4 5 1.8-10.5-7.6-7.4 10.5-1.5z' },
};
const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const mix = (h, t, k) => '#' + [1, 3, 5].map(i => Math.round(parseInt(h.slice(i, i + 2), 16) * (1 - k) + parseInt(t.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');
const STY = {
  neon_light: { th: 'neon', glyph: '#ffffff', edge: '#ffffff', dark: false },
  neon_dark:  { th: 'neon', glyph: '#f4f1e6', edge: '#0f1118', dark: true },
  west_light: { th: 'west', glyph: '#fbf3df', edge: '#3a2616', dark: false },
  west_dark:  { th: 'west', glyph: '#f1e2c2', edge: '#17130f', dark: true },
};
export const CONTRAST = {};
function fillFor(s, grp) {
  let f = HUE[s.th][grp]; if (s.dark) f = mix(f, '#1a1c24', 0.35); // muted in dark mode
  let k = 0; while (cr(f, s.glyph) < 4.6 && k++ < 40) f = mix(f, '#000000', 0.05);
  return f;
}
function svgFor(name, s, px, key) {
  const grp = GROUP[name], fill = fillFor(s, grp), shape = SHAPE[s.th][grp];
  (CONTRAST[key] ||= {})[grp] = +cr(fill, s.glyph).toFixed(2);
  const rough = s.th === 'west' ? 'filter="url(#r)"' : '';
  const ring = s.th === 'neon' ? `<path d="${shape}" fill="none" stroke="${s.dark ? mix(fill, '#ffffff', 0.45) : '#ffffff'}" stroke-width="1.2" transform="translate(20 21) scale(.84) translate(-20 -21)" opacity="${s.dark ? 0.7 : 0.85}"/>`
    : `<path d="${shape}" fill="none" stroke="${s.glyph}" stroke-width="0.9" opacity="0.6" transform="translate(20 21) scale(.83) translate(-20 -21)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px * 43 / 40}" viewBox="-2 -1 44 45">
    <defs><filter id="r"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${name.length}"/><feDisplacementMap in="SourceGraphic" scale="0.8"/></filter></defs>
    <g ${rough}><path d="${shape}" fill="${fill}" stroke="${s.edge}" stroke-width="2.2" stroke-linejoin="round"/>${ring}</g>
    <g transform="translate(20 21) scale(.92) translate(-12 -12)" fill="${s.glyph}" fill-rule="evenodd"><path d="${G[name]}"/></g></svg>`;
}
fs.mkdirSync('public/sprites', { recursive: true });
for (const [sty, s] of Object.entries(STY)) {
  for (const ratio of [1, 2]) {
    const px = 30 * ratio, names = Object.keys(G), cols = 6;
    const imgs = names.map(n => { const r = new Resvg(svgFor(n, s, px, sty)).render(); return { n, w: r.width, h: r.height, data: r.pixels }; });
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
console.log('sprites ok', JSON.stringify(CONTRAST));
