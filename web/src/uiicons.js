// Original UI icon set (v0.7), drawn for RoadGlow. Two art styles matching the POI badges:
//  ink-west: black rough badge + white solid glyph (cream rim in dark mode)
//  neon: angular cut-corner frame in thin neon line + solid glyph
const P = {
  search: 'M10 3a7 7 0 0 1 5.6 11.2l5.6 5.6-1.6 1.6-5.6-5.6A7 7 0 1 1 10 3zm0 2.4a4.6 4.6 0 1 0 0 9.2 4.6 4.6 0 1 0 0-9.2z',
  menu: 'M3 5h18v2.6H3zM3 10.7h18v2.6H3zM3 16.4h18V19H3z',
  dir: 'M12 1.5L22.5 12 12 22.5 1.5 12zM13 7.5v2.8H9.3A1.8 1.8 0 0 0 7.5 12v3.2h2.3v-2.6H13v2.9l4.2-4z',
  start: 'M12 2.5l8 18.5-8-4.2L4 21z',
  star: 'M12 1.5l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 8.7l7.1-.6z',
  share: 'M12 1.5l5.5 5.5h-4V15h-3V7h-4zM3.5 11.5h3V19h11v-7.5h3V22h-17z',
  measure: 'M1.5 16L16 1.5 22.5 8 8 22.5zM5.8 15.6l1.6 1.6 1.4-1.4-1.6-1.6zM8.9 12.5l2.4 2.4 1.4-1.4-2.4-2.4zM12 9.4l1.6 1.6 1.4-1.4L13.4 8zM15.1 6.3l2.4 2.4 1.4-1.4-2.4-2.4z',
  offline: 'M10.5 2.5h3v8.5h3.8L12 16.6 6.7 11h3.8zM3.5 18h17v3.5h-17z',
  settings: 'M10 2h4l.6 2.8 2 .9 2.4-1.6 2.8 2.8-1.6 2.4.9 2 2.9.7v4l-2.8.6-.9 2 1.6 2.4-2.8 2.8-2.4-1.6-2 .9L14 22h-4l-.6-2.8-2-.9-2.4 1.6-2.8-2.8 1.6-2.4-.9-2L2 14v-4l2.8-.6.9-2-1.6-2.4 2.8-2.8 2.4 1.6 2-.9zm2 6.3a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 1 0 0-7.4z',
  recent: 'M12 2a10 10 0 1 1 0 20 10 10 0 1 1 0-20zm-1.3 4v7.3l5.3 3.1 1.3-2.1-4-2.4V6z',
  quest: 'M12 1l3 8 8 3-8 3-3 8-3-8-8-3 8-3zm0 8.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 1 0 0-5z',
  layers: 'M12 1.5l10 5.5-10 5.5L2 7zM4.6 10.8L12 14.9l7.4-4.1 2.6 1.4-10 5.5-10-5.5zM4.6 15.8L12 19.9l7.4-4.1 2.6 1.4-10 5.5-10-5.5z',
  trash: 'M8 2h8v2h5v2.6H3V4h5zM5 8h14l-1.3 14H6.3z',
  size: 'M3 3h18v4.5h-2.5V5.6h-5V19H16v2.5H8V19h2.5V5.6h-5v1.9H3z',
  voice: 'M2.5 8.5h4.2L12 3.5v17l-5.3-5H2.5zM15 7.6a5.5 5.5 0 0 1 0 8.8l-1.5-1.6a3.3 3.3 0 0 0 0-5.6zM17.6 4.6a9.5 9.5 0 0 1 0 14.8l-1.5-1.6a7.3 7.3 0 0 0 0-11.6z',
  info: 'M12 2a10 10 0 1 1 0 20 10 10 0 1 1 0-20zm-1.6 8v8.5h3.2V10zm0-4.4v3.1h3.2V5.6z',
  list: 'M3 4h3.2v3.2H3zM8.3 4H21v3.2H8.3zM3 10.4h3.2v3.2H3zM8.3 10.4H21v3.2H8.3zM3 16.8h3.2V20H3zM8.3 16.8H21V20H8.3z',
  locate: 'M11 1h2v3.1A8 8 0 0 1 19.9 11H23v2h-3.1A8 8 0 0 1 13 19.9V23h-2v-3.1A8 8 0 0 1 4.1 13H1v-2h3.1A8 8 0 0 1 11 4.1zm1 5a6 6 0 1 0 0 12 6 6 0 1 0 0-12zm0 3a3 3 0 1 1 0 6 3 3 0 1 1 0-6z',
  pin: 'M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7zm0 4.3a2.7 2.7 0 1 0 0 5.4 2.7 2.7 0 1 0 0-5.4z',
  close: 'M5.6 3.5L12 9.9l6.4-6.4 2.1 2.1-6.4 6.4 6.4 6.4-2.1 2.1-6.4-6.4-6.4 6.4-2.1-2.1 6.4-6.4-6.4-6.4z',
  phone: 'M6.5 2l4 4.2-2.4 2.9a12.5 12.5 0 0 0 6.8 6.8l2.9-2.4 4.2 4L19 22C10 21.5 2.5 14 2 5z',
  web: 'M12 2a10 10 0 1 1 0 20 10 10 0 1 1 0-20zM4.3 10.8h3.6c.1-2.2.6-4.2 1.4-5.9a8 8 0 0 0-5 5.9zm5.9 0h3.6c-.1-2.4-.8-4.6-1.8-6.4-1 1.8-1.7 4-1.8 6.4zm5.9 0h3.6a8 8 0 0 0-5-5.9c.8 1.7 1.3 3.7 1.4 5.9zM4.3 13.2a8 8 0 0 0 5 5.9c-.8-1.7-1.3-3.7-1.4-5.9zm5.9 0c.1 2.4.8 4.6 1.8 6.4 1-1.8 1.7-4 1.8-6.4zm5.9 0c-.1 2.2-.6 4.2-1.4 5.9a8 8 0 0 0 5-5.9z',
  clock: 'M12 2a10 10 0 1 1 0 20 10 10 0 1 1 0-20zm-1.3 4v7.3l5.3 3.1 1.3-2.1-4-2.4V6z',
  access: 'M12 1.5a2.3 2.3 0 1 1 0 4.6 2.3 2.3 0 1 1 0-4.6zM5 7h14v2.4h-4.8V13l3 8.5-2.3.8L12 15.5l-2.9 6.8-2.3-.8 3-8.5V9.4H5z',
  copy: 'M8 2h12v14h-3V5H8zM3.5 7h11.5v15H3.5z',
  add: 'M3 3h18v18H3zm2.5 2.5v13h13v-13zM10.8 7.5h2.4v3.3h3.3v2.4h-3.3v3.3h-2.4v-3.3H7.5v-2.4h3.3z',
  ruler: 'M1.5 16L16 1.5 22.5 8 8 22.5z',
};
P.coord = P.locate; P.saved = P.star; P.recents = P.recent; P.lists = P.list;
const WB = 'M3.5 4.2L20 3l16.6 1.4L36 20l.8 16.3L20 37.2 3.2 36.4 4 20z'; // rough ink badge
const NB = 'M10 2.5h20L37.5 10v20L30 37.5H10L2.5 30V10z';               // cut-corner neon frame
export function iconDefs() {
  const sym = Object.entries(P).map(([k, d]) => `
<symbol id="uiw-${k}" viewBox="0 0 40 40"><path d="${WB}" fill="var(--ink,#3a322a)" stroke="var(--icr,#241c15)" stroke-width="1.6" filter="url(#uiink)"/><path transform="translate(8 8)" d="${d}" fill="#efe3c8" fill-rule="evenodd"/></symbol>
<symbol id="uin-${k}" viewBox="0 0 40 40"><path d="${NB}" fill="var(--icb,none)" stroke="var(--ic1,#2fd3e6)" stroke-width="2.2" stroke-linejoin="miter"/><path d="M10 2.5h6M37.5 24v6" stroke="var(--ic2,#ffd25a)" stroke-width="2.6"/><path transform="translate(9 9) scale(.917)" d="${d}" fill="var(--ic2,#ffd25a)" fill-rule="evenodd"/></symbol>`).join('');
  return `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><filter id="uiink"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="1.2"/></filter></defs>${sym}</svg>`;
}
export const ic = (k, cls = '') => P[k] ? `<svg class="uic ${cls}" aria-hidden="true"><use class="w" href="#uiw-${k}"/><use class="n" href="#uin-${k}"/></svg>` : '';
import { PG } from './poiglyphs.js';
// category -> POI glyph (same art as the map badges), rendered as a themed UI badge
const CATG = { restaurant: 'restaurant', fast_food: 'restaurant', cafe: 'cafe', ice_cream: 'cafe', bakery: 'cafe', bar: 'bar', pub: 'bar', library: 'library', supermarket: 'supermarket', grocery: 'supermarket', convenience: 'supermarket',
  fuel: 'fuel', hotel: 'hotel', lodging: 'hotel', motel: 'hotel', hospital: 'hospital', doctors: 'hospital', clinic: 'hospital', dentist: 'hospital', pharmacy: 'pharmacy', school: 'school', college: 'school', university: 'school', kindergarten: 'school',
  park: 'park', garden: 'park', playground: 'park', bank: 'bank', atm: 'bank', parking: 'parking', bus: 'transit', railway: 'transit', bus_station: 'transit', station: 'transit', bus_stop: 'transit', aerodrome: 'transit', ferry_terminal: 'ferry',
  museum: 'museum', attraction: 'museum', art_gallery: 'museum', theatre: 'museum', cinema: 'museum', monument: 'museum', mall: 'shop', shop: 'shop', department_store: 'shop', clothes: 'shop' };
for (const [k, d] of Object.entries(PG)) if (!P['g_' + k]) P['g_' + k] = d;
export const catIc = c => { const v = String(c || '').split('=').pop(); return ic('g_' + (CATG[v] || (PG[v] ? v : 'generic'))); };
export const ICON_NAMES = Object.keys(P);
