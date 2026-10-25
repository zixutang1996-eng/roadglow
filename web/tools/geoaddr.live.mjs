// v0.9.13 LIVE (network) check of the general address pipeline on several Canadian address shapes. Not a unit test: depends on Photon/Nominatim/geocoder.ca.
import { geocodeAddress as G } from '../src/geoaddr.js';
const Q = [['1581 coalbanks blvd w, lethbridge', 49.6678, -112.8974], ['301 7 st s lethbridge'], ['8770 170 st nw edmonton'], ['1 dundas st w toronto'], ['800 robson st vancouver'], ['1234 kensington rd nw calgary'], ['55 rue de la gauchetiere o montreal'], ['2100 13 ave regina sk'], ['100 queen st ottawa on']];
for (const [q, la, lo] of Q) { const t = Date.now(); const r = await G(q, { lat: 49.69, lng: -112.84 }); const x = r[0];
  console.log(`${(Date.now() - t + 'ms').padStart(7)} ${q.padEnd(38)} → ${x ? `${x.exact ? 'EXACT' : 'street'} ${x.name}, ${x.address} [${x.src}] ${x.lat.toFixed(5)},${x.lng.toFixed(5)}` : 'none'}${la && x ? `  Δ=${Math.round(Math.hypot((x.lat - la) * 111e3, (x.lng - lo) * 72e3))} m` : ''}`);
  await new Promise(r => setTimeout(r, 1200)); }
