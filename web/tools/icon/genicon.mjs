// v0.9.4 launcher icon B (glowing cyan pin + circuit traces) → adaptive layers, monochrome, legacy/round mipmaps, splash, PWA.
import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';
import fs from 'node:fs';
const src = fs.readFileSync(new URL('../../../screenshots/icons/icon_B.svg', import.meta.url), 'utf8');
const inner = src.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const defs = inner.match(/<defs>.*?<\/defs>/s)[0];
const bgRect = '<rect width="108" height="108" fill="url(#g)"/>';
const grid = inner.match(/<g stroke="#4fd6e8".*?<\/g>/s)[0].replace('stroke-opacity=".06"', 'stroke-opacity=".09"').replace('stroke-width=".4"', 'stroke-width=".5"');
let fg = inner.replace(defs, '').replace(bgRect, '').replace(/<g stroke="#4fd6e8".*?<\/g>/s, '');
// thicken strokes ~25% so the art reads at 48 px
fg = fg.replace(/stroke-width="([\d.]+)"/g, (_, w) => `stroke-width="${(+w * 1.25).toFixed(2)}"`).replace(/r="(2\.2|3\.4)"/g, (_, r) => `r="${(+r * 1.2).toFixed(2)}"`);
const svg = (body, d = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="108" height="108">${d}${body}</svg>`;
const BG = svg(bgRect + grid, defs), FG = svg(fg), FULL = svg(bgRect + grid + fg, defs);
// monochrome: only the solid strokes/dots (no glow halos), single colour
const mono = fg.replace(/<path[^>]*stroke-opacity="[^"]*"[^>]*\/>/g, '').replace(/#4fd6e8|#c77a9a/g, '#ffffff');
const MONO = svg(mono);
const render = (s, px) => new Resvg(s, { fitTo: { mode: 'width', value: px } }).render().asPng();
const mask = (buf, kind, px) => { const p = PNG.sync.read(buf), r = px / 2, rr = px * 0.18; for (let y = 0; y < px; y++) for (let x = 0; x < px; x++) { let a = 1; const cx = x + .5 - r, cy = y + .5 - r;
  if (kind === 'round') a = Math.max(0, Math.min(1, r - Math.hypot(cx, cy)));
  else { const dx = Math.max(0, Math.abs(cx) - (r - rr)), dy = Math.max(0, Math.abs(cy) - (r - rr)); a = Math.max(0, Math.min(1, rr - Math.hypot(dx, dy))); }
  p.data[(y * px + x) * 4 + 3] *= a; } return PNG.sync.write(p); };
const RES = 'android/app/src/main/res', D = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4, ldpi: 0.75 };
for (const [d, s] of Object.entries(D)) {
  const dir = `${RES}/mipmap-${d}`; fs.mkdirSync(dir, { recursive: true });
  const a = Math.round(108 * s), l = Math.round(48 * s);
  fs.writeFileSync(`${dir}/ic_launcher_background.png`, render(BG, a));
  fs.writeFileSync(`${dir}/ic_launcher_foreground.png`, render(FG, a));
  fs.writeFileSync(`${dir}/ic_launcher_monochrome.png`, render(MONO, a));
  // legacy: the 66dp safe zone scaled to fill the 48dp icon (crop 12..96)
  const crop = svg(bgRect + grid + fg, defs).replace('viewBox="0 0 108 108"', 'viewBox="14 14 80 80"');
  fs.writeFileSync(`${dir}/ic_launcher.png`, mask(render(crop, l), 'sq', l));
  fs.writeFileSync(`${dir}/ic_launcher_round.png`, mask(render(crop, l), 'round', l));
}
const AD = l => `<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n    <background android:drawable="@mipmap/ic_launcher_background" />\n    <foreground android:drawable="@mipmap/ic_launcher_foreground" />\n    <monochrome android:drawable="@mipmap/ic_launcher_monochrome" />\n</adaptive-icon>\n`;
for (const n of ['ic_launcher', 'ic_launcher_round']) fs.writeFileSync(`${RES}/mipmap-anydpi-v26/${n}.xml`, AD(n));
// splash: navy background with the icon art centred (Capacitor splash drawables, all densities/orientations)
const splash = (w, h) => { const sz = Math.round(Math.min(w, h) * 0.42); return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#0b1224"/><svg x="${(w - sz) / 2}" y="${(h - sz) / 2}" width="${sz}" height="${sz}" viewBox="14 14 80 80">${fg}</svg></svg>`; };
const rs = s => new Resvg(s).render().asPng();
for (const d of fs.readdirSync(RES).filter(d => d.startsWith('drawable'))) { const f = `${RES}/${d}/splash.png`; if (!fs.existsSync(f)) continue; const p = PNG.sync.read(fs.readFileSync(f)); fs.writeFileSync(f, rs(splash(p.width, p.height))); }
// PWA / web icons
const sq = px => mask(render(svg(bgRect + grid + fg, defs).replace('viewBox="0 0 108 108"', 'viewBox="14 14 80 80"'), px), 'sq', px);
for (const [f, px, m] of [['icons/Icon-192.png', 192], ['icons/Icon-512.png', 512], ['icons/Icon-maskable-192.png', 192, 1], ['icons/Icon-maskable-512.png', 512, 1], ['public/pwa/icon-192.png', 192], ['public/pwa/icon-512.png', 512], ['public/pwa/icon-512-maskable.png', 512, 1], ['public/pwa/icon-180.png', 180, 1], ['favicon.png', 64]])
  fs.writeFileSync(f, m ? render(FULL, px) : sq(px));
for (const f of fs.readdirSync('public/pwa').filter(f => /^splash-\d+x\d+\.png$/.test(f))) { const [w, h] = f.match(/(\d+)x(\d+)/).slice(1).map(Number); fs.writeFileSync('public/pwa/' + f, rs(splash(w, h))); }
fs.writeFileSync('../screenshots/icons/icon_B_preview.png', render(FULL, 432));
console.log('icons ok');
