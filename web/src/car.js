// v0.9.8 Android Auto bridge (phone side). Pushes the active skin's resolved MapLibre style, the position and the
// navigation state to the native car screen (CarBridgePlugin → CarState); receives destinations picked on the car.
import { Capacitor, registerPlugin } from '@capacitor/core';
const ON = Capacitor.getPlatform() === 'android';
const CB = ON ? registerPlugin('CarBridge') : null;
const strip = s => String(s || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
const turnOf = s => s.type === 'arrive' ? 'arrive' : s.type === 'depart' ? 'depart' : (s.modifier || 'straight');
let lastPos = 0, lastNav = 0;

/** Rewrites the in-WebView style so MapLibre Native can load it (assets via asset://public/, drops runtime overlay layers). */
function nativeStyle(map) {
  const st = JSON.parse(JSON.stringify(map.getStyle()));
  const origin = location.origin + '/';
  const fix = u => typeof u === 'string' && u.startsWith(origin) ? 'asset://public/' + u.slice(origin.length).replace(/\?.*$/, '') : u;
  const keep = new Set(Object.entries(st.sources).filter(([, s]) => s.type === 'vector' || s.type === 'raster' || s.type === 'raster-dem').map(([k]) => k));
  for (const k of Object.keys(st.sources)) if (!keep.has(k)) delete st.sources[k];
  for (const s of Object.values(st.sources)) { if (s.tiles) s.tiles = s.tiles.map(fix); if (s.url) s.url = fix(s.url); }
  st.layers = st.layers.filter(l => !l.source || keep.has(l.source));
  if (typeof st.sprite === 'string') st.sprite = fix(st.sprite); else if (Array.isArray(st.sprite)) st.sprite = st.sprite.map(x => ({ ...x, url: fix(x.url) }));
  st.glyphs = fix(st.glyphs); delete st.terrain;
  return JSON.stringify(st);
}
export function initCar({ map, S, isDark, lang, onDest, onStop }) {
  if (!ON) return;
  const push = () => { try {
    const ink = document.documentElement.classList.contains('fx-inkui');
    CB.setStyle({ json: nativeStyle(map), skin: S.skin || S.theme, dark: isDark(), ink, zh: lang === 'zh' }).catch(() => {});
  } catch (e) { console.warn('car style', e); } };
  map.on('style.load', () => setTimeout(push, 300)); if (map.isStyleLoaded()) push();
  CB.addListener('carDest', d => { if (d.name === '__stop__') onStop(); else onDest({ name: d.name, lat: +d.lat, lng: +d.lng }); });
  CB.takePending().then(d => d?.name && onDest({ name: d.name, lat: +d.lat, lng: +d.lng })).catch(() => {});
  window.__rgCar = {
    pos(p) { const n = Date.now(); if (n - lastPos < 900) return; lastPos = n; CB.pos({ lat: p.lat, lng: p.lng, bearing: p.heading ?? 0 }).catch(() => {}); },
    nav(o) {
      const n = Date.now(); if (o.active && n - lastNav < 900 && !o.force) return; lastNav = n;
      const s = o.step || {};
      CB.nav({ active: !!o.active, cue: strip(o.cue), road: s.name || '', turn: o.active ? turnOf(s) : 'straight', dest: o.dest || '', stepDist: o.toNext || 0, remDist: o.rem || 0, eta: o.eta || 0,
        lat: o.p?.lat, lng: o.p?.lng, bearing: o.bearing ?? 0, route: o.route ? o.route.flat() : undefined }).catch(() => {});
    },
  };
}
