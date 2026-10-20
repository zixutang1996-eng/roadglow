import { Resvg } from '@resvg/resvg-js'; import fs from 'fs';
const road = `<defs><linearGradient id="g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffb347"/><stop offset="1" stop-color="#4fd6e8"/></linearGradient>
<filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22"/></filter></defs>
<g transform="translate(512 512)"><path d="M-250 330 C -90 190, 120 140, 40 -40 S 60 -250, 190 -330" fill="none" stroke="url(#g)" stroke-width="120" stroke-linecap="round" opacity=".55" filter="url(#b)"/>
<path d="M-250 330 C -90 190, 120 140, 40 -40 S 60 -250, 190 -330" fill="none" stroke="url(#g)" stroke-width="74" stroke-linecap="round"/>
<path d="M-250 330 C -90 190, 120 140, 40 -40 S 60 -250, 190 -330" fill="none" stroke="#14161f" stroke-width="7" stroke-dasharray="34 30" stroke-linecap="round"/>
<path d="M190 -390 L262 -250 L190 -282 L118 -250 Z" fill="#fff4dc"/></g>`;
const bg = `<rect width="1024" height="1024" fill="#14161f"/><circle cx="512" cy="512" r="520" fill="#1d2433" opacity=".9"/>`;
const r = (svg, w, f) => fs.writeFileSync(f, new Resvg(svg, { fitTo: { mode: 'width', value: w } }).render().asPng());
r(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">${bg}${road}</svg>`, 1024, 'assets/icon-only.png');
r(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><g transform="translate(512 512) scale(.62) translate(-512 -512)">${road}</g></svg>`, 1024, 'assets/icon-foreground.png');
r(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">${bg}</svg>`, 1024, 'assets/icon-background.png');
const sp = d => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2732 2732"><rect width="2732" height="2732" fill="${d ? '#14161f' : '#14161f'}"/><g transform="translate(1366 1250) scale(.7) translate(-512 -512)">${road}</g><text x="1366" y="1900" font-family="sans-serif" font-size="150" font-weight="700" fill="#e3ecef" text-anchor="middle" letter-spacing="12">RoadGlow</text></svg>`;
r(sp(0), 2732, 'assets/splash.png'); r(sp(1), 2732, 'assets/splash-dark.png');
