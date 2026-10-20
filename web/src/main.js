import * as maplibregl from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';
import { t, lang, setLang, fmtDist, fmtDur, instruction } from './i18n.js';
import { photon, photonReverse, nominatim, osmElement, nearbyCategory, nearbyCategoryNominatim, osrm, photoFor } from './services.js';

maplibregl.setWorkerUrl(workerUrl);
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const store = { get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set: (k, v) => localStorage.setItem(k, JSON.stringify(v)) };
const S = { sat: store.get('sat', false), theme: store.get('theme', 'neon'), mode: store.get('mode', 'auto'), me: null, place: null, routes: null, routeIdx: 0, travel: 'drive', from: null, catLayer: null };
const isDark = () => S.mode === 'dark' || (S.mode === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
const styleKey = () => `${S.theme}_${isDark() ? 'dark' : 'light'}`;
const base = new URL(import.meta.env.BASE_URL, location.href).href;

async function loadStyle() {
  const st = await (await fetch(`${base}styles/${styleKey()}.json`)).json();
  st.glyphs = `${base}glyphs/{fontstack}/{range}.pbf`;
  st.sprite = `${base}sprites/${styleKey()}`;
  const nameExpr = lang === 'zh' ? ['coalesce', ['get', 'name:zh-Hans'], ['get', 'name:zh'], ['get', 'name'], ['get', 'name:en']] : ['coalesce', ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']];
  for (const l of st.layers) if (l.layout?.['text-field']) l.layout['text-field'] = nameExpr;
  return st;
}
const routeColor = () => ({ neon_dark: '#4fd6e8', neon_light: '#c2309a', west_light: '#9a2a18', west_dark: '#e0a46a' })[styleKey()];
function applyBodyClass() { document.body.className = `${S.theme} ${isDark() ? 'dark' : 'light'}${$('#panel').classList.contains('hidden') ? '' : ' panel-open'}`; }

// ---------- map ----------
const hash = location.hash.slice(1).split('/').map(Number);
const map = new maplibregl.Map({
  container: 'map', style: await loadStyle(),
  center: hash.length >= 3 && !hash.some(isNaN) ? [hash[2], hash[1]] : [-113.4938, 53.5461], zoom: hash.length >= 3 && !isNaN(hash[0]) ? hash[0] : 12,
  attributionControl: { compact: true }, hash: false, maxPitch: 70, fadeDuration: 150, localIdeographFontFamily: '"PingFang SC","Noto Sans CJK SC","Microsoft YaHei",sans-serif',
});
window._map = map;
applyBodyClass();
const updHash = () => { const c = map.getCenter(); history.replaceState(null, '', `${location.pathname}${location.search}#${map.getZoom().toFixed(2)}/${c.lat.toFixed(5)}/${c.lng.toFixed(5)}`); };
map.on('moveend', updHash);
map.on('rotate', () => { $('#needle').style.transform = `rotate(${-90 - map.getBearing()}deg)`; });

function addOverlays() {
  const empty = { type: 'FeatureCollection', features: [] };
  for (const id of ['route-alt', 'route', 'pins', 'cat']) if (!map.getSource(id)) map.addSource(id, { type: 'geojson', data: empty });
  const c = routeColor(), dk = isDark();
  map.addLayer({ id: 'route-alt', type: 'line', source: 'route-alt', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': dk ? '#6b7280' : '#9aa0a6', 'line-width': 6, 'line-opacity': 0.8 } });
  map.addLayer({ id: 'route-case', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': dk ? '#05070c' : '#ffffff', 'line-width': 10 } });
  map.addLayer({ id: 'route', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': c, 'line-width': 6 } });
  map.addLayer({ id: 'cat', type: 'symbol', source: 'cat', layout: { 'icon-image': ['get', 'icon'], 'icon-allow-overlap': true, 'text-field': ['get', 'name'], 'text-font': map.getStyle().layers.find(l => l.id === 'poi')?.layout['text-font'] || ['Rajdhani SemiBold'], 'text-size': 12, 'text-offset': [0, 1.1], 'text-anchor': 'top', 'text-optional': true }, paint: { 'text-color': c, 'text-halo-color': dk ? '#000' : '#fff', 'text-halo-width': 1.4 } });
  map.addLayer({ id: 'pins', type: 'circle', source: 'pins', paint: { 'circle-radius': 9, 'circle-color': c, 'circle-stroke-width': 3, 'circle-stroke-color': dk ? '#000' : '#fff' } });
  if (S.sat) addSatellite();
  if (!map.getSource('saved')) map.addSource('saved', { type: 'geojson', data: savedFC() });
  map.addLayer({ id: 'saved-dot', type: 'circle', source: 'saved', paint: { 'circle-radius': 8, 'circle-color': '#f2b600', 'circle-stroke-width': 2.5, 'circle-stroke-color': dk ? '#000' : '#fff' } });
  map.addLayer({ id: 'saved-label', type: 'symbol', source: 'saved', layout: { 'text-field': ['get', 'name'], 'text-font': map.getStyle().layers.find(l => l.id === 'poi')?.layout['text-font'] || ['Rajdhani SemiBold'], 'text-size': 15, 'text-offset': [0, 1.1], 'text-anchor': 'top', 'text-allow-overlap': true }, paint: { 'text-color': dk ? '#ffd65c' : '#7a5600', 'text-halo-color': dk ? '#000' : '#fff', 'text-halo-width': 2 } });
  drawRoutes(); drawPin(); if (S.catData) map.getSource('cat').setData(S.catData);
}
map.on('load', addOverlays);
async function setStyle() {
  store.set('theme', S.theme); store.set('mode', S.mode); applyBodyClass();
  map.setStyle(await loadStyle(), { diff: false });
  map.once('style.load', addOverlays);
  renderLayersPop(); renderDrawer();
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => S.mode === 'auto' && setStyle());

const savedFC = () => ({ type: 'FeatureCollection', features: store.get('saved', []).map(s => ({ type: 'Feature', properties: { name: s.name }, geometry: { type: 'Point', coordinates: [s.lng, s.lat] } })) });
// Satellite: EOX Sentinel-2 cloudless 2024 (CC BY-NC-SA 4.0, personal non-commercial) (City of Edmonton orthophoto tiles block cross-origin browser use, so not included).

function addSatellite() {
  if (!map.getSource('eox')) map.addSource('eox', { type: 'raster', tileSize: 256, maxzoom: 15,
    tiles: ['https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2024_3857/default/g/{z}/{y}/{x}.jpg'],
    attribution: '<a href="https://s2maps.eu" target="_blank">Sentinel-2 cloudless – s2maps.eu</a> by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2024), CC BY-NC-SA 4.0' });
  const before = map.getLayer('landuse') ? 'landuse' : undefined;
  map.addLayer({ id: 'sat-eox', type: 'raster', source: 'eox', paint: { 'raster-fade-duration': 150 } }, before);
  for (const l of map.getStyle().layers) {
    if (l.type === 'fill' || l.id === 'water-edge' || l.id === 'waterway') map.setLayoutProperty(l.id, 'visibility', 'none');
    if (l.type === 'line' && !l.id.startsWith('route')) map.setPaintProperty(l.id, 'line-opacity', l.id.includes('glow') ? 0 : 0.55);
    if (l.type === 'symbol' && l.paint?.['text-halo-color'] !== undefined) { map.setPaintProperty(l.id, 'text-halo-color', '#000000'); map.setPaintProperty(l.id, 'text-color', '#ffffff'); }
  }
}
// ---------- my location ----------
let puck;
function setMe(pos) {
  S.me = { lat: pos.coords.latitude, lng: pos.coords.longitude, heading: pos.coords.heading, speed: pos.coords.speed, acc: pos.coords.accuracy };
  if (!puck) { const el = document.createElement('div'); el.className = 'puck'; puck = new maplibregl.Marker({ element: el, rotationAlignment: 'map', pitchAlignment: 'map' }).setLngLat(S.me).addTo(map); }
  puck.setLngLat(S.me);
}
export const locate = (fly = true) => navigator.geolocation?.getCurrentPosition(p => { setMe(p); fly && map.flyTo({ center: S.me, zoom: Math.max(map.getZoom(), 15) }); }, () => toast(t('err') + ': GPS'), { enableHighAccuracy: true, timeout: 10000 });

// ---------- search ----------
const q = $('#q'); q.placeholder = t('search');
let sugTimer, sugItems = [], sugSel = -1, lastQ = '';
q.addEventListener('input', () => {
  $('#clearBtn').classList.toggle('hidden', !q.value);
  clearTimeout(sugTimer);
  const v = q.value.trim();
  if (v.length < 2) { renderSuggest(v ? [] : recentItems()); return; }
  sugTimer = setTimeout(() => runSearch(v), 280);
});
q.addEventListener('focus', () => { if (!q.value) renderSuggest(recentItems()); });
q.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { sugSel = Math.max(0, Math.min(sugItems.length - 1, sugSel + (e.key === 'ArrowDown' ? 1 : -1))); renderSuggest(sugItems, true); e.preventDefault(); }
  if (e.key === 'Enter') { if (sugItems[sugSel >= 0 ? sugSel : 0]) pick(sugItems[sugSel >= 0 ? sugSel : 0]); else nominatimSearch(q.value.trim()); }
  if (e.key === 'Escape') { $('#suggest').classList.add('hidden'); q.blur(); }
});
$('#clearBtn').onclick = () => { q.value = ''; $('#clearBtn').classList.add('hidden'); closePanel(); clearCat(); S.place = null; drawPin(); q.focus(); };
async function runSearch(v) {
  lastQ = v;
  try {
    const r = await photon(v, map.getCenter());
    if (lastQ !== v) return;
    const seen = new Set(); renderSuggest(r.filter(x => { const key = x.name + '|' + x.address; if (seen.has(key)) return false; seen.add(key); return true; }), false, v);
  } catch { renderSuggest([], false, v); }
}
async function nominatimSearch(v) {
  if (!v) return;
  $('#suggest').innerHTML = `<div class="sug"><div class="t">${t('searching')}</div></div>`; $('#suggest').classList.remove('hidden');
  try { renderSuggest(await nominatim(v, map.getCenter()), false, null); } catch (e) { renderSuggest([], false, null); }
}
const recentItems = () => store.get('recents', []).slice(0, 8).map(r => ({ ...r, recent: true }));
function renderSuggest(items, keepSel, qForNom) {
  sugItems = items; if (!keepSel) sugSel = -1;
  const box = $('#suggest');
  if (!items.length && qForNom === undefined) { box.classList.add('hidden'); return; }
  box.innerHTML = items.map((r, i) => `<div class="sug${i === sugSel ? ' sel' : ''}" data-i="${i}"><div class="i">${r.recent ? '🕘' : '📍'}</div><div><div class="t">${esc(r.name)}</div><div class="s">${esc(r.address)}</div></div></div>`).join('')
    + (!items.length ? `<div class="sug"><div class="s">${t('noresults')}</div></div>` : '')
    + (qForNom ? `<div class="sug" data-nom="1"><div class="i">🔎</div><div class="t">${t('nominatim')}</div></div>` : '');
  box.classList.remove('hidden');
}
$('#suggest').addEventListener('click', e => {
  const el = e.target.closest('.sug'); if (!el) return;
  if (el.dataset.nom) return nominatimSearch(q.value.trim());
  if (el.dataset.i) pick(sugItems[+el.dataset.i]);
});
document.addEventListener('pointerdown', e => { if (!e.target.closest('#top')) $('#suggest').classList.add('hidden'); });
function addRecent(p) {
  const r = store.get('recents', []).filter(x => !(Math.abs(x.lat - p.lat) < 1e-5 && Math.abs(x.lng - p.lng) < 1e-5));
  r.unshift({ name: p.name, address: p.address, lat: p.lat, lng: p.lng, osm: p.osm, category: p.category }); store.set('recents', r.slice(0, 30));
}
function pick(p) {
  $('#suggest').classList.add('hidden'); q.value = p.name; q.blur(); $('#clearBtn').classList.remove('hidden');
  map.flyTo({ center: [p.lng, p.lat], zoom: Math.max(map.getZoom(), 16), padding: panelPadding() });
  showPlace(p);
}
const panelPadding = () => innerWidth > 700 ? { left: 420 } : { bottom: innerHeight * 0.45 };

// ---------- chips (category search via Overpass in current view) ----------
const CATS = [['restaurant', '["amenity"~"^(restaurant|fast_food)$"]', 'restaurant'], ['cafe', '["amenity"="cafe"]', 'cafe'], ['supermarket', '["shop"~"^(supermarket|convenience|greengrocer)$"]', 'supermarket'],
  ['fuel', '["amenity"="fuel"]', 'fuel'], ['hotel', '["tourism"~"^(hotel|motel|hostel|guest_house)$"]', 'hotel'], ['park', '["leisure"="park"]', 'park'],
  ['pharmacy', '["amenity"="pharmacy"]', 'pharmacy'], ['atm', '["amenity"~"^(atm|bank)$"]', 'bank'], ['charging', '["amenity"="charging_station"]', 'fuel'], ['parking', '["amenity"="parking"]', 'parking']];
$('#chips').innerHTML = CATS.map(([k]) => `<button class="chip" data-k="${k}">${t(k)}</button>`).join('');
$('#chips').addEventListener('click', async e => {
  const b = e.target.closest('.chip'); if (!b) return;
  if (b.classList.contains('on')) { clearCat(); closePanel(); return; }
  document.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === b));
  const [k, filter, icon] = CATS.find(c => c[0] === b.dataset.k);
  openPanel(`<div class="list"><div class="row">${t('searching')}</div></div>`);
  try {
    if (map.getZoom() < 12.5) await new Promise(r => { map.once('moveend', r); map.easeTo({ zoom: 13.5 }); });
    let els; try { els = await nearbyCategory(filter, map.getBounds()); } catch { els = await nearbyCategoryNominatim(k, map.getBounds()); }
    const items = els.map(x => ({ name: x.tags.name, lat: x.lat ?? x.center?.lat, lng: x.lon ?? x.center?.lon, osm: { type: x.type, id: x.id }, tags: x.tags, category: k,
      address: [x.tags['addr:housenumber'], x.tags['addr:street']].filter(Boolean).join(' ') })).filter(x => x.lat);
    const c = map.getCenter(); items.sort((a, b) => ((a.lat - c.lat) ** 2 + (a.lng - c.lng) ** 2) - ((b.lat - c.lat) ** 2 + (b.lng - c.lng) ** 2));
    S.catData = { type: 'FeatureCollection', features: items.map((it, i) => ({ type: 'Feature', id: i, properties: { name: it.name, icon, i }, geometry: { type: 'Point', coordinates: [it.lng, it.lat] } })) };
    map.getSource('cat')?.setData(S.catData); S.catItems = items;
    openPanel(`<div class="list"><div class="dh">${t(k)} · ${items.length}</div>${items.map((it, i) => `<div class="it" data-i="${i}"><div>${esc(it.name)}</div><div class="s">${esc(it.address || it.tags.cuisine || '')}${hoursBadgeSync(it.tags)}</div></div>`).join('') || `<div class="row">${t('noresults')}</div>`}</div>`);
    $('#panelBody').querySelector('.list').onclick = ev => { const it = ev.target.closest('.it'); if (it) { const p = S.catItems[+it.dataset.i]; map.easeTo({ center: [p.lng, p.lat], zoom: 17, padding: panelPadding() }); showPlace(p); } };
    hydrateBadges();
  } catch (err) { openPanel(`<div class="row">${t('err')}: ${esc(err.message)}</div>`); }
});
function clearCat() { document.querySelectorAll('.chip').forEach(c => c.classList.remove('on')); S.catData = null; map.getSource('cat')?.setData({ type: 'FeatureCollection', features: [] }); }
let OH = null; const ohLib = () => OH ??= import('opening_hours').then(m => m.default);
const hoursBadgeSync = tags => tags.opening_hours ? ` · <span class="ohb" data-oh="${esc(tags.opening_hours)}"></span>` : '';
async function hydrateBadges() { const lib = await ohLib(); document.querySelectorAll('.ohb').forEach(el => { const r = ohStatus(lib, el.dataset.oh); if (r) el.outerHTML = r.badge; }); }
function ohStatus(lib, s) {
  try {
    const oh = new lib(s, { address: { country_code: 'ca', state: 'Alberta' } }, { locale: lang });
    const open = oh.getState(), next = oh.getNextChange();
    const tm = next ? next.toLocaleTimeString(lang === 'zh' ? 'zh-CN' : 'en-CA', { hour: 'numeric', minute: '2-digit' }) : '';
    const badge = `<span class="${open ? 'open' : 'closed'}">${t(open ? 'open' : 'closed')}</span>${next ? ` · ${t(open ? 'closes' : 'opens')} ${tm}` : ''}`;
    let table = '';
    try { table = oh.prettifyValue({ conf: { locale: lang, rule_sep_string: '\n', print_semicolon: false } }); } catch { table = s; }
    return { badge, table };
  } catch { return null; }
}

// ---------- place card ----------
const panel = $('#panel');
function openPanel(html) { $('#panelBody').innerHTML = html; panel.classList.remove('hidden'); panel.scrollTop = 0; applyBodyClass(); }
function closePanel() { panel.classList.add('hidden'); applyBodyClass(); }
function drawPin() {
  const src = map.getSource('pins'); if (!src) return;
  src.setData({ type: 'FeatureCollection', features: S.place && !S.place.fromPoi ? [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [S.place.lng, S.place.lat] } }] : [] });
}
const catLabel = c => (c || '').replace(/^(amenity|shop|tourism|leisure|place|building|highway|office|craft)=/, '').replace(/_/g, ' ');
async function showPlace(p) {
  S.place = p; drawPin(); addRecent(p);
  renderPlace(p, p.tags || null, null);
  let tags = p.tags;
  if (!tags && p.osm) { try { const el = await osmElement(p.osm.type, p.osm.id); tags = el?.tags || {}; } catch { tags = {}; } if (S.place !== p) return; p.tags = tags; renderPlace(p, tags, null); }
  if (tags) {
    const [lib, photo] = await Promise.all([tags.opening_hours ? ohLib() : null, photoFor(tags, p).catch(() => null)]);
    if (S.place !== p) return;
    renderPlace(p, tags, { oh: lib && ohStatus(lib, tags.opening_hours), photo });
  }
}
function renderPlace(p, tags, extra) {
  tags = tags || {};
  const saved = store.get('saved', []).some(s => Math.abs(s.lat - p.lat) < 1e-5 && Math.abs(s.lng - p.lng) < 1e-5);
  const addr = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ') + (tags['addr:city'] ? ', ' + tags['addr:city'] : '');
  const cat = catLabel(tags.amenity ? 'amenity=' + tags.amenity : tags.shop ? 'shop=' + tags.shop : tags.tourism ? 'tourism=' + tags.tourism : tags.leisure ? 'leisure=' + tags.leisure : p.category);
  const web = tags.website || tags['contact:website'], tel = tags.phone || tags['contact:phone'];
  openPanel(`<div class="pc">
    ${extra?.photo ? `<a href="${esc(extra.photo.page)}" target="_blank" rel="noopener"><img class="photo" src="${esc(extra.photo.src)}" alt="" loading="lazy"></a><div class="credit">📷 ${esc(extra.photo.credit || '')}</div>` : ''}
    <h2>${esc(tags[lang === 'zh' ? 'name:zh' : 'name:en'] || p.name)}</h2><div class="cat">${esc(cat)}${tags.cuisine ? ' · ' + esc(tags.cuisine.replace(/;/g, ', ')) : ''}</div>
    <div class="acts">
      <button class="act primary" data-a="dir"><span class="b">➦</span>${t('directions')}</button>
      <button class="act" data-a="start"><span class="b">▲</span>${t('start')}</button>
      <button class="act" data-a="save"><span class="b">${saved ? '★' : '☆'}</span>${saved ? t('saved_ok') : t('save')}</button>
      <button class="act" data-a="share"><span class="b">⇪</span>${t('share')}</button>
    </div>
    ${tags.opening_hours ? `<div class="row"><span class="i">🕘</span><div>${extra?.oh ? extra.oh.badge : esc(tags.opening_hours)}${extra?.oh ? `<div class="hrs">${esc(extra.oh.table)}</div>` : ''}</div></div>` : ''}
    <div class="row"><span class="i">📍</span><div>${esc(addr || p.address || tags._display || '')}</div></div>
    ${tel ? `<div class="row"><span class="i">☎</span><a href="tel:${esc(tel)}">${esc(tel)}</a></div>` : ''}
    ${web ? `<div class="row"><span class="i">🌐</span><a href="${esc(web.startsWith('http') ? web : 'https://' + web)}" target="_blank" rel="noopener">${esc(web.replace(/^https?:\/\//, ''))}</a></div>` : ''}
    ${tags.wheelchair ? `<div class="row"><span class="i">♿</span><div>${esc(tags.wheelchair)}</div></div>` : ''}
    <div class="row"><span class="i">⌖</span><div>${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}</div></div>
    ${p.osm ? `<div class="tags"><a href="https://www.openstreetmap.org/${{ N: 'node', W: 'way', R: 'relation' }[p.osm.type] || p.osm.type}/${p.osm.id}" target="_blank" rel="noopener">OpenStreetMap</a></div>` : ''}
  </div>`);
  $('#panelBody .acts').onclick = e => {
    const a = e.target.closest('.act')?.dataset.a;
    if (a === 'dir') openDirections(p);
    if (a === 'start') openDirections(p, true);
    if (a === 'save') { let s = store.get('saved', []); s = saved ? s.filter(x => !(Math.abs(x.lat - p.lat) < 1e-5 && Math.abs(x.lng - p.lng) < 1e-5)) : [{ name: p.name, address: addr || p.address, lat: p.lat, lng: p.lng, osm: p.osm }, ...s]; store.set('saved', s); map.getSource('saved')?.setData(savedFC()); renderPlace(p, tags, extra); renderDrawer(); }
    if (a === 'share') share(p);
  };
}
async function share(p) {
  const url = `${location.origin}${location.pathname}?p=${p.lat.toFixed(6)},${p.lng.toFixed(6)}&n=${encodeURIComponent(p.name)}#17/${p.lat.toFixed(5)}/${p.lng.toFixed(5)}`;
  if (navigator.share) { try { await navigator.share({ title: p.name, url }); return; } catch {} }
  try { await navigator.clipboard.writeText(url); toast(t('copied')); } catch { prompt('URL', url); }
}

// POI click with hit tolerance (any rendered POI / category result)
const hitLayers = () => ['cat', 'saved-dot', 'poi'].filter(l => map.getLayer(l));
map.on('click', e => {
  if (S.nav?.active || S.picking) return;
  const pad = 10, b = [[e.point.x - pad, e.point.y - pad], [e.point.x + pad, e.point.y + pad]];
  const fs = map.queryRenderedFeatures(b, { layers: hitLayers() });
  if (!fs.length) return;
  const f = fs.sort((a, b2) => (a.layer.id === 'poi' ? 1 : 0) - (b2.layer.id === 'poi' ? 1 : 0))[0];
  const [lng, lat] = f.geometry.coordinates;
  if (f.layer.id === 'cat') { const it = S.catItems[f.properties.i]; showPlace(it); return; }
  if (f.layer.id === 'saved-dot') { const sv = store.get('saved', []).find(x => x.name === f.properties.name); if (sv) return showPlace(sv); }
  // OpenMapTiles/Planetiler feature id = osm_id * 10 + (1 node | 2 way | 3 relation)
  const id = typeof f.id === 'number' ? f.id : null;
  const osm = id ? { type: ['N', 'N', 'W', 'R'][id % 10] || 'N', id: Math.floor(id / 10) } : null;
  const name = f.properties[lang === 'zh' ? 'name:zh' : 'name:en'] || f.properties.name;
  showPlace({ name, address: '', lat, lng, osm, category: f.properties.class, fromPoi: true });
});
for (const l of ['poi', 'cat']) { map.on('mouseenter', l, () => map.getCanvas().style.cursor = 'pointer'); map.on('mouseleave', l, () => map.getCanvas().style.cursor = ''); }

// Long-press / right-click: drop pin + reverse geocode ("What's here?")
let lpTimer;
map.on('contextmenu', e => dropPin(e.lngLat));
map.on('touchstart', e => { if (e.originalEvent.touches.length !== 1) return; lpTimer = setTimeout(() => dropPin(e.lngLat), 550); });
for (const ev of ['touchend', 'touchmove', 'movestart']) map.on(ev, () => clearTimeout(lpTimer));
async function dropPin(ll) {
  const p = { name: t('dropped'), address: `${ll.lat.toFixed(5)}, ${ll.lng.toFixed(5)}`, lat: ll.lat, lng: ll.lng };
  showPlace(p);
  try { const r = await photonReverse(ll); if (r && S.place === p) { p.name = r.address ? [r.name, ''].join('') : r.name; p.address = r.address; renderPlace(p, {}, null); } } catch {}
}

// ---------- directions ----------
// S.from / S.dest: {name,lat,lng} or {gps:true}
function attachAC(input, onPick) {
  const box = document.createElement('div'); box.className = 'acl hidden'; input.parentElement.appendChild(box);
  let tm, items = [];
  const extra = () => [{ gps: true, name: t('mylocation'), address: 'GPS' }, { pickMap: true, name: lang === 'zh' ? '在地图上选择' : 'Choose on map', address: '' },
    ...store.get('saved', []).slice(0, 3), ...store.get('recents', []).slice(0, 4)];
  const render = list => { items = list; box.innerHTML = list.map((r, i) => `<div class="sug" data-i="${i}"><div class="i">${r.gps ? '◎' : r.pickMap ? '⌖' : '📍'}</div><div><div class="t">${esc(r.name)}</div><div class="s">${esc(r.address || '')}</div></div></div>`).join(''); box.classList.toggle('hidden', !list.length); };
  input.addEventListener('focus', () => { input.select(); render(extra()); });
  input.addEventListener('input', () => { clearTimeout(tm); const v = input.value.trim(); if (v.length < 2) return render(extra());
    tm = setTimeout(async () => { try { render(await photon(v, map.getCenter(), 6)); } catch {} }, 280); });
  box.addEventListener('pointerdown', e => { const el = e.target.closest('.sug'); if (!el) return; e.preventDefault(); box.classList.add('hidden'); input.blur(); onPick(items[+el.dataset.i]); });
  input.addEventListener('blur', () => setTimeout(() => box.classList.add('hidden'), 150));
}
function pickOnMap() {
  return new Promise(res => {
    closePanelTemp(true);
    const bar = document.createElement('div'); bar.className = 'card pickbar'; bar.innerHTML = `<span>${lang === 'zh' ? '点按地图选择位置' : 'Tap the map to choose'}</span><button class="btn ghost">${lang === 'zh' ? '取消' : 'Cancel'}</button>`;
    document.body.appendChild(bar); S.picking = true;
    const done = v => { S.picking = false; bar.remove(); map.off('click', onClick); closePanelTemp(false); res(v); };
    const onClick = async e => { const ll = e.lngLat; let name = `${ll.lat.toFixed(5)}, ${ll.lng.toFixed(5)}`; try { const r = await photonReverse(ll); if (r) name = r.name; } catch {} done({ name, lat: ll.lat, lng: ll.lng }); };
    bar.querySelector('button').onclick = () => done(null);
    setTimeout(() => map.on('click', onClick), 0);
  });
}
const closePanelTemp = hide => { panel.style.visibility = hide ? 'hidden' : ''; };
function openDirections(dest, autostart = false) {
  if (dest !== undefined) S.dest = dest; S.from = S.from || { gps: true, name: t('mylocation') }; S.routes = null;
  openPanel(`<button class="xbtn" id="dirX" title="${lang === 'zh' ? '关闭路线' : 'Close directions'}">✕</button><div class="dir">
    <div class="seg" id="modeSeg" style="margin-right:48px"><button data-m="drive">🚗 ${t('drive')}</button><button data-m="walk">🚶 ${t('walk')}</button><button disabled title="${t('transit')}">🚌 ${t('transit')}</button></div>
    <div class="row2"><div style="flex:1">
      <div class="fld"><span>◯</span><div class="acbox" style="flex:1"><input id="fromIn" value="${esc(S.from.name)}"></div></div>
      <div class="fld"><span>📍</span><div class="acbox" style="flex:1"><input id="toIn" value="${esc(S.dest?.name || '')}" placeholder="${t('to')}"></div></div>
    </div><button class="swap" id="swapBtn" title="swap">⇅</button></div>
  </div><div id="alts">${S.dest ? `<div class="row">${t('searching')}</div>` : ''}</div><div id="steps"></div>`);
  const seg = $('#modeSeg'); const mark = () => seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.m === S.travel)); mark();
  seg.onclick = e => { const m = e.target.closest('button')?.dataset.m; if (m) { S.travel = m; mark(); route(false); } };
  const set = which => async v => { if (!v) return; if (v.pickMap) { v = await pickOnMap(); if (!v) return openDirections(); } S[which] = v.gps ? { gps: true, name: t('mylocation') } : { name: v.name, lat: v.lat, lng: v.lng }; openDirections(); };
  attachAC($('#fromIn'), set('from')); attachAC($('#toIn'), set('dest'));
  $('#swapBtn').onclick = () => { const f = S.from; S.from = S.dest || { gps: true, name: t('mylocation') }; S.dest = f.gps ? null : f; if (!S.dest && S.from.gps) {} openDirections(); };
  $('#dirX').onclick = closeDirections;
  if (S.dest && !S.dest.gps) route(autostart); else if (S.dest?.gps) route(autostart);
}
function closeDirections() { S.routes = null; S.from = null; drawRoutes(); closePanel(); }
const gpsNow = () => new Promise(res => navigator.geolocation ? navigator.geolocation.getCurrentPosition(p => { setMe(p); res(S.me); }, () => res(null), { timeout: 8000, enableHighAccuracy: true }) : res(null));
async function resolveEnd(e) { if (!e) return null; if (!e.gps) return e; return S.me || await gpsNow(); }
async function route(autostart) {
  const from = await resolveEnd(S.from), to = await resolveEnd(S.dest);
  if (!from || !to) { $('#alts').innerHTML = `<div class="row">${!from ? t('err') + ': GPS' : ''}</div>`; return; }
  try {
    S.routes = await osrm(from, to, S.travel); S.routeIdx = 0; drawRoutes(); fitRoute(); renderAlts();
    if (autostart) startNav();
  } catch (e) { $('#alts').innerHTML = `<div class="row">${t('err')}: ${esc(e.message)}</div>`; }
}
function renderAlts() {
  $('#alts').innerHTML = S.routes.map((r, i) => `<div class="alt${i === S.routeIdx ? ' on' : ''}" data-i="${i}"><div class="d">${fmtDur(r.duration)}<small>${fmtDist(r.distance)}</small></div>
    ${i === S.routeIdx ? `<div style="margin-top:8px"><button class="btn" id="goBtn">▲ ${t('start')}</button></div>` : ''}</div>`).join('');
  $('#alts').onclick = e => { if (e.target.id === 'goBtn') return startNav(); const a = e.target.closest('.alt'); if (a) { S.routeIdx = +a.dataset.i; drawRoutes(); renderAlts(); } };
  const r = S.routes[S.routeIdx];
  $('#steps').innerHTML = `<div class="dh" style="font-size:15px">${t('steps')}</div>` + r.steps.map(s => `<div class="step"><div class="i">${arrow(s)}</div><div>${esc(instruction(s))}<div class="m">${s.distance ? fmtDist(s.distance) : ''}</div></div></div>`).join('');
}
export const arrow = s => s.type === 'arrive' ? '⚑' : s.type === 'depart' ? '⬆' : s.modifier.includes('left') ? (s.modifier.includes('slight') ? '⬉' : '⬅') : s.modifier.includes('right') ? (s.modifier.includes('slight') ? '⬈' : '➡') : s.modifier === 'uturn' ? '⮌' : s.type.includes('roundabout') ? '⟳' : '⬆';
function drawRoutes() {
  if (!map.getSource('route')) return;
  const rs = S.routes || [];
  map.getSource('route').setData({ type: 'FeatureCollection', features: rs[S.routeIdx] ? [{ type: 'Feature', properties: {}, geometry: rs[S.routeIdx].geometry }] : [] });
  map.getSource('route-alt').setData({ type: 'FeatureCollection', features: rs.filter((_, i) => i !== S.routeIdx).map(r => ({ type: 'Feature', properties: {}, geometry: r.geometry })) });
}
function fitRoute() {
  const c = S.routes[S.routeIdx].geometry.coordinates; const b = new maplibregl.LngLatBounds(c[0], c[0]); c.forEach(x => b.extend(x));
  map.fitBounds(b, { padding: innerWidth > 700 ? { left: 440, right: 80, top: 80, bottom: 80 } : { top: 140, bottom: innerHeight * 0.5, left: 40, right: 40 }, duration: 600 });
}
async function startNav() {
  const { startNavigation } = await import('./nav.js'); // lazy: only loaded when navigating
  closePanel();
  S.nav = startNavigation({ map, S, setMe: (c) => { S.me = c; if (puck) puck.setLngLat(c); }, getPuck: () => puck, makePuck: c => { setMe({ coords: { latitude: c.lat, longitude: c.lng } }); return puck; }, reroute: async from => (await osrm(from, await resolveEnd(S.dest), S.travel)), drawRoutes, onEnd: () => { S.nav = null; S.routes = null; drawRoutes(); $('#top').classList.remove('hidden'); } });
  $('#top').classList.add('hidden');
}
$('#dirBtn').onclick = () => openDirections(S.place || null);

// ---------- controls ----------
$('#zin').onclick = () => map.zoomIn(); $('#zout').onclick = () => map.zoomOut();
$('#compassBtn').onclick = () => { if (S.nav?.active) return S.nav.toggleHeading(); map.easeTo({ bearing: 0, pitch: 0 }); };
$('#locBtn').onclick = () => locate(true);
$('#layersBtn').onclick = () => { renderLayersPop(); $('#layersPop').classList.toggle('hidden'); };
function renderLayersPop() {
  $('#layersPop').innerHTML = `<div style="font-weight:600;margin-bottom:8px">${t('styles')}</div>
   <div class="grid2">${['neon', 'west'].map(th => `<button class="opt${S.theme === th ? ' on' : ''}" data-th="${th}"><img src="${base}previews/${th}_${isDark() ? 'dark' : 'light'}.png" alt="">${t(th)}</button>`).join('')}</div>
   <div class="seg" style="margin-top:10px">${['auto', 'light', 'dark'].map(m => `<button data-md="${m}" class="${S.mode === m ? 'on' : ''}">${t(m)}</button>`).join('')}</div>
   <div class="seg" style="margin-top:10px"><button data-sat="0" class="${!S.sat ? 'on' : ''}">${lang === 'zh' ? '地图' : 'Map'}</button><button data-sat="1" class="${S.sat ? 'on' : ''}">${lang === 'zh' ? '卫星' : 'Satellite'}</button></div>
   <div style="font-size:12px;color:var(--muted);margin-top:6px">${lang === 'zh' ? '卫星：EOX Sentinel‑2 无云（非商业）+ 埃德蒙顿市航拍' : 'Satellite: EOX Sentinel‑2 cloudless (non‑commercial) + City of Edmonton orthophoto'}</div>`;
  $('#layersPop').onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.th) S.theme = b.dataset.th; if (b.dataset.md) S.mode = b.dataset.md; if (b.dataset.sat) { S.sat = b.dataset.sat === '1'; store.set('sat', S.sat); } setStyle(); };
}

// ---------- drawer ----------
function renderDrawer() {
  const saved = store.get('saved', []), rec = store.get('recents', []);
  const li = (arr, k) => arr.slice(0, 6).map((p, i) => `<div class="di" data-${k}="${i}"><span class="i">${k === 's' ? '★' : '🕘'}</span><div>${esc(p.name)}<div class="s" style="font-size:12px;color:var(--muted)">${esc(p.address || '')}</div></div></div>`).join('') || `<div class="sub">${t('empty')}</div>`;
  $('#drawer').innerHTML = `<div class="dh">RoadGlow</div>
   <div class="ds"><div class="di"><span class="i">★</span><b>${t('saved')}</b></div>${li(saved, 's')}</div>
   <div class="ds"><div class="di"><span class="i">🕘</span><b>${t('recents')}</b></div>${li(rec, 'r')}${rec.length ? `<div class="di" data-clear="1"><span class="i">🗑</span>${t('clear_history')}</div>` : ''}</div>
   <div class="ds"><div class="di"><span class="i">◩</span><b>${t('styles')}</b></div>
     <div style="padding:0 22px 10px 58px"><div class="seg">${['neon', 'west'].map(th => `<button data-th="${th}" class="${S.theme === th ? 'on' : ''}">${t(th)}</button>`).join('')}</div>
     <div class="seg" style="margin-top:8px">${['auto', 'light', 'dark'].map(m => `<button data-md="${m}" class="${S.mode === m ? 'on' : ''}">${t(m)}</button>`).join('')}</div></div></div>
   <div class="ds"><div class="di"><span class="i">⇩</span><b>${t('offline')}</b></div><div class="sub">${t('offline_soon')}</div></div>
   <div class="ds"><div class="di"><span class="i">⚙</span><b>${t('settings')}</b></div>
     <div style="padding:0 22px 10px 58px"><div style="font-size:13px;color:var(--muted);margin-bottom:6px">${t('language')}</div><div class="seg">
     <button data-lang="" class="${!localStorage.getItem('lang') ? 'on' : ''}">${t('lang_auto')}</button><button data-lang="zh" class="${localStorage.getItem('lang') === 'zh' ? 'on' : ''}">中文</button><button data-lang="en" class="${localStorage.getItem('lang') === 'en' ? 'on' : ''}">English</button></div></div></div>
   <div class="ds"><div class="di"><span class="i">ⓘ</span><b>${t('about')}</b></div><div class="sub">${t('about_text')}</div></div>`;
  $('#drawer').onclick = e => {
    const el = e.target.closest('[data-s],[data-r],[data-th],[data-md],[data-lang],[data-clear]'); if (!el) return;
    if (el.dataset.s) { closeDrawer(); pick(saved[+el.dataset.s]); }
    else if (el.dataset.r) { closeDrawer(); pick(rec[+el.dataset.r]); }
    else if (el.dataset.th) { S.theme = el.dataset.th; setStyle(); }
    else if (el.dataset.md) { S.mode = el.dataset.md; setStyle(); }
    else if (el.dataset.lang !== undefined) setLang(el.dataset.lang);
    else if (el.dataset.clear) { store.set('recents', []); renderDrawer(); }
  };
}
const openDrawer = () => { renderDrawer(); $('#drawer').classList.add('open'); $('#scrim').classList.remove('hidden'); };
const closeDrawer = () => { $('#drawer').classList.remove('open'); $('#scrim').classList.add('hidden'); };
$('#menuBtn').onclick = openDrawer; $('#scrim').onclick = closeDrawer;
renderDrawer();

let toastT; export function toast(s) { const el = $('#toast'); el.textContent = s; el.classList.remove('hidden'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.add('hidden'), 2200); }

// Shared link ?p=lat,lng&n=name
const sp = new URLSearchParams(location.search);
if (sp.get('p')) { const [la, ln] = sp.get('p').split(',').map(Number); if (!isNaN(la)) map.once('load', () => showPlace({ name: sp.get('n') || t('dropped'), address: `${la}, ${ln}`, lat: la, lng: ln })); }
navigator.permissions?.query({ name: 'geolocation' }).then(r => { if (r.state === 'granted') locate(false); }).catch(() => {});
window._app = { S, showPlace, openDirections, startNav, pick, openDrawer, closeDrawer, runSearch, setStyle, nominatimSearch };
